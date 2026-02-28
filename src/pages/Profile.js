import React, { useState, useEffect } from 'react';
import pb from '../services/pocketbase';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(false);
  const isOwnProfile = !id;

  useEffect(() => {
    if (id) {
      setLoading(true);
      pb.collection('users').getOne(id)
        .then(record => setUser(record))
        .catch(() => navigate(-1))
        .finally(() => setLoading(false));
    } else {
      setUser(pb.authStore.model);
    }
  }, [id]);

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      pb.authStore.clear();
      navigate('/login');
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-top">
          <div className="back-btn" onClick={() => navigate(-1)} style={{color:'white',fontSize:'24px',cursor:'pointer'}}>←</div>
          <div className="settings-btn">{isOwnProfile ? '⚙️' : ''}</div>
        </div>
        <div className="avatar-section">
          <div className="avatar">👤<div className="avatar-badge">✓</div></div>
          <div className="user-name">{user?.name || 'Пользователь'}</div>
          <div className="user-type">
            {user?.userType === 'volunteer' ? '🤝 Волонтёр' : user?.userType === 'service' ? '🏪 Поставщик услуг' : '🐾 Владелец питомцев'}
          </div>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-item"><div className="stat-number">{user?.postsCount || 0}</div><div className="stat-label">Объявления</div></div>
        <div className="stat-item"><div className="stat-number">0</div><div className="stat-label">Найдено</div></div>
        <div className="stat-item"><div className="stat-number">{user?.helpCount || 0}</div><div className="stat-label">Помощь</div></div>
      </div>

      <div className="profile-content">
        <div className="section">
          <div className="section-title">Контакты</div>
          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <div className="contact-info"><div className="contact-label">Телефон</div><div className="contact-value">{user?.phone || 'Не указан'}</div></div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <div className="contact-info"><div className="contact-label">Email</div><div className="contact-value">{user?.email}</div></div>
          </div>
        </div>

        {!isOwnProfile ? (
          <button className="btn-primary" style={{width:'100%',marginBottom:'16px'}} onClick={() => navigate(`/chat/${id}`)}>
            💬 Написать
          </button>
        ) : (
          <div className="section">
            {[['❤️','Избранное'],['📜','История'],['🔔','Уведомления'],['❓','Помощь'],['ℹ️','О приложении']].map(([icon, label]) => (
              <div key={label} className="menu-item">
                <div className="menu-icon">{icon}</div>
                <div className="menu-text">{label}</div>
                <div className="menu-arrow">→</div>
              </div>
            ))}
          </div>
        )}

        {isOwnProfile && <button className="logout-btn" onClick={handleLogout}>Выйти из аккаунта</button>}
      </div>

      <BottomNav />
    </div>
  );
}

export default Profile;

