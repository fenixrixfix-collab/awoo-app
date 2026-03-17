import React, { useState, useEffect, useRef } from 'react';
import pb from '../services/pocketbase';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Chats.css';

function ChatRoom() {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chatType, chatName } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuMsg, setMenuMsg] = useState(null); // сообщение для которого показываем меню
  const currentUser = pb.authStore.model;
  const messagesEndRef = useRef(null);
  const lastIdRef = useRef(null);
  const pollRef = useRef(null);
  const isGroup = chatType === 'group';

  useEffect(() => {
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(pollRef.current);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Закрываем меню при клике вне
  useEffect(() => {
    const handler = () => setMenuMsg(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchMessages = async (initial) => {
    try {
      const filter = lastIdRef.current && !initial
        ? `chatId = "${chatId}" && created > "${lastIdRef.current}"`
        : `chatId = "${chatId}"`;

      const records = await pb.collection('messages').getList(1, 200, {
        filter, sort: 'created'
      });

      if (records.items.length > 0) {
        const formatted = records.items.map(formatMessage);
        if (initial) setMessages(formatted);
        else setMessages(prev => [...prev, ...formatted]);
        lastIdRef.current = records.items[records.items.length - 1].created;
        markAsRead();
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (initial) setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      const unread = await pb.collection('messages').getFullList({
        filter: `chatId = "${chatId}" && userId != "${currentUser.id}" && read = false`,
        fields: 'id'
      });
      for (const msg of unread) {
        await pb.collection('messages').update(msg.id, { read: true });
      }
    } catch (e) {}
  };

  const formatMessage = (record) => ({
    id: record.id,
    userId: record.userId,
    userName: record.userName,
    text: record.text,
    time: new Date(record.created).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    isOwn: record.userId === currentUser?.id
  });

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await pb.collection('messages').create({
        chatId,
        userId: currentUser?.id,
        userName: currentUser?.name || 'Пользователь',
        text,
        chatType: chatType || 'group'
      });
    } catch (e) {
      console.error(e);
      setNewMessage(text);
    }
  };

  const handleWritePrivate = (msg) => {
    setMenuMsg(null);
    const privateChatId = [currentUser.id, msg.userId].sort().join('_');
    navigate(`/chat/${privateChatId}`, {
      state: { chatType: 'private', chatName: msg.userName, otherUserId: msg.userId }
    });
  };

  const handleMsgClick = (e, msg) => {
    if (!isGroup || msg.isOwn) return;
    e.stopPropagation();
    setMenuMsg(menuMsg?.id === msg.id ? null : msg);
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="back-btn" onClick={() => navigate(-1)}>←</div>
        <div className="chat-header-info">
          <div className="chat-header-name">{chatName || 'Чат'}</div>
          {isGroup && <div className="chat-header-desc">Групповой чат</div>}
        </div>
        <div className="chat-header-actions"><span>⋮</span></div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div style={{textAlign:'center', padding:'20px', color:'#999'}}>Загрузка...</div>
        ) : messages.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#999'}}>
            <div style={{fontSize:'40px'}}>💬</div>
            <p>Нет сообщений. Напишите первым!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}
              style={{position:'relative'}}
              onClick={(e) => handleMsgClick(e, msg)}
            >
              {!msg.isOwn && (
                <div className="message-avatar" style={{cursor: isGroup ? 'pointer' : 'default'}}>👤</div>
              )}
              <div className="message-bubble" style={{cursor: isGroup && !msg.isOwn ? 'pointer' : 'default'}}>
                {!msg.isOwn && (
                  <div className="message-author" style={{display:'flex', alignItems:'center', gap:'6px'}}>
                    {msg.userName}
                    {isGroup && <span style={{fontSize:'10px', color:'#aaa'}}>• нажми для ЛС</span>}
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{msg.time}</div>
              </div>

              {/* Меню при нажатии */}
              {menuMsg?.id === msg.id && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position:'absolute',
                    bottom:'100%',
                    left: msg.isOwn ? 'auto' : '48px',
                    right: msg.isOwn ? '0' : 'auto',
                    background:'white',
                    borderRadius:'12px',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
                    padding:'8px',
                    zIndex:100,
                    minWidth:'180px',
                    marginBottom:'4px'
                  }}
                >
                  <div style={{fontSize:'12px', color:'#999', padding:'4px 8px 6px', fontWeight:'600'}}>
                    {msg.userName}
                  </div>
                  <div
                    onClick={() => handleWritePrivate(msg)}
                    style={{
                      padding:'10px 12px',
                      borderRadius:'8px',
                      cursor:'pointer',
                      fontSize:'14px',
                      display:'flex',
                      alignItems:'center',
                      gap:'8px',
                      color:'#3B5998',
                      fontWeight:'600'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='#F5F9FF'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    💬 Написать в личку
                  </div>
                  <div
                    onClick={() => navigate(`/profile/${msg.userId}`)}
                    style={{
                      padding:'10px 12px',
                      borderRadius:'8px',
                      cursor:'pointer',
                      fontSize:'14px',
                      display:'flex',
                      alignItems:'center',
                      gap:'8px',
                      color:'#555'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='#F5F5F5'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    👤 Открыть профиль
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          placeholder="Написать сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend} disabled={!newMessage.trim()}>➤</button>
      </div>
    </div>
  );
}

export default ChatRoom;
