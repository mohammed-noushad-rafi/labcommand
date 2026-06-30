import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { useLab } from '../context/LabContext';

const STATUS_COLOR = {
  online:    { bg:'#eefbf3', border:'#bce8cc', dot:'#0f9d58', label:'Online' },
  offline:   { bg:'#fafafd', border:'#e9e9f0', dot:'#a8a8b8', label:'Offline' },
  locked:    { bg:'#fef8ee', border:'#f6dba8', dot:'#d97706', label:'Locked' },
  exam:      { bg:'#fef2f2', border:'#f5bcbc', dot:'#dc2626', label:'Exam' },
  classroom: { bg:'#f6f1fe', border:'#dccdfb', dot:'#7c3aed', label:'Classroom' },
};

const STAT_PALETTE = [
  { dot:'#4f46e5', bg:'#f5f4fe' },
  { dot:'#0f9d58', bg:'#eefbf3' },
  { dot:'#a8a8b8', bg:'#fafafd' },
  { dot:'#d97706', bg:'#fef8ee' },
];

export default function LabMap() {
  const navigate = useNavigate();
  const { selectedLab } = useLab();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading]   = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:3001', { auth: { token } });

    socketRef.current.on('machine:status', ({ machineId, status }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status } : m));
    });

    socketRef.current.on('machine:telemetry', ({ machineId, cpu, ram, disk }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, cpu_percent: cpu, ram_percent: ram, disk_percent: disk } : m));
    });

    api.get('/machines').then(r => setMachines(r.data.data || [])).finally(() => setLoading(false));

    return () => socketRef.current?.disconnect();
  }, []);

  const filtered = selectedLab === 'all'
    ? machines
    : machines.filter(m => m.lab_id === parseInt(selectedLab));

  const grouped = filtered.reduce((acc, m) => {
    const key = m.lab_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const counts = {
    total:   machines.length,
    online:  machines.filter(m => m.status === 'online').length,
    offline: machines.filter(m => m.status === 'offline').length,
    locked:  machines.filter(m => ['locked','exam','classroom'].includes(m.status)).length,
  };

  if (loading) return <div style={s.loading}>Loading lab map</div>;

  return (
    <div style={s.page}>
      <div style={s.accentBar} />
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Lab map</h1>
          <p style={s.sub}>Live view of all lab computers</p>
        </div>
      </div>

      <div style={s.grid4}>
        {[
          { label:'Total',   value: counts.total },
          { label:'Online',  value: counts.online },
          { label:'Offline', value: counts.offline },
          { label:'Locked',  value: counts.locked },
        ].map((c, i) => {
          const p = STAT_PALETTE[i % STAT_PALETTE.length];
          return (
            <div key={c.label} style={{ ...s.card, background:p.bg }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:p.dot, marginBottom:10 }} />
              <div style={{ ...s.statNum, color:p.dot }}>{c.value}</div>
              <div style={s.statLabel}>{c.label}</div>
            </div>
          );
        })}
      </div>

      <div style={s.legendRow}>
        {Object.entries(STATUS_COLOR).map(([k,v]) => (
          <div key={k} style={s.legendItem}>
            <span style={{ ...s.legendDot, background:v.dot }} />
            {v.label}
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([labName, labMachines]) => (
        <div key={labName} style={{ marginBottom:28 }}>
          <div style={s.labHeaderRow}>
            <h2 style={s.labHeader}>{labName}</h2>
            <span style={s.labCount}>{labMachines.length} machines</span>
            <span style={s.labOnline}>{labMachines.filter(m=>m.status==='online').length} online</span>
          </div>

          <div style={s.machineGrid}>
            {labMachines.map(m => {
              const st = STATUS_COLOR[m.status] || STATUS_COLOR.offline;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/machines/${m.id}`)}
                  style={{ ...s.machineCard, background:st.bg, border:`1.5px solid ${st.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(16,16,30,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:st.dot, flexShrink:0 }} />
                    <span style={s.hostname}>{m.hostname}</span>
                  </div>

                  <div style={s.ip}>{m.ip_address}</div>

                  {m.status === 'online' && m.cpu_percent != null ? (
                    <div>
                      <div style={s.barLabelRow}><span>CPU</span><span>{Math.round(m.cpu_percent)}%</span></div>
                      <div style={s.barTrack}>
                        <div style={{ ...s.barFill, background: m.cpu_percent>80?'#dc2626':m.cpu_percent>60?'#d97706':'#0f9d58', width:`${Math.min(m.cpu_percent,100)}%` }} />
                      </div>
                      <div style={s.barLabelRow}><span>RAM</span><span>{Math.round(m.ram_percent)}%</span></div>
                      <div style={s.barTrack}>
                        <div style={{ ...s.barFill, background: m.ram_percent>80?'#dc2626':m.ram_percent>60?'#d97706':'#4f46e5', width:`${Math.min(m.ram_percent,100)}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...s.statusLabel, color:st.dot }}>{st.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={s.emptyState}>No machines found</div>
      )}
    </div>
  );
}

const s = {
  page:        { padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  loading:     { padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 },
  accentBar:   { height:3, width:64, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:16 },
  header:      { marginBottom:20, borderBottom:'1px solid #e9e9f0', paddingBottom:20 },
  title:       { fontSize:23, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' },
  sub:         { fontSize:13, color:'#7c7c8a', marginTop:3 },
  grid4:       { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:18 },
  card:        { borderRadius:14, padding:'18px 18px', border:'1px solid transparent', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  statNum:     { fontSize:28, fontWeight:800, letterSpacing:'-0.02em' },
  statLabel:   { fontSize:12, color:'#7c7c8a', marginTop:4, fontWeight:500 },
  legendRow:   { display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', marginBottom:26 },
  legendItem:  { display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'#7c7c8a', fontWeight:500 },
  legendDot:   { width:7, height:7, borderRadius:'50%' },
  labHeaderRow:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  labHeader:   { fontSize:15, fontWeight:700, color:'#16161f' },
  labCount:    { fontSize:12, color:'#a8a8b8' },
  labOnline:   { fontSize:12, color:'#0f9d58', fontWeight:600 },
  machineGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 },
  machineCard: { borderRadius:12, padding:'14px 13px', cursor:'pointer', transition:'transform .15s, box-shadow .15s' },
  hostname:    { fontSize:12.5, fontWeight:700, color:'#16161f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  ip:          { fontSize:10.5, color:'#a8a8b8', marginBottom:9 },
  barLabelRow: { display:'flex', justifyContent:'space-between', fontSize:10, color:'#7c7c8a', marginBottom:3, fontWeight:500 },
  barTrack:    { height:4, background:'rgba(22,22,31,0.07)', borderRadius:2, marginBottom:6 },
  barFill:     { height:4, borderRadius:2 },
  statusLabel: { fontSize:11.5, fontWeight:700, textAlign:'center', marginTop:6 },
  emptyState:  { textAlign:'center', color:'#a8a8b8', padding:60, fontSize:13 },
};