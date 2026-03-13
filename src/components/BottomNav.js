import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, SearchIcon, PawIcon, VolunteerIcon, ChatIcon } from './Icons';
import pb from '../services/pocketbase';
import '../styles/BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = pb.authStore.model;

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUnread = async () => {
    if (!currentUser?.id) return;
    try {
      const records = await pb.collection('messages').getList(1, 1, {
        filter: `chatId ~ "${currentUser.id}" && userId != "${currentUser.id}" && read = false && chatType = "private"`,
        fields: 'id'
      });
      setUnreadCount(records.totalItems);
    } catch (e) {}
  };

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Главная' },
    { path: '/create-post?type=lost', icon: SearchIcon, label: 'Потерял' },
    { path: '/create-post?type=found', icon: PawIcon, label: 'Нашёл' },
    { path: '/volunteers', icon: VolunteerIcon, label: 'Волонтёры' },
    { path: '/chats', icon: ChatIcon, label: 'Чаты', badge: unreadCount },
    { path: '/services', icon: () => <span style={{fontSize: '22px'}}>🛎️</span>, label: 'Услуги' }
  ];

  const isActive = (path) => {
    if (path === '/create-post?type=lost' || path === '/create-post?type=found') {
      return location.pathname === '/create-post';
    }
    if (path === '/chats') {
      return location.pathname === '/chats' || location.pathname.startsWith('/chat/');
    }
    if (path === '/volunteers') {
      return location.pathname.startsWith('/volunteers');
    }
    if (path === '/services') {
      return location.pathname.startsWith('/services');
    }
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
            onClick={() => navigate(item.path)}
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
