
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import BottomNav from '../components/BottomNav';
import '../styles/Services.css';
import 'maplibre-gl/dist/maplibre-gl.css';

function ServiceCategory() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [userCoords, setUserCoords] = useState(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedProvider, setSelectedProvider] = useState(null);

  const categoryInfo = {
    veterinary: { name: 'Ветеринары', icon: '🏥', color: '#FF6B6B' },
    zootaxi: { name: 'Зоотакси', icon: '🚗', color: '#4ECDC4' },
    groomer: { name: 'Грумеры', icon: '✂️', color: '#95E1D3' },
    trainer: { name: 'Кинологи', icon: '🎓', color: '#F38181' },
    boarding: { name: 'Передержка', icon: '🏠', color: '#AA96DA' }
  };

  const category = categoryInfo[type] || categoryInfo.veterinary;

  // Получаем геолокацию при загрузке
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSortByDistance(true);
        },
        () => {}
      );
    }
  }, []);

  // Функция расстояния между двумя точками (км)
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Mock данные для демонстрации
  const mockProviders = [
    { id: 1, name: 'Ветклиника "Айболит"', description: 'Полный спектр ветеринарных услуг', rating: 4.8, reviews: 156, price: 'от 500 ₽', address: 'ул. Ленина, 45', phone: '+7 (912) 345-67-89', workTime: '09:00 - 21:00', isVerified: true, lat: 55.7558, lng: 37.6173 },
    { id: 2, name: 'Ветеринарный центр "Друг"', description: 'Экстренная помощь 24/7', rating: 4.9, reviews: 203, price: 'от 600 ₽', address: 'пр. Мира, 12', phone: '+7 (912) 456-78-90', workTime: 'Круглосуточно', isVerified: true, lat: 55.7700, lng: 37.6400 },
    { id: 3, name: 'Доктор Пёс', description: 'Специализация: собаки', rating: 4.7, reviews: 89, price: 'от 450 ₽', address: 'ул. Пушкина, 78', phone: '+7 (912) 567-89-01', workTime: '10:00 - 20:00', isVerified: false, lat: 55.7400, lng: 37.6000 },
  ];

  // Сортируем по расстоянию если есть геолокация
  const displayProviders = mockProviders
    .map(p => ({
      ...p,
      distance: userCoords && p.lat && p.lng
        ? getDistance(userCoords.lat, userCoords.lng, p.lat, p.lng)
        : null
    }))
    .sort((a, b) => sortByDistance && a.distance !== null && b.distance !== null
      ? a.distance - b.distance : 0
    );

  return (
    <div className="service-category-page">
      <div className="header">
        <div className="header-top">
          <div className="back-btn" onClick={() => navigate('/services')}>←</div>
          <div className="header-title">{category.icon} {category.name}</div>
          <div
            className="filter-icon"
            style={{cursor:'pointer', opacity: userCoords ? 1 : 0.4}}
            onClick={() => userCoords && setSortByDistance(s => !s)}
            title={userCoords ? 'Сортировка по расстоянию' : 'Геолокация недоступна'}
          >
            {sortByDistance ? '📍' : '⚙️'}
          </div>
          <button onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', fontSize:'16px'}}>
            {viewMode === 'list' ? '🗺️' : '☰'}
          </button>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Поиск по названию..." />
        </div>
        {sortByDistance && userCoords && (
          <div style={{color:'rgba(255,255,255,0.85)', fontSize:'12px', paddingBottom:'8px'}}>
            📍 Сортировка по близости к вам
          </div>
        )}
      </div>

      <div className="content">
        {viewMode === 'map' ? (
          <div style={{height:'calc(100vh - 160px)'}}>
            <Map
              initialViewState={{
                longitude: userCoords ? userCoords.lng : 37.6173,
                latitude: userCoords ? userCoords.lat : 55.7558,
                zoom: 12
              }}
              style={{width:'100%', height:'100%'}}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
            >
              <NavigationControl position="top-right" />
              {displayProviders.filter(p => p.lat && p.lng).map(p => (
                <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom" onClick={() => setSelectedProvider(p)}>
                  <div style={{fontSize:'24px', cursor:'pointer'}}>{category.icon}</div>
                </Marker>
              ))}
              {selectedProvider && (
                <Popup longitude={selectedProvider.lng} latitude={selectedProvider.lat} anchor="top" onClose={() => setSelectedProvider(null)}>
                  <div style={{minWidth:'150px', padding:'4px'}}>
                    <div style={{fontWeight:'600'}}>{selectedProvider.name}</div>
                    <div style={{fontSize:'12px'}}>📍 {selectedProvider.address}</div>
                    <div style={{fontSize:'12px'}}>🕐 {selectedProvider.workTime}</div>
                    <div style={{fontSize:'12px'}}>⭐ {selectedProvider.rating}</div>
                    <button onClick={() => window.location.href=`tel:${selectedProvider.phone}`} style={{marginTop:'6px', width:'100%', padding:'4px', background:'#3B5998', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>
                      Позвонить
                    </button>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        ) : (
        <div className="providers-list">
          {displayProviders.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <div className="provider-avatar" style={{background: `${category.color}20`}}>
                  {category.icon}
                </div>
                <div className="provider-main">
                  <div className="provider-name">
                    {provider.name}
                    {provider.isVerified && <span className="verified-badge">✓</span>}
                  </div>
                  <div className="provider-rating">
                    <span className="stars">⭐</span>
                    <span className="rating-value">{provider.rating}</span>
                    <span className="reviews-count">({provider.reviews} отзывов)</span>
                    {provider.distance !== null && (
                      <span style={{marginLeft:'8px', color:'#6BA3E8', fontSize:'12px'}}>
                        • {provider.distance < 1 ? `${Math.round(provider.distance * 1000)} м` : `${provider.distance.toFixed(1)} км`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="provider-description">{provider.description}</div>

              <div className="provider-details">
                <div className="detail-item"><span className="detail-icon">💰</span><span className="detail-text">{provider.price}</span></div>
                <div className="detail-item"><span className="detail-icon">📍</span><span className="detail-text">{provider.address}</span></div>
                <div className="detail-item"><span className="detail-icon">🕐</span><span className="detail-text">{provider.workTime}</span></div>
                <div className="detail-item"><span className="detail-icon">📞</span><span className="detail-text">{provider.phone}</span></div>
              </div>

              <div className="provider-actions">
                <button className="btn-secondary" onClick={() => alert('Открыть профиль')}>Подробнее</button>
                <button className="btn-primary" onClick={() => window.location.href = `tel:${provider.phone}`}>Позвонить</button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default ServiceCategory;

