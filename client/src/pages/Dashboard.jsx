import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../components/EmptyState';
import { useLab } from '../context/LabContext';

const PIE_COLORS = { working:'#0f9d58', faulty:'#dc2626', maintenance:'#d97706' };
const PALETTE = [
  { dot:'#4f46e5', bg:'#f5f4fe' },
  { dot:'#0f9d58', bg:'#eefbf3' },
  { dot:'#d97706', bg:'#fef8ee' },
  { dot:'#dc2626', bg:'#fef2f2' },
  { dot:'#2563eb', bg:'#eff5fe' },
  { dot:'#7c3aed', bg:'#f6f1fe' },
];

export default function Dashboard() {
  const { selectedLab, selectedLabName } = useLab();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = selectedLab === 'all' ? '/dashboard/summary' : `/dashboard/summary?lab_id=${selectedLab}`;
    api.get(url).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [selectedLab]);

  if (loading) return <div style={s.loading}>Loading</div>;

  const stats = data?.stats || {};
  const cards = [
    { label:'PCs online',       value: stats.machines_online },
    { label:'Active alerts',    value: stats.active_alerts },
    { label:'Open complaints',  value: stats.open_complaints },
    { label:'Low stock items',  value: stats.low_stock },
    { label:'Exams today',      value: stats.exams_today },
    { label:'AI critical risk', value: stats.critical_ai },
  ];

  return (
    <div style={s.page}>
      <div style={s.accentBar} />
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>{selectedLab === 'all' ? 'Overview across all labs' : selectedLabName}</p>
        </div>
        <span style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</span>
      </div>

      <div style={s.grid6}>
        {cards.map((c, i) => {
          const p = PALETTE[i % PALETTE.length];
          return (
            <div key={c.label} style={{ ...s.card, background:p.bg, border:'1px solid transparent' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:p.dot, marginBottom:10 }} />
              <div style={{ ...s.statNum, color:p.dot }}>{c.value ?? 0}</div>
              <div style={s.statLabel}>{c.label}</div>
            </div>
          );
        })}
      </div>

      <div style={s.grid2}>
        <div style={s.panel}>
          <h3 style={s.panelTitle}>Equipment status</h3>
          {data?.equipment_status?.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={data.equipment_status.map(e=>({...e,value:parseInt(e.value)}))} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                  {data.equipment_status.map((e,i) => <Cell key={i} fill={PIE_COLORS[e.status] || '#c4c4cc'} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No equipment data" subtitle="Equipment for this lab hasn't been added yet."/>}
          {data?.equipment_status?.length > 0 && (
            <div style={s.legendRow}>
              {data.equipment_status.map(e => (
                <div key={e.status} style={s.legendItem}>
                  <span style={{...s.legendDot, background:PIE_COLORS[e.status]||'#c4c4cc'}}/>
                  <span style={s.legendLabel}>{e.status}</span>
                  <span style={s.legendValue}>{e.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.panel}>
          <h3 style={s.panelTitle}>Weekly bookings</h3>
          {data?.weekly_slots?.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.weekly_slots}>
                <XAxis dataKey="day" tick={{fontSize:11, fill:'#a8a8b8'}} axisLine={{stroke:'#e9e9f0'}} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{fontSize:11, fill:'#a8a8b8'}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill:'#f7f7fb'}}/>
                <Bar dataKey="bookings" fill="#4f46e5" radius={[4,4,0,0]} maxBarSize={28}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No bookings this week" subtitle="Bookings will appear here once labs are reserved."/>}
        </div>
      </div>

      <div style={s.panel}>
        <h3 style={s.panelTitle}>Maintenance due — next 14 days</h3>
        {data?.maintenance_due?.length ? (
          <table style={s.table}>
            <thead>
              <tr>{['Equipment','Lab','Technician','Date','Cost','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.maintenance_due.map(m => (
                <tr key={m.id}>
                  <td style={s.td}>{m.equipment_name}</td>
                  <td style={{...s.td, color:'#9494a3'}}>{m.lab_name}</td>
                  <td style={{...s.td, color:'#9494a3'}}>{m.technician}</td>
                  <td style={{...s.td, color:'#9494a3'}}>{new Date(m.scheduled_date).toLocaleDateString('en-IN')}</td>
                  <td style={s.td}>₹{Number(m.cost).toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{
                      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                      background: m.status==='in_progress' ? '#fef3e2' : '#e8f0fe',
                      color: m.status==='in_progress' ? '#d97706' : '#2563eb',
                    }}>{m.status.replace('_',' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState title="No maintenance due" subtitle="Nothing scheduled in the next two weeks."/>}
      </div>
    </div>
  );
}

const s = {
  page:       { padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  loading:    { padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 },
  accentBar:  { height:3, width:64, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:16 },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:14, borderBottom:'1px solid #e9e9f0', paddingBottom:20 },
  title:      { fontSize:23, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' },
  sub:        { fontSize:13, color:'#7c7c8a', marginTop:3 },
  date:       { fontSize:11.5, color:'#b4b4c0' },
  grid6:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 },
  card:       { borderRadius:14, padding:'18px 18px', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  statNum:    { fontSize:28, fontWeight:800, letterSpacing:'-0.02em' },
  statLabel:  { fontSize:12, color:'#7c7c8a', marginTop:4, fontWeight:500 },
  grid2:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:20, marginBottom:20 },
  panel:      { background:'#fff', border:'1px solid #e9e9f0', borderRadius:14, padding:'22px 24px', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  panelTitle: { fontSize:14, fontWeight:700, color:'#16161f', marginBottom:18 },
  legendRow:  { display:'flex', gap:18, marginTop:14, paddingTop:14, borderTop:'1px solid #f0f0f6', flexWrap:'wrap' },
  legendItem: { display:'flex', alignItems:'center', gap:6, fontSize:12 },
  legendDot:  { width:8, height:8, borderRadius:'50%' },
  legendLabel:{ color:'#7c7c8a', textTransform:'capitalize', fontWeight:500 },
  legendValue:{ color:'#16161f', fontWeight:700 },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:         { textAlign:'left', padding:'11px 12px', color:'#a8a8b8', fontWeight:700, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:'2px solid #f0f0f6', background:'#fafafd' },
  td:         { padding:'14px 12px', color:'#16161f', borderBottom:'1px solid #f0f0f6' },
};