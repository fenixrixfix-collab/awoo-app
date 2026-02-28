import React, { useState } from 'react';
import pb from '../services/pocketbase';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', userType: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают'); return; }
    if (formData.password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    setLoading(true);
    try {
      await pb.collection('users').create({
        username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000),
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        name: formData.name,
        phone: formData.phone,
        userType: formData.userType,
        postsCount: 0,
        helpCount: 0,
      });
      await pb.collection('users').authWithPassword(formData.email, formData.password);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
            <h1 className="logo-text">AWOO</h1>
            <svg width="40" height="40" viewBox="0 0 512 512" fill="#3B5998">
              <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
            </svg>
          </div>
          <p className="logo-subtitle">Розыск домашних животных</p>
        </div>
        <div className="auth-form">
          <h2>Регистрация</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Имя *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ваше имя" required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Телефон *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Тип пользователя</label>
              <select name="userType" value={formData.userType} onChange={handleChange} disabled={loading}>
                <option value="user">Владелец животного</option>
                <option value="volunteer">Волонтёр</option>
                <option value="service">Поставщик услуг</option>
              </select>
            </div>
            <div className="form-group">
              <label>Пароль *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Минимум 8 символов" required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Подтвердите пароль *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Повторите пароль" required disabled={loading} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          <div className="auth-footer">
            <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
