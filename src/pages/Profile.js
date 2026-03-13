import React, { useState, useEffect } from 'react';
import pb, { getImageUrl } from '../services/pocketbase';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Profile.css';
 
function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
 
  useEffect(() => {
    if (isOwnProfile && activeTab === 'posts') fetchMyPosts();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
 
  const fetchMyPosts = async () => {
    setPostsLoading(true);
    try {
      const records = await pb.collection('posts').getList(1, 50, {
        filter: `userId = "${pb.authStore.model.id}"`,
        sort: '-created'
      });
      setMyPosts(records.items);
    } catch (e) {
      console.error(e);
    } finally {
      setPostsLoading(false);
    }
  };
 
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Удалить объявление?')) return;
    try {
      await pb.collection('posts').delete(postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      alert('Ошибка при удалении');
    }
  };
 
  const handleTogglePhoneHidden = async () => {
    try {
      const updated = await pb.collection('users').update(currentUser.id, {
        phoneHidden: !user.phoneHidden
      });
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
    } catch (e) {
      alert('Ошибка при сохранении');
    }
  };
 
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
        <div className="stat-item"><div className="stat-number">{myPosts.length || user?.postsCount || 0}</div><div className="stat-label">Объявления</div></div>
        <div className="stat-item"><div className="stat-number">0</div><div className="stat-label">Найдено</div></div>
        <div className="stat-item"><div className="stat-number">{user?.helpCount || 0}</div><div className="stat-label">Помощь</div></div>
      </div>
 
      {isOwnProfile && (
        <div style={{display:'flex', borderBottom:'2px solid #E3F2FD', background:'white'}}>
          {[['info','👤 Профиль'], ['posts','📋 Объявления'], ['messages','💬 Сообщения']].map(([tab, label]) => (
            <div key={tab}
              onClick={() => tab === 'messages' ? navigate('/chats') : setActiveTab(tab)}
              style={{flex:1, textAlign:'center', padding:'12px 6px', fontSize:'13px',
                fontWeight: activeTab===tab ? '700':'400',
                color: activeTab===tab ? '#3B5998':'#666',
                borderBottom: activeTab===tab ? '2px solid #3B5998':'none',
                cursor:'pointer', marginBottom:'-2px'}}>
              {label}
            </div>
          ))}
        </div>
      )}
 
      <div className="profile-content">
        {activeTab === 'info' && (
          <>
            <div className="section">
              <div className="section-title">Контакты</div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-info">
                  <div className="contact-label">Телефон {isOwnProfile && <span style={{fontSize:'11px', color: user?.phoneHidden ? '#FF6B35' : '#4CAF50'}}>{user?.phoneHidden ? '🔒 скрыт' : '🔓 виден всем'}</span>}</div>
                  <div className="contact-value">{user?.phone || 'Не указан'}</div>
                </div>
                {isOwnProfile && (
                  <button onClick={handleTogglePhoneHidden} style={{background:'none', border:'1px solid #E0E0E0', borderRadius:'8px', padding:'6px 10px', fontSize:'12px', cursor:'pointer', color:'#666', flexShrink:0}}>
                    {user?.phoneHidden ? '👁 Показать' : '🙈 Скрыть'}
                  </button>
                )}
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
                {[['🔔','Уведомления'],['❓','Помощь'],['ℹ️','О приложении']].map(([icon, label]) => (
                  <div key={label} className="menu-item">
                    <div className="menu-icon">{icon}</div>
                    <div className="menu-text">{label}</div>
                    <div className="menu-arrow">→</div>
                  </div>
                ))}
              </div>
            )}
            {isOwnProfile && <button className="logout-btn" onClick={handleLogout}>Выйти из аккаунта</button>}
          </>
        )}
 
        {activeTab === 'posts' && isOwnProfile && (
          <div>
            {postsLoading ? (
              <div className="loading-state"><div className="spinner"></div></div>
            ) : myPosts.length === 0 ? (
              <div style={{padding:'40px 20px', textAlign:'center'}}>
                <div style={{fontSize:'48px'}}>📋</div>
                <h3>Нет объявлений</h3>
                <p style={{color:'#999'}}>Создайте первое объявление</p>
                <button className="btn-primary" onClick={() => navigate('/create-post')} style={{marginTop:'16px'}}>
                  Создать объявление
                </button>
              </div>
            ) : (
              <div style={{padding:'12px'}}>
                {myPosts.map(post => (
                  <div key={post.id} style={{background:'white', borderRadius:'12px', padding:'14px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                    <div style={{display:'flex', gap:'12px'}}>
                      {post.image ? (
                        <img src={getImageUrl(post, post.image)} alt={post.petName}
                          style={{width:'70px', height:'70px', objectFit:'cover', borderRadius:'8px', flexShrink:0}} />
                      ) : (
                        <div style={{width:'70px', height:'70px', background:'#F5F9FF', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0}}>🐾</div>
                      )}
                      <div style={{flex:1}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                          <div>
                            <div style={{fontWeight:'700', fontSize:'16px'}}>{post.petName}</div>
                            <div style={{fontSize:'12px', color: post.type==='lost'?'#FF6B35':'#4CAF50', fontWeight:'600', marginTop:'2px'}}>
                              {post.type === 'lost' ? '🔍 Потерялся' : '🐾 Найден'}
                            </div>
                          </div>
                          <div style={{fontSize:'11px', color:'#999'}}>{getTimeAgo(post.created)}</div>
                        </div>
                        <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>📍 {post.location}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                      <button onClick={() => navigate(`/post/${post.id}`)}
                        style={{flex:1, padding:'8px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#3B5998'}}>
                        👁️ Просмотр
                      </button>
                      <button onClick={() => handleDeletePost(post.id)}
                        style={{flex:1, padding:'8px', background:'#FFEBEE', border:'1px solid #FFCDD2', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#C62828'}}>
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
 
      <BottomNav />
    </div>
  );
}
 
function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff/60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ч назад`;
  return `${Math.floor(diff/86400)} дн назад`;
}
 
export default Profile;
 