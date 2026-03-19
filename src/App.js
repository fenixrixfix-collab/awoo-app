import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import pb from './services/pocketbase';

// Pages
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import CreatePostChoose from './pages/CreatePostChoose';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import VolunteersCatalog from './pages/VolunteersCatalog';
import VolunteersRequests from './pages/VolunteersRequests';
import Chats from './pages/Chats';
import ChatRoom from './pages/ChatRoom';
import Services from './pages/Services';
import ServiceCategory from './pages/ServiceCategory';
import { MoreMenu } from './pages/PlaceholderPages';
import Blacklist from './pages/Blacklist';

// Styles
import './styles/App.css';

// Компонент-защита для страниц требующих авторизации
function RequireAuth({ user, children }) {
  if (!user) {
    // Показываем модалку входа вместо редиректа
    return (
      <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end'}}>
        <div style={{background:'white', borderRadius:'24px 24px 0 0', width:'100%', padding:'24px'}}>
          <div style={{textAlign:'center', marginBottom:'20px'}}>
            <div style={{fontSize:'40px', marginBottom:'8px'}}>🐾</div>
            <div style={{fontWeight:'700', fontSize:'18px', marginBottom:'6px'}}>Нужна авторизация</div>
            <div style={{fontSize:'14px', color:'#666'}}>Войдите или зарегистрируйтесь чтобы продолжить</div>
          </div>
          <a href="/login" style={{display:'block', padding:'14px', background:'#3B5998', color:'white', borderRadius:'12px', textAlign:'center', fontSize:'15px', fontWeight:'700', textDecoration:'none', marginBottom:'10px'}}>
            Войти
          </a>
          <a href="/register" style={{display:'block', padding:'14px', background:'#F5F9FF', color:'#3B5998', borderRadius:'12px', textAlign:'center', fontSize:'15px', fontWeight:'700', textDecoration:'none', border:'2px solid #E3F2FD'}}>
            Зарегистрироваться
          </a>
        </div>
      </div>
    );
  }
  return children;
}

function App() {
  const [user, setUser] = React.useState(pb.authStore.model);
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => {
      unsubscribe();
      clearTimeout(splashTimer);
    };
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />

          {/* Публичные страницы — доступны без авторизации */}
          <Route path="/home" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/volunteers" element={<VolunteersCatalog />} />
          <Route path="/volunteers/requests" element={<VolunteersRequests />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:type" element={<ServiceCategory />} />

          {/* Страницы требующие авторизации */}
          <Route path="/create-post/choose" element={<RequireAuth user={user}><CreatePostChoose /></RequireAuth>} />
          <Route path="/create-post" element={<RequireAuth user={user}><CreatePost /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth user={user}><Profile /></RequireAuth>} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/chats" element={<RequireAuth user={user}><Chats /></RequireAuth>} />
          <Route path="/chat/:chatId" element={<RequireAuth user={user}><ChatRoom /></RequireAuth>} />
          <Route path="/more" element={<RequireAuth user={user}><MoreMenu /></RequireAuth>} />
          <Route path="/blacklist" element={<Blacklist />} />

          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
