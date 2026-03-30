import React, { useState, useEffect } from 'react';
import pb from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

function Blacklist() {
  const navigate = useNavigate();
  const currentUser = pb.authStore.model;
  const isVolunteer = currentUser?.userType === 'volunteer';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone: '', name: '', reason: '', city: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBlacklist(); }, []);

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('blacklist').getList(1, 100, { sort: '-created' });
      setEntries(records.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.phone || !form.reason) { setError('Заполните телефон и причину'); return; }
    setSaving(true);
    setError('');
    try {
      await pb.collection('blacklist').create({
        phone: form.phone,
        name: form.name,
        reason: form.reason,
        city: form.city,
        address: form.address,
        addedBy: currentUser?.name,
        addedById: currentUser?.id
      });
      setForm({ phone: '', name: '', reason: '', city: '', address: '' });
      setShowForm(false);
      fetchBlacklist();
    } catch (e) {
      setError('Ошибка при добавлении');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись?')) return;
    try {
      await pb.collection('blacklist').delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert('Ошибка при удалении');
    }
  };

  // Фильтрация по поиску — по телефону, имени, городу, адресу
  const filtered = entries.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.phone?.toLowerCase().includes(q) ||
      e.name?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{minHeight:'100vh', background:'#F5F7FA', paddingBottom:'80px'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg, #8B0000 0%, #C62828 100%)', padding:'15px 20px', color:'white'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px'}}>
          <div onClick={() => navigate(-1)} style={{fontSize:'24px', cursor:'pointer'}}>←</div>
          <div style={{fontSize:'20px', fontWeight:'700'}}>🚫 Чёрный список</div>
        </div>

        {/* Поиск */}
        <div style={{display:'flex', alignItems:'center', background:'rgba(255,255,255,0.15)', borderRadius:'10px', padding:'8px 12px', gap:'8px'}}>
          <span style={{fontSize:'16px'}}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по телефону, имени, городу, адресу..."
            style={{background:'none', border:'none', outline:'none', color:'white', fontSize:'14px', flex:1}}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{cursor:'pointer', fontSize:'16px', opacity:0.7}}>✕</span>
          )}
        </div>
      </div>

      {/* Volunteer notice */}
      {!isVolunteer && (
        <div style={{margin:'12px', background:'#FFF8E1', border:'1px solid #FFE082', borderRadius:'10px', padding:'12px', fontSize:'13px', color:'#7B5800'}}>
          ℹ️ Просматривать список может каждый. Добавлять записи могут только волонтёры.
        </div>
      )}

      {/* Add button for volunteers */}
      {isVolunteer && !showForm && (
        <div style={{padding:'12px'}}>
          <button onClick={() => setShowForm(true)}
            style={{width:'100%', padding:'14px', background:'#C62828', color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'600', cursor:'pointer'}}>
            ➕ Добавить в чёрный список
          </button>
        </div>
      )}

      {/* Add form */}
      {isVolunteer && showForm && (
        <div style={{margin:'12px', background:'white', borderRadius:'12px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
          <div style={{fontWeight:'700', fontSize:'16px', marginBottom:'12px'}}>Новая запись</div>
          {error && <div style={{color:'#C62828', marginBottom:'8px', fontSize:'13px'}}>{error}</div>}
          {[
            ['phone',   '📞 Телефон *',              'tel',  '+7 (___) ___-__-__'],
            ['name',    '👤 Имя (если известно)',     'text', 'ФИО или псевдоним'],
            ['city',    '📍 Город',                   'text', 'Красноярск, Новосибирск...'],
            ['address', '🏠 Адрес',                   'text', 'Улица, район, ориентир...'],
            ['reason',  '⚠️ Причина добавления *',   'text', 'Опишите ситуацию...'],
          ].map(([field, label, type, placeholder]) => (
            <div key={field} style={{marginBottom:'10px'}}>
              <div style={{fontSize:'13px', color:'#666', marginBottom:'4px'}}>{label}</div>
              {field === 'reason' ? (
                <textarea value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                  placeholder={placeholder} rows={3}
                  style={{width:'100%', padding:'10px', border:'1px solid #E0E0E0', borderRadius:'8px', fontSize:'14px', resize:'none', boxSizing:'border-box', fontFamily:'inherit'}} />
              ) : (
                <input type={type} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                  placeholder={placeholder}
                  style={{width:'100%', padding:'10px', border:'1px solid #E0E0E0', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box'}} />
              )}
            </div>
          ))}
          <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
            <button onClick={() => setShowForm(false)}
              style={{flex:1, padding:'12px', background:'#F5F5F5', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px'}}>
              Отмена
            </button>
            <button onClick={handleSubmit} disabled={saving}
              style={{flex:2, padding:'12px', background:'#C62828', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600'}}>
              {saving ? 'Сохранение...' : '✓ Добавить'}
            </button>
          </div>
        </div>
      )}

      {/* Результат поиска */}
      {search.trim() && (
        <div style={{padding:'0 12px 8px', fontSize:'13px', color:'#666'}}>
          Найдено: {filtered.length} {filtered.length === 1 ? 'запись' : filtered.length >= 2 && filtered.length <= 4 ? 'записи' : 'записей'}
        </div>
      )}

      {/* List */}
      <div style={{padding:'0 12px'}}>
        {loading ? (
          <div style={{textAlign:'center', padding:'40px', color:'#999'}}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#999'}}>
            <div style={{fontSize:'48px'}}>{search ? '🔍' : '✅'}</div>
            <p>{search ? 'Ничего не найдено' : 'Чёрный список пуст'}</p>
          </div>
        ) : (
          filtered.map(entry => (
            <div key={entry.id} style={{background:'white', borderRadius:'12px', padding:'14px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', borderLeft:'4px solid #C62828'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px'}}>
                    <span style={{fontSize:'18px'}}>🚫</span>
                    <span style={{fontWeight:'700', fontSize:'16px'}}>{entry.phone}</span>
                  </div>
                  {entry.name && <div style={{fontSize:'14px', color:'#333', marginBottom:'4px'}}>👤 {entry.name}</div>}
                  {entry.city && <div style={{fontSize:'13px', color:'#666', marginBottom:'4px'}}>📍 {entry.city}</div>}
                  {entry.address && <div style={{fontSize:'13px', color:'#666', marginBottom:'4px'}}>🏠 {entry.address}</div>}
                  <div style={{fontSize:'13px', color:'#555', background:'#FFF5F5', padding:'8px', borderRadius:'6px', marginTop:'6px'}}>
                    ⚠️ {entry.reason}
                  </div>
                  <div style={{fontSize:'11px', color:'#999', marginTop:'6px'}}>
                    Добавил: {entry.addedBy} • {new Date(entry.created).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                {(isVolunteer && entry.addedById === currentUser?.id) && (
                  <button onClick={() => handleDelete(entry.id)}
                    style={{background:'none', border:'none', cursor:'pointer', fontSize:'18px', padding:'4px', marginLeft:'8px'}}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Blacklist;
