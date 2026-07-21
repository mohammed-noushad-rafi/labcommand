import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export default function BookingToast() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    socketRef.current = io(API_URL, { auth: { token } });

    socketRef.current.on('booking:new', (data) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...data }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
    });

    return () => socketRef.current?.disconnect();
  }, [user]);

  if (!toasts.length) return null;

  return (
    <div style={{ position:'fixed', bottom:24, left:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:'#fff', border:'1px solid #e9e9f0',
          borderLeft:'4px solid #4f46e5', borderRadius:12,
          padding:'14px 18px', boxShadow:'0 4px 20px rgba(16,16,30,0.12)',
          minWidth:300, maxWidth:380, animation:'slideIn .25s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#4f46e5', flexShrink:0 }} />
            <span style={{ fontSize:13, fontWeight:700, color:'#16161f' }}>Lab booked</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#a8a8b8', fontSize:16 }}>×</button>
          </div>
          <div style={{ fontSize:13, color:'#16161f', fontWeight:500 }}>{t.lab_name}</div>
          <div style={{ fontSize:12, color:'#7c7c8a', marginTop:3 }}>
            {t.user_name} · {new Date(t.date).toLocaleDateString('en-IN')} · {t.start_time} – {t.end_time}
          </div>
          {t.purpose && <div style={{ fontSize:11.5, color:'#a8a8b8', marginTop:3 }}>{t.purpose}</div>}
        </div>
      ))}
      <style>{'@keyframes slideIn { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:translateX(0) } }'}</style>
    </div>
  );
}
