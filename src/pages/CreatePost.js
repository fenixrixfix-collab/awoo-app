import React, { useState } from 'react';
import pb from '../services/pocketbase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import BottomNav from '../components/BottomNav';
import '../styles/CreatePost.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const urgencyOptions = [
  { value: 'normal',   label: '🟢 Обычная' },
  { value: 'urgent',   label: '🟠 Срочно' },
  { value: 'critical', label: '🔴 Критично' },
];

function CreatePost() {
  const [searchParams] = useSearchParams();
  const postType = searchParams.get('type') || 'lost';
  const navigate = useNavigate();
  const currentUser = pb.authStore.model;
  const isService = currentUser?.userType === 'service';

  // Тип help — отдельная форма для волонтёра
  const isHelp    = postType === 'help';
  // Тип service — рекламная форма для поставщика
  const isAdvert  = postType === 'service';

  const [formData, setFormData] = useState({
    // Общие
    petName: '', petType: 'dog', breed: '', description: '',
    location: '', date: new Date().toISOString().split('T')[0], reward: '',
    // Волонтёр — нужна помощь
    helpDescription: '', urgency: 'normal',
    // Поставщик услуг
    serviceTitle: '', serviceDescription: '', servicePrice: '', serviceAddress: '',
  });

  const [geoCoords, setGeoCoords] = useState({ lat: null, lng: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Файл слишком большой. Максимум 5MB'); return; }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleMapPick = async (lat, lng) => {
    setGeoCoords({ lat, lng });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`);
      const data = await res.json();
      const addr = data.address;
      const readable = [addr.road, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean).join(', ');
      const address = readable || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setFormData(f => isAdvert ? { ...f, serviceAddress: address } : { ...f, location: address });
    } catch {
      const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setFormData(f => isAdvert ? { ...f, serviceAddress: address } : { ...f, location: address });
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { alert('Геолокация не поддерживается'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`);
          const data = await res.json();
          const addr = data.address;
          const readable = [addr.road, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean).join(', ');
          const address = readable || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData(f => isAdvert ? { ...f, serviceAddress: address } : { ...f, location: address });
        } catch {
          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData(f => isAdvert ? { ...f, serviceAddress: address } : { ...f, location: address });
        } finally { setGeoLoading(false); }
      },
      () => { alert('Не удалось получить геолокацию'); setGeoLoading(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация по типу
    if (isHelp && !formData.helpDescription) { setError('Опишите проблему'); return; }
    if (isAdvert && !formData.serviceTitle) { setError('Введите название услуги'); return; }
    if (!isHelp && !isAdvert && !formData.petName) { setError('Введите кличку питомца'); return; }
    if (!isHelp && !isAdvert && !formData.location) { setError('Укажите место'); return; }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('type', postType);
      data.append('userId', currentUser.id);
      data.append('userName', currentUser.name);
      data.append('status', 'active');
      data.append('views', 0);
      data.append('responses', 0);
      if (image) data.append('image', image);

      if (isHelp) {
        // Форма "нужна помощь"
        data.append('petName', formData.petName || 'Животное');
        data.append('petType', formData.petType);
        data.append('helpDescription', formData.helpDescription);
        data.append('urgency', formData.urgency);
        data.append('location', formData.location || '');
        data.append('date', formData.date);
      } else if (isAdvert) {
        // Рекламное объявление услуги
        data.append('petName', formData.serviceTitle);
        data.append('description', formData.serviceDescription);
        data.append('location', formData.serviceAddress);
        data.append('reward', formData.servicePrice);
        data.append('date', formData.date);
        if (geoCoords.lat) data.append('lat', geoCoords.lat);
        if (geoCoords.lng) data.append('lng', geoCoords.lng);
      } else {
        // Обычное объявление нашёл/потерял
        data.append('petName', formData.petName);
        data.append('petType', formData.petType);
        data.append('breed', formData.breed);
        data.append('description', formData.description);
        data.append('location', formData.location);
        data.append('date', formData.date);
        data.append('reward', formData.reward || '');
        if (geoCoords.lat) data.append('lat', geoCoords.lat);
        if (geoCoords.lng) data.append('lng', geoCoords.lng);
      }

      await pb.collection('posts').create(data);

      // Push только для потерял/нашёл
      if (!isHelp && !isAdvert) {
        try {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${process.env.REACT_APP_ONESIGNAL_API_KEY}` },
            body: JSON.stringify({
              app_id: '1d88784a-2a8e-4a3b-9ca3-97be4c939d90',
              included_segments: ['Total Subscriptions'],
              headings: { ru: postType === 'lost' ? '🔍 Потерялся питомец!' : '🐾 Найден питомец!' },
              contents: { ru: `${formData.petName} — ${formData.location}` },
              url: 'https://awoo-app-v2.vercel.app/home'
            })
          });
        } catch (e) { console.log('Push error:', e); }
      }

      navigate(isAdvert ? '/services' : '/home');
    } catch (err) {
      console.error(err);
      setError('Ошибка при создании объявления. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Заголовок хедера
  const headerTitle = isHelp ? '🆘 Нужна помощь' : isAdvert ? '🛎️ Рекламное объявление' : postType === 'lost' ? '🔍 Потерялся питомец' : '🐾 Найден питомец';

  // ─── ФОРМА "НУЖНА ПОМОЩЬ" (волонтёр) ───────────────────────────────────────
  if (isHelp) return (
    <div className="create-post-page">
      <div className="header" style={{background:'linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)', color:'white', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div onClick={() => navigate(-1)} style={{fontSize:'24px', cursor:'pointer'}}>←</div>
        <div style={{fontSize:'18px', fontWeight:'600'}}>{headerTitle}</div>
        <div style={{width:'24px'}}></div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="form-container">

        {/* Фото */}
        <div className="section">
          <div className="section-title">Фото (необязательно)</div>
          <input type="file" id="image-upload-gallery" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
          <input type="file" id="image-upload-camera" accept="image/*" capture="environment" onChange={handleImageChange} style={{display:'none'}} />
          {imagePreview ? (
            <div style={{position:'relative', height:'180px'}}>
              <img src={imagePreview} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} />
              <button type="button" onClick={() => { setImage(null); setImagePreview(null); }}
                style={{position:'absolute', top:'8px', right:'8px', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px'}}>✕</button>
            </div>
          ) : (
            <div style={{display:'flex', gap:'10px'}}>
              <label htmlFor="image-upload-camera" style={{flex:1, height:'80px', background:'#F1F8E9', border:'2px dashed #66BB6A', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px'}}>
                <span style={{fontSize:'28px'}}>📷</span><span style={{fontSize:'12px', color:'#66BB6A', fontWeight:'600'}}>Камера</span>
              </label>
              <label htmlFor="image-upload-gallery" style={{flex:1, height:'80px', background:'#F1F8E9', border:'2px dashed #66BB6A', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px'}}>
                <span style={{fontSize:'28px'}}>🖼️</span><span style={{fontSize:'12px', color:'#66BB6A', fontWeight:'600'}}>Галерея</span>
              </label>
            </div>
          )}
        </div>

        {/* Вид животного */}
        <div className="section">
          <div className="section-title">Вид животного</div>
          <div className="select-buttons">
            {[['dog','🐕 Собака'],['cat','🐈 Кошка'],['rodent','🐇 Грызун'],['bird','🦜 Птица'],['other','🐠 Другое']].map(([val, label]) => (
              <button key={val} type="button" className={`select-btn ${formData.petType === val ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, petType: val})}>{label}</button>
            ))}
          </div>
        </div>

        {/* Описание проблемы */}
        <div className="section" style={{border:'2px solid #E8F5E9', borderRadius:'12px', background:'#F9FFF9'}}>
          <div className="section-title" style={{color:'#388E3C'}}>Описание проблемы *</div>
          <textarea name="helpDescription" className="form-input"
            placeholder="Опишите ситуацию подробно — что случилось, где находится животное, какая помощь нужна..."
            value={formData.helpDescription} onChange={handleChange} rows={5} required />

          <div style={{marginTop:'14px'}}>
            <label style={{display:'block', fontSize:'13px', color:'#388E3C', marginBottom:'8px', fontWeight:'600'}}>Срочность</label>
            <div style={{display:'flex', gap:'8px'}}>
              {urgencyOptions.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setFormData(f => ({...f, urgency: opt.value}))}
                  style={{flex:1, padding:'10px 8px', border:'2px solid',
                    borderColor: formData.urgency === opt.value ? (opt.value==='critical'?'#F44336':opt.value==='urgent'?'#FF9800':'#4CAF50') : '#E0E0E0',
                    background: formData.urgency === opt.value ? (opt.value==='critical'?'#FFEBEE':opt.value==='urgent'?'#FFF3E0':'#E8F5E9') : 'white',
                    borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight:'600',
                    color: formData.urgency === opt.value ? (opt.value==='critical'?'#C62828':opt.value==='urgent'?'#E65100':'#2E7D32') : '#666'}}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Место */}
        <div className="section">
          <div className="section-title">Место (необязательно)</div>
          <input type="text" name="location" className="form-input" placeholder="Где находится животное?" value={formData.location} onChange={handleChange} />
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{background:'linear-gradient(135deg, #388E3C, #66BB6A)'}}>
          {loading ? '⏳ Публикация...' : '🆘 Опубликовать запрос о помощи'}
        </button>
      </form>
      <BottomNav />
    </div>
  );

  // ─── ФОРМА "УСЛУГА" (поставщик) ─────────────────────────────────────────────
  if (isAdvert) return (
    <div className="create-post-page">
      <div className="header" style={{background:'linear-gradient(135deg, #7B1FA2 0%, #BA68C8 100%)', color:'white', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div onClick={() => navigate(-1)} style={{fontSize:'24px', cursor:'pointer'}}>←</div>
        <div style={{fontSize:'18px', fontWeight:'600'}}>{headerTitle}</div>
        <div style={{width:'24px'}}></div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="form-container">

        {/* Фото */}
        <div className="section">
          <div className="section-title">Фото услуги</div>
          <input type="file" id="image-upload-gallery" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
          <input type="file" id="image-upload-camera" accept="image/*" capture="environment" onChange={handleImageChange} style={{display:'none'}} />
          {imagePreview ? (
            <div style={{position:'relative', height:'180px'}}>
              <img src={imagePreview} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} />
              <button type="button" onClick={() => { setImage(null); setImagePreview(null); }}
                style={{position:'absolute', top:'8px', right:'8px', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px'}}>✕</button>
            </div>
          ) : (
            <div style={{display:'flex', gap:'10px'}}>
              <label htmlFor="image-upload-camera" style={{flex:1, height:'80px', background:'#F3E5F5', border:'2px dashed #BA68C8', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px'}}>
                <span style={{fontSize:'28px'}}>📷</span><span style={{fontSize:'12px', color:'#BA68C8', fontWeight:'600'}}>Камера</span>
              </label>
              <label htmlFor="image-upload-gallery" style={{flex:1, height:'80px', background:'#F3E5F5', border:'2px dashed #BA68C8', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px'}}>
                <span style={{fontSize:'28px'}}>🖼️</span><span style={{fontSize:'12px', color:'#BA68C8', fontWeight:'600'}}>Галерея</span>
              </label>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-title">Об услуге</div>
          <div className="form-field">
            <label className="form-label required">Название</label>
            <input type="text" name="serviceTitle" className="form-input" placeholder="Например: Стрижка собак всех пород" value={formData.serviceTitle} onChange={handleChange} required />
          </div>
          <div className="form-field">
            <label className="form-label">Описание</label>
            <textarea name="serviceDescription" className="form-input" placeholder="Расскажите подробнее об услуге..." value={formData.serviceDescription} onChange={handleChange} rows={4} />
          </div>
          <div className="form-field">
            <label className="form-label">Цена</label>
            <input type="text" name="servicePrice" className="form-input" placeholder="Например: от 500 ₽" value={formData.servicePrice} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Адрес / район</label>
            <div style={{display:'flex', gap:'10px'}}>
              <input type="text" name="serviceAddress" className="form-input" placeholder="Где оказывается услуга?" value={formData.serviceAddress} onChange={handleChange} style={{flex:1}} />
              <button type="button" onClick={getLocation} disabled={geoLoading}
                style={{padding:'12px', background:'#F3E5F5', border:'2px solid #E1BEE7', borderRadius:'10px', cursor:'pointer', fontSize:'20px', minWidth:'48px'}}>
                {geoLoading ? '⏳' : geoCoords.lat ? '✅' : '📍'}
              </button>
            </div>
            <button type="button" onClick={() => setShowMap(s => !s)}
              style={{marginTop:'8px', background:'none', border:'1px solid #BA68C8', color:'#BA68C8', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', fontSize:'13px'}}>
              🗺️ {showMap ? 'Скрыть карту' : 'Выбрать на карте'}
            </button>
            {showMap && (
              <div style={{marginTop:'10px', borderRadius:'12px', overflow:'hidden', height:'220px'}}>
                <Map
                  initialViewState={{longitude: geoCoords.lng || 37.6173, latitude: geoCoords.lat || 55.7558, zoom: 13}}
                  style={{width:'100%', height:'100%'}}
                  mapStyle="https://tiles.openfreemap.org/styles/liberty"
                  onClick={(e) => handleMapPick(e.lngLat.lat, e.lngLat.lng)}
                  cursor="crosshair"
                >
                  <NavigationControl position="top-right" />
                  {geoCoords.lat && (
                    <Marker longitude={geoCoords.lng} latitude={geoCoords.lat} anchor="bottom">
                      <div style={{fontSize:'28px'}}>📍</div>
                    </Marker>
                  )}
                </Map>
                <div style={{fontSize:'12px', color:'#999', marginTop:'4px', textAlign:'center'}}>Нажмите на карту чтобы выбрать место</div>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{background:'linear-gradient(135deg, #7B1FA2, #BA68C8)'}}>
          {loading ? '⏳ Публикация...' : '🛎️ Опубликовать объявление'}
        </button>
      </form>
      <BottomNav />
    </div>
  );

  // ─── ОБЫЧНАЯ ФОРМА (нашёл / потерял) ────────────────────────────────────────
  return (
    <div className="create-post-page">
      <div className="header" style={{background:'linear-gradient(135deg, #3B5998 0%, #6BA3E8 100%)', color:'white', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div onClick={() => navigate(-1)} style={{fontSize:'24px', cursor:'pointer'}}>←</div>
        <div style={{fontSize:'18px', fontWeight:'600'}}>{headerTitle}</div>
        <div style={{width:'24px'}}></div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="form-container">

        {/* Фото */}
        <div className="section">
          <div className="section-title">Фотография питомца</div>
          <input type="file" id="image-upload-gallery" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
          <input type="file" id="image-upload-camera" accept="image/*" capture="environment" onChange={handleImageChange} style={{display:'none'}} />
          {imagePreview ? (
            <div style={{position:'relative', height:'180px'}}>
              <img src={imagePreview} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} />
              <button type="button" onClick={() => { setImage(null); setImagePreview(null); }}
                style={{position:'absolute', top:'8px', right:'8px', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px'}}>✕</button>
            </div>
          ) : (
            <div style={{display:'flex', gap:'10px'}}>
              <label htmlFor="image-upload-camera" style={{flex:1, height:'80px', background:'#F5F9FF', border:'2px dashed #6BA3E8', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px'}}>
                <span style={{fontSize:'28px'}}>📷</span><span style={{fontSize:'12px', color:'#6BA3E8', fontWeight:'600'}}>Камера</span>
              </label>
              <label htmlFor="image-upload-gallery" style={{flex:1, height:'80px', background:'#F5F9FF', border:'2px dashed #6BA3E8', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px'}}>
                <span style={{fontSize:'28px'}}>🖼️</span><span style={{fontSize:'12px', color:'#6BA3E8', fontWeight:'600'}}>Галерея</span>
              </label>
            </div>
          )}
        </div>

        {/* Вид животного */}
        <div className="section">
          <div className="section-title">Вид животного</div>
          <div className="select-buttons">
            {[['dog','🐕 Собака'],['cat','🐈 Кошка'],['rodent','🐇 Грызун'],['bird','🦜 Птица'],['other','🐠 Другое']].map(([val, label]) => (
              <button key={val} type="button" className={`select-btn ${formData.petType === val ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, petType: val})}>{label}</button>
            ))}
          </div>
        </div>

        {/* Основная информация */}
        <div className="section">
          <div className="section-title">Информация о питомце</div>
          <div className="form-field">
            <label className="form-label required">Кличка</label>
            <input type="text" name="petName" className="form-input" placeholder="Кличка питомца" value={formData.petName} onChange={handleChange} required />
          </div>
          <div className="form-field">
            <label className="form-label">Порода</label>
            <input type="text" name="breed" className="form-input" placeholder="Например: Хаски" value={formData.breed} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Окрас и особые приметы</label>
            <textarea name="description" className="form-input" placeholder="Опишите питомца подробнее..." value={formData.description} onChange={handleChange} rows={3} />
          </div>
        </div>

        {/* Место и дата */}
        <div className="section">
          <div className="section-title">{postType === 'lost' ? 'Где и когда потерялся' : 'Где и когда найден'}</div>
          <div className="form-field">
            <label className="form-label required">Место</label>
            <div style={{display:'flex', gap:'10px'}}>
              <input type="text" name="location" className="form-input" placeholder="Адрес или район" value={formData.location} onChange={handleChange} required style={{flex:1}} />
              <button type="button" onClick={getLocation} disabled={geoLoading}
                style={{padding:'12px', background:'#F5F9FF', border:'2px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'20px', minWidth:'48px'}}>
                {geoLoading ? '⏳' : geoCoords.lat ? '✅' : '📍'}
              </button>
            </div>
            <button type="button" onClick={() => setShowMap(s => !s)}
              style={{marginTop:'8px', background:'none', border:'1px solid #6BA3E8', color:'#6BA3E8', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', fontSize:'13px'}}>
              🗺️ {showMap ? 'Скрыть карту' : 'Выбрать на карте'}
            </button>
            {showMap && (
              <div style={{marginTop:'10px', borderRadius:'12px', overflow:'hidden', height:'220px'}}>
                <Map initialViewState={{longitude: geoCoords.lng || 37.6173, latitude: geoCoords.lat || 55.7558, zoom: 13}}
                  style={{width:'100%', height:'100%'}} mapStyle="https://tiles.openfreemap.org/styles/liberty"
                  onClick={(e) => handleMapPick(e.lngLat.lat, e.lngLat.lng)} cursor="crosshair">
                  <NavigationControl position="top-right" />
                  {geoCoords.lat && <Marker longitude={geoCoords.lng} latitude={geoCoords.lat} anchor="bottom"><div style={{fontSize:'28px'}}>📍</div></Marker>}
                </Map>
                <div style={{fontSize:'12px', color:'#999', marginTop:'4px', textAlign:'center'}}>Нажмите на карту чтобы выбрать место</div>
              </div>
            )}
          </div>
          <div className="form-field">
            <label className="form-label required">Дата</label>
            <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
          </div>
        </div>

        {postType === 'lost' && (
          <div className="section">
            <div className="section-title">Вознаграждение</div>
            <input type="number" name="reward" className="form-input" placeholder="Сумма вознаграждения (₽)" value={formData.reward} onChange={handleChange} />
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '⏳ Публикация...' : '✅ Опубликовать объявление'}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}

export default CreatePost;
