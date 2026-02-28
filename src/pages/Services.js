import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Services.css';

function Services() {
  const navigate = useNavigate();

  const categories = [
    { id: 'veterinary', name: 'Ветеринары', icon: '🏥', count: 45, color: '#FF6B6B' },
    { id: 'boarding', name: 'Передержка', icon: '🏠', count: 56, color: '#AA96DA' },
    { id: 'zootaxi', name: 'Зоотакси', icon: '🚗', count: 23, color: '#4ECDC4' },
    { id: 'groomer', name: 'Грумеры', icon: '✂️', count: 38, color: '#95E1D3' },
    { id: 'trainer', name: 'Кинологи', icon: '🎓', count: 19, color: '#F38181' },
  ];

  return (
    <div className="services-page">
      <div className="header">
        <div className="header-title">🛎️ Услуги</div>
        <div className="header-subtitle">Профессиональные услуги для питомцев</div>
      </div>

      <div className="content">
        <div className="services-grid">
          {categories.map(cat => (
            <div key={cat.id} className="service-card" onClick={() => navigate(`/services/${cat.id}`)}>
              <div className="service-icon" style={{background: cat.color + '20'}}>
                <span style={{fontSize: '40px'}}>{cat.icon}</span>
              </div>
              <div className="service-info">
                <div className="service-name">{cat.name}</div>
                <div className="service-count">{cat.count} специалистов</div>
              </div>
              <div className="service-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default Services;

