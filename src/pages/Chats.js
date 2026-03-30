import React, { useState, useEffect } from 'react';
import pb from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Chats.css';

function Chats() {
  const [activeTab, setActiveTab] = useState('private');
  const navigate = useNavigate();
  const currentUser = pb.authStore.model;
  const [privateChats, setPrivateChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  const isVolunteer = currentUser?.userType === 'volunteer' || currentUser?.userType === 'volunteer_pending';

  const groupChats = [
    { id: 'general', name: 'Общий чат', icon: '🌐', description: 'Для всех пользователей', forAll: true },
    { id: 'volunteers', name: 'Чат волонтёров', icon: '🤝', description: 'Координация помощи', allowedTypes: ['volunteer', 'volunteer_pending'] },
    { id: 'veterinary', name: 'Чат ветеринаров', icon: '🏥', description: 'Профессиональное общение', allowedType: 'veterinary' },
    { id: 'trainers', name: 'Чат кинологов', icon: '🎓', description: 'Обмен опытом', allowedType: 'trainer' },
    { id: 'groomers', name: 'Чат грумеров', icon: '✂️', description: 'Советы и рекомендации', allowedType: 'groomer' },
    { id: 'zootaxi', name: 'Чат зоотакси', icon: '🚗', description: 'Координация перевозок', allowedType: 'zootaxi' },
  ].filter(c => {
    if (c.forAll) return true;
    if (c.allowedTypes) return c.allowedTypes.includes(currentUser?.userType);
    return c.allowedType === currentUser?.userType;
  });

  useEffect(() => {
    if (activeTab === 'private') fetchPrivateChats();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrivateChats = async () => {
    setChatsLoading(true);
    try {
      const records = await pb.collection('messages').getList(1, 200, {
        filter: `(userId = "${currentUser?.id}" || chatId ~ "${currentUser?.id}") && chatType = "private"`,
        sort: '-created'
      });

      const chatsMap = {};
      for (const msg of records.items) {
        if (!chatsMap[msg.chatId]) {
          chatsMap[msg.chatId] = msg;
        }
      }

      const chatsList = await Promise.all(Object.values(chatsMap).map(async msg => {
        const otherUserId = msg.chatId.split('_').find(uid => uid !== currentUser?.id);
        const isMyMsg = msg.userId === currentUser?.id;
        let userName = isMyMsg ? (msg.otherUserName || '') : msg.userName;

        if (!userName && otherUserId) {
          try {
            const otherUser = await pb.collection('users').getOne(otherUserId, { fields: 'id,name,username' });
            userName = otherUser.name || otherUser.username || 'Пользователь';
          } catch (e) {
            userName = 'Пользователь';
          }
        }

        return {
          id: msg.chatId,
          userName: userName || 'Пользователь',
          otherUserId,
          lastMessage: msg.text,
          time: new Date(msg.created).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          unread: 0
        };
      }));

      setPrivateChats(chatsList);
    } catch (e) {
      console.error(e);
    } finally {
      setChatsLoading(false);
    }
  };

  return (
    <div className="chats-page">
      <div className="header">
        <div className="header-top">
          <div className="header-title">💬 Сообщения</div>
          <div className="search-icon">🔍</div>
        </div>
        <div className="tabs">
          <div className={`tab ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>
            Личные
          </div>
          <div className={`tab ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>
            Чаты ({groupChats.length})
          </div>
        </div>
      </div>

      <div className="content">
        {activeTab === 'group' && (
          <div className="group-chats-list">
            {groupChats.map(chat => (
              <div key={chat.id} className="chat-item group-chat-item"
                onClick={() => navigate(`/chat/${chat.id}`, { state: { chatType: 'group', chatName: chat.name } })}>
                <div className="chat-avatar group-avatar">{chat.icon}</div>
                <div className="chat-content">
                  <div className="chat-header">
                    <div className="chat-name">{chat.name}</div>
                    {chat.allowedType && <div className="access-badge">🔒 Закрытый</div>}
                  </div>
                  <div className="chat-message">{chat.description}</div>
                </div>
                <div className="chat-arrow">→</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'private' && (
          <div className="private-chats-list">
            {chatsLoading ? (
              <div style={{textAlign:'center', padding:'40px', color:'#999'}}>Загрузка...</div>
            ) : privateChats.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px 20px', color:'#999'}}>
                <div style={{fontSize:'48px'}}>💬</div>
                <p>Нет личных сообщений</p>
                <p style={{fontSize:'13px'}}>Напишите кому-нибудь из объявления</p>
              </div>
            ) : (
              privateChats.map(chat => (
                <div key={chat.id} className="chat-item"
                  onClick={() => navigate(`/chat/${chat.id}`, { state: { chatType: 'private', chatName: chat.userName } })}>
                  <div className="chat-avatar">👤</div>
                  <div className="chat-content">
                    <div className="chat-header">
                      <div className="chat-name">{chat.userName}</div>
                      <div className="chat-time">{chat.time}</div>
                    </div>
                    <div className="chat-message">{chat.lastMessage}</div>
                  </div>
                  {chat.unread > 0 && <div className="unread-badge">{chat.unread}</div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Chats;
