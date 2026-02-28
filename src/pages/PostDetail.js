import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pb, { getImageUrl } from '../services/pocketbase';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import '../styles/PostDetail.css';
import 'maplibre-gl/dist/maplibre-gl.css';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const record = await pb.collection('posts').getOne(id);
      setPost(record);
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="error-page">
        <h3>Объявление не найдено</h3>
        <button onClick={() => navigate('/home')}>На главную</button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      {/* Header */}
      <div className="header-fixed">
        <div className="back-btn" onClick={() => navigate(-1)} style={{cursor:'pointer', fontSize:'24px'}}>←</div>
        <div className="header-actions">
          <span className="header-icon">🤍</span>
          <span className="header-icon">↗️</span>
        </div>
      </div>

      {/* Photo */}
      {post.image && (
        <div className="post-photo">
          <img src={getImageUrl(post, post.image)} alt={post.petName} />
          <div className={`status-badge ${post.type}`}>
            {post.type === 'lost' ? '🔍 Потерялся' : '🐾 Найден'}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="post-content">
        <div className="post-header-info">
          <h1 className="post-title-main">{post.petName}</h1>
          <div className="post-meta">
            <span>⏰ {getTimeAgo(post.created)}</span>
            <span>👁️ {post.views || 0} просмотров</span>
            <span>💬 {post.responses || 0} откликов</span>
          </div>
        </div>

        <div className="info-section">
          <div className="info-title">Информация о питомце</div>
          <div className="info-row">
            <span className="info-label">Вид:</span>
            <span className="info-value">{getPetTypeLabel(post.petType)}</span>
          </div>
          {post.breed && (
            <div className="info-row">
              <span className="info-label">Порода:</span>
              <span className="info-value">{post.breed}</span>
            </div>
          )}
          {post.reward && (
            <div className="reward-badge">💰 Вознаграждение: {post.reward} ₽</div>
          )}
        </div>

        {post.description && (
          <div className="info-section">
            <div className="info-title">Описание</div>
            <p className="description-text">{post.description}</p>
          </div>
        )}

        <div className="info-section">
          <div className="info-title">Место {post.type === 'lost' ? 'потери' : 'находки'}</div>
          <div className="location-info">
            <span>📍 {post.location}</span>
            <span>📅 {post.date}</span>
          </div>
          {post.lat && post.lng && (
            <div style={{marginTop:'12px', borderRadius:'12px', overflow:'hidden', height:'200px'}}>
              <Map
                initialViewState={{ longitude: post.lng, latitude: post.lat, zoom: 15 }}
                style={{width:'100%', height:'100%'}}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                scrollZoom={false}
              >
                <NavigationControl position="top-right" />
                <Marker longitude={post.lng} latitude={post.lat} anchor="bottom">
                  <div style={{fontSize:'28px'}}>📍</div>
                </Marker>
              </Map>
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="author-info">
            <div className="author-avatar">👤</div>
            <div className="author-details">
              <div className="author-name">{post.userName || 'Пользователь'}</div>
            </div>
            <div className="verified-badge">✓ Проверен</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons-fixed">
        <button className="action-btn btn-secondary" onClick={() => alert('Связаться с владельцем')}>
          📞 Связаться
        </button>
        <button className="action-btn btn-primary" onClick={() => alert('Спасибо! Владелец получит уведомление.')}>
          ✓ Я нашёл
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'недавно';
  const now = new Date();
  const postDate = new Date(timestamp);
  const diff = Math.floor((now - postDate) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

function getPetTypeLabel(type) {
  const types = { dog: '🐕 Собака', cat: '🐈 Кошка', rodent: '🐇 Грызун', bird: '🦜 Птица', other: '🐠 Другое' };
  return types[type] || type;
}

export default PostDetail;


