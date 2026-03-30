import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '../services/pocketbase';
import BottomNav from '../components/BottomNav';
import '../styles/Services.css';

const CATEGORIES = [
  { id: 'veterinary', name: 'Ветеринары', icon: '🏥', color: '#FF6B6B' },
  { id: 'boarding',   name: 'Передержка', icon: '🏠', color: '#AA96DA' },
  { id: 'zootaxi',    name: 'Зоотакси',   icon: '🚗', color: '#4ECDC4' },
  { id: 'groomer',    name: 'Грумеры',    icon: '✂️', color: '#95E1D3' },
  { id: 'trainer',    name: 'Кинологи',   icon: '🎓', color: '#F38181' },
];

function Services() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const records = await pb.collection('users').getFullList({
          filter: 'userType = "service"',
          fields: 'serviceCategories',
        });
        const result = {};
        CATEGORIES.forEach(c => { result[c.id] = 0; });
        records.forEach(r => {
          try {
            const cats = Array.isArray(r.serviceCategories)
              ? r.serviceCategories
              : JSON.parse(r.serviceCategories || '[]');
            cats.forEach(cat => {
              if (result[cat] !== undefined) result[cat]++;
            });
          } catch {}
        });
        setCounts(result);
      } catch {}
      finally { setLoading(false); }
    };
    fetchCounts();
  }, []);

  return (
    <div className="services-page">
      <div className="header">
        <div className="header-title">🛎️ Услуги</div>
        <div className="header-subtitle">Профессиональные услуги для питомцев</div>
      </div>

      <div className="content">
        <div className="services-grid">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="service-card" onClick={() => navigate(`/services/${cat.id}`)}>
              <div className="service-icon" style={{background: cat.color + '20'}}>
                <span style={{fontSize: '40px'}}>{cat.icon}</span>
              </div>
              <div className="service-info">
                <div className="service-name">{cat.name}</div>
                <div className="service-count">
                  {loading ? '...' : counts[cat.id] === 0 ? 'Нет специалистов' : `${counts[cat.id]} специалист${counts[cat.id] === 1 ? '' : counts[cat.id] >= 2 && counts[cat.id] <= 4 ? 'а' : 'ов'}`}
                </div>
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
