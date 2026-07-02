import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import PageHeader, { Panel } from '../components/PageHeader';
import Button from '../components/Button';

const STATUS_COLOR = {
  online:    { dot:'#0f9d58', label:'Online' },
  offline:   { dot:'#a8a8b8', label:'Offline' },
  classroom: { dot:'#7c3aed', label:'Locked' },
  locked:    { dot:'#d97706', label:'Locked' },
  exam:      { dot:'#dc2626', label:'Exam' },
};

export default function Classroom() {
  const [labs,        setLabs]        = useState([]);
  const [machines,    setMachines]    = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [broadcastMsg,setBroadcastMsg]= useState('');
  const [active,      setActive]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [log,         setLog]         = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get('/labs').then(r => setLabs(r.data.data || []));
    api.get('/machines').then(r => setMachines(r.data.data || []));

    socketRef.current = io('http://localhost:3001');
    socketRef.current.on('classroom:started', () => setActive(true));
    socketRef.current.on('classroom:ended',   () => setActive(false));
    socketRef.current.on('machine:status', ({ machineId, status }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status } : m));
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const labMachines = machines.filter(m => m.lab_id === parseInt(selectedLab));
  const addLog = (msg) => setLog(prev => [`${new Date().toLocaleTimeString('en-IN')} — ${msg}`, ...prev.slice(0,19)]);

  const startSession = async () => {
    if (!selectedLab || !sessionName.trim()) return alert('Select a lab and enter a session name');
    setLoading(true);
    try {
      const r = await api.post('/classroom/start', { lab_id: selectedLab, session_name: sessionName });
      setActive(true);
      addLog(`Session started — ${r.data.machines} machines, ${r.data.locked} locked`);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const endSession = async () => {
    setLoading(true);
    try {
      await api.post('/classroom/end', { lab_id: selectedLab });
      setActive(false);
      addLog('Session ended — all machines unlocked');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const broadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      const r = await api.post('/classroom/broadcast', { lab_id: selectedLab, message: broadcastMsg });
      addLog(`Broadcast to ${r.data.sent} machines: "${broadcastMsg}"`);
      setBroadcastMsg('');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader title="Classroom mode" subtitle="Lock machines, broadcast messages, and manage class sessions" />

      {active && (
        <div style={activeBanner}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={pulseDot} />
            <div>
              <div style={{ fontWeight:700, color:'#5b21b6' }}>Class in session: {sessionName}</div>
              <div style={{ fontSize:12, color:'#7c3aed' }}>{labMachines.length} machines locked</div>
            </div>
          </div>
          <Button onClick={endSession} disabled={loading} style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', border:'none', color:'#fff' }}>
            {loading ? 'Ending...' : 'End session'}
          </Button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Panel title="Session setup">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={labelStyle}>Select lab</label>
                <select value={selectedLab} onChange={e=>setSelectedLab(e.target.value)} style={selectStyle} disabled={active}>
                  <option value="">Choose a lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Session name</label>
                <input type="text" value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder="e.g. Python Lab — Batch A" style={inputStyle} disabled={active}/>
              </div>
              {!active ? (
                <Button onClick={startSession} disabled={loading||!selectedLab||!sessionName} style={{ width:'100%', opacity:(!selectedLab||!sessionName)?0.4:1 }}>
                  {loading ? 'Starting...' : 'Start classroom session'}
                </Button>
              ) : (
                <Button variant="danger" onClick={endSession} disabled={loading} style={{ width:'100%', background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', color:'#fff' }}>
                  {loading ? 'Ending...' : 'End session and unlock all'}
                </Button>
              )}
            </div>
          </Panel>

          <Panel title="Broadcast message">
            <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} placeholder="Type a message to send to all machines in the lab" rows={3} style={{ ...inputStyle, resize:'vertical', marginBottom:10 }}/>
            <Button onClick={broadcast} disabled={!broadcastMsg.trim()||!selectedLab} style={{ width:'100%', opacity:(!broadcastMsg.trim()||!selectedLab)?0.4:1 }}>
              Broadcast to all machines
            </Button>
          </Panel>

          <Panel title="Activity log">
            <div style={{ maxHeight:180, overflowY:'auto' }}>
              {log.length === 0 ? (
                <div style={{ fontSize:12, color:'#a8a8b8', textAlign:'center', padding:'20px 0' }}>No activity yet</div>
              ) : log.map((entry, i) => (
                <div key={i} style={{ fontSize:11, color:'#7c7c8a', padding:'5px 0', borderBottom:'1px solid #f5f5f7' }}>{entry}</div>
              ))}
            </div>
          </Panel>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#16161f' }}>
              {selectedLab ? `Machines in ${labs.find(l=>l.id===parseInt(selectedLab))?.name||'lab'}` : 'Select a lab to see machines'}
            </h3>
            {selectedLab && <span style={{ fontSize:12, color:'#7c7c8a' }}>{labMachines.filter(m=>m.status==='online'||m.status==='classroom').length} active</span>}
          </div>

          {!selectedLab ? (
            <Panel>
              <div style={{ padding:'40px 0', textAlign:'center', color:'#a8a8b8', fontSize:13 }}>Select a lab from the panel to see its machines</div>
            </Panel>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
              {labMachines.map(m => {
                const st = STATUS_COLOR[m.status] || STATUS_COLOR.offline;
                const locked = m.status === 'classroom' || m.status === 'locked';
                return (
                  <div key={m.id} style={{ background:'#fff', border:`1.5px solid ${locked?'#e9d5ff':m.status==='online'?'#bce8cc':'#e9e9f0'}`, borderRadius:12, padding:'14px 12px', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:st.dot, flexShrink:0 }} />
                      <span style={{ fontSize:12.5, fontWeight:700, color:'#16161f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.hostname}</span>
                    </div>
                    <div style={{ fontSize:10.5, color:'#a8a8b8', marginBottom:7 }}>{m.ip_address}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:st.dot }}>{locked ? 'Locked' : st.label}</div>
                    {m.cpu_percent != null && m.status === 'online' && (
                      <div style={{ marginTop:7 }}>
                        <div style={{ height:3, background:'#f0f0f6', borderRadius:2 }}>
                          <div style={{ height:3, borderRadius:2, background:'#4f46e5', width:`${Math.min(m.cpu_percent,100)}%` }} />
                        </div>
                        <div style={{ fontSize:9.5, color:'#a8a8b8', marginTop:2 }}>CPU {Math.round(m.cpu_percent)}%</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

const activeBanner = { background:'#f6f1fe', border:'1px solid #dccdfb', borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 };
const pulseDot     = { display:'inline-block', width:9, height:9, borderRadius:'50%', background:'#7c3aed', animation:'pulse 1.2s infinite' };
const inputStyle   = { padding:'8px 12px', border:'1px solid #e9e9f0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
const selectStyle  = { padding:'8px 12px', border:'1px solid #e9e9f0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', background:'#fff', outline:'none' };
const labelStyle   = { fontSize:11, fontWeight:500, color:'#888', display:'block', marginBottom:4 };