import React, { useState } from 'react';
import pb from '../services/pocketbase';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

const SERVICE_CATEGORIES = [
  { value: 'veterinary', label: '🏥 Ветеринар' },
  { value: 'boarding', label: '🏠 Передержка' },
  { value: 'zootaxi', label: '🚗 Зоотакси' },
  { value: 'groomer', label: '✂️ Грумер' },
  { value: 'trainer', label: '🎓 Кинолог' },
];

function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    userType: 'user',
    // Поля для поставщика услуг
    address: '', workTime: '', priceFrom: '', serviceDescription: '',
  });
  const [serviceCategories, setServiceCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleCategory = (val) => {
    setServiceCategories(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    );
  };

  const isService = formData.userType === 'service';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают'); return; }
    if (formData.password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    if (isService && serviceCategories.length === 0) { setError('Выберите хотя бы одну категорию услуг'); return; }
    setLoading(true);
    try {
      const userData = {
        username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000),
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        name: formData.name,
        phone: formData.phone,
        userType: formData.userType,
        postsCount: 0,
        helpCount: 0,
        isVerified: false,
      };

      if (isService) {
        userData.serviceCategories = JSON.stringify(serviceCategories);
        userData.address = formData.address;
        userData.workTime = formData.workTime;
        userData.priceFrom = formData.priceFrom;
        userData.bio = formData.serviceDescription;
      }

      await pb.collection('users').create(userData);
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
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'12px'}}>
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
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ваше имя или название организации" required disabled={loading} />
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
              <label>Тип аккаунта</label>
              <select name="userType" value={formData.userType} onChange={handleChange} disabled={loading}>
                <option value="user">🐾 Владелец животного</option>
                <option value="volunteer">🤝 Волонтёр</option>
                <option value="service">🛎️ Поставщик услуг</option>
              </select>
            </div>

            {/* Блок для поставщика услуг */}
            {isService && (
              <div style={{background:'#F5F9FF', border:'2px solid #E3F2FD', borderRadius:'12px', padding:'16px', marginBottom:'16px'}}>
                <div style={{fontWeight:'700', fontSize:'14px', color:'#3B5998', marginBottom:'12px'}}>🛎️ Информация об услугах</div>

                <div className="form-group">
                  <label>Категории услуг * <span style={{fontSize:'11px', color:'#999', fontWeight:'400'}}>(можно выбрать несколько)</span></label>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'6px'}}>
                    {SERVICE_CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleCategory(cat.value)}
                        disabled={loading}
                        style={{
                          padding:'8px 12px', borderRadius:'20px', border:'2px solid',
                          borderColor: serviceCategories.includes(cat.value) ? '#3B5998' : '#E0E0E0',
                          background: serviceCategories.includes(cat.value) ? '#E8EDF8' : 'white',
                          color: serviceCategories.includes(cat.value) ? '#3B5998' : '#666',
                          fontWeight: serviceCategories.includes(cat.value) ? '700' : '400',
                          cursor:'pointer', fontSize:'13px', transition:'all 0.2s'
                        }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Адрес</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Улица, дом, город" disabled={loading} />
                </div>

                <div className="form-group">
                  <label>Часы работы</label>
                  <input type="text" name="workTime" value={formData.workTime} onChange={handleChange} placeholder="Например: 09:00 - 21:00" disabled={loading} />
                </div>

                <div className="form-group">
                  <label>Цены от (₽)</label>
                  <input type="text" name="priceFrom" value={formData.priceFrom} onChange={handleChange} placeholder="Например: от 500 ₽" disabled={loading} />
                </div>

                <div className="form-group">
                  <label>Описание услуг</label>
                  <textarea name="serviceDescription" value={formData.serviceDescription} onChange={handleChange}
                    placeholder="Расскажите о ваших услугах..." rows={3} disabled={loading}
                    style={{width:'100%', padding:'10px', border:'1px solid #E0E0E0', borderRadius:'8px', fontSize:'14px', fontFamily:'inherit', resize:'none', boxSizing:'border-box'}} />
                </div>
              </div>
            )}

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
