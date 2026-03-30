import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, SearchIcon, PawIcon, VolunteerIcon, ChatIcon } from './Icons';
import pb from '../services/pocketbase';
import '../styles/BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [badges, setBadges] = useState({ lost: 0, found: 0, chats: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const currentUser = pb.authStore.model;

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBadges = async () => {
    if (!currentUser?.id) return;
    const lastLost = localStorage.getItem('lastVisitLost') || '2000-01-01';
    const lastFound = localStorage.getItem('lastVisitFound') || '2000-01-01';
    try {
      const msgs = await pb.collection('messages').getList(1, 200, {
        filter: `userId != "${currentUser.id}" && chatType = "private"`,
        fields: 'id,chatId,read'
      });
      const unreadChats = msgs.items.filter(m => m.chatId && m.chatId.includes(currentUser.id) && !m.read).length;

      const [lostRes, foundRes] = await Promise.all([
        pb.collection('posts').getList(1, 1, { filter: `type = "lost" && created > "${lastLost}" && userId != "${currentUser.id}"`, fields: 'id' }),
        pb.collection('posts').getList(1, 1, { filter: `type = "found" && created > "${lastFound}" && userId != "${currentUser.id}"`, fields: 'id' }),
      ]);

      setBadges({ lost: lostRes.totalItems, found: foundRes.totalItems, chats: unreadChats });
    } catch (e) {}
  };

  const isVolunteer = currentUser?.userType === 'volunteer' || currentUser?.userType === 'volunteer_pending';

  const getFabPath = () => {
    if (!currentUser) { setShowAuthModal(true); return null; }
    if (isVolunteer) return '/create-post/choose';
    if (currentUser?.userType === 'service') return '/create-post?type=service';
    return '/create-post';
  };

  const handleNav = (path) => {
    // Защищённые маршруты для незалогиненных
    const protectedPaths = ['/chats', '/profile'];
    if (!currentUser && protectedPaths.some(p => path.startsWith(p))) {
      setShowAuthModal(true);
      return;
    }
    if (path === '/volunteers') localStorage.setItem('lastVisitVolunteers', new Date().toISOString());
    if (path === '/services') localStorage.setItem('lastVisitServices', new Date().toISOString());
    navigate(path);
  };

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Главная' },
    { path: '/create-post?type=lost', icon: SearchIcon, label: 'Потерял' },
    { path: '/create-post?type=found', icon: PawIcon, label: 'Нашёл' },
    { path: '/volunteers', icon: VolunteerIcon, label: 'Волонтёры' },
    { path: '/chats', icon: ChatIcon, label: 'Чаты', badge: badges.chats },
    { path: '/services', icon: () => <span style={{fontSize:'22px'}}>🛎️</span>, label: 'Услуги' },
    ...(isVolunteer ? [{ path: '/blacklist', icon: () => <span style={{fontSize:'22px'}}>🚫</span>, label: 'ЧС' }] : []),
  ];

  const isActive = (path) => {
    if (path === '/create-post?type=lost' || path === '/create-post?type=found') return location.pathname === '/create-post';
    if (path === '/chats') return location.pathname === '/chats' || location.pathname.startsWith('/chat/');
    if (path === '/volunteers') return location.pathname.startsWith('/volunteers');
    if (path === '/services') return location.pathname.startsWith('/services');
    return location.pathname === path;
  };

  return (
    <>
      {/* FAB кнопка ➕ */}
      <div
        onClick={() => { const path = getFabPath(); if (path) navigate(path); }}
        style={{
          position: 'fixed', bottom: '80px', right: '20px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
          color: 'white', fontSize: '28px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
          cursor: 'pointer', zIndex: 100,
          transition: 'transform 0.2s',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ➕
      </div>

      <div className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <div
              key={item.path}
              className={'nav-item ' + (active ? 'active' : '')}
              onClick={() => handleNav(item.path)}
            >
              <div className="nav-icon" style={{position:'relative'}}>
                <Icon active={active} />
                {item.badge > 0 && (
                  <div className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</div>
                )}
              </div>
              <div className="nav-label">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Модалка авторизации для гостей */}
      {showAuthModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end'}}
          onClick={() => setShowAuthModal(false)}>
          <div style={{background:'white', borderRadius:'24px 24px 0 0', width:'100%', padding:'24px'}}
            onClick={e => e.stopPropagation()}>
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <div style={{fontSize:'40px', marginBottom:'8px'}}>🐾</div>
              <div style={{fontWeight:'700', fontSize:'18px', marginBottom:'6px'}}>Нужна авторизация</div>
              <div style={{fontSize:'14px', color:'#666'}}>Войдите или зарегистрируйтесь чтобы продолжить</div>
            </div>
            <div onClick={() => navigate('/login')}
              style={{display:'block', padding:'14px', background:'#3B5998', color:'white', borderRadius:'12px', textAlign:'center', fontSize:'15px', fontWeight:'700', cursor:'pointer', marginBottom:'10px'}}>
              Войти
            </div>
            <div onClick={() => navigate('/register')}
              style={{display:'block', padding:'14px', background:'#F5F9FF', color:'#3B5998', borderRadius:'12px', textAlign:'center', fontSize:'15px', fontWeight:'700', cursor:'pointer', border:'2px solid #E3F2FD'}}>
              Зарегистрироваться
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNav;
