import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, SearchIcon, PawIcon, VolunteerIcon, ChatIcon } from './Icons';
import '../styles/BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Главная' },
    { path: '/create-post?type=lost', icon: SearchIcon, label: 'Потерял' },
    { path: '/create-post?type=found', icon: PawIcon, label: 'Нашёл' },
    { path: '/volunteers', icon: VolunteerIcon, label: 'Волонтёры' },
    { path: '/chats', icon: ChatIcon, label: 'Чаты' },
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
            <div className="nav-icon">
              <Icon active={active} />
            </div>
            <div className="nav-label">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default BottomNav;
