import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import api from '../api/axios';

const VIOLATION_LABELS = {
  tab_switch:         { label:'Tab switch',       color:'#fbbf24' },
  fullscreen_exit:    { label:'Fullscreen exit',  color:'#f87171' },
  clipboard_paste:    { label:'Clipboard paste',  color:'#f87171' },
  devtools_open:      { label:'DevTools opened',  color:'#fb7185' },
  new_process:        { label:'New process',      color:'#fb7185' },
  usb_device:         { label:'USB device',       color:'#f472b6' },
  multi_monitor:      { label:'Multi-monitor',    color:'#fb923c' },
  concurrent_session: { label:'Dual login',       color:'#c4b5fd' },
  inactivity:         { label:'Inactivity',       color:'#94a3b8' },
  right_click:        { label:'Right click',      color:'#94a3b8' },
};

function TrustBadge({ score }) {
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const bg    = score >= 80 ? 'rgba(52,211,153,0.12)' : score >= 50 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)';
  return (
    <div style={{ background:bg, border:`1.5px solid ${color}55`, borderRadius:10, padding:'8px 12px', textAlign:'center', minWidth:66 }}>
      <div style={{ fontSize:21, fontWeight:800, color }}>{score}</div>
      <div style={{ fontSize:9, color, fontWeight:700, letterSpacing:'0.05em' }}>TRUST</div>
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
  const [screenshots, setScreenshots] = useState({}); // machineId -> { image, ts }
  const [zoomed, setZoomed] = useState(null); // machine_id currently shown enlarged
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
    socketRef.current = io(API_URL);

    socketRef.current.on('exam:violation', (data) => {
      if (data.machineId) {
        setScores(prev => prev.map(s => s.machine_id === data.machineId ? { ...s, trust_score: data.trustScoreAfter } : s));
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
      setScores(prev => prev.map(s => s.machine_id === machineId ? { ...s, is_locked: true } : s));
    });

    socketRef.current.on('exam:screenshot', (data) => {
      setScreenshots(prev => ({ ...prev, [data.machineId]: { image: data.image, ts: data.ts } }));
    });

    return () => socketRef.current?.disconnect();
  }, [id]);

  const sendWarning = async (machineId, hostname) => {
    try {
      await api.post(`/commands/${machineId}`, { type: 'message', content: 'Warning from invigilator: suspicious activity detected. Please follow exam rules.' });
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

  if (loading) return <div style={s.loading}>Loading war room</div>;

  const critical = scores.filter(s => s.trust_score < 50).length;
  const locked   = scores.filter(s => s.is_locked).length;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={()=>navigate('/exam')} style={s.backBtn}>← Back</button>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={s.pulseDot} />
              <h1 style={s.title}>{session?.title || 'Exam war room'}</h1>
            </div>
            <div style={s.subTitle}>{session?.lab_name} · {scores.length} candidates</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {[
            { l:'Monitoring', v:scores.length, c:'#818cf8' },
            { l:'At risk',    v:critical,       c:'#fbbf24' },
            { l:'Locked',     v:locked,         c:'#f87171' },
          ].map(stat=>(
            <div key={stat.l} style={s.statChip}>
              <div style={{ fontSize:19, fontWeight:800, color:stat.c }}>{stat.v}</div>
              <div style={s.statChipLabel}>{stat.l}</div>
            </div>
          ))}
          {session?.status === 'active' && (
            <button onClick={endExam} style={s.endBtn}>End exam</button>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
        <div>
          <div style={s.sectionLabel}>Student machines</div>
          {scores.length === 0 ? (
            <div style={s.emptyBox}>
              No machines enrolled in this session yet.<br/>
              <span style={{ fontSize:12 }}>Start the exam to enroll online machines.</span>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
              {scores.map(s => {
                const mEvents = machineEvents(s.machine_id);
                const bg     = s.is_locked ? 'rgba(248,113,113,0.08)' : s.trust_score < 50 ? 'rgba(248,113,113,0.06)' : s.trust_score < 80 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)';
                const border = s.is_locked ? '1.5px solid rgba(248,113,113,0.4)' : s.trust_score < 50 ? '1.5px solid rgba(248,113,113,0.25)' : '1px solid rgba(255,255,255,0.08)';
                return (
                  <div key={s.id} style={{ background:bg, border, borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#f4f4f8' }}>{s.student_name || s.hostname}</div>
                        <div style={{ fontSize:10, color:'rgba(244,244,248,0.4)' }}>{s.ip_address}</div>
                      </div>
                      <TrustBadge score={s.trust_score} />
                    </div>

                    {screenshots[s.machine_id] ? (
                      <img
                        src={`data:image/jpeg;base64,${screenshots[s.machine_id].image}`}
                        onClick={()=>setZoomed(s.machine_id)}
                        style={{ width:'100%', borderRadius:8, marginBottom:8, cursor:'zoom-in', display:'block', border:'1px solid rgba(255,255,255,0.08)' }}
                        alt="Live screen"
                      />
                    ) : (
                      <div style={{ width:'100%', aspectRatio:'16/10', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:8, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10.5, color:'rgba(244,244,248,0.25)' }}>
                        No live feed yet
                      </div>
                    )}

                    {s.is_locked && (
                      <div style={s.lockedBanner}>MACHINE LOCKED</div>
                    )}

                    {mEvents.length > 0 && (
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                        {mEvents.slice(0,6).map((e,i) => {
                          const v = VIOLATION_LABELS[e.event_type] || { color:'#94a3b8' };
                          return <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:v.color, display:'inline-block' }} title={v.label}/>;
                        })}
                        {mEvents.length > 6 && <span style={{ fontSize:10, color:'rgba(244,244,248,0.4)' }}>+{mEvents.length-6}</span>}
                      </div>
                    )}

                    {!s.is_locked && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>sendWarning(s.machine_id,s.hostname)} style={s.warnBtn}>Warn</button>
                        <button onClick={()=>lockMachine(s.machine_id,s.hostname)} style={s.lockBtn}>Lock</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div style={s.sectionLabel}>Live violations</div>
          <div style={s.feedBox}>
            {events.length === 0 ? (
              <div style={s.feedEmpty}>No violations detected yet</div>
            ) : events.map(e => {
              const v = VIOLATION_LABELS[e.event_type] || { label: e.event_type, color:'#94a3b8' };
              return (
                <div key={e.id} style={s.feedRow}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:v.color, flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:600, color:v.color }}>{v.label}</span>
                    <span style={{ marginLeft:'auto', fontSize:10, color:'rgba(244,244,248,0.3)' }}>
                      {new Date(e.recorded_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(244,244,248,0.5)' }}>{e.student_name}</div>
                  <div style={{ fontSize:11, color:'rgba(244,244,248,0.3)' }}>Score: {e.trust_score_after}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {zoomed && screenshots[zoomed] && (
        <div onClick={()=>setZoomed(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:40 }}>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'90vh' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                {scores.find(sc=>sc.machine_id===zoomed)?.student_name || scores.find(sc=>sc.machine_id===zoomed)?.hostname}
              </div>
              <button onClick={()=>setZoomed(null)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Close ✕</button>
            </div>
            <img src={`data:image/jpeg;base64,${screenshots[zoomed].image}`} style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', display:'block' }} alt="Live screen enlarged"/>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  );
}

const s = {
  page:          { padding:24, background:'#0e0e16', minHeight:'100vh', color:'#f4f4f8', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  loading:       { padding:60, textAlign:'center', color:'rgba(244,244,248,0.4)', fontSize:13 },
  header:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:14 },
  backBtn:       { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#f4f4f8', padding:'7px 13px', borderRadius:8, cursor:'pointer', fontSize:13 },
  pulseDot:      { width:9, height:9, borderRadius:'50%', background:'#818cf8', animation:'pulse 1.2s infinite' },
  title:         { fontSize:17, fontWeight:700, margin:0 },
  subTitle:      { fontSize:12, color:'rgba(244,244,248,0.5)', marginTop:2 },
  statChip:      { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'8px 14px', textAlign:'center' },
  statChipLabel: { fontSize:10, color:'rgba(244,244,248,0.45)', marginTop:1, fontWeight:500 },
  endBtn:        { background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', color:'#fff', padding:'9px 16px', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 4px 14px rgba(220,38,38,0.3)' },
  sectionLabel:  { fontSize:11.5, color:'rgba(244,244,248,0.35)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 },
  emptyBox:      { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:40, textAlign:'center', color:'rgba(244,244,248,0.3)' },
  lockedBanner:  { background:'rgba(248,113,113,0.15)', borderRadius:7, padding:'5px 8px', fontSize:11, color:'#fca5a5', marginBottom:8, textAlign:'center', fontWeight:700, letterSpacing:'0.03em' },
  warnBtn:       { flex:1, padding:'6px', background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.25)', color:'#fbbf24', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600 },
  lockBtn:       { flex:1, padding:'6px', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.25)', color:'#fca5a5', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600 },
  feedBox:       { background:'rgba(255,255,255,0.02)', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)', maxHeight:'calc(100vh - 160px)', overflowY:'auto' },
  feedEmpty:     { padding:30, textAlign:'center', color:'rgba(244,244,248,0.2)', fontSize:13 },
  feedRow:       { padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' },
};