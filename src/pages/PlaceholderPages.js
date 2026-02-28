
// Заглушки для страниц в разработке
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export function Services() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="header" style={{background: 'linear-gradient(135deg, #3B5998 0%, #6BA3E8 100%)', color: 'white', padding: '20px'}}>
        <h2>🛎️ Услуги</h2>
      </div>
      <div style={{padding: '20px'}}>
        <p style={{color: '#666', textAlign: 'center', marginTop: '40px'}}>Раздел в разработке</p>
        <button onClick={() => navigate(-1)} style={{padding: '10px 20px', width: '100%', marginTop: '20px'}}>
          ← Назад
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

export function MoreMenu() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="header" style={{background: 'linear-gradient(135deg, #3B5998 0%, #6BA3E8 100%)', color: 'white', padding: '20px'}}>
        <h2>⋯ Меню</h2>
      </div>
      <div style={{padding: '20px'}}>
        <button onClick={() => navigate('/services')} style={{padding: '10px 20px', width: '100%', marginBottom: '10px'}}>
          🛎️ Услуги
        </button>
        <button onClick={() => navigate('/profile')} style={{padding: '10px 20px', width: '100%', marginBottom: '10px'}}>
          👤 Профиль
        </button>
        <button onClick={() => navigate('/home')} style={{padding: '10px 20px', width: '100%'}}>
          🏠 На главную
        </button>
      </div>
      <BottomNav />
    </div>
  );
}