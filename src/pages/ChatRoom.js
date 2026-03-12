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
  const currentUser = pb.authStore.model;
  const messagesEndRef = useRef(null);
  const lastIdRef = useRef(null);
  const pollRef = useRef(null);
 
  useEffect(() => {
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(pollRef.current);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const fetchMessages = async (initial) => {
    try {
      const filter = lastIdRef.current && !initial
        ? `chatId = "${chatId}" && created > "${lastIdRef.current}"`
        : `chatId = "${chatId}"`;
 
      const records = await pb.collection('messages').getList(1, 200, {
        filter,
        sort: 'created'
      });
 
      if (records.items.length > 0) {
        const formatted = records.items.map(formatMessage);
        if (initial) {
          setMessages(formatted);
        } else {
          setMessages(prev => [...prev, ...formatted]);
        }
        lastIdRef.current = records.items[records.items.length - 1].created;
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (initial) setLoading(false);
    }
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
      // Сразу подгружаем новые сообщения
      fetchMessages(false);
    } catch (e) {
      console.error(e);
      setNewMessage(text);
    }
  };
 
  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="back-btn" onClick={() => navigate(-1)}>←</div>
        <div className="chat-header-info">
          <div className="chat-header-name">{chatName || 'Чат'}</div>
          {chatType === 'group' && <div className="chat-header-desc">Групповой чат</div>}
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
            <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}>
              {!msg.isOwn && <div className="message-avatar">👤</div>}
              <div className="message-bubble">
                {!msg.isOwn && <div className="message-author">{msg.userName}</div>}
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{msg.time}</div>
              </div>
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
