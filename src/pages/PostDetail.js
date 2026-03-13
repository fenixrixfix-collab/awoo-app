import React, { useState, useEffect, useRef } from 'react';
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
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState(null);
  const [commentPhotoPreview, setCommentPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, userName }
  const [showPhone, setShowPhone] = useState(false);
  const [postAuthor, setPostAuthor] = useState(null);
  const fileInputRef = useRef(null);
  const currentUser = pb.authStore.model;

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPost = async () => {
    try {
      const record = await pb.collection('posts').getOne(id);
      setPost(record);
      if (record.userId) {
        try {
          const author = await pb.collection('users').getOne(record.userId);
          setPostAuthor(author);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteMessage = () => {
    if (!post.userId || post.userId === currentUser?.id) return;
    const chatId = [currentUser.id, post.userId].sort().join('_');
    const chatName = post.userName || 'Пользователь';
    navigate(`/chat/${chatId}`, { state: { chatType: 'private', chatName, otherUserId: post.userId } });
  };

  const handleContactPhone = () => {
    if (!postAuthor) { alert('Загрузка данных...'); return; }
    if (postAuthor.phoneHidden) { alert('Пользователь скрыл номер телефона'); return; }
    if (!postAuthor.phone) { alert('Телефон не указан'); return; }
    setShowPhone(true);
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const records = await pb.collection('comments').getFullList({
        filter: `post = "${id}"`,
        sort: 'created',
        expand: 'user',
      });
      setComments(records);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCommentPhoto(file);
    setCommentPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setCommentPhoto(null);
    setCommentPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() && !commentPhoto) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('post', id);
      formData.append('user', currentUser.id);
      formData.append('userName', currentUser.name || currentUser.username || 'Пользователь');
      formData.append('text', commentText.trim());
      formData.append('parentId', replyTo ? replyTo.id : '');
      if (commentPhoto) {
        formData.append('photo', commentPhoto);
      }
      await pb.collection('comments').create(formData);
      setCommentText('');
      setCommentPhoto(null);
      setCommentPhotoPreview(null);
      setReplyTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await pb.collection('comments').delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Строим дерево: top-level + children
  const topLevel = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

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

        {/* ===== COMMENTS ===== */}
        <div className="info-section comments-section">
          <div className="info-title">
            💬 Комментарии {comments.length > 0 && <span className="comments-count">{comments.length}</span>}
          </div>

          {/* Comment list */}
          {commentsLoading ? (
            <div className="comments-loading">Загрузка комментариев...</div>
          ) : topLevel.length === 0 ? (
            <div className="comments-empty">Будьте первым, кто оставит комментарий</div>
          ) : (
            <div className="comments-list">
              {topLevel.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={getReplies(comment.id)}
                  currentUser={currentUser}
                  onReply={(c) => {
                    setReplyTo({ id: c.id, userName: c.userName });
                    document.getElementById('comment-input')?.focus();
                  }}
                  onDelete={handleDeleteComment}
                  getReplies={getReplies}
                />
              ))}
            </div>
          )}

          {/* Input */}
          <div className="comment-input-box">
            {replyTo && (
              <div className="reply-indicator">
                <span>↩ Ответ для <b>{replyTo.userName}</b></span>
                <button className="reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
              </div>
            )}

            {commentPhotoPreview && (
              <div className="comment-photo-preview">
                <img src={commentPhotoPreview} alt="preview" />
                <button className="remove-photo-btn" onClick={removePhoto}>✕</button>
              </div>
            )}

            <div className="comment-input-row">
              <button
                className="attach-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Прикрепить фото"
              >📷</button>
              <input
                id="comment-input"
                type="text"
                className="comment-text-input"
                placeholder={replyTo ? `Ответить ${replyTo.userName}...` : 'Написать комментарий...'}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); }}}
              />
              <button
                className="send-comment-btn"
                onClick={handleSubmitComment}
                disabled={submitting || (!commentText.trim() && !commentPhoto)}
              >
                {submitting ? '...' : '➤'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{display:'none'}}
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons-fixed">
        <button className="action-btn btn-secondary" onClick={handleContactPhone}>
          📞 Связаться
        </button>
        {post.userId !== currentUser?.id && (
          <button className="action-btn btn-primary" onClick={handleWriteMessage}>
            💬 Написать
          </button>
        )}
      </div>

      {/* Phone modal */}
      {showPhone && postAuthor?.phone && (
        <div className="phone-modal-overlay" onClick={() => setShowPhone(false)}>
          <div className="phone-modal" onClick={e => e.stopPropagation()}>
            <div className="phone-modal-title">📞 Контакт</div>
            <div className="phone-modal-name">{postAuthor.name || 'Пользователь'}</div>
            <a className="phone-modal-number" href={`tel:${postAuthor.phone}`}>{postAuthor.phone}</a>
            <button className="phone-modal-close" onClick={() => setShowPhone(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Компонент одного комментария ──────────────────────────────────────────────
function CommentItem({ comment, replies, currentUser, onReply, onDelete, getReplies }) {
  const [expanded, setExpanded] = useState(true);
  const photoUrl = comment.photo
    ? `${pb.baseUrl}/api/files/comments/${comment.id}/${comment.photo}`
    : null;

  return (
    <div className="comment-item">
      <div className="comment-avatar">👤</div>
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.userName || 'Пользователь'}</span>
          <span className="comment-time">{getTimeAgo(comment.created)}</span>
          {currentUser?.id === comment.user && (
            <button className="comment-delete-btn" onClick={() => onDelete(comment.id)}>🗑</button>
          )}
        </div>

        {comment.text && <p className="comment-text">{comment.text}</p>}

        {photoUrl && (
          <div className="comment-photo">
            <img src={photoUrl} alt="фото к комментарию" />
          </div>
        )}

        <button className="comment-reply-btn" onClick={() => onReply(comment)}>
          ↩ Ответить
        </button>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="replies-section">
            <button className="toggle-replies-btn" onClick={() => setExpanded(p => !p)}>
              {expanded ? '▲' : '▼'} {replies.length} {getRepliesLabel(replies.length)}
            </button>
            {expanded && (
              <div className="replies-list">
                {replies.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    replies={getReplies(reply.id)}
                    currentUser={currentUser}
                    onReply={onReply}
                    onDelete={onDelete}
                    getReplies={getReplies}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function getRepliesLabel(count) {
  if (count === 1) return 'ответ';
  if (count >= 2 && count <= 4) return 'ответа';
  return 'ответов';
}

export default PostDetail;
