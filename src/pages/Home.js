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
  const [badges, setBadges] = useState({ ls: 0, cs: 0 });
  const [filterBadges, setFilterBadges] = useState({ lost: 0, found: 0, help: 0, services: 0 });
  const navigate = useNavigate();
  const currentUser = pb.authStore.model;
  const isVolunteer = currentUser?.userType === 'volunteer' || currentUser?.userType === 'volunteer_pending';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBadges = async () => {
    if (!currentUser?.id) return;
    const lastVisitLS = localStorage.getItem('lastVisitLS') || '2000-01-01';
    const lastVisitCS = localStorage.getItem('lastVisitCS') || '2000-01-01';
    try {
      const msgs = await pb.collection('messages').getList(1, 200, {
        filter: `userId != "${currentUser.id}" && chatType = "private"`,
        fields: 'id,chatId,read'
      });
      const unreadMsgs = msgs.items.filter(m => m.chatId && m.chatId.includes(currentUser.id) && !m.read).length;

      let csCount = 0;
      try {
        const cs = await pb.collection('blacklist').getList(1, 1, {
          filter: `created > "${lastVisitCS}"`, fields: 'id'
        });
        csCount = cs.totalItems;
      } catch (e) {}

      const toFilter = (iso) => iso.replace('T', ' ').replace('Z', '').slice(0, 19);
      const lastLost     = toFilter(localStorage.getItem('lastVisitFilterLost')     || '2000-01-01T00:00:00Z');
      const lastFound    = toFilter(localStorage.getItem('lastVisitFilterFound')    || '2000-01-01T00:00:00Z');
      const lastHelp     = toFilter(localStorage.getItem('lastVisitFilterHelp')     || '2000-01-01T00:00:00Z');
      const lastServices = toFilter(localStorage.getItem('lastVisitFilterServices') || '2000-01-01T00:00:00Z');
      const [lostRes, foundRes, helpRes, servicesRes] = await Promise.all([
        pb.collection('posts').getList(1, 1, { filter: `type = "lost" && created > "${lastLost}" && userId != "${currentUser.id}"`, fields: 'id' }),
        pb.collection('posts').getList(1, 1, { filter: `type = "found" && created > "${lastFound}" && userId != "${currentUser.id}"`, fields: 'id' }),
        pb.collection('posts').getList(1, 1, { filter: `type = "help" && created > "${lastHelp}" && userId != "${currentUser.id}"`, fields: 'id' }),
        pb.collection('posts').getList(1, 1, { filter: `type = "service" && created > "${lastServices}" && userId != "${currentUser.id}"`, fields: 'id' }),
      ]);
      setFilterBadges({ lost: lostRes.totalItems, found: foundRes.totalItems, help: helpRes.totalItems, services: servicesRes.totalItems });
      setBadges({ ls: unreadMsgs, cs: csCount });
    } catch (e) {}
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let filterStr = '';
      if (filter === 'lost') filterStr = 'type = "lost"';
      else if (filter === 'found') filterStr = 'type = "found"';
      else if (filter === 'help') filterStr = 'type = "help"';
      else if (filter === 'services') filterStr = 'type = "service"';
      else if (filter === 'dog') filterStr = 'petType = "dog"';
      else if (filter === 'cat') filterStr = 'petType = "cat"';
      else if (filter === 'other') filterStr = 'petType != "dog" && petType != "cat"';

      const queryOptions = { sort: '-created' };
      if (filterStr) queryOptions.filter = filterStr;

      const records = await pb.collection('posts').getList(1, 50, queryOptions);
      setPosts(records.items);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Новый порядок фильтров
  const filters = [
    { value: 'lost',     label: '🔍 Потерялись', badge: filterBadges.lost },
    { value: 'found',    label: '🐾 Найдены',    badge: filterBadges.found },
    { value: 'help',     label: '🆘 Помощь',     badge: filterBadges.help },
    { value: 'services', label: '🛎️ Услуги',     badge: filterBadges.services },
    { value: 'map',      label: '🗺️ На карте' },
    { value: 'all',      label: 'Все' },
    { value: 'dog',      label: '🐕 Собаки' },
    { value: 'cat',      label: '🐈 Кошки' },
    { value: 'other',    label: '🐦 Другое' },
  ];

  const getUrgencyBadge = (urgency) => {
    if (urgency === 'critical') return { label: '🔴 Критично', color: '#F44336' };
    if (urgency === 'urgent')   return { label: '🟠 Срочно',   color: '#FF9800' };
    return null; // обычная — не показываем
  };

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
            <button onClick={() => { localStorage.setItem('lastVisitLS', new Date().toISOString()); navigate('/profile'); }} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', fontSize:'13px', fontWeight:'700', position:'relative'}}>
              ЛС
              {badges.ls > 0 && <span style={{position:'absolute', top:'-6px', right:'-6px', background:'#FF6B35', color:'white', fontSize:'10px', fontWeight:'700', minWidth:'16px', height:'16px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', border:'2px solid rgba(59,89,152,0.95)'}}>{badges.ls > 99 ? '99+' : badges.ls}</span>}
            </button>
            {isVolunteer && (
              <button onClick={() => { localStorage.setItem('lastVisitCS', new Date().toISOString()); navigate('/blacklist'); }} style={{background:'rgba(220,50,50,0.5)', border:'none', color:'white', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', fontSize:'13px', fontWeight:'700', position:'relative'}}>
                ЧС
                {badges.cs > 0 && <span style={{position:'absolute', top:'-6px', right:'-6px', background:'#FF6B35', color:'white', fontSize:'10px', fontWeight:'700', minWidth:'16px', height:'16px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', border:'2px solid rgba(59,89,152,0.95)'}}>{badges.cs > 99 ? '99+' : badges.cs}</span>}
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Поиск по кличке, породе..." />
        </div>
        <div className="filters">
          {filters.map(f => (
            <button key={f.value} className={`filter-btn ${filter === f.value ? 'active' : ''}`} style={{position:'relative'}} onClick={() => {
              if (f.value === 'lost') localStorage.setItem('lastVisitFilterLost', new Date().toISOString());
              if (f.value === 'found') localStorage.setItem('lastVisitFilterFound', new Date().toISOString());
              if (f.value === 'help') localStorage.setItem('lastVisitFilterHelp', new Date().toISOString());
              if (f.value === 'services') localStorage.setItem('lastVisitFilterServices', new Date().toISOString());
              if (f.value === 'map') setViewMode('map');
              else setViewMode('list');
              setFilter(f.value);
            }}>
              {f.label}
              {f.badge > 0 && <span style={{position:'absolute', top:'-6px', right:'-4px', background:'#FF6B35', color:'white', fontSize:'9px', fontWeight:'700', minWidth:'15px', height:'15px', borderRadius:'8px', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'0 3px', border:'2px solid white'}}>{f.badge > 99 ? '99+' : f.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="content">
        {(viewMode === 'map' || filter === 'map') ? (
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
                <Marker key={post.id} longitude={post.lng} latitude={post.lat} anchor="bottom" onClick={() => setSelectedPost(post)}>
                  <div style={{fontSize:'24px', cursor:'pointer'}}>
                    {post.type === 'lost' ? '🔍' : post.type === 'help' ? '🆘' : post.type === 'service' ? '🛎️' : '🐾'}
                  </div>
                </Marker>
              ))}
              {selectedPost && (
                <Popup longitude={selectedPost.lng} latitude={selectedPost.lat} anchor="top" onClose={() => setSelectedPost(null)}>
                  <div style={{minWidth:'150px', padding:'4px'}}>
                    <div style={{fontWeight:'600'}}>{selectedPost.type === 'help' ? 'Нужна помощь' : selectedPost.petName}</div>
                    <div style={{fontSize:'12px', color: selectedPost.type === 'lost' ? '#FF6B35' : selectedPost.type === 'help' ? '#E65100' : '#4CAF50'}}>
                      {selectedPost.type === 'lost' ? '🔍 Потерялся' : selectedPost.type === 'help' ? '🆘 Помощь' : selectedPost.type === 'service' ? '🛎️ Реклама' : '🐾 Найден'}
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
            {posts.map(post => {
              const isHelp = post.type === 'help';
              const urgencyBadge = isHelp ? getUrgencyBadge(post.urgency) : null;
              return (
                <div key={post.id} className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
                  <div className="post-header">
                    <div style={{display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap'}}>
                      <span className={`post-type ${post.type}`}>
                        {post.type === 'lost' ? '🔍 Потерялся' : post.type === 'service' ? '🛎️ Реклама' : post.type === 'help' ? '🆘 Нужна помощь' : '🐾 Найден'}
                      </span>
                      {urgencyBadge && (
                        <span style={{fontSize:'11px', fontWeight:'700', color: urgencyBadge.color, background: urgencyBadge.color + '15', borderRadius:'10px', padding:'2px 8px'}}>
                          {urgencyBadge.label}
                        </span>
                      )}
                    </div>
                    <span className="post-time">{getTimeAgo(post.created)}</span>
                  </div>

                  {post.image && (
                    <img src={getImageUrl(post, post.image)} alt={post.petName} className="post-image" />
                  )}

                  {/* Для help — показываем описание проблемы вместо клички */}
                  {isHelp ? (
                    <>
                      {post.helpDescription && (
                        <div className="post-description" style={{marginTop:'8px', fontWeight:'500', color:'#333'}}>
                          {post.helpDescription.length > 120 ? post.helpDescription.slice(0, 120) + '...' : post.helpDescription}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="post-title">{post.petName}</div>
                      <div className="post-description">{post.description}</div>
                    </>
                  )}

                  {post.location && (
                    <div className="post-location">📍 {post.location}</div>
                  )}
                  <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'10px', paddingTop:'8px', borderTop:'1px solid #F0F0F0'}}>
                    <span style={{fontSize:'12px', color:'#999', display:'flex', alignItems:'center', gap:'3px'}}>
                      👁 {post.views || 0}
                    </span>
                    <span style={{fontSize:'12px', color:'#999', display:'flex', alignItems:'center', gap:'3px'}}>
                      💬 {post.responses || 0}
                    </span>
                    <span style={{fontSize:'12px', color:'#999', display:'flex', alignItems:'center', gap:'3px'}}>
                      ❤️ {post.likes || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'недавно';
  const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

export default Home;
