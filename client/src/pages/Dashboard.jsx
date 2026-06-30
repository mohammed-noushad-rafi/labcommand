import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { working: '#22c55e', faulty: '#ef4444', maintenance: '#f59e0b' };

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [labs, setLabs]       = useState([]);
  const [selectedLab, setSelectedLab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/labs').then(r => setLabs(r.data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedLab === 'all' ? '/dashboard/summary' : `/dashboard/summary?lab_id=${selectedLab}`;
    api.get(url)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedLab]);

  if (loading) return <div style={s.loading}>Loading dashboard...</div>;

  const stats = data?.stats || {};
  const cards = [
    { label:'PCs Online',       value: stats.machines_online, icon:'🖥️', grad:['#3b82f6','#60a5fa'] },
    { label:'Active Alerts',    value: stats.active_alerts,   icon:'🚨', grad:['#ef4444','#f87171'] },
    { label:'Open Complaints',  value: stats.open_complaints, icon:'🎫', grad:['#f59e0b','#fbbf24'] },
    { label:'Low Stock Items',  value: stats.low_stock,       icon:'📦', grad:['#8b5cf6','#a78bfa'] },
    { label:'Exams Today',      value: stats.exams_today,     icon:'📝', grad:['#06b6d4','#22d3ee'] },
    { label:'AI Critical Risk', value: stats.critical_ai,     icon:'🤖', grad:['#ec4899','#f472b6'] },
  ];

  const selectedLabName = selectedLab === 'all' ? 'All Labs' : labs.find(l=>l.id===parseInt(selectedLab))?.name;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>Welcome back — here's what's happening in {selectedLab==='all' ? 'your labs' : selectedLabName}</p>
        </div>
        <div style={s.headerRight}>
          <div style={s.labSelector}>
            <span style={s.labIcon}>🏫</span>
            <select value={selectedLab} onChange={e=>setSelectedLab(e.target.value)} style={s.labSelect}>
              <option value="all">All Labs</option>
              {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <span style={s.chevron}>▾</span>
          </div>
          <div style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={s.grid6}>
        {cards.map(c => (
          <div key={c.label} style={s.card}>
            <div style={{...s.cardGlow, background:`linear-gradient(135deg,${c.grad[0]},${c.grad[1]})`}}></div>
            <div style={s.cardIcon}>{c.icon}</div>
            <div style={{...s.statNum, color: c.grad[0]}}>{c.value ?? 0}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={s.grid2}>
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Equipment status {selectedLab!=='all' && <span style={s.labBadge}>{selectedLabName}</span>}</h3>
          {data?.equipment_status?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.equipment_status.map(e=>({...e,value:parseInt(e.value)}))} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({status,value})=>`${status}: ${value}`}>
                  {data.equipment_status.map((e, i) => <Cell key={i} fill={COLORS[e.status] || '#94a3b8'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={s.empty}>No equipment data for this lab</div>}
        </div>

        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Weekly lab bookings {selectedLab!=='all' && <span style={s.labBadge}>{selectedLabName}</span>}</h3>
          {data?.weekly_slots?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekly_slots}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#667eea" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={s.empty}>No bookings this week yet</div>}
        </div>
      </div>

      {/* Maintenance Due */}
      <div style={s.chartCard}>
        <h3 style={s.chartTitle}>Maintenance due (next 14 days) {selectedLab!=='all' && <span style={s.labBadge}>{selectedLabName}</span>}</h3>
        {data?.maintenance_due?.length ? (
          <table style={s.table}>
            <thead>
              <tr>{['Equipment','Lab','Technician','Scheduled Date','Cost','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.maintenance_due.map(m => (
                <tr key={m.id} style={s.tr}>
                  <td style={s.td}>{m.equipment_name}</td>
                  <td style={s.td}>{m.lab_name}</td>
                  <td style={s.td}>{m.technician}</td>
                  <td style={s.td}>{new Date(m.scheduled_date).toLocaleDateString('en-IN')}</td>
                  <td style={s.td}>₹{Number(m.cost).toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: m.status === 'in_progress' ? '#fef3c7' : '#e0f2fe', color: m.status === 'in_progress' ? '#92400e' : '#0369a1' }}>
                      {m.status.replace('_',' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={s.empty}>No maintenance due in the next 14 days</div>}
      </div>
    </div>
  );
}

const s = {
  page:        { padding:28, maxWidth:1240 },
  loading:     { padding:40, textAlign:'center', color:'#888' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:16 },
  title:       { fontSize:26, fontWeight:700, color:'#1a1a2e', margin:0 },
  sub:         { fontSize:13, color:'#888', marginTop:4 },
  headerRight: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 },
  labSelector: { display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1.5px solid #e8ecf0', borderRadius:10, padding:'7px 12px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', position:'relative' },
  labIcon:     { fontSize:14 },
  labSelect:   { border:'none', outline:'none', background:'transparent', fontSize:13, fontWeight:500, color:'#1a1a2e', cursor:'pointer', appearance:'none', paddingRight:14 },
  chevron:     { fontSize:10, color:'#888', marginLeft:-10, pointerEvents:'none' },
  date:        { fontSize:12, color:'#aaa' },
  grid6:       { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))', gap:14, marginBottom:20 },
  card:        { position:'relative', background:'#fff', borderRadius:14, padding:'22px 16px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden', border:'1px solid #f0f0f5' },
  cardGlow:    { position:'absolute', top:-30, right:-30, width:80, height:80, borderRadius:'50%', opacity:0.12, filter:'blur(8px)' },
  cardIcon:    { fontSize:26, marginBottom:6, position:'relative' },
  statNum:     { fontSize:30, fontWeight:800, margin:'4px 0', position:'relative' },
  statLabel:   { fontSize:11.5, color:'#888', fontWeight:500, position:'relative' },
  grid2:       { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:16, marginBottom:20 },
  chartCard:   { background:'#fff', borderRadius:14, padding:'22px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #f0f0f5' },
  chartTitle:  { fontSize:15, fontWeight:600, color:'#1a1a2e', marginBottom:16, display:'flex', alignItems:'center', gap:8 },
  labBadge:    { fontSize:10, fontWeight:600, background:'#eef0ff', color:'#5b5cf0', padding:'2px 9px', borderRadius:20 },
  empty:       { color:'#bbb', fontSize:13, padding:'36px 0', textAlign:'center' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:          { textAlign:'left', padding:'10px 12px', color:'#999', fontWeight:600, borderBottom:'1.5px solid #f0f0f5', fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em' },
  td:          { padding:'12px 12px', color:'#333', borderBottom:'1px solid #f7f7fa' },
  tr:          { transition:'background .15s' },
  badge:       { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 },
};