import React, { useState, useEffect } from 'react';
import pb, { getImageUrl } from '../services/pocketbase';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Profile.css';

const CATEGORY_LABELS = {
  veterinary: '🏥 Ветеринар',
  boarding: '🏠 Передержка',
  zootaxi: '🚗 Зоотакси',
  groomer: '✂️ Грумер',
  trainer: '🎓 Кинолог',
};

const STARS = [1, 2, 3, 4, 5];

function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Волонтёр
  const [volunteerForm, setVolunteerForm] = useState({ district: '', bio: '' });
  const [volunteerSaving, setVolunteerSaving] = useState(false);
  const [volunteerSaved, setVolunteerSaved] = useState(false);

  // Поставщик услуг
  const [serviceForm, setServiceForm] = useState({ address: '', workTime: '', priceFrom: '', bio: '' });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceSaved, setServiceSaved] = useState(false);

  // Отзывы
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState({ rating: 0, text: '' });
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  const isOwnProfile = !id;
  const profileUserId = id || pb.authStore.model?.id;
  const isVolunteer = user?.userType === 'volunteer';
  const isService = user?.userType === 'service';
  const currentUser = pb.authStore.model;

  // Редактирование профиля
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const openEdit = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      district: user?.district || '',
      address: user?.address || '',
      workTime: user?.workTime || '',
      priceFrom: user?.priceFrom || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const data = new FormData();
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v));
      if (avatarFile) data.append('avatar', avatarFile);
      const updated = await pb.collection('users').update(pb.authStore.model.id, data);
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
      setEditModal(false);
    } catch { alert('Ошибка при сохранении'); }
    finally { setEditSaving(false); }
  };
    try {
      const cats = u?.serviceCategories;
      if (!cats) return [];
      if (Array.isArray(cats)) return cats;
      return JSON.parse(cats);
    } catch { return []; }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      pb.collection('users').getOne(id)
        .then(record => { setUser(record); syncForms(record); })
        .catch(() => navigate(-1))
        .finally(() => setLoading(false));
    } else {
      const u = pb.authStore.model;
      setUser(u);
      syncForms(u);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncForms = (u) => {
    setVolunteerForm({ district: u?.district || '', bio: u?.bio || '' });
    setServiceForm({ address: u?.address || '', workTime: u?.workTime || '', priceFrom: u?.priceFrom || '', bio: u?.bio || '' });
  };

  useEffect(() => {
    if (activeTab === 'posts' && isOwnProfile) fetchMyPosts();
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMyPosts = async () => {
    setPostsLoading(true);
    try {
      const records = await pb.collection('posts').getList(1, 50, {
        filter: `userId = "${pb.authStore.model.id}"`, sort: '-created'
      });
      setMyPosts(records.items);
    } catch (e) { console.error(e); }
    finally { setPostsLoading(false); }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const records = await pb.collection('reviews').getList(1, 50, {
        filter: `targetUserId = "${profileUserId}"`, sort: '-created'
      });
      setReviews(records.items);
      // Проверяем — оставлял ли текущий пользователь отзыв
      if (!isOwnProfile && currentUser) {
        const mine = records.items.find(r => r.authorId === currentUser.id);
        if (mine) setExistingReview(mine);
      }
    } catch (e) { console.error(e); }
    finally { setReviewsLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!myReview.rating) { alert('Поставьте оценку'); return; }
    if (!myReview.text.trim()) { alert('Напишите комментарий'); return; }
    setReviewSubmitting(true);
    try {
      if (existingReview) {
        await pb.collection('reviews').update(existingReview.id, {
          rating: myReview.rating, text: myReview.text
        });
      } else {
        await pb.collection('reviews').create({
          targetUserId: profileUserId,
          authorId: currentUser.id,
          authorName: currentUser.name,
          rating: myReview.rating,
          text: myReview.text,
        });
      }
      // Пересчитываем средний рейтинг
      const allReviews = await pb.collection('reviews').getFullList({
        filter: `targetUserId = "${profileUserId}"`, fields: 'rating'
      });
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await pb.collection('users').update(profileUserId, { rating: Math.round(avg * 10) / 10 });
      setMyReview({ rating: 0, text: '' });
      fetchReviews();
    } catch (e) { alert('Ошибка при отправке отзыва'); }
    finally { setReviewSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Удалить объявление?')) return;
    try {
      await pb.collection('posts').delete(postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
    } catch { alert('Ошибка при удалении'); }
  };

  const handleTogglePhoneHidden = async () => {
    try {
      const updated = await pb.collection('users').update(pb.authStore.model.id, { phoneHidden: !user.phoneHidden });
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
    } catch { alert('Ошибка при сохранении'); }
  };

  const handleSaveVolunteer = async () => {
    setVolunteerSaving(true);
    try {
      const updated = await pb.collection('users').update(pb.authStore.model.id, volunteerForm);
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
      setVolunteerSaved(true);
      setTimeout(() => setVolunteerSaved(false), 2000);
    } catch { alert('Ошибка при сохранении'); }
    finally { setVolunteerSaving(false); }
  };

  const handleSaveService = async () => {
    setServiceSaving(true);
    try {
      const updated = await pb.collection('users').update(pb.authStore.model.id, serviceForm);
      pb.authStore.save(pb.authStore.token, updated);
      setUser(updated);
      setServiceSaved(true);
      setTimeout(() => setServiceSaved(false), 2000);
    } catch { alert('Ошибка при сохранении'); }
    finally { setServiceSaving(false); }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      pb.authStore.clear();
      navigate('/login');
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : user?.rating || null;

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  const tabs = [
    ['info', '👤 Профиль'],
    ['posts', '📋 Объявления'],
    ...(isVolunteer ? [['volunteer', '🤝 Волонтёр']] : []),
    ...(isService ? [['service', '🛎️ Услуги']] : []),
    ['reviews', '⭐ Отзывы'],
    ...(isOwnProfile ? [['messages', '💬 Сообщения']] : []),
  ];

  const serviceCategories = getServiceCategories(user);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-top">
          <div className="back-btn" onClick={() => navigate(-1)} style={{color:'white',fontSize:'24px',cursor:'pointer'}}>←</div>
          <div className="settings-btn" onClick={isOwnProfile ? openEdit : undefined} style={{cursor: isOwnProfile ? 'pointer' : 'default', fontSize:'22px'}}>{isOwnProfile ? '⚙️' : ''}</div>
        </div>
        <div className="avatar-section">
          <div className="avatar">
            👤
            {user?.isVerified && <div className="avatar-badge">✓</div>}
          </div>
          <div className="user-name">
            {user?.name || 'Пользователь'}
            {user?.isVerified && <span style={{fontSize:'14px', marginLeft:'6px', color:'#4FC3F7'}}>✓</span>}
          </div>
          <div className="user-type">
            {isVolunteer ? '🤝 Волонтёр' : isService ? '🛎️ Поставщик услуг' : '🐾 Владелец питомцев'}
          </div>
          {isVolunteer && user?.district && (
            <div style={{fontSize:'13px', color:'rgba(255,255,255,0.85)', marginTop:'4px'}}>📍 {user.district}</div>
          )}
          {isService && serviceCategories.length > 0 && (
            <div style={{display:'flex', gap:'6px', flexWrap:'wrap', justifyContent:'center', marginTop:'8px'}}>
              {serviceCategories.map(cat => (
                <span key={cat} style={{background:'rgba(255,255,255,0.2)', borderRadius:'12px', padding:'3px 10px', fontSize:'12px', color:'white'}}>
                  {CATEGORY_LABELS[cat] || cat}
                </span>
              ))}
            </div>
          )}
          {avgRating && (
            <div style={{marginTop:'6px', fontSize:'13px', color:'rgba(255,255,255,0.9)'}}>
              ⭐ {avgRating} ({reviews.length || 0} отзывов)
            </div>
          )}
        </div>
      </div>

      {/* stats убраны */}

      <div style={{display:'flex', borderBottom:'2px solid #E3F2FD', background:'white', overflowX:'auto'}}>
        {tabs.map(([tab, label]) => (
          <div key={tab}
            onClick={() => tab === 'messages' ? navigate('/chats') : setActiveTab(tab)}
            style={{flex:1, textAlign:'center', padding:'12px 6px', fontSize:'12px', whiteSpace:'nowrap',
              fontWeight: activeTab===tab ? '700':'400',
              color: activeTab===tab ? '#3B5998':'#666',
              borderBottom: activeTab===tab ? '2px solid #3B5998':'none',
              cursor:'pointer', marginBottom:'-2px'}}>
            {label}
          </div>
        ))}
      </div>

      <div className="profile-content">

        {/* --- ПРОФИЛЬ --- */}
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
              {isService && user?.address && (
                <div className="contact-item">
                  <div className="contact-icon">📍</div>
                  <div className="contact-info"><div className="contact-label">Адрес</div><div className="contact-value">{user.address}</div></div>
                </div>
              )}
              {isService && user?.workTime && (
                <div className="contact-item">
                  <div className="contact-icon">🕐</div>
                  <div className="contact-info"><div className="contact-label">Часы работы</div><div className="contact-value">{user.workTime}</div></div>
                </div>
              )}
              {isService && user?.priceFrom && (
                <div className="contact-item">
                  <div className="contact-icon">💰</div>
                  <div className="contact-info"><div className="contact-label">Цены</div><div className="contact-value">{user.priceFrom}</div></div>
                </div>
              )}
            </div>

            {user?.bio && (
              <div className="section">
                <div className="section-title">О себе</div>
                <div style={{fontSize:'14px', color:'#444', lineHeight:'1.5', padding:'4px 0'}}>{user.bio}</div>
              </div>
            )}

            {!isOwnProfile ? (
              <button className="btn-primary" style={{width:'100%', margin:'0 16px 16px', width:'calc(100% - 32px)'}} onClick={() => navigate(`/chat/${id}`)}>
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

        {/* --- ОБЪЯВЛЕНИЯ --- */}
        {activeTab === 'posts' && isOwnProfile && (
          <div>
            {postsLoading ? (
              <div className="loading-state"><div className="spinner"></div></div>
            ) : myPosts.length === 0 ? (
              <div style={{padding:'40px 20px', textAlign:'center'}}>
                <div style={{fontSize:'48px'}}>📋</div>
                <h3>Нет объявлений</h3>
                <button className="btn-primary" onClick={() => navigate('/create-post')} style={{marginTop:'16px'}}>Создать объявление</button>
              </div>
            ) : (
              <div style={{padding:'12px'}}>
                {myPosts.map(post => (
                  <div key={post.id} style={{background:'white', borderRadius:'12px', padding:'14px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                    <div style={{display:'flex', gap:'12px'}}>
                      {post.image
                        ? <img src={getImageUrl(post, post.image)} alt={post.petName} style={{width:'70px', height:'70px', objectFit:'cover', borderRadius:'8px', flexShrink:0}} />
                        : <div style={{width:'70px', height:'70px', background:'#F5F9FF', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0}}>🐾</div>
                      }
                      <div style={{flex:1}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                          <div>
                            <div style={{fontWeight:'700', fontSize:'16px'}}>{post.petName}</div>
                            <div style={{fontSize:'12px', color: post.type==='lost'?'#FF6B35':post.type==='service'?'#7B1FA2':post.type==='help'?'#E65100':'#4CAF50', fontWeight:'600', marginTop:'2px'}}>
                              {post.type === 'lost' ? '🔍 Потерялся' : post.type === 'service' ? '🛎️ Реклама' : post.type === 'help' ? '🆘 Нужна помощь' : '🐾 Найден'}
                            </div>
                          </div>
                          <div style={{fontSize:'11px', color:'#999'}}>{getTimeAgo(post.created)}</div>
                        </div>
                        <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>📍 {post.location}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                      <button onClick={() => navigate(`/post/${post.id}`)} style={{flex:1, padding:'8px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#3B5998'}}>👁️ Просмотр</button>
                      <button onClick={() => handleDeletePost(post.id)} style={{flex:1, padding:'8px', background:'#FFEBEE', border:'1px solid #FFCDD2', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#C62828'}}>🗑️ Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ВОЛОНТЁР --- */}
        {activeTab === 'volunteer' && isVolunteer && isOwnProfile && (
          <div style={{padding:'16px'}}>
            <div style={{background:'linear-gradient(135deg, #4CAF50, #66BB6A)', borderRadius:'16px', padding:'20px', marginBottom:'16px', color:'white', textAlign:'center'}}>
              <div style={{fontSize:'40px', fontWeight:'800'}}>{user?.helpCount || 0}</div>
              <div style={{fontSize:'15px', opacity:0.9}}>раз помог(ла) животным</div>
            </div>
            <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'16px', color:'#333'}}>📋 Информация волонтёра</div>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>📍 Район / Город</label>
                <input type="text" value={volunteerForm.district} onChange={e => setVolunteerForm(f => ({...f, district: e.target.value}))}
                  placeholder="Например: Центральный район, Москва"
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>💬 О себе</label>
                <textarea value={volunteerForm.bio} onChange={e => setVolunteerForm(f => ({...f, bio: e.target.value}))}
                  placeholder="Расскажите о себе и вашем опыте..." rows={3}
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box', resize:'none', fontFamily:'inherit'}} />
              </div>
              <button onClick={handleSaveVolunteer} disabled={volunteerSaving}
                style={{width:'100%', padding:'12px', background: volunteerSaved ? '#4CAF50' : '#3B5998', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                {volunteerSaving ? 'Сохранение...' : volunteerSaved ? '✓ Сохранено!' : 'Сохранить'}
              </button>
            </div>
            <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
              <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'12px', color:'#333'}}>⚡ Быстрые действия</div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <button onClick={() => navigate('/create-post')} style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>📢 Создать объявление</button>
                <button onClick={() => navigate('/volunteers/requests')} style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>🤝 Запросы о помощи</button>
                <button onClick={() => navigate('/chats')} style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>💬 Чат волонтёров</button>
              </div>
            </div>
          </div>
        )}

        {/* --- УСЛУГИ (для поставщика) --- */}
        {activeTab === 'service' && isService && isOwnProfile && (
          <div style={{padding:'16px'}}>
            <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:'16px'}}>
              <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'16px', color:'#333'}}>🛎️ Информация об услугах</div>

              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>📍 Адрес</label>
                <input type="text" value={serviceForm.address} onChange={e => setServiceForm(f => ({...f, address: e.target.value}))}
                  placeholder="Улица, дом, город"
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>🕐 Часы работы</label>
                <input type="text" value={serviceForm.workTime} onChange={e => setServiceForm(f => ({...f, workTime: e.target.value}))}
                  placeholder="Например: 09:00 - 21:00"
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>💰 Цены</label>
                <input type="text" value={serviceForm.priceFrom} onChange={e => setServiceForm(f => ({...f, priceFrom: e.target.value}))}
                  placeholder="Например: от 500 ₽"
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>💬 Описание услуг</label>
                <textarea value={serviceForm.bio} onChange={e => setServiceForm(f => ({...f, bio: e.target.value}))}
                  placeholder="Расскажите о ваших услугах..." rows={3}
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box', resize:'none', fontFamily:'inherit'}} />
              </div>
              <button onClick={handleSaveService} disabled={serviceSaving}
                style={{width:'100%', padding:'12px', background: serviceSaved ? '#4CAF50' : '#3B5998', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                {serviceSaving ? 'Сохранение...' : serviceSaved ? '✓ Сохранено!' : 'Сохранить'}
              </button>
            </div>

            <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
              <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'12px', color:'#333'}}>⚡ Быстрые действия</div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <button onClick={() => navigate('/create-post')} style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>📢 Создать рекламное объявление</button>
                <button onClick={() => navigate('/services')} style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>🛎️ Мои услуги в каталоге</button>
                <button onClick={() => navigate('/chats')} style={{padding:'12px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'10px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600', textAlign:'left'}}>💬 Личные сообщения</button>
              </div>
            </div>
          </div>
        )}

        {/* --- ОТЗЫВЫ --- */}
        {activeTab === 'reviews' && (
          <div style={{padding:'16px'}}>

            {/* Форма для оставления отзыва (только для чужого профиля) */}
            {!isOwnProfile && currentUser && (
              <div style={{background:'white', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:'16px'}}>
                <div style={{fontWeight:'700', fontSize:'15px', marginBottom:'12px', color:'#333'}}>
                  {existingReview ? '✏️ Изменить отзыв' : '✍️ Оставить отзыв'}
                </div>
                {/* Звёзды */}
                <div style={{display:'flex', gap:'6px', marginBottom:'12px'}}>
                  {STARS.map(star => (
                    <span key={star}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setMyReview(r => ({...r, rating: star}))}
                      style={{fontSize:'32px', cursor:'pointer', transition:'transform 0.1s',
                        transform: reviewHover >= star || myReview.rating >= star ? 'scale(1.2)' : 'scale(1)',
                        filter: reviewHover >= star || myReview.rating >= star ? 'none' : 'grayscale(1)'}}>
                      ⭐
                    </span>
                  ))}
                  {myReview.rating > 0 && (
                    <span style={{fontSize:'14px', color:'#666', alignSelf:'center', marginLeft:'4px'}}>
                      {['','Плохо','Так себе','Нормально','Хорошо','Отлично'][myReview.rating]}
                    </span>
                  )}
                </div>
                <textarea value={myReview.text} onChange={e => setMyReview(r => ({...r, text: e.target.value}))}
                  placeholder="Поделитесь вашим опытом..."
                  rows={3}
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box', resize:'none', fontFamily:'inherit', marginBottom:'10px'}} />
                <button onClick={handleSubmitReview} disabled={reviewSubmitting}
                  style={{width:'100%', padding:'12px', background:'#3B5998', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                  {reviewSubmitting ? 'Отправка...' : existingReview ? 'Обновить отзыв' : 'Отправить отзыв'}
                </button>
              </div>
            )}

            {/* Список отзывов */}
            {reviewsLoading ? (
              <div className="loading-state"><div className="spinner"></div></div>
            ) : reviews.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'#999'}}>
                <div style={{fontSize:'48px'}}>⭐</div>
                <p>Пока нет отзывов</p>
                {!isOwnProfile && <p style={{fontSize:'13px'}}>Будьте первым!</p>}
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {reviews.map(review => (
                  <div key={review.id} style={{background:'white', borderRadius:'16px', padding:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#E3F2FD', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}}>👤</div>
                        <div>
                          <div style={{fontWeight:'700', fontSize:'14px'}}>{review.authorName}</div>
                          <div style={{fontSize:'11px', color:'#999'}}>{getTimeAgo(review.created)}</div>
                        </div>
                      </div>
                      <div style={{fontSize:'16px'}}>{'⭐'.repeat(review.rating)}</div>
                    </div>
                    <div style={{fontSize:'14px', color:'#444', lineHeight:'1.5'}}>{review.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Модалка редактирования профиля */}
      {editModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end'}}>
          <div style={{background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'90vh', overflowY:'auto', padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <div style={{fontWeight:'700', fontSize:'18px'}}>✏️ Редактировать профиль</div>
              <div onClick={() => setEditModal(false)} style={{fontSize:'24px', cursor:'pointer', color:'#999'}}>✕</div>
            </div>

            {/* Аватарка */}
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <div style={{width:'90px', height:'90px', borderRadius:'50%', margin:'0 auto', overflow:'hidden', background:'#E3F2FD', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', position:'relative'}}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  : user?.avatar
                    ? <img src={pb.files.getUrl(user, user.avatar)} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    : '👤'
                }
              </div>
              <label style={{display:'inline-block', marginTop:'10px', padding:'8px 16px', background:'#F5F9FF', border:'1px solid #E3F2FD', borderRadius:'20px', cursor:'pointer', fontSize:'13px', color:'#3B5998', fontWeight:'600'}}>
                📷 Изменить фото
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{display:'none'}} />
              </label>
            </div>

            {/* Основные поля */}
            {[['name','👤 Имя / Название','text'], ['phone','📞 Телефон','tel']].map(([key, label, type]) => (
              <div key={key} style={{marginBottom:'14px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>{label}</label>
                <input type={type} value={editForm[key] || ''} onChange={e => setEditForm(f => ({...f, [key]: e.target.value}))}
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
              </div>
            ))}

            <div style={{marginBottom:'14px'}}>
              <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>💬 О себе</label>
              <textarea value={editForm.bio || ''} onChange={e => setEditForm(f => ({...f, bio: e.target.value}))}
                rows={3} placeholder="Расскажите о себе..."
                style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box', resize:'none', fontFamily:'inherit'}} />
            </div>

            {/* Поля волонтёра */}
            {isVolunteer && (
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>📍 Район / Город</label>
                <input type="text" value={editForm.district || ''} onChange={e => setEditForm(f => ({...f, district: e.target.value}))}
                  placeholder="Например: Центральный район, Москва"
                  style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
              </div>
            )}

            {/* Поля поставщика услуг */}
            {isService && (
              <>
                {[['address','📍 Адрес','Улица, дом, город'], ['workTime','🕐 Часы работы','09:00 - 21:00'], ['priceFrom','💰 Цены','от 500 ₽']].map(([key, label, placeholder]) => (
                  <div key={key} style={{marginBottom:'14px'}}>
                    <label style={{display:'block', fontSize:'13px', color:'#666', marginBottom:'6px', fontWeight:'600'}}>{label}</label>
                    <input type="text" value={editForm[key] || ''} onChange={e => setEditForm(f => ({...f, [key]: e.target.value}))}
                      placeholder={placeholder}
                      style={{width:'100%', padding:'10px 12px', border:'1px solid #E0E0E0', borderRadius:'10px', fontSize:'14px', boxSizing:'border-box'}} />
                  </div>
                ))}
              </>
            )}

            <button onClick={handleSaveEdit} disabled={editSaving}
              style={{width:'100%', padding:'14px', background:'#3B5998', color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700', cursor:'pointer', marginTop:'8px'}}>
              {editSaving ? 'Сохранение...' : '✅ Сохранить'}
            </button>
          </div>
        </div>
      )}

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
