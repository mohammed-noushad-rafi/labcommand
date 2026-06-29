import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

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
      addLog(`Message broadcast to ${r.data.sent} machines: "${broadcastMsg}"`);
      setBroadcastMsg('');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const STATUS_COLORS = {
    online:    '#22c55e',
    offline:   '#94a3b8',
    classroom: '#8b5cf6',
    locked:    '#f59e0b',
    exam:      '#ef4444',
  };

  return (
    <div style={{padding:28}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Classroom Mode</h1>
        <p style={{fontSize:13,color:'#888',marginTop:4}}>Lock machines, broadcast messages, and manage class sessions</p>
      </div>

      {/* Active session banner */}
      {active && (
        <div style={{background:'#ede9fe',border:'1.5px solid #c4b5fd',borderRadius:10,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:'#8b5cf6',animation:'pulse 1s infinite'}}></div>
            <div>
              <div style={{fontWeight:600,color:'#5b21b6'}}>Class in session: {sessionName}</div>
              <div style={{fontSize:12,color:'#7c3aed'}}>{labMachines.length} machines locked</div>
            </div>
          </div>
          <button onClick={endSession} disabled={loading} style={{padding:'8px 18px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500}}>
            ⏹ End session
          </button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:20}}>
        {/* Control panel */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Session setup */}
          <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Session setup</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div>
                <label style={lbl}>Select lab</label>
                <select value={selectedLab} onChange={e=>setSelectedLab(e.target.value)} style={sel} disabled={active}>
                  <option value="">Choose a lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Session name</label>
                <input type="text" value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder="e.g. Python Lab — Batch A" style={inp} disabled={active}/>
              </div>
              {!active ? (
                <button onClick={startSession} disabled={loading||!selectedLab||!sessionName} style={{...btn('#8b5cf6'),opacity:(!selectedLab||!sessionName)?0.4:1}}>
                  {loading ? 'Starting...' : '🔒 Start classroom session'}
                </button>
              ) : (
                <button onClick={endSession} disabled={loading} style={btn('#ef4444')}>
                  {loading ? 'Ending...' : '🔓 End session and unlock all'}
                </button>
              )}
            </div>
          </div>

          {/* Broadcast */}
          <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Broadcast message</h3>
            <textarea
              value={broadcastMsg}
              onChange={e=>setBroadcastMsg(e.target.value)}
              placeholder="Type a message to send to all machines in the lab..."
              rows={3}
              style={{...inp,resize:'vertical',marginBottom:10}}
            />
            <button onClick={broadcast} disabled={!broadcastMsg.trim()||!selectedLab} style={{...btn('#3b82f6'),opacity:(!broadcastMsg.trim()||!selectedLab)?0.4:1,width:'100%'}}>
              📢 Broadcast to all machines
            </button>
          </div>

          {/* Activity log */}
          <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:10}}>Activity log</h3>
            <div style={{maxHeight:200,overflowY:'auto'}}>
              {log.length === 0 ? (
                <div style={{fontSize:12,color:'#aaa',textAlign:'center',padding:'20px 0'}}>No activity yet</div>
              ) : log.map((entry,i) => (
                <div key={i} style={{fontSize:11,color:'#555',padding:'4px 0',borderBottom:'1px solid #f5f5f5'}}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Machine grid */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e'}}>
              {selectedLab ? `Machines in ${labs.find(l=>l.id===parseInt(selectedLab))?.name||'lab'}` : 'Select a lab to see machines'}
            </h3>
            {selectedLab && (
              <div style={{fontSize:12,color:'#888'}}>
                {labMachines.filter(m=>m.status==='online'||m.status==='classroom').length} active
              </div>
            )}
          </div>

          {!selectedLab ? (
            <div style={{background:'#fff',borderRadius:12,padding:60,textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:32,marginBottom:10}}>📋</div>
              <div style={{color:'#aaa',fontSize:13}}>Select a lab from the panel to see its machines</div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
              {labMachines.map(m => {
                const color  = STATUS_COLORS[m.status] || '#94a3b8';
                const locked = m.status === 'classroom' || m.status === 'locked';
                return (
                  <div key={m.id} style={{background:'#fff',border:`1.5px solid ${color}33`,borderRadius:10,padding:'14px 12px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}></div>
                      <span style={{fontSize:12,fontWeight:600,color:'#1a1a2e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.hostname}</span>
                    </div>
                    <div style={{fontSize:10,color:'#888',marginBottom:6}}>{m.ip_address}</div>
                    <div style={{fontSize:11,fontWeight:500,color}}>
                      {locked ? '🔒 Locked' : m.status === 'online' ? '✅ Online' : '⚫ Offline'}
                    </div>
                    {m.cpu_percent != null && m.status === 'online' && (
                      <div style={{marginTop:6}}>
                        <div style={{height:3,background:'#f0f0f0',borderRadius:2}}>
                          <div style={{height:3,borderRadius:2,background:'#667eea',width:`${Math.min(m.cpu_percent,100)}%`}}></div>
                        </div>
                        <div style={{fontSize:9,color:'#aaa',marginTop:2}}>CPU {Math.round(m.cpu_percent)}%</div>
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

const btn = c => ({padding:'10px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500,width:'100%'});
const inp = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box'};
const sel = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box',background:'#fff'};
const lbl = {fontSize:11,fontWeight:500,color:'#555',display:'block',marginBottom:4};