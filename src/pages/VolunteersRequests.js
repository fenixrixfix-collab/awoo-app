import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Volunteers.css';

function VolunteersRequests() {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const mockRequests = [
    { id: 1, author: 'Елена Петрова', time: '10 мин назад', urgency: 'critical', type: 'emergency', title: 'Срочная транспортировка в ветклинику', description: 'Собака сбита машиной, нужна помощь', district: 'Центральный', petType: 'Собака', responses: 3 },
    { id: 2, author: 'Игорь Смирнов', time: '1 час назад', urgency: 'urgent', type: 'boarding', title: 'Передержка кошки на 3 дня', description: 'Срочная командировка', district: 'Советский', petType: 'Кошка', deadline: '20-23 февраля', responses: 5 },
    { id: 3, author: 'Мария Козлова', time: '3 часа назад', urgency: 'normal', type: 'search', title: 'Помощь в поиске хаски', description: 'Потерялся в парке вчера вечером', district: 'Октябрьский', petType: 'Собака', responses: 8, responded: true },
    { id: 4, author: 'Андрей Волков', time: '1 день назад', urgency: 'normal', type: 'financial', title: 'Финансовая помощь на операцию', description: 'Кошке нужна операция, не хватает 5000₽', amount: '5000 ₽', responses: 12 },
  ];

  const filters = [
    { value: 'all', label: 'Все запросы' },
    { value: 'urgent', label: 'Срочные' },
    { value: 'boarding', label: 'Передержка' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'financial', label: 'Финансы' },
    { value: 'mydistrict', label: 'Мой район' },
  ];

  const getUrgencyColor = (urgency) => {
    const colors = { critical: '#F44336', urgent: '#FF9800', normal: '#4CAF50' };
    return colors[urgency] || '#4CAF50';
  };

  const getTypeIcon = (type) => {
    const icons = { emergency: '🚨', boarding: '🏠', search: '🔍', financial: '💰', transport: '🚗' };
    return icons[type] || '📋';
  };

  return (
    <div className="volunteers-page">
      <div className="header">
        <div className="header-top">
          <div className="header-title">🤝 Запросы о помощи</div>
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
        <div className="requests-list">
          {mockRequests.map(req => (
            <div key={req.id} className="request-card" style={{borderLeft: `4px solid ${getUrgencyColor(req.urgency)}`}}>
              <div className="req-header">
                <div className="req-author">
                  <span className="author-avatar">👤</span>
                  <span className="author-name">{req.author}</span>
                  <span className="req-time">• {req.time}</span>
                </div>
                <div className={`urgency-badge ${req.urgency}`}>
                  {req.urgency === 'critical' ? '🔴 Критично' : req.urgency === 'urgent' ? '🟠 Срочно' : '🟢 Обычная'}
                </div>
              </div>
              <div className="req-type">{getTypeIcon(req.type)} {req.type === 'emergency' ? 'Экстренная помощь' : req.type === 'boarding' ? 'Передержка' : req.type === 'search' ? 'Поиск' : 'Финансовая помощь'}</div>
              <div className="req-title">{req.title}</div>
              <div className="req-description">{req.description}</div>
              <div className="req-details">
                {req.district && <span>📍 {req.district} район</span>}
                {req.petType && <span>🐾 {req.petType}</span>}
                {req.deadline && <span>📅 {req.deadline}</span>}
                {req.amount && <span>💰 {req.amount}</span>}
              </div>
              <div className="req-footer">
                <span className="responses-count">{req.responses} откликов</span>
                <button className={`btn-respond ${req.responded ? 'responded' : ''}`} onClick={() => {
                    if (!req.responded) alert('Отклик отправлен!');
                  }}>
                  {req.responded ? '✓ Вы откликнулись' : '🤝 Я могу помочь'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fab" onClick={() => navigate('/create-post')}>➕</div>
      <BottomNav />
    </div>
  );
}

export default VolunteersRequests;


