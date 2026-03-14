import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

function CreatePostChoose() {
  const navigate = useNavigate();

  return (
    <div style={{minHeight:'100vh', background:'#F5F9FF', display:'flex', flexDirection:'column'}}>
      <div style={{background:'linear-gradient(135deg, #3B5998 0%, #6BA3E8 100%)', color:'white', padding:'15px 20px', display:'flex', alignItems:'center', gap:'12px'}}>
        <div onClick={() => navigate(-1)} style={{fontSize:'24px', cursor:'pointer'}}>←</div>
        <div style={{fontSize:'18px', fontWeight:'600'}}>Создать объявление</div>
      </div>

      <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'32px 20px', gap:'16px'}}>

        <div style={{textAlign:'center', marginBottom:'8px'}}>
          <div style={{fontSize:'32px'}}>🤝</div>
          <div style={{fontSize:'16px', color:'#666', marginTop:'8px'}}>Что вы хотите опубликовать?</div>
        </div>

        {/* Нашёл / Потерял */}
        <div
          onClick={() => navigate('/create-post?type=lost')}
          style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', cursor:'pointer', display:'flex', alignItems:'center', gap:'16px', transition:'transform 0.2s'}}
          onMouseDown={e => e.currentTarget.style.transform='scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
        >
          <div style={{width:'56px', height:'56px', borderRadius:'16px', background:'#FFF3E0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0}}>🔍</div>
          <div>
            <div style={{fontWeight:'700', fontSize:'16px', color:'#333'}}>Потерялся / Нашёлся питомец</div>
            <div style={{fontSize:'13px', color:'#888', marginTop:'4px'}}>Объявление о потерянном или найденном животном</div>
          </div>
          <div style={{marginLeft:'auto', color:'#CCC', fontSize:'20px'}}>→</div>
        </div>

        {/* Нужна помощь */}
        <div
          onClick={() => navigate('/create-post?type=help')}
          style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', cursor:'pointer', display:'flex', alignItems:'center', gap:'16px', transition:'transform 0.2s'}}
          onMouseDown={e => e.currentTarget.style.transform='scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
        >
          <div style={{width:'56px', height:'56px', borderRadius:'16px', background:'#E8F5E9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0}}>🆘</div>
          <div>
            <div style={{fontWeight:'700', fontSize:'16px', color:'#333'}}>Нужна помощь</div>
            <div style={{fontSize:'13px', color:'#888', marginTop:'4px'}}>Запрос о помощи животному с описанием проблемы и срочностью</div>
          </div>
          <div style={{marginLeft:'auto', color:'#CCC', fontSize:'20px'}}>→</div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}

export default CreatePostChoose;
