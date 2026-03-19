import React, { useState } from 'react';
import pb from '../services/pocketbase';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(email, password);
      navigate('/home');
    } catch (err) {
      setError('Неверный email или пароль. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      await pb.collection('users').requestPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err) {
      setError('Ошибка отправки. Проверьте email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'12px'}}>
            <h1 className="logo-text">AWOO</h1>
            <svg width="40" height="40" viewBox="0 0 512 512" fill="white">
              <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
            </svg>
          </div>
          <p className="logo-subtitle" style={{textAlign:'center'}}>Розыск, помощь и уход за животными.</p>
        </div>

        <div className="auth-form">
          {!showReset ? (
            <>
              <h2>Вход</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
                </div>
                <div style={{textAlign:'right', marginBottom:'16px', marginTop:'-8px'}}>
                  <span onClick={() => { setShowReset(true); setError(''); }}
                    style={{fontSize:'13px', color:'#3B5998', cursor:'pointer', textDecoration:'underline'}}>
                    Забыли пароль?
                  </span>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>
              <div className="auth-footer">
                <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
                <p style={{marginTop:'8px'}}>
                  <span onClick={() => navigate('/home')}
                    style={{fontSize:'13px', color:'#999', cursor:'pointer', textDecoration:'underline'}}>
                    Войти как гость →
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <h2>Восстановление пароля</h2>
              {resetSent ? (
                <div style={{textAlign:'center', padding:'20px 0'}}>
                  <div style={{fontSize:'48px', marginBottom:'12px'}}>📧</div>
                  <div style={{fontWeight:'700', fontSize:'16px', marginBottom:'8px'}}>Письмо отправлено!</div>
                  <div style={{fontSize:'14px', color:'#666', marginBottom:'20px'}}>
                    Проверьте почту {resetEmail} и следуйте инструкциям в письме.
                  </div>
                  <button onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); }}
                    className="btn-primary">
                    Вернуться к входу
                  </button>
                </div>
              ) : (
                <>
                  {error && <div className="error-message">{error}</div>}
                  <p style={{fontSize:'14px', color:'#666', marginBottom:'16px'}}>
                    Введите email от вашего аккаунта — мы отправим ссылку для сброса пароля.
                  </p>
                  <form onSubmit={handleReset}>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your@email.com" required disabled={resetLoading} />
                    </div>
                    <button type="submit" className="btn-primary" disabled={resetLoading}>
                      {resetLoading ? 'Отправка...' : 'Отправить ссылку'}
                    </button>
                  </form>
                  <div style={{textAlign:'center', marginTop:'16px'}}>
                    <span onClick={() => { setShowReset(false); setError(''); }}
                      style={{fontSize:'13px', color:'#3B5998', cursor:'pointer', textDecoration:'underline'}}>
                      ← Вернуться к входу
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
