import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';

const VIOLATION_LABELS = {
  tab_switch:         { label:'Tab switch',       icon:'🔄', color:'#f59e0b' },
  fullscreen_exit:    { label:'Fullscreen exit',  icon:'📺', color:'#ef4444' },
  clipboard_paste:    { label:'Clipboard paste',  icon:'📋', color:'#ef4444' },
  devtools_open:      { label:'DevTools opened',  icon:'🔧', color:'#dc2626' },
  new_process:        { label:'New process',      icon:'⚙️', color:'#dc2626' },
  concurrent_session: { label:'Dual login',       icon:'👥', color:'#7c3aed' },
  inactivity:         { label:'Inactivity',       icon:'💤', color:'#64748b' },
  right_click:        { label:'Right click',      icon:'🖱️', color:'#64748b' },
};

function TrustBadge({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626';
  const bg    = score >= 80 ? '#dcfce7' : score >= 50 ? '#fef9c3' : '#fee2e2';
  return (
    <div style={{background:bg,border:`2px solid ${color}`,borderRadius:10,padding:'8px 12px',textAlign:'center',minWidth:70}}>
      <div style={{fontSize:22,fontWeight:800,color}}>{score}</div>
      <div style={{fontSize:9,color,fontWeight:600}}>TRUST</div>
    </div>
  );
}

export default function ExamWarRoom() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [scores,  setScores]  = useState([]);
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const load = () => {
    api.get(`/exams`).then(r => {
      const s = r.data.data?.find(e => e.id === parseInt(id));
      setSession(s);
    });
    api.get(`/exams/${id}/scores`).then(r => {
      setScores(r.data.scores || []);
      setEvents(r.data.events || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('exam:violation', (data) => {
      if (data.machineId) {
        setScores(prev => prev.map(s =>
          s.machine_id === data.machineId
            ? { ...s, trust_score: data.trustScoreAfter }
            : s
        ));
        setEvents(prev => [{
          id: Date.now(),
          machine_id: data.machineId,
          student_name: data.studentName,
          event_type: data.eventType,
          severity: data.severity,
          trust_score_after: data.trustScoreAfter,
          recorded_at: new Date().toISOString(),
        }, ...prev.slice(0, 49)]);
      }
    });

    socketRef.current.on('exam:machine_locked', ({ machineId }) => {
      setScores(prev => prev.map(s =>
        s.machine_id === machineId ? { ...s, is_locked: true } : s
      ));
    });

    return () => socketRef.current?.disconnect();
  }, [id]);

  const sendWarning = async (machineId, hostname) => {
    try {
      await api.post(`/commands/${machineId}`, { type: 'message', content: '⚠️ Warning from invigilator: suspicious activity detected. Please follow exam rules.' });
      alert(`Warning sent to ${hostname}`);
    } catch { alert('Machine may be offline'); }
  };

  const lockMachine = async (machineId, hostname) => {
    if (!window.confirm(`Lock ${hostname}?`)) return;
    await api.post(`/commands/${machineId}`, { type: 'lock' });
    setScores(prev => prev.map(s => s.machine_id === machineId ? { ...s, is_locked: true } : s));
  };

  const endExam = async () => {
    if (!window.confirm('End this exam session?')) return;
    await api.post(`/exams/${id}/end`);
    navigate('/exam');
  };

  const machineEvents = (machineId) => events.filter(e => e.machine_id === machineId);

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading war room...</div>;

  const critical = scores.filter(s => s.trust_score < 50).length;
  const locked   = scores.filter(s => s.is_locked).length;

  return (
    <div style={{padding:24,background:'#0f172a',minHeight:'100vh',color:'#fff'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>navigate('/exam')} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:13}}>← Back</button>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#22c55e',animation:'pulse 1s infinite'}}></div>
              <h1 style={{fontSize:18,fontWeight:700,margin:0}}>{session?.title || 'Exam War Room'}</h1>
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2}}>{session?.lab_name} · {scores.length} candidates</div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {[
            {l:'Monitoring', v:scores.length,    c:'#22c55e'},
            {l:'At risk',    v:critical,          c:'#f59e0b'},
            {l:'Locked',     v:locked,            c:'#ef4444'},
          ].map(s=>(
            <div key={s.l} style={{background:'rgba(255,255,255,0.08)',borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>{s.l}</div>
            </div>
          ))}
          {session?.status === 'active' && (
            <button onClick={endExam} style={{background:'#dc2626',border:'none',color:'#fff',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600}}>
              ⏹ End exam
            </button>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        {/* Student grid */}
        <div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em'}}>Student machines</div>
          {scores.length === 0 ? (
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:40,textAlign:'center',color:'rgba(255,255,255,0.3)'}}>
              No machines enrolled in this session yet.<br/>
              <span style={{fontSize:12}}>Start the exam to enroll online machines.</span>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
              {scores.map(s => {
                const mEvents  = machineEvents(s.machine_id);
                const bgColor  = s.is_locked ? 'rgba(220,38,38,0.15)' : s.trust_score < 50 ? 'rgba(239,68,68,0.1)' : s.trust_score < 80 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)';
                const border   = s.is_locked ? '1.5px solid #dc2626' : s.trust_score < 50 ? '1.5px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)';
                return (
                  <div key={s.id} style={{background:bgColor,border,borderRadius:10,padding:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>{s.student_name || s.hostname}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{s.ip_address}</div>
                      </div>
                      <TrustBadge score={s.trust_score} />
                    </div>

                    {s.is_locked && (
                      <div style={{background:'rgba(220,38,38,0.3)',borderRadius:6,padding:'4px 8px',fontSize:11,color:'#fca5a5',marginBottom:8,textAlign:'center',fontWeight:600}}>
                        🔒 MACHINE LOCKED
                      </div>
                    )}

                    {/* Violation dots */}
                    {mEvents.length > 0 && (
                      <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:8}}>
                        {mEvents.slice(0,8).map((e,i) => {
                          const v = VIOLATION_LABELS[e.event_type] || {};
                          return <span key={i} title={v.label} style={{fontSize:14}}>{v.icon||'⚡'}</span>;
                        })}
                        {mEvents.length > 8 && <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>+{mEvents.length-8}</span>}
                      </div>
                    )}

                    {!s.is_locked && (
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>sendWarning(s.machine_id,s.hostname)} style={{flex:1,padding:'5px',background:'rgba(245,158,11,0.2)',border:'1px solid rgba(245,158,11,0.4)',color:'#fcd34d',borderRadius:6,cursor:'pointer',fontSize:11}}>
                          ⚠ Warn
                        </button>
                        <button onClick={()=>lockMachine(s.machine_id,s.hostname)} style={{flex:1,padding:'5px',background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.4)',color:'#fca5a5',borderRadius:6,cursor:'pointer',fontSize:11}}>
                          🔒 Lock
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live alert feed */}
        <div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em'}}>Live violations</div>
          <div style={{background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',maxHeight:'calc(100vh - 160px)',overflowY:'auto'}}>
            {events.length === 0 ? (
              <div style={{padding:30,textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:13}}>
                No violations detected yet
              </div>
            ) : events.map(e => {
              const v = VIOLATION_LABELS[e.event_type] || { label: e.event_type, icon:'⚡', color:'#888' };
              return (
                <div key={e.id} style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    <span style={{fontSize:14}}>{v.icon}</span>
                    <span style={{fontSize:12,fontWeight:600,color:v.color}}>{v.label}</span>
                    <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.3)'}}>
                      {new Date(e.recorded_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                    </span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{e.student_name}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Score: {e.trust_score_after}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}