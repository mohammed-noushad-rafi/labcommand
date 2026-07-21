import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

const STATUS_TONE = {
  online:    { color:'#0f9d58', bg:'#eefbf3' },
  offline:   { color:'#7c7c8a', bg:'#f1f1f6' },
  locked:    { color:'#d97706', bg:'#fef3e2' },
  exam:      { color:'#dc2626', bg:'#fde9e9' },
  classroom: { color:'#7c3aed', bg:'#f1ebfe' },
};

export default function MachineDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [machine,   setMachine]   = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState('');
  const [sending,   setSending]   = useState(false);
  const [screenshot, setScreenshot] = useState(null); // { image, ts }
  const [zoomed, setZoomed] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/machines/${id}`).then(r => {
      setMachine(r.data.data);
      setTelemetry((r.data.telemetry || []).slice(0,60).reverse());
      setProcesses(r.data.processes || []);
    }).finally(() => setLoading(false));

    socketRef.current = io(API_URL);

    socketRef.current.on('machine:telemetry', (data) => {
      if (data.machineId === parseInt(id)) {
        setMachine(prev => prev ? { ...prev, cpu_percent: data.cpu, ram_percent: data.ram, disk_percent: data.disk } : prev);
        setTelemetry(prev => [...prev.slice(-59), { cpu_percent: data.cpu, ram_percent: data.ram, recorded_at: new Date().toISOString() }]);
      }
    });

    socketRef.current.on('machine:status', (data) => {
      if (data.machineId === parseInt(id)) {
        setMachine(prev => prev ? { ...prev, status: data.status } : prev);
      }
    });

    socketRef.current.on('exam:screenshot', (data) => {
      if (data.machineId === parseInt(id)) {
        setScreenshot({ image: data.image, ts: data.ts });
      }
    });

    // Tell this machine's agent to switch into fast live-mirror mode while
    // this page is open, renewing every 60s so it doesn't hit the agent's
    // own safety auto-stop, and explicitly stop it when leaving the page.
    const machineIdNum = parseInt(id);
    socketRef.current.emit('client:watch', { machineId: machineIdNum });
    const watchHeartbeat = setInterval(() => {
      socketRef.current.emit('client:watch', { machineId: machineIdNum });
    }, 60000);

    return () => {
      clearInterval(watchHeartbeat);
      socketRef.current?.emit('client:unwatch', { machineId: machineIdNum });
      socketRef.current?.disconnect();
    };
  }, [id]);

  const sendCommand = async (type, payload = {}) => {
    setSending(true);
    try {
      await api.post(`/commands/${id}`, { type, ...payload });
      alert(`Command "${type}" sent successfully`);
    } catch {
      alert('Failed to send command — machine may be offline');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = () => {
    if (!msg.trim()) return;
    sendCommand('message', { content: msg });
    setMsg('');
  };

  if (loading) return <div style={s.loading}>Loading</div>;
  if (!machine) return <div style={s.loading}>Machine not found</div>;

  const isOnline = machine.status === 'online';
  const tone = STATUS_TONE[machine.status] || STATUS_TONE.offline;

  const Gauge = ({ label, value, color }) => (
    <div style={s.gauge}>
      <div style={s.gaugeLabel}>{label}</div>
      <div style={s.gaugeTrack}>
        <div style={{ ...s.gaugeFill, background:color, width:`${Math.min(value||0,100)}%` }} />
      </div>
      <div style={{ ...s.gaugeValue, color }}>{value != null ? `${Math.round(value)}%` : '—'}</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.accentBar} />
      <div style={s.headerRow}>
        <button onClick={() => navigate('/lab-map')} style={s.backBtn}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style={s.title}>{machine.hostname}</h1>
            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:tone.bg, color:tone.color }}>
              {machine.status}
            </span>
          </div>
          <div style={s.sub}>{machine.ip_address} · {machine.lab_name} · {machine.os_info}</div>
        </div>
      </div>

      <div style={s.panel}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h3 style={{ ...s.panelTitle, marginBottom:0 }}>Live screen</h3>
          {isOnline && screenshot && (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#dc2626', fontWeight:700 }}>
              <span className="lc-live-dot" style={{ width:6, height:6, borderRadius:'50%', background:'#dc2626', display:'inline-block' }} />
              LIVE
            </div>
          )}
        </div>
        {!isOnline ? (
          <div style={s.emptyState}>Machine is offline — no live feed available</div>
        ) : screenshot ? (
          <img
            src={`data:image/jpeg;base64,${screenshot.image}`}
            onClick={()=>setZoomed(true)}
            style={{ width:'100%', maxWidth:640, borderRadius:10, cursor:'zoom-in', display:'block', border:'1px solid #e9e9f0' }}
            alt="Live screen"
          />
        ) : (
          <div style={s.emptyState}>Waiting for live feed from agent…</div>
        )}
      </div>

      <div style={s.panel}>
        <h3 style={s.panelTitle}>Live metrics</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Gauge label="CPU"  value={machine.cpu_percent}  color={machine.cpu_percent>80?'#dc2626':machine.cpu_percent>60?'#d97706':'#0f9d58'}/>
          <Gauge label="RAM"  value={machine.ram_percent}  color={machine.ram_percent>80?'#dc2626':machine.ram_percent>60?'#d97706':'#4f46e5'}/>
          <Gauge label="Disk" value={machine.disk_percent} color={machine.disk_percent>90?'#dc2626':machine.disk_percent>70?'#d97706':'#7c3aed'}/>
        </div>
      </div>

      {telemetry.length > 0 && (
        <div style={s.panel}>
          <h3 style={s.panelTitle}>CPU history — last hour</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={telemetry}>
              <XAxis dataKey="recorded_at" hide />
              <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} width={40} tick={{fontSize:11, fill:'#a8a8b8'}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>`${Math.round(v)}%`} labelFormatter={()=>'CPU'}/>
              <Line type="monotone" dataKey="cpu_percent" stroke="#4f46e5" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={s.grid2}>
        <div style={s.panel}>
          <h3 style={s.panelTitle}>Remote actions</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'Lock screen', type:'lock',     color:'#d97706', bg:'#fef3e2' },
              { label:'Restart',     type:'restart',  color:'#2563eb', bg:'#e8f0fe' },
              { label:'Shutdown',    type:'shutdown', color:'#dc2626', bg:'#fde9e9' },
            ].map(a => (
              <button key={a.type} disabled={!isOnline || sending}
                onClick={() => { if(window.confirm(`Send ${a.type} to ${machine.hostname}?`)) sendCommand(a.type); }}
                style={{
                  padding:'10px 14px', border:'none', borderRadius:9, background:a.bg, color:a.color,
                  cursor: isOnline ? 'pointer' : 'not-allowed', fontSize:13, fontWeight:600,
                  opacity: isOnline ? 1 : 0.45, textAlign:'left',
                }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.panel}>
          <h3 style={s.panelTitle}>Send message</h3>
          <textarea
            value={msg}
            onChange={e=>setMsg(e.target.value)}
            placeholder="Type a message to display on this machine"
            style={s.textarea}
          />
          <button onClick={sendMessage} disabled={!isOnline||!msg.trim()||sending} style={{
            marginTop:10, width:'100%', padding:'10px', fontSize:13, fontWeight:600,
            background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', borderRadius:9,
            cursor: (isOnline&&msg.trim()) ? 'pointer' : 'default',
            opacity: (isOnline&&msg.trim()) ? 1 : 0.4,
            boxShadow: (isOnline&&msg.trim()) ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
          }}>
            Send message
          </button>
        </div>
      </div>

      <div style={s.panel}>
        <h3 style={s.panelTitle}>
          Running processes {processes.length > 0 && <span style={{ color:'#a8a8b8', fontWeight:400 }}>({processes.length})</span>}
        </h3>
        {processes.length ? (
          <table style={s.table}>
            <thead>
              <tr>{['Process','PID','CPU %','Memory (MB)'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {processes.map((p,i)=>(
                <tr key={i}>
                  <td style={s.td}>{p.process_name}</td>
                  <td style={{ ...s.td, color:'#9494a3' }}>{p.pid}</td>
                  <td style={{ ...s.td, color: p.cpu_percent>50?'#dc2626':'#16161f', fontWeight: p.cpu_percent>50?700:400 }}>{p.cpu_percent?.toFixed(1)}%</td>
                  <td style={s.td}>{p.mem_mb?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={s.emptyState}>
            {isOnline ? 'No process data yet' : 'Machine is offline — no process data available'}
          </div>
        )}
      </div>
      {zoomed && screenshot && (
        <div onClick={()=>setZoomed(false)} style={{ position:'fixed', inset:0, background:'rgba(16,16,31,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:40 }}>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'90vh' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{machine.hostname}</div>
              <button onClick={()=>setZoomed(false)} style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Close ✕</button>
            </div>
            <img src={`data:image/jpeg;base64,${screenshot.image}`} style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', display:'block' }} alt="Live screen enlarged"/>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:        { padding:'32px 36px', maxWidth:1100, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  loading:     { padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 },
  accentBar:   { height:3, width:64, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:16 },
  headerRow:   { display:'flex', alignItems:'center', gap:12, marginBottom:24, borderBottom:'1px solid #e9e9f0', paddingBottom:20 },
  backBtn:     { background:'#fff', border:'1px solid #e9e9f0', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontSize:13, color:'#5a5a6c', fontWeight:500 },
  title:       { fontSize:21, fontWeight:700, color:'#16161f', margin:0 },
  sub:         { fontSize:12, color:'#a8a8b8', marginTop:3 },
  panel:       { background:'#fff', border:'1px solid #e9e9f0', borderRadius:14, padding:'20px 22px', marginBottom:16, boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  panelTitle:  { fontSize:13.5, fontWeight:700, color:'#16161f', marginBottom:14 },
  gauge:       { flex:1, background:'#fafafd', borderRadius:12, padding:'16px 12px', textAlign:'center', minWidth:100 },
  gaugeLabel:  { fontSize:11, color:'#7c7c8a', marginBottom:8, fontWeight:600 },
  gaugeTrack:  { position:'relative', height:7, background:'#ececf2', borderRadius:4, marginBottom:8 },
  gaugeFill:   { position:'absolute', top:0, left:0, height:7, borderRadius:4, transition:'width .5s' },
  gaugeValue:  { fontSize:21, fontWeight:800 },
  grid2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  textarea:    { width:'100%', height:80, padding:11, border:'1px solid #e9e9f0', borderRadius:9, fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:          { textAlign:'left', padding:'10px 10px', color:'#a8a8b8', fontWeight:700, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'2px solid #f0f0f6', background:'#fafafd' },
  td:          { padding:'11px 10px', color:'#16161f', borderBottom:'1px solid #f0f0f6' },
  emptyState:  { color:'#a8a8b8', fontSize:13, padding:'24px 0', textAlign:'center' },
};
