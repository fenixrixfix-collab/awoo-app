import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const currentUser = pb.authStore.model;

  // Mock сообщения для демонстрации
  const mockMessages = [
    { id: 1, userId: 'other', userName: 'Мария Соколова', text: 'Здравствуйте! Могу помочь с передержкой', time: '10:25', isOwn: false },
    { id: 2, userId: currentUser?.id, userName: currentUser?.name, text: 'Отлично! На сколько дней?', time: '10:26', isOwn: true },
    { id: 3, userId: 'other', userName: 'Мария Соколова', text: 'До 5 дней точно смогу', time: '10:27', isOwn: false },
    { id: 4, userId: currentUser?.id, userName: currentUser?.name, text: 'Спасибо большое! Напишу детали', time: '10:28', isOwn: true },
  ];

  useEffect(() => {
    setMessages(mockMessages);
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const msg = {
      id: Date.now(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      text: newMessage,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };

    setMessages([...messages, msg]);
    setNewMessage('');

    // Здесь будет реальное сохранение в PocketBase
    // await pb.collection('messages').create({...})
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="back-btn" onClick={() => navigate(-1)}>←</div>
        <div className="chat-header-info">
          <div className="chat-header-name">{chatName || 'Чат'}</div>
          {chatType === 'group' && <div className="chat-header-desc">Групповой чат</div>}
        </div>
        <div className="chat-header-actions">
          <span>⋮</span>
        </div>
      </div>

      <div className="messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}>
            {!msg.isOwn && <div className="message-avatar">👤</div>}
            <div className="message-bubble">
              {!msg.isOwn && <div className="message-author">{msg.userName}</div>}
              <div className="message-text">{msg.text}</div>
              <div className="message-time">{msg.time}</div>
            </div>
          </div>
        ))}
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
        <button className="send-btn" onClick={handleSend} disabled={!newMessage.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default ChatRoom;
