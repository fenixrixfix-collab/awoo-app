import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import pb from './services/pocketbase';

// Pages
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import VolunteersCatalog from './pages/VolunteersCatalog';
import VolunteersRequests from './pages/VolunteersRequests';
import Chats from './pages/Chats';
import ChatRoom from './pages/ChatRoom';
import Services from './pages/Services';
import ServiceCategory from './pages/ServiceCategory';
import { MoreMenu } from './pages/PlaceholderPages';

// Styles
import './styles/App.css';

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
          <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/create-post" element={user ? <CreatePost /> : <Navigate to="/login" />} />
          <Route path="/post/:id" element={user ? <PostDetail /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/volunteers" element={user ? <VolunteersCatalog /> : <Navigate to="/login" />} />
          <Route path="/volunteers/requests" element={user ? <VolunteersRequests /> : <Navigate to="/login" />} />
          <Route path="/services" element={user ? <Services /> : <Navigate to="/login" />} />
          <Route path="/services/:type" element={user ? <ServiceCategory /> : <Navigate to="/login" />} />
          <Route path="/chats" element={user ? <Chats /> : <Navigate to="/login" />} />
          <Route path="/chat/:chatId" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
          <Route path="/more" element={user ? <MoreMenu /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={user ? "/home" : "/login"} />} />
          <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

