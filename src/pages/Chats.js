import React, { useState } from 'react';
import pb from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Chats.css';

function Chats() {
  const [activeTab, setActiveTab] = useState('group');
  const navigate = useNavigate();
  const currentUser = pb.authStore.model;

  // Определяем доступные групповые чаты
  const availableGroupChats = [
    { id: 'general', name: 'Общий чат', icon: '🌐', type: 'general', description: 'Для всех пользователей', forAll: true },
    { id: 'volunteers', name: 'Чат волонтёров', icon: '🤝', type: 'volunteer', description: 'Координация помощи', allowedType: 'volunteer' },
    { id: 'veterinary', name: 'Чат ветеринаров', icon: '🏥', type: 'veterinary', description: 'Профессиональное общение', allowedType: 'veterinary' },
    { id: 'trainers', name: 'Чат кинологов', icon: '🎓', type: 'trainer', description: 'Обмен опытом', allowedType: 'trainer' },
    { id: 'groomers', name: 'Чат грумеров', icon: '✂️', type: 'groomer', description: 'Советы и рекомендации', allowedType: 'groomer' },
    { id: 'zootaxi', name: 'Чат зоотакси', icon: '🚗', type: 'zootaxi', description: 'Координация перевозок', allowedType: 'zootaxi' },
  ];

  // Фильтруем чаты по правам доступа
  const userGroupChats = availableGroupChats.filter(chat => 
    chat.forAll || chat.allowedType === currentUser?.userType
  );

  // Mock данные для личных чатов
  const mockPrivateChats = [
    { id: 1, userName: 'Мария Соколова', userAvatar: '👩', lastMessage: 'Спасибо за помощь!', time: '10:30', unread: 2, online: true },
    { id: 2, userName: 'Ветклиника Айболит', userAvatar: '🏥', lastMessage: 'Можем принять завтра', time: 'Вчера', unread: 0, online: false },
    { id: 3, userName: 'Дмитрий Петров', userAvatar: '👨', lastMessage: 'Собака найдена!', time: '2 дня', unread: 0, online: false },
  ];

  const handleOpenGroupChat = (chat) => {
    navigate(`/chat/${chat.id}`, { state: { chatType: 'group', chatName: chat.name } });
  };

  const handleOpenPrivateChat = (chat) => {
    navigate(`/chat/${chat.id}`, { state: { chatType: 'private', chatName: chat.userName } });
  };

  return (
    <div className="chats-page">
      <div className="header">
        <div className="header-top">
          <div className="header-title">💬 Сообщения</div>
          <div className="search-icon">🔍</div>
        </div>
        <div className="tabs">
          <div className={`tab ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>
            Чаты ({userGroupChats.length})
          </div>
          <div className={`tab ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>
            Личные ({mockPrivateChats.filter(c => c.unread > 0).length})
          </div>
        </div>
      </div>

      <div className="content">
        {activeTab === 'group' ? (
          <div className="group-chats-list">
            {userGroupChats.map(chat => (
              <div key={chat.id} className="chat-item group-chat-item" onClick={() => handleOpenGroupChat(chat)}>
                <div className="chat-avatar group-avatar">{chat.icon}</div>
                <div className="chat-content">
                  <div className="chat-header">
                    <div className="chat-name">{chat.name}</div>
                    {chat.allowedType && (
                      <div className="access-badge">🔒 Закрытый</div>
                    )}
                  </div>
                  <div className="chat-message">{chat.description}</div>
                </div>
                <div className="chat-arrow">→</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="private-chats-list">
            {mockPrivateChats.map(chat => (
              <div key={chat.id} className={`chat-item ${chat.unread > 0 ? 'unread' : ''}`} onClick={() => handleOpenPrivateChat(chat)}>
                <div className="chat-avatar">
                  {chat.userAvatar}
                  {chat.online && <div className="online-badge"></div>}
                </div>
                <div className="chat-content">
                  <div className="chat-header">
                    <div className="chat-name">{chat.userName}</div>
                    <div className="chat-time">{chat.time}</div>
                  </div>
                  <div className="chat-message">{chat.lastMessage}</div>
                </div>
                {chat.unread > 0 && (
                  <div className="chat-info">
                    <div className="unread-badge">{chat.unread}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Chats;
