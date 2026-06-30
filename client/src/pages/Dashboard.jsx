import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../components/EmptyState';
import { useLab } from '../context/LabContext';

const PIE_COLORS = { working:'#1a1a2e', faulty:'#b91c1c', maintenance:'#a16207' };

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
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>{selectedLab === 'all' ? 'Overview across all labs' : selectedLabName}</p>
        </div>
        <span style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</span>
      </div>

      <div style={s.grid6}>
        {cards.map(c => (
          <div key={c.label} style={s.card}>
            <div style={s.statNum}>{c.value ?? 0}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={s.grid2}>
        <div style={s.panel}>
          <h3 style={s.panelTitle}>Equipment status</h3>
          {data?.equipment_status?.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={data.equipment_status.map(e=>({...e,value:parseInt(e.value)}))} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
                  {data.equipment_status.map((e,i) => <Cell key={i} fill={PIE_COLORS[e.status] || '#ccc'} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No equipment data" subtitle="Equipment for this lab hasn't been added yet."/>}
          {data?.equipment_status?.length > 0 && (
            <div style={s.legendRow}>
              {data.equipment_status.map(e => (
                <div key={e.status} style={s.legendItem}>
                  <span style={{...s.legendDot, background:PIE_COLORS[e.status]||'#ccc'}}/>
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
                <XAxis dataKey="day" tick={{fontSize:11, fill:'#999'}} axisLine={{stroke:'#ececf0'}} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{fontSize:11, fill:'#999'}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill:'#f7f7f9'}}/>
                <Bar dataKey="bookings" fill="#1a1a2e" radius={[3,3,0,0]} maxBarSize={28}/>
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
                  <td style={{...s.td, color:'#999'}}>{m.lab_name}</td>
                  <td style={{...s.td, color:'#999'}}>{m.technician}</td>
                  <td style={{...s.td, color:'#999'}}>{new Date(m.scheduled_date).toLocaleDateString('en-IN')}</td>
                  <td style={s.td}>₹{Number(m.cost).toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{
                      padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500,
                      background: m.status==='in_progress' ? '#fdf6e3' : '#f3f4f6',
                      color: m.status==='in_progress' ? '#a16207' : '#374151',
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
  loading:    { padding:60, textAlign:'center', color:'#bbb', fontSize:13 },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:14, borderBottom:'1px solid #ececf0', paddingBottom:20 },
  title:      { fontSize:22, fontWeight:600, color:'#1a1a2e', margin:0, letterSpacing:'-0.01em' },
  sub:        { fontSize:13, color:'#999', marginTop:3 },
  date:       { fontSize:11.5, color:'#bbb' },
  grid6:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:1, marginBottom:28, background:'#ececf0', border:'1px solid #ececf0', borderRadius:12, overflow:'hidden' },
  card:       { background:'#fff', padding:'22px 18px' },
  statNum:    { fontSize:28, fontWeight:600, color:'#1a1a2e', letterSpacing:'-0.02em' },
  statLabel:  { fontSize:12, color:'#999', marginTop:4 },
  grid2:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:20, marginBottom:20 },
  panel:      { background:'#fff', border:'1px solid #ececf0', borderRadius:12, padding:'22px 24px' },
  panelTitle: { fontSize:13.5, fontWeight:600, color:'#1a1a2e', marginBottom:18 },
  legendRow:  { display:'flex', gap:18, marginTop:14, paddingTop:14, borderTop:'1px solid #f5f5f7', flexWrap:'wrap' },
  legendItem: { display:'flex', alignItems:'center', gap:6, fontSize:12 },
  legendDot:  { width:7, height:7, borderRadius:'50%' },
  legendLabel:{ color:'#999', textTransform:'capitalize' },
  legendValue:{ color:'#1a1a2e', fontWeight:600 },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:         { textAlign:'left', padding:'9px 10px', color:'#bbb', fontWeight:500, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #ececf0' },
  td:         { padding:'12px 10px', color:'#1a1a2e', borderBottom:'1px solid #f5f5f7' },
};