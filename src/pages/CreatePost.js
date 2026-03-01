import React, { useState } from 'react';
import pb from '../services/pocketbase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import BottomNav from '../components/BottomNav';
import '../styles/CreatePost.css';
import 'maplibre-gl/dist/maplibre-gl.css';

function CreatePost() {
  const [searchParams] = useSearchParams();
  const postType = searchParams.get('type') || 'lost';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ petName: '', petType: 'dog', breed: '', color: '', description: '', location: '', date: new Date().toISOString().split('T')[0], reward: '' });
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
      setFormData(f => ({ ...f, location: readable || `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
    } catch {
      setFormData(f => ({ ...f, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
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
          setFormData(f => ({ ...f, location: readable || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } catch {
          setFormData(f => ({ ...f, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setGeoLoading(false);
        }
      },
      () => { alert('Не удалось получить геолокацию'); setGeoLoading(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.petName) { setError('Введите кличку питомца'); return; }
    if (!formData.location) { setError('Укажите место'); return; }
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('type', postType);
      data.append('petName', formData.petName);
      data.append('petType', formData.petType);
      data.append('breed', formData.breed);
      data.append('color', formData.color);
      data.append('description', formData.description);
      data.append('location', formData.location);
      data.append('date', formData.date);
      data.append('reward', formData.reward || '');
      data.append('userId', pb.authStore.model.id);
      data.append('userName', pb.authStore.model.name);
      data.append('status', 'active');
      data.append('views', 0);
      data.append('responses', 0);
      if (geoCoords.lat) data.append('lat', geoCoords.lat);
      if (geoCoords.lng) data.append('lng', geoCoords.lng);
      if (image) data.append('image', image);

      await pb.collection('posts').create(data);
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError('Ошибка при создании объявления. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <div className="header" style={{background: 'linear-gradient(135deg, #3B5998 0%, #6BA3E8 100%)', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div className="back-btn" onClick={() => navigate(-1)} style={{fontSize: '24px', cursor: 'pointer'}}>←</div>
        <div style={{fontSize: '18px', fontWeight: '600'}}>{postType === 'lost' ? '🔍 Потерялся питомец' : '🐾 Найден питомец'}</div>
        <div style={{width: '24px'}}></div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="form-container">
        {/* Фото */}
        <div className="section">
          <div className="section-title">Фотография питомца</div>
          <input type="file" id="image-upload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          <label htmlFor="image-upload" className="photo-box" style={{display: 'block', height: '180px'}}>
            {imagePreview
              ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
              : <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}><div style={{fontSize: '48px'}}>📷</div><div style={{color: '#6BA3E8', fontWeight: '600', marginTop: '10px'}}>Нажмите чтобы добавить фото</div></div>
            }
          </label>
        </div>

        {/* Вид животного */}
        <div className="section">
          <div className="section-title">Вид животного</div>
          <div className="select-buttons">
            {[['dog','🐕 Собака'],['cat','🐈 Кошка'],['rodent','🐇 Грызун'],['bird','🦜 Птица'],['other','🐠 Другое']].map(([val, label]) => (
              <button key={val} type="button" className={`select-btn ${formData.petType === val ? 'selected' : ''}`} onClick={() => setFormData({...formData, petType: val})}>{label}</button>
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
            <div style={{display: 'flex', gap: '10px'}}>
              <input type="text" name="location" className="form-input" placeholder="Адрес или район" value={formData.location} onChange={handleChange} required style={{flex: 1}} />
              <button type="button" onClick={getLocation} disabled={geoLoading} style={{padding: '12px', background: '#F5F9FF', border: '2px solid #E3F2FD', borderRadius: '10px', cursor: 'pointer', fontSize: '20px', minWidth: '48px'}}>
                {geoLoading ? '⏳' : geoCoords.lat ? '✅' : '📍'}
              </button>
            </div>
            <button type="button" onClick={() => setShowMap(s => !s)} style={{marginTop:'8px', background:'none', border:'1px solid #6BA3E8', color:'#6BA3E8', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', fontSize:'13px'}}>
              🗺️ {showMap ? 'Скрыть карту' : 'Выбрать на карте'}
            </button>
            {showMap && (
              <div style={{marginTop:'10px', borderRadius:'12px', overflow:'hidden', height:'220px'}}>
                <Map
                  initialViewState={{
                    longitude: geoCoords.lng || 37.6173,
                    latitude: geoCoords.lat || 55.7558,
                    zoom: 13
                  }}
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
          <div className="form-field">
            <label className="form-label required">Дата</label>
            <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
          </div>
        </div>

        {/* Вознаграждение */}
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


