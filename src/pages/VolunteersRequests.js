import React, { useState, useEffect, useCallback } from 'react';
import pb, { getImageUrl } from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Volunteers.css';

function VolunteersRequests() {
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState(null); // null = загрузка
  const navigate = useNavigate();

  const filters = [
    { value: 'all',         label: 'Все запросы' },
    { value: 'critical',    label: '🔴 Критичные' },
    { value: 'urgent',      label: '🟠 Срочные' },
    { value: 'normal',      label: '🟢 Обычные' },
    { value: 'mydistrict',  label: '📍 Мой район' },
  ];

  const fetchRequests = useCallback(async () => {
    setRequests(null);
    try {
      let filterStr = 'type = "help"';
      if (filter === 'critical') filterStr += ' && urgency = "critical"';
      else if (filter === 'urgent') filterStr += ' && urgency = "urgent"';
      else if (filter === 'normal') filterStr += ' && urgency = "normal"';

      const records = await pb.collection('posts').getList(1, 50, {
        filter: filterStr,
        sort: '-created',
      });
      setRequests(records.items);
    } catch (e) {
      console.error(e);
      setRequests([]);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const getUrgencyColor = (urgency) => {
    if (urgency === 'critical') return '#F44336';
    if (urgency === 'urgent') return '#FF9800';
    return '#4CAF50';
  };

  const getUrgencyLabel = (urgency) => {
    if (urgency === 'critical') return '🔴 Критично';
    if (urgency === 'urgent') return '🟠 Срочно';
    return '🟢 Обычная';
  };

  const getPetTypeLabel = (type) => {
    const types = { dog: '🐕 Собака', cat: '🐈 Кошка', rodent: '🐇 Грызун', bird: '🦜 Птица', other: '🐠 Другое' };
    return types[type] || type;
  };

  return (
    <div className="volunteers-page">
      <div className="header">
        <div className="header-top">
          <div className="header-title">🆘 Запросы о помощи</div>
          <div className="tab-switcher-small">
            <span className="tab" onClick={() => navigate('/volunteers')}>Волонтёры</span>
            <span className="tab active">Запросы</span>
          </div>
        </div>
        <div className="filters">
          {filters.map(f => (
            <button key={f.value} className={`filter-btn ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="content">
        {requests === null ? (
          <div className="loading-state"><div className="spinner"></div><p>Загрузка...</p></div>
        ) : requests.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#888'}}>
            <div style={{fontSize:'40px'}}>🆘</div>
            <p>Запросов пока нет</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <div key={req.id} className="request-card"
                style={{borderLeft:`4px solid ${getUrgencyColor(req.urgency)}`, cursor:'pointer'}}
                onClick={() => navigate(`/post/${req.id}`)}
              >
                <div className="req-header">
                  <div className="req-author">
                    <span className="author-avatar">👤</span>
                    <span className="author-name">{req.userName || 'Волонтёр'}</span>
                    <span className="req-time">• {getTimeAgo(req.created)}</span>
                  </div>
                  <div className={`urgency-badge ${req.urgency}`}>
                    {getUrgencyLabel(req.urgency)}
                  </div>
                </div>

                {req.image && (
                  <img src={getImageUrl(req, req.image)} alt="фото"
                    style={{width:'100%', height:'160px', objectFit:'cover', borderRadius:'8px', margin:'8px 0'}} />
                )}

                {req.helpDescription && (
                  <div className="req-description" style={{fontWeight:'500', color:'#333'}}>
                    {req.helpDescription.length > 150 ? req.helpDescription.slice(0, 150) + '...' : req.helpDescription}
                  </div>
                )}

                <div className="req-details" style={{marginTop:'8px'}}>
                  {req.petType && <span>{getPetTypeLabel(req.petType)}</span>}
                  {req.location && <span>📍 {req.location}</span>}
                </div>

                <div className="req-footer">
                  <span className="responses-count">💬 {req.responses || 0} откликов</span>
                  <span style={{fontSize:'12px', color:'#999'}}>👁 {req.views || 0}</span>
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

function getTimeAgo(timestamp) {
  if (!timestamp) return 'недавно';
  const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

export default VolunteersRequests;
