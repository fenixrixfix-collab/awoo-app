import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, SearchIcon, PawIcon, VolunteerIcon, ChatIcon } from './Icons';
import pb from '../services/pocketbase';
import '../styles/BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [badges, setBadges] = useState({ lost: 0, found: 0, volunteers: 0, chats: 0, services: 0 });
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
    const lastVol = localStorage.getItem('lastVisitVolunteers') || '2000-01-01';
    const lastSvc = localStorage.getItem('lastVisitServices') || '2000-01-01';

    try {
      // Непрочитанные сообщения
      const msgs = await pb.collection('messages').getList(1, 200, {
        filter: `userId != "${currentUser.id}" && chatType = "private"`,
        fields: 'id,chatId,read'
      });
      const unreadChats = msgs.items.filter(m => m.chatId && m.chatId.includes(currentUser.id) && !m.read).length;

      // Новые объявления
      const [lostRes, foundRes] = await Promise.all([
        pb.collection('posts').getList(1, 1, { filter: `type = "lost" && created > "${lastLost}"`, fields: 'id' }),
        pb.collection('posts').getList(1, 1, { filter: `type = "found" && created > "${lastFound}"`, fields: 'id' }),
      ]);

      // Новые волонтёры и услуги
      let volCount = 0, svcCount = 0;
      try {
        const volRes = await pb.collection('volunteers').getList(1, 1, { filter: `created > "${lastVol}"`, fields: 'id' });
        volCount = volRes.totalItems;
      } catch (e) {}
      try {
        const svcRes = await pb.collection('services').getList(1, 1, { filter: `created > "${lastSvc}"`, fields: 'id' });
        svcCount = svcRes.totalItems;
      } catch (e) {}

      setBadges({
        lost: lostRes.totalItems,
        found: foundRes.totalItems,
        volunteers: volCount,
        chats: unreadChats,
        services: svcCount,
      });
    } catch (e) {}
  };

  const handleNav = (path) => {
    // Сбрасываем значок при переходе
    if (path.includes('lost')) localStorage.setItem('lastVisitLost', new Date().toISOString());
    if (path.includes('found')) localStorage.setItem('lastVisitFound', new Date().toISOString());
    if (path === '/volunteers') localStorage.setItem('lastVisitVolunteers', new Date().toISOString());
    if (path === '/services') localStorage.setItem('lastVisitServices', new Date().toISOString());
    navigate(path);
  };

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Главная' },
    { path: '/create-post?type=lost', icon: SearchIcon, label: 'Потерял', badge: badges.lost },
    { path: '/create-post?type=found', icon: PawIcon, label: 'Нашёл', badge: badges.found },
    { path: '/volunteers', icon: VolunteerIcon, label: 'Волонтёры', badge: badges.volunteers },
    { path: '/chats', icon: ChatIcon, label: 'Чаты', badge: badges.chats },
    { path: '/services', icon: () => <span style={{fontSize: '22px'}}>🛎️</span>, label: 'Услуги', badge: badges.services }
  ];

  const isActive = (path) => {
    if (path === '/create-post?type=lost' || path === '/create-post?type=found') {
      return location.pathname === '/create-post';
    }
    if (path === '/chats') {
      return location.pathname === '/chats' || location.pathname.startsWith('/chat/');
    }
    if (path === '/volunteers') return location.pathname.startsWith('/volunteers');
    if (path === '/services') return location.pathname.startsWith('/services');
    return location.pathname === path;
  };

  return (
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
  );
}

export default BottomNav;
