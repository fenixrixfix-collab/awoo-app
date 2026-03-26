import React, { useState, useEffect, useCallback } from 'react';
import pb from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Volunteers.css';

const mockVolunteers = [
  { id: 1, name: 'Мария Соколова', district: 'Центральный', rating: 4.9, helpCount: 45, description: '5 лет опыта волонтёрства' },
  { id: 2, name: 'Дмитрий Петров', district: 'Советский', rating: 5.0, helpCount: 38, description: 'Кинолог-любитель' },
  { id: 3, name: 'Анна Иванова', district: 'Октябрьский', rating: 4.8, helpCount: 52, description: 'Помогаю бездомным животным' },
];

function VolunteersCatalog() {
  // null = идёт загрузка, массив = данные загружены
  const [volunteers, setVolunteers] = useState(null);
  const [filter, setFilter] = useState('all');
  const [userDistrict, setUserDistrict] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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

  const fetchVolunteers = useCallback(async () => {
    setVolunteers(null);
    try {
      let filterStr = '(userType = "volunteer" || userType = "volunteer_pending")';
      if (filter === 'mydistrict' && userDistrict) filterStr += ` && district = "${userDistrict}"`;

      const records = await pb.collection('users').getList(1, 50, {
        sort: '-created',
        filter: filterStr,
      });
      setVolunteers(records.items.length > 0 ? records.items : mockVolunteers);
    } catch {
      setVolunteers(mockVolunteers);
    }
  }, [filter, userDistrict]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const displayData = (() => {
    if (!volunteers) return [];
    let data = [...volunteers];
    if (filter === 'toprated') data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (filter === 'mydistrict' && userDistrict) data = data.filter(v => v.district === userDistrict);
    return data;
  })();

  const filters = [
    { value: 'all', label: 'Все', icon: '' },
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
        {volunteers === null ? (
          <div className="loading-state"><div className="spinner"></div><p>Загрузка...</p></div>
        ) : displayData.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#888'}}>
            <div style={{fontSize:'40px'}}>🔍</div>
            <p>Волонтёры не найдены</p>
          </div>
        ) : (
          <div className="volunteers-list">
            {displayData.map(vol => (
              <div key={vol.id} className="volunteer-card">
                <div className="vol-header">
                  <div className="vol-avatar">
                    {vol.avatar
                      ? <img src={pb.files.getUrl(vol, vol.avatar)} alt={vol.name} style={{width:'48px',height:'48px',borderRadius:'50%',objectFit:'cover'}} />
                      : '👤'
                    }
                  </div>
                  <div className="vol-info">
                    <div className="vol-name">
                      {vol.name}
                      {vol.userType === 'volunteer_pending' && (
                        <span style={{
                          marginLeft:'6px', fontSize:'11px', fontWeight:'600',
                          background:'#FFF8E1', color:'#F57F17', border:'1px solid #FFE082',
                          borderRadius:'10px', padding:'1px 7px', verticalAlign:'middle'
                        }}>🕐 На проверке</span>
                      )}
                    </div>
                    {vol.district && <div className="vol-district">📍 {vol.district}</div>}
                    <div className="vol-rating">
                      <span className="stars">⭐</span>
                      <span className="rating-val">{vol.rating || '5.0'}</span>
                      <span className="help-count">• {vol.helpCount || 0} помощей</span>
                    </div>
                  </div>
                </div>
                {(vol.bio || vol.description) && (
                  <div className="vol-description">{vol.bio || vol.description}</div>
                )}
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

      <BottomNav />
    </div>
  );
}

export default VolunteersCatalog;
