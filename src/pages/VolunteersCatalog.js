import React, { useState, useEffect } from 'react';
import pb from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Volunteers.css';

function VolunteersCatalog() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userDistrict, setUserDistrict] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем район пользователя при загрузке
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`);
          const data = await res.json();
          const district = data.address?.suburb || data.address?.city_district || data.address?.city || null;
          setUserDistrict(district);
        } catch {}
      }, () => {});
    }
  }, []);

  useEffect(() => {
    fetchVolunteers();
  }, [filter]);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      let filterStr = 'userType = "volunteer"';
      if (filter === 'available') filterStr += ' && isAvailable = true';
      if (filter === 'mydistrict' && userDistrict) filterStr += ` && district = "${userDistrict}"`;
      
      const records = await pb.collection('users').getList(1, 50, {
        sort: '-created',
        filter: filterStr,
      });
      setVolunteers(records.items);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const mockVolunteers = [
    { id: 1, name: 'Мария Соколова', district: 'Центральный', rating: 4.9, helpCount: 45, isAvailable: true, services: ['Передержка', 'Транспорт', 'Выгул'], description: '5 лет опыта волонтёрства' },
    { id: 2, name: 'Дмитрий Петров', district: 'Советский', rating: 5.0, helpCount: 38, isAvailable: false, services: ['Поиск', 'Дрессировка'], description: 'Кинолог-любитель' },
    { id: 3, name: 'Анна Иванова', district: 'Октябрьский', rating: 4.8, helpCount: 52, isAvailable: true, services: ['Передержка', 'Финансы'], description: 'Помогаю бездомным животным' },
  ];

  const displayData = volunteers.length > 0 ? volunteers : mockVolunteers;

  const filters = [
    { value: 'all', label: 'Все', icon: '' },
    { value: 'available', label: 'Свободны', icon: '✓' },
    { value: 'dogs', label: 'Собаки', icon: '🐕' },
    { value: 'cats', label: 'Кошки', icon: '🐈' },
    { value: 'mydistrict', label: 'Мой район', icon: '📍' },
    { value: 'toprated', label: 'Высокий рейтинг', icon: '⭐' },
  ];

  return (
    <div className="volunteers-page">
      <div className="header">
        <div className="header-top">
          <div className="header-title">🤝 Волонтёры</div>
          <div className="tab-switcher-small">
            <span className="tab active">Волонтёры</span>
            <span className="tab" onClick={() => navigate('/volunteers/requests')}>Запросы</span>
          </div>
        </div>
        <div className="filters">
          {filters.map(f => (
            <button key={f.value} className={`filter-btn ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-banner">
        <div className="stat-item"><div className="stat-num">147</div><div className="stat-label">Волонтёров</div></div>
        <div className="stat-item"><div className="stat-num">823</div><div className="stat-label">Помогли</div></div>
        <div className="stat-item"><div className="stat-num">42</div><div className="stat-label">Готовы помочь</div></div>
      </div>

      {filter === 'mydistrict' && !userDistrict && (
        <div style={{padding:'10px 20px', color:'#FF9800', fontSize:'13px', textAlign:'center'}}>
          ⚠️ Разрешите доступ к геолокации для фильтра по району
        </div>
      )}

      <div className="content">
        {loading && volunteers.length === 0 ? (
          <div className="loading-state"><div className="spinner"></div><p>Загрузка...</p></div>
        ) : (
          <div className="volunteers-list">
            {displayData.map(vol => (
              <div key={vol.id} className="volunteer-card">
                <div className="vol-header">
                  <div className="vol-avatar">👤</div>
                  <div className="vol-info">
                    <div className="vol-name">{vol.name}</div>
                    <div className="vol-district">📍 {vol.district || 'Центральный район'}</div>
                    <div className="vol-rating">
                      <span className="stars">⭐</span>
                      <span className="rating-val">{vol.rating || '5.0'}</span>
                      <span className="help-count">• {vol.helpCount || 0} помощей</span>
                    </div>
                  </div>
                  <div className={`status-badge ${vol.isAvailable ? 'available' : 'busy'}`}>
                    {vol.isAvailable ? '✓ Свободен' : '⏰ Занят'}
                  </div>
                </div>
                <div className="vol-services">
                  {(vol.services || ['Передержка']).map((s, i) => <span key={i} className="service-tag">{s}</span>)}
                </div>
                <div className="vol-description">{vol.description || 'Помогаю животным'}</div>
                <div className="vol-actions">
                  <button className="btn-profile" onClick={() => {
                    if (typeof vol.id === 'string') navigate(`/profile/${vol.id}`);
                    else alert('Профиль: ' + vol.name);
                  }}>Профиль</button>
                  <button className="btn-contact" onClick={() => {
                    if (typeof vol.id === 'string') navigate(`/chat/${vol.id}`);
                    else alert('Написать: ' + vol.name);
                  }}>Связаться</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fab" onClick={() => navigate('/profile')}>➕</div>
      <BottomNav />
    </div>
  );
}

export default VolunteersCatalog;

