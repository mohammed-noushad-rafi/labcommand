import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function ExamStudent() {
  const { sessionId, machineId } = useParams();
  const [violations, setViolations] = useState([]);
  const [locked,     setLocked]     = useState(false);
  const [trustScore, setTrustScore] = useState(100);
  const socketRef = useRef(null);
  const studentName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Student';

  const sendViolation = (type, metadata = {}) => {
    if (locked) return;
    socketRef.current?.emit('exam:violation', {
      sessionId: parseInt(sessionId),
      machineId: parseInt(machineId),
      studentName,
      eventType: type,
      metadata,
    });
    setViolations(prev => [...prev, { type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('exam:machine_locked', ({ machineId: mid }) => {
      if (parseInt(mid) === parseInt(machineId)) setLocked(true);
    });

    socketRef.current.on('exam:violation', (data) => {
      if (data.machineId === parseInt(machineId)) setTrustScore(data.trustScoreAfter);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) sendViolation('tab_switch');
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) sendViolation('fullscreen_exit');
    });

    document.addEventListener('paste', () => sendViolation('clipboard_paste'));
    document.addEventListener('contextmenu', e => { e.preventDefault(); sendViolation('right_click'); });

    const keyHandler = (e) => {
      if ((e.key === 'F12') || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        sendViolation('devtools_open');
      }
    };
    document.addEventListener('keydown', keyHandler);

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    return () => {
      socketRef.current?.disconnect();
      document.removeEventListener('keydown', keyHandler);
    };
  }, [locked]);

  if (locked) {
    return (
      <div style={{minHeight:'100vh',background:'#1a1a2e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff'}}>
        <div style={{fontSize:60,marginBottom:16}}>🔒</div>
        <h1 style={{fontSize:24,fontWeight:700,color:'#ef4444',margin:0}}>Session suspended</h1>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',marginTop:8}}>Your machine has been locked by the invigilator.</p>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.3)'}}>Please raise your hand and wait for assistance.</p>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#fff',padding:24}}>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,padding:'12px 16px',background:'rgba(255,255,255,0.05)',borderRadius:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:8,height:8,background:'#22c55e',borderRadius:'50%'}}></div>
            <span style={{fontSize:13,color:'rgba(255,255,255,0.7)'}}>Exam in progress — monitoring active</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Trust score:</span>
            <span style={{fontSize:18,fontWeight:700,color:trustScore>=80?'#22c55e':trustScore>=50?'#f59e0b':'#ef4444'}}>{trustScore}</span>
          </div>
        </div>

        <div style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:32,textAlign:'center',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:40,marginBottom:12}}>📝</div>
          <h2 style={{fontSize:18,fontWeight:600,margin:0}}>Exam interface</h2>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginTop:8}}>Your exam content would appear here.</p>
          <p style={{color:'rgba(255,255,255,0.3)',fontSize:12,marginTop:4}}>This machine is being monitored. Stay focused.</p>
        </div>

        {violations.length > 0 && (
          <div style={{marginTop:16,background:'rgba(239,68,68,0.1)',borderRadius:8,padding:'10px 14px',border:'1px solid rgba(239,68,68,0.2)'}}>
            <div style={{fontSize:12,color:'#fca5a5',fontWeight:600,marginBottom:6}}>⚠ Violations detected this session:</div>
            {violations.slice(-3).map((v,i)=>(
              <div key={i} style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{v.time} — {v.type.replace('_',' ')}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}