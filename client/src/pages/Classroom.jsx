import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import DeptIcon from '../components/DeptIcon';
import api from '../api/axios';

const STATUS_COLOR = {
  online:    { dot:'#0f9d58', bg:'#eefbf3', border:'#bce8cc', label:'Online' },
  offline:   { dot:'#c4c4cc', bg:'#fafafd', border:'#e9e9f0', label:'Offline' },
  classroom: { dot:'#7c3aed', bg:'#f6f1fe', border:'#dccdfb', label:'Locked' },
  locked:    { dot:'#d97706', bg:'#fef8ee', border:'#f6dba8', label:'Locked' },
  exam:      { dot:'#dc2626', bg:'#fef2f2', border:'#f5bcbc', label:'Exam' },
};

const QUICK_MESSAGES = [
  'Please stop working and look at the board',
  'Save your work now',
  'Exam starts in 5 minutes — close all applications',
  'Please submit your files to the server',
  'Session ending in 10 minutes',
  'Do not copy from other machines',
];

const SESSION_TEMPLATES = [
  'Python Lab — Batch A','Python Lab — Batch B',
  'Java Lab — Batch A','Database Lab — Batch A',
  'Network Lab — Batch A','Web Technologies Lab',
  'OS Lab — Batch A','Data Structures Lab',
];

export default function Classroom() {
  const [departments,  setDepartments]  = useState([]);
  const [machines,     setMachines]     = useState([]);
  const [dept,         setDept]         = useState(null);
  const [selectedLab,  setSelectedLab]  = useState(null);
  const [sessionName,  setSessionName]  = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [active,       setActive]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [log,          setLog]          = useState([]);
  const [showTemplates,setShowTemplates]= useState(false);
  const [screenshots, setScreenshots] = useState({}); // machineId -> { image, ts }
  const [zoomed, setZoomed] = useState(null); // machine object currently enlarged
  const socketRef = useRef(null);
  const machinesRef = useRef([]);
  useEffect(() => { machinesRef.current = machines; }, [machines]);

  useEffect(() => {
    api.get('/labs/departments').then(r => {
      setDepartments((r.data.data || []).filter(d => d.department === 'Computer Science'));
    });
    api.get('/machines').then(r => setMachines(r.data.data || []));
    const token = localStorage.getItem('token');
    socketRef.current = io(API_URL, { auth: { token } });
    socketRef.current.on('classroom:started', () => setActive(true));
    socketRef.current.on('classroom:ended',   () => setActive(false));
    socketRef.current.on('machine:status', ({ machineId, status }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status } : m));
    });
    socketRef.current.on('machine:telemetry', ({ machineId, cpu, ram }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, cpu_percent:cpu, ram_percent:ram } : m));
    });
    socketRef.current.on('exam:screenshot', (data) => {
      setScreenshots(prev => ({ ...prev, [data.machineId]: { image: data.image, ts: data.ts } }));
    });
    return () => socketRef.current?.disconnect();
  }, []);

  // Live-mirror every online/locked machine in the currently selected lab.
  // Heartbeat every 60s picks up machines that come online mid-view;
  // everything is unwatched cleanly when leaving this lab or the page.
  useEffect(() => {
    if (!selectedLab || !socketRef.current) return;
    const watchAll = () => {
      machinesRef.current
        .filter(m => m.lab_id === selectedLab.id && ['online','locked','exam','classroom'].includes(m.status))
        .forEach(m => socketRef.current?.emit('client:watch', { machineId: m.id }));
    };
    watchAll();
    const heartbeat = setInterval(watchAll, 60000);
    return () => {
      clearInterval(heartbeat);
      machinesRef.current
        .filter(m => m.lab_id === selectedLab.id)
        .forEach(m => socketRef.current?.emit('client:unwatch', { machineId: m.id }));
    };
  }, [selectedLab?.id]);

  const labMachines = selectedLab ? machines.filter(m => m.lab_id === selectedLab.id) : [];
  const onlineCount = labMachines.filter(m => m.status === 'online' || m.status === 'classroom').length;
  const lockedCount = labMachines.filter(m => m.status === 'classroom').length;
  const addLog = msg => setLog(prev => [new Date().toLocaleTimeString('en-IN') + ' — ' + msg, ...prev.slice(0,19)]);

  const startSession = async () => {
    if (!selectedLab || !sessionName.trim()) return alert('Enter a session name');
    setLoading(true);
    try {
      const r = await api.post('/classroom/start', { lab_id: selectedLab.id, session_name: sessionName });
      setActive(true);
      addLog('Session started — ' + r.data.machines + ' machines, ' + r.data.locked + ' locked');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const endSession = async () => {
    setLoading(true);
    try {
      await api.post('/classroom/end', { lab_id: selectedLab.id });
      setActive(false);
      addLog('Session ended — all machines unlocked');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const broadcast = async msg => {
    const message = msg || broadcastMsg;
    if (!message.trim()) return;
    try {
      const r = await api.post('/classroom/broadcast', { lab_id: selectedLab.id, message });
      addLog('Broadcast to ' + r.data.sent + ' machines: "' + message + '"');
      setBroadcastMsg('');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  // LEVEL 1 — CS Department card
  if (!dept) return (
    <div style={page}>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#7c3aed,#9333ea)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Classroom mode</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Lock machines, broadcast messages and manage class sessions</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => (
          <div key={d.department} onClick={() => setDept(d)}
            style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px #7c3aed12'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
            <div style={{ marginBottom:18 }}><DeptIcon department={d.department} size={34}/></div>
            <div style={{ fontSize:18, fontWeight:700, color:'#16161f', marginBottom:4 }}>{d.department}</div>
            <div style={{ fontSize:12, color:'#bbb', marginBottom:16 }}>{d.lab_count} lab{d.lab_count>1?'s':''}</div>
            <span style={{ fontSize:13, color:'#7c3aed', fontWeight:600 }}>Select lab →</span>
          </div>
        ))}
      </div>
      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  );

  // LEVEL 2 — Lab list
  if (!selectedLab) return (
    <div style={page}>
      <button onClick={() => setDept(null)} style={backBtn}>← Back</button>
      <div style={{ marginBottom:36, marginTop:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <DeptIcon department="Computer Science" size={20}/>
          <span style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Computer Science</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>Select a lab</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>Choose a lab to start a classroom session</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => {
          const labM   = machines.filter(m => m.lab_id === lab.id);
          const online = labM.filter(m => m.status === 'online').length;
          const locked = labM.filter(m => m.status === 'classroom').length;
          const isActive = locked > 0;
          return (
            <div key={lab.id} onClick={() => setSelectedLab(lab)}
              style={{ background:'#fff', border:'1px solid '+(isActive?'#dccdfb':'#ebebf0'), borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.background='#faf7ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=isActive?'#dccdfb':'#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:isActive?'#f6f1fe':'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:isActive?'#7c3aed':'#4f46e5' }}>
                  {isActive ? '🔒' : 'L'+(idx+1)}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · {labM.length} machines</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:11, color:isActive?'#7c3aed':'#0f9d58', fontWeight:isActive?700:600 }}>
                  {isActive ? '🔒 Session active — '+locked+' locked' : online+' online'}
                </span>
                <span style={{ fontSize:18, color:'#ddd' }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  );

  // LEVEL 3 — Control panel
  return (
    <div style={page}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:28 }}>
        <button onClick={() => { setSelectedLab(null); setActive(false); }} style={backBtn}>← Labs</button>
        <span style={{ color:'#e0e0e6' }}>›</span>
        <span style={{ fontSize:12, color:'#9494a3', fontWeight:500 }}>{selectedLab.name}</span>
        {active && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, background:'#f6f1fe', border:'1px solid #dccdfb', borderRadius:10, padding:'6px 14px' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#7c3aed', animation:'pulse 1.2s infinite', display:'inline-block' }}/>
            <span style={{ fontSize:12, fontWeight:700, color:'#5b21b6' }}>Session active: {sessionName}</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom:24, borderBottom:'1px solid #ebebf0', paddingBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>{selectedLab.name}</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Classroom control · {labMachines.length} machines · {onlineCount} active</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={card}>
            <div style={cardTitle}>Session control</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ position:'relative' }}>
                <label style={lbl}>Session name</label>
                <input value={sessionName}
                  onChange={e => { setSessionName(e.target.value); setShowTemplates(true); }}
                  onFocus={() => setShowTemplates(true)}
                  placeholder="e.g. Python Lab — Batch A"
                  disabled={active}
                  style={{ ...inp, opacity:active?0.6:1 }}/>
                {showTemplates && !active && sessionName.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ebebf0', borderRadius:10, boxShadow:'0 8px 24px rgba(16,16,31,0.1)', zIndex:100, marginTop:4 }}>
                    {SESSION_TEMPLATES.filter(t => t.toLowerCase().includes(sessionName.toLowerCase())).map(t => (
                      <div key={t} onClick={() => { setSessionName(t); setShowTemplates(false); }}
                        style={{ padding:'9px 14px', cursor:'pointer', fontSize:12, color:'#16161f', borderBottom:'1px solid #f7f7fb' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f7f7ff'}
                        onMouseLeave={e => e.currentTarget.style.background=''}>
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!active ? (
                <button onClick={startSession} disabled={loading||!sessionName}
                  style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer', opacity:!sessionName?0.4:1 }}>
                  {loading ? 'Starting...' : '🔒 Start session & lock machines'}
                </button>
              ) : (
                <button onClick={endSession} disabled={loading}
                  style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  {loading ? 'Ending...' : '🔓 End session & unlock all'}
                </button>
              )}
            </div>
          </div>

          <div style={card}>
            <div style={cardTitle}>Quick broadcast</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
              {QUICK_MESSAGES.map(m => (
                <button key={m} onClick={() => broadcast(m)} disabled={!active}
                  style={{ background:'#f7f7f9', border:'1px solid #ebebf0', borderRadius:8, padding:'8px 12px', fontSize:11.5, cursor:active?'pointer':'not-allowed', textAlign:'left', color:active?'#555':'#bbb', transition:'all .1s', opacity:active?1:0.5 }}
                  onMouseEnter={e => { if(active){ e.currentTarget.style.background='#f0ecfe'; e.currentTarget.style.borderColor='#dccdfb'; e.currentTarget.style.color='#7c3aed'; }}}
                  onMouseLeave={e => { e.currentTarget.style.background='#f7f7f9'; e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.color=active?'#555':'#bbb'; }}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Custom message..."
                onKeyDown={e => e.key==='Enter' && broadcast()}
                disabled={!active}
                style={{ ...inp, flex:1, opacity:active?1:0.5 }}/>
              <button onClick={() => broadcast()} disabled={!broadcastMsg.trim()||!active}
                style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:9, padding:'0 14px', fontSize:13, fontWeight:600, cursor:'pointer', opacity:(!broadcastMsg.trim()||!active)?0.4:1 }}>
                Send
              </button>
            </div>
            {!active && <div style={{ fontSize:11, color:'#dc2626', marginTop:6 }}>Start a session first to broadcast</div>}
          </div>

          <div style={card}>
            <div style={cardTitle}>Activity log</div>
            <div style={{ maxHeight:160, overflowY:'auto' }}>
              {log.length === 0
                ? <div style={{ fontSize:12, color:'#bbb', textAlign:'center', padding:'20px 0' }}>No activity yet</div>
                : log.map((entry, i) => <div key={i} style={{ fontSize:11, color:'#7c7c8a', padding:'5px 0', borderBottom:'1px solid #f5f5f7' }}>{entry}</div>)
              }
            </div>
          </div>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#16161f' }}>Machine view</div>
              <div style={{ fontSize:12, color:'#9494a3', marginTop:2 }}>{onlineCount} active · {lockedCount} locked</div>
            </div>
            <div style={{ display:'flex', gap:12, fontSize:11 }}>
              {[{d:'#0f9d58',l:'Online'},{d:'#7c3aed',l:'Locked'},{d:'#c4c4cc',l:'Offline'}].map(s=>(
                <div key={s.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:s.d }}/>
                  <span style={{ color:'#9494a3', fontWeight:500 }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {labMachines.length === 0 ? (
            <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
              No machines registered for this lab yet
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:10 }}>
              {labMachines.map(m => {
                const st = STATUS_COLOR[m.status] || STATUS_COLOR.offline;
                const locked = m.status === 'classroom';
                return (
                  <div key={m.id} style={{ background:st.bg, border:'1.5px solid '+st.border, borderRadius:13, padding:'14px 12px', transition:'transform .1s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform=''}>
                    {(m.status === 'online' || m.status === 'classroom') && (
                      screenshots[m.id] ? (
                        <img
                          src={`data:image/jpeg;base64,${screenshots[m.id].image}`}
                          onClick={() => setZoomed(m)}
                          style={{ width:'100%', aspectRatio:'16/10', objectFit:'cover', borderRadius:8, marginBottom:8, cursor:'zoom-in', display:'block', border:'1px solid rgba(0,0,0,0.06)' }}
                          alt="Live screen"
                        />
                      ) : (
                        <div style={{ width:'100%', aspectRatio:'16/10', background:'rgba(0,0,0,0.03)', border:'1px dashed rgba(0,0,0,0.1)', borderRadius:8, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#bbb' }}>
                          Connecting…
                        </div>
                      )
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:st.dot, ...(locked?{animation:'pulse 1.2s infinite'}:{}) }}/>
                      <span style={{ fontSize:12.5, fontWeight:700, color:'#16161f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.hostname}</span>
                    </div>
                    <div style={{ fontSize:10, color:'#bbb', marginBottom:8 }}>{m.ip_address}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:st.dot }}>{locked ? '🔒 Locked' : st.label}</div>
                    {m.status==='online' && m.cpu_percent!=null && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9.5, color:'#bbb', marginBottom:3 }}>
                          <span>CPU</span><span>{Math.round(m.cpu_percent)}%</span>
                        </div>
                        <div style={{ height:3, background:'rgba(0,0,0,0.06)', borderRadius:2 }}>
                          <div style={{ height:3, borderRadius:2, background:'#4f46e5', width:Math.min(m.cpu_percent,100)+'%' }}/>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {zoomed && screenshots[zoomed.id] && (
        <div onClick={()=>setZoomed(null)} style={{ position:'fixed', inset:0, background:'rgba(16,16,31,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:40 }}>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'90vh' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{zoomed.hostname}</div>
              <button onClick={()=>setZoomed(null)} style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Close ✕</button>
            </div>
            <img src={`data:image/jpeg;base64,${screenshots[zoomed.id].image}`} style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', display:'block' }} alt="Live screen enlarged"/>
          </div>
        </div>
      )}

      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  );
}

const page     = { padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' };
const backBtn  = { background:'none', border:'1px solid #ebebf0', color:'#7c7c8a', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500 };
const card     = { background:'#fff', border:'1px solid #ebebf0', borderRadius:14, padding:'20px' };
const cardTitle= { fontSize:13, fontWeight:700, color:'#16161f', marginBottom:14 };
const lbl      = { display:'block', fontSize:11.5, fontWeight:600, color:'#7c7c8a', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' };
const inp      = { padding:'9px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f', fontFamily:'inherit' };
