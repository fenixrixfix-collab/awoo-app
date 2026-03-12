
import React, { useState, useEffect } from 'react';
import pb, { getImageUrl } from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import BottomNav from '../components/BottomNav';
import '../styles/Home.css';
import 'maplibre-gl/dist/maplibre-gl.css';
 
function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userCoords, setUserCoords] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();
 
  useEffect(() => {
    // Тихо получаем геолокацию при загрузке
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);
 
  useEffect(() => { fetchPosts(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
 
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let filterStr = '';
      if (filter === 'lost') filterStr = 'type = "lost"';
      else if (filter === 'found') filterStr = 'type = "found"';
      else if (filter === 'dog') filterStr = 'petType = "dog"';
      else if (filter === 'cat') filterStr = 'petType = "cat"';
      else if (filter === 'other') filterStr = 'petType != "dog" && petType != "cat"';
 
      const queryOptions = { sort: '-created' };
      if (filterStr) queryOptions.filter = filterStr;
 
      const records = await pb.collection('posts').getList(1, 50, queryOptions);
      let items = records.items;
 
      // Сортировка по близости если есть геолокация и фильтр "рядом"
      if (filter === 'nearby' && userCoords) {
        items = items
          .filter(p => p.lat && p.lng)
          .sort((a, b) => {
            const distA = Math.hypot(a.lat - userCoords.lat, a.lng - userCoords.lng);
            const distB = Math.hypot(b.lat - userCoords.lat, b.lng - userCoords.lng);
            return distA - distB;
          });
      }
 
      setPosts(items);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const filters = [
    { value: 'all', label: 'Все' },
    { value: 'lost', label: '🔍 Потерялись' },
    { value: 'found', label: '🐾 Найдены' },
    { value: 'dog', label: '🐕 Собаки' },
    { value: 'cat', label: '🐈 Кошки' },
    { value: 'other', label: '🐦 Другое' },
    { value: 'nearby', label: '📍 Рядом' },
  ];
 
  return (
    <div className="home-page">
      <div className="header">
        <div className="header-top">
          <div>
            <div className="logo" style={{display:'flex', alignItems:'center', gap:'10px'}}>
              AWOO
              <svg width="28" height="28" viewBox="0 0 512 512" fill="white" style={{opacity:0.95}}>
                <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
              </svg>
            </div>
            <div className="logo-subtitle" style={{fontSize:'17px'}}>Розыск, помощь и уход за животными.</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <div className="notification-icon">🔔</div>
            <button onClick={() => navigate('/profile')} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', fontSize:'13px', fontWeight:'700'}}>
              ЛС
            </button>
            <button onClick={() => navigate('/blacklist')} style={{background:'rgba(220,50,50,0.5)', border:'none', color:'white', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', fontSize:'13px', fontWeight:'700'}}>
              ЧС
            </button>
          </div>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Поиск по кличке, породе..." />
        </div>
        <div className="filters">
          {filters.map(f => (
            <button key={f.value} className={`filter-btn ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
 
      <div className="content">
        {viewMode === 'map' ? (
          <div style={{height:'calc(100vh - 200px)'}}>
            <Map
              initialViewState={{
                longitude: userCoords ? userCoords.lng : 37.6173,
                latitude: userCoords ? userCoords.lat : 55.7558,
                zoom: 11
              }}
              style={{width:'100%', height:'100%'}}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
            >
              <NavigationControl position="top-right" />
              {posts.filter(p => p.lat && p.lng).map(post => (
                <Marker
                  key={post.id}
                  longitude={post.lng}
                  latitude={post.lat}
                  anchor="bottom"
                  onClick={() => setSelectedPost(post)}
                >
                  <div style={{fontSize:'24px', cursor:'pointer'}}>
                    {post.type === 'lost' ? '🔍' : '🐾'}
                  </div>
                </Marker>
              ))}
              {selectedPost && (
                <Popup
                  longitude={selectedPost.lng}
                  latitude={selectedPost.lat}
                  anchor="top"
                  onClose={() => setSelectedPost(null)}
                >
                  <div style={{minWidth:'150px', padding:'4px'}}>
                    <div style={{fontWeight:'600'}}>{selectedPost.petName}</div>
                    <div style={{fontSize:'12px', color: selectedPost.type === 'lost' ? '#FF6B35' : '#4CAF50'}}>
                      {selectedPost.type === 'lost' ? '🔍 Потерялся' : '🐾 Найден'}
                    </div>
                    <div style={{fontSize:'12px'}}>📍 {selectedPost.location}</div>
                    <button onClick={() => navigate(`/post/${selectedPost.id}`)} style={{marginTop:'6px', width:'100%', padding:'4px', background:'#3B5998', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>
                      Подробнее
                    </button>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        ) : loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Загрузка...</p></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐾</div>
            <h3>Пока нет объявлений</h3>
            <p>Будьте первым, кто создаст объявление!</p>
            <button className="btn-primary" onClick={() => navigate('/create-post')}>Создать объявление</button>
          </div>
        ) : (
          <div className="posts-feed">
            {posts.map(post => (
              <div key={post.id} className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
                <div className="post-header">
                  <span className={`post-type ${post.type}`}>{post.type === 'lost' ? '🔍 Потерялся' : '🐾 Найден'}</span>
                  <span className="post-time">{getTimeAgo(post.created)}</span>
                </div>
                {post.image && (
                  <img src={getImageUrl(post, post.image)} alt={post.petName} className="post-image" />
                )}
                <div className="post-title">{post.petName}</div>
                <div className="post-description">{post.description}</div>
                <div className="post-location">📍 {post.location}</div>
              </div>
            ))}
          </div>
        )}
        </div>
 
      <div className="fab" onClick={() => navigate('/create-post')}>➕</div>
      <BottomNav />
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
 
export default Home;
 