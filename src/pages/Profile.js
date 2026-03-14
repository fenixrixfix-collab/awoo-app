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
  const [volunteerForm, setVolunteerForm] = useState({ district: '', bio: '' });
  const [volunteerSaving, setVolunteerSaving] = useState(false);
  const [volunteerSaved, setVolunteerSaved] = useState(false);
  const isOwnProfile = !id;
  const isVolunteer = user?.userType === 'volunteer';

  useEffect(() => {
    if (id) {
      setLoading(true);
      pb.collection('users').getOne(id)
        .then(record => { setUser(record); syncVolunteerForm(record); })
        .catch(() => navigate(-1))
        .finally(() => setLoading(false));
    } else {
      const u = pb.authStore.model;
      setUser(u);
      syncVolunteerForm(u);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncVolunteerForm = (u) => {
    setVolunteerForm({ district: u?.district || '', bio: u?.bio || '' });
  };

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
      const updated = await pb.collection('users').update(pb.authStore.model.id, {
        phoneHidden: !user.phoneHidden
      });
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении');
    }
  };

  const handleSaveVolunteer = async () => {
    setVolunteerSaving(true);
    try {
      const updated = await pb.collection('users').update(pb.authStore.model.id, {
        district: volunteerForm.district,
        bio: volunteerForm.bio,
      });
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
      setVolunteerSaved(true);
      setTimeout(() => setVolunteerSaved(false), 2000);
    } catch (e) {
      alert('Ошибка при сохранении');
    } finally {
      setVolunteerSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      pb.authStore.clear();
      navigate('/login');
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  // Вкладки: для волонтёра добавляем вкладку "Волонтёр"
  const tabs = [
    ['info', '👤 Профиль'],
    ['posts', '📋 Объявления'],
    ...(isVolunteer ? [['volunteer', '🤝 Волонтёр']] : []),
    ['messages', '💬 Сообщения'],
  ];

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
            {isVolunteer ? '🤝 Волонтёр' : user?.userType === 'service' ? '🏪 Поставщик услуг' : '🐾 Владелец питомцев'}
          </div>
          {isVolunteer && user?.district && (
            <div style={{fontSize:'13px', color:'rgba(255,255,255,0.85)', marginTop:'4px'}}>📍 {user.district}</div>
          )}
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-item"><div className="stat-number">{myPosts.length || user?.postsCount || 0}</div><div className="stat-label">Объявления</div></div>
        <div className="stat-item"><div className="stat-number">0</div><div className="stat-label">Найдено</div></div>
        <div className="stat-item"><div className="stat-number">{user?.helpCount || 0}</div><div className="stat-label">Помощь</div></div>
      </div>

      {isOwnProfile && (
        <div style={{display:'flex', borderBottom:'2px solid #E3F2FD', background:'white', overflowX:'auto'}}>
          {tabs.map(([tab, label]) => (
            <div key={tab}
              onClick={() => tab === 'messages' ? navigate('/chats') : setActiveTab(tab)}
              style={{flex:1, textAlign:'center', padding:'12px 6px', fontSize:'13px', whiteSpace:'nowrap',
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

        {/* --- Вкладка ПРОФИЛЬ --- */}
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

        {/* --- Вкладка ОБЪЯВЛЕНИЯ --- */}
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

        {/* --- Вкладка ВОЛОНТЁР (только для volunteer) --- */}
        {activeTab === 'volunteer' && isOwnProfile && isVolunteer && (
          <div style={{padding:'16px'}}>

            {/* Статистика помощи */}
            <div style={{background:'linear-gradient(135deg, #4CAF50, #66BB6A)', borderRadius:'16px', padding:'20px', marginBottom:'16px', color:'white', textAlign:'center'}}>
              <div style={{fontSize:'40px', fontWeight:'800'}}>{user?.helpCount || 0}</div>
              <div style={{fontSize:'15px', opacity:0.9}}>раз помог(ла) животным</div>
              {user?.helpCount > 0 && (
                <div style={{marginTop:'8px', fontSize:'13px', opacity:0.8}}>🏆 Спасибо за вашу помощь!</div>
              )}
            </div>

            {/* Форма волонтёра */}
            <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'16px', color:'#333'}}>📋 Информация волонтёра</div>

              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>📍 Район / Город</label>
                <input
                  type="text"
                  value={volunteerForm.district}
                  onChange={e => setVolunteerForm(f => ({...f, district: e.target.value}))}
                  placeholder="Например: Центральный район, Москва"
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box', outline:'none'}}
                />
              </div>

              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>💬 О себе</label>
                <textarea
                  value={volunteerForm.bio}
                  onChange={e => setVolunteerForm(f => ({...f, bio: e.target.value}))}
                  placeholder="Расскажите немного о себе и вашем опыте..."
                  rows={3}
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box', outline:'none', resize:'none', fontFamily:'inherit'}}
                />
              </div>

              <button
                onClick={handleSaveVolunteer}
                disabled={volunteerSaving}
                style={{width:'100%', padding:'12px', background: volunteerSaved ? '#4CAF50' : '#3B5998', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', transition:'background 0.3s'}}>
                {volunteerSaving ? 'Сохранение...' : volunteerSaved ? '✓ Сохранено!' : 'Сохранить'}
              </button>
            </div>

            {/* Быстрые действия волонтёра */}
            <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'12px', color:'#333'}}>⚡ Быстрые действия</div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <button onClick={() => navigate('/create-post')}
                  style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>
                  📢 Создать объявление (нашёл / потерял)
                </button>
                <button onClick={() => navigate('/volunteers/requests')}
                  style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>
                  🤝 Посмотреть запросы о помощи
                </button>
                <button onClick={() => navigate('/chats')}
                  style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>
                  💬 Чат волонтёров
                </button>
              </div>
            </div>

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
