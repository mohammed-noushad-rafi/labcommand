import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../components/EmptyState';

const PIE_COLORS = { working:'#0f9d58', faulty:'#dc2626', maintenance:'#d97706' };
const PALETTE = [
  { dot:'#4f46e5', bg:'#f5f4fe' },
  { dot:'#0f9d58', bg:'#eefbf3' },
  { dot:'#d97706', bg:'#fef8ee' },
  { dot:'#dc2626', bg:'#fef2f2' },
  { dot:'#2563eb', bg:'#eff5fe' },
  { dot:'#7c3aed', bg:'#f6f1fe' },
];
const DEPT_STYLE = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5', bg:'#eef2ff', desc:'Programming, networking and computing labs' },
  'Physics':          { icon:'⚛️',  color:'#0891b2', bg:'#e0f7fa', desc:'Physics experiments and research labs' },
  'Chemistry':        { icon:'🧪', color:'#0f9d58', bg:'#e8f5e9', desc:'Chemical analysis and laboratory work' },
};
function getStyle(dept) {
  return DEPT_STYLE[dept] || { icon:'🏫', color:'#4f46e5', bg:'#eef2ff', desc:'College laboratory' };
}

function DepartmentCard({ dept, onClick }) {
  const [summaries, setSummaries] = useState({});
  const style = getStyle(dept.department);
  useEffect(() => {
    dept.labs.forEach(lab => {
      api.get('/dashboard/summary?lab_id=' + lab.id)
        .then(r => setSummaries(prev => ({ ...prev, [lab.id]: r.data })))
        .catch(() => {});
    });
  }, []);
  const totalOnline     = dept.labs.reduce((s,l) => s + (summaries[l.id]?.stats?.machines_online || 0), 0);
  const totalComplaints = dept.labs.reduce((s,l) => s + (summaries[l.id]?.stats?.open_complaints || 0), 0);
  const totalEquipment  = dept.labs.reduce((s,l) => (summaries[l.id]?.equipment_status || []).reduce((a,e) => a + parseInt(e.value), 0) + s, 0);
  const workingEquip    = dept.labs.reduce((s,l) => { const w = (summaries[l.id]?.equipment_status || []).find(e => e.status === 'working'); return s + (w ? parseInt(w.value) : 0); }, 0);
  const healthPct = totalEquipment > 0 ? Math.round((workingEquip/totalEquipment)*100) : 0;
  return (
    <div onClick={onClick} style={{ background:'#fff', border:'1px solid #e9e9f0', borderRadius:18, padding:'28px', cursor:'pointer', transition:'all .18s', boxShadow:'0 1px 3px rgba(16,16,30,0.05)', position:'relative', overflow:'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px ' + style.color + '22'; e.currentTarget.style.borderColor=style.color; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 3px rgba(16,16,30,0.05)'; e.currentTarget.style.borderColor='#e9e9f0'; }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:style.bg, opacity:0.5 }}/>
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:20, position:'relative' }}>
        <div style={{ width:52, height:52, borderRadius:14, background:style.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{style.icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:700, color:'#16161f' }}>{dept.department}</div>
          <div style={{ fontSize:12, color:'#a8a8b8', marginTop:3 }}>{style.desc}</div>
        </div>
        <div style={{ background:style.bg, color:style.color, borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700 }}>{dept.lab_count} lab{dept.lab_count > 1 ? 's' : ''}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
        {[
          { label:'PCs online',  value:totalOnline,     color:'#0f9d58', bg:'#eefbf3' },
          { label:'Complaints',  value:totalComplaints, color:'#d97706', bg:'#fef8ee' },
          { label:'Equipment',   value:totalEquipment,  color:style.color, bg:style.bg },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10.5, color:'#7c7c8a', marginTop:3, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {totalEquipment > 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:11, color:'#a8a8b8', fontWeight:500 }}>Equipment health</span>
            <span style={{ fontSize:11, color:style.color, fontWeight:700 }}>{healthPct}% working</span>
          </div>
          <div style={{ height:7, borderRadius:4, background:'#f0f0f6', overflow:'hidden' }}>
            <div style={{ height:7, borderRadius:4, background:style.color, width:healthPct + '%', transition:'width .6s' }}/>
          </div>
        </div>
      )}
      <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid #f0f0f6', display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:style.color, fontWeight:600 }}>Explore {dept.department} labs</span>
        <span style={{ color:style.color }}>→</span>
      </div>
    </div>
  );
}

function LabSelector({ dept, onSelect, onBack }) {
  const style = getStyle(dept.department);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e9e9f0' }}>
        <button onClick={onBack} style={backBtn}>← Departments</button>
        <span style={{ fontSize:22 }}>{style.icon}</span>
        <div>
          <h1 style={{ fontSize:21, fontWeight:700, color:'#16161f', margin:0 }}>{dept.department}</h1>
          <p style={{ fontSize:13, color:'#7c7c8a', margin:0 }}>{dept.labs.length} labs — select one to view details</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {dept.labs.map((lab, idx) => (
          <LabMiniCard key={lab.id} lab={lab} idx={idx} style={style} onClick={() => onSelect(lab)} />
        ))}
      </div>
    </div>
  );
}

function LabMiniCard({ lab, idx, style, onClick }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/summary?lab_id=' + lab.id).then(r => setData(r.data)).catch(() => {}); }, [lab.id]);
  const stats = data?.stats || {};
  const equipment = data?.equipment_status || [];
  const total = equipment.reduce((s,e) => s + parseInt(e.value), 0);
  return (
    <div onClick={onClick} style={{ background:'#fff', border:'1px solid #e9e9f0', borderRadius:16, padding:'22px', cursor:'pointer', transition:'all .15s', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=style.color; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='#e9e9f0'; }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:style.bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15, color:style.color }}}>L{idx+1}</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#16161f' }}>{lab.name}</div>
          <div style={{ fontSize:11, color:'#a8a8b8' }}>Capacity: {lab.capacity} seats</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:12 }}>
        {[
          { label:'PCs online',  value:stats.machines_online ?? '—', color:'#0f9d58' },
          { label:'Complaints',  value:stats.open_complaints ?? '—', color:'#d97706' },
          { label:'Low stock',   value:stats.low_stock ?? '—',       color:'#dc2626' },
          { label:'Exams today', value:stats.exams_today ?? '—',     color:style.color },
        ].map(s => (
          <div key={s.label} style={{ background:'#fafafd', borderRadius:8, padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#7c7c8a', marginTop:2, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div style={{ height:5, borderRadius:3, background:'#f0f0f6', overflow:'hidden', display:'flex' }}>
          {equipment.map((e,i) => <div key={i} style={{ width:((parseInt(e.value)/total)*100) + '%', background:PIE_COLORS[e.status] || '#ccc' }}/>)}
        </div>
      )}
      <div style={{ marginTop:12, fontSize:12, color:style.color, fontWeight:600 }}>View full dashboard →</div>
    </div>
  );
}

function LabDashboard({ lab, dept, onBack, onBackToDept }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const style = getStyle(dept.department);
  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/summary?lab_id=' + lab.id).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [lab.id]);
  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 }}>Loading</div>;
  const stats = data?.stats || {};
  const cards = [
    { label:'PCs online',      value:stats.machines_online },
    { label:'Active alerts',   value:stats.active_alerts },
    { label:'Open complaints', value:stats.open_complaints },
    { label:'Low stock items', value:stats.low_stock },
    { label:'Exams today',     value:stats.exams_today },
    { label:'AI critical risk',value:stats.critical_ai },
  ];
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={onBackToDept} style={backBtn}>← Departments</button>
        <span style={{ color:'#ddd' }}>›</span>
        <button onClick={onBack} style={{ ...backBtn, background:style.bg, color:style.color }}>{style.icon} {dept.department}</button>
        <span style={{ color:'#ddd' }}>›</span>
        <span style={{ fontSize:13, fontWeight:700, color:'#16161f' }}>{lab.name}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e9e9f0' }}>
        <div style={{ width:46, height:46, borderRadius:12, background:style.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{style.icon}</div>
        <div>
          <h1 style={{ fontSize:21, fontWeight:700, color:'#16161f', margin:0 }}>{lab.name}</h1>
          <p style={{ fontSize:13, color:'#7c7c8a', margin:0 }}>Live dashboard — {dept.department} — Capacity: {lab.capacity}</p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
        {cards.map((c,i) => {
          const p = PALETTE[i % PALETTE.length];
          return (
            <div key={c.label} style={{ borderRadius:14, padding:'18px', background:p.bg, boxShadow:'0 1px 3px rgba(16,16,30,0.04)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:p.dot, marginBottom:10 }}/>
              <div style={{ fontSize:28, fontWeight:800, color:p.dot, letterSpacing:'-0.02em' }}>{c.value ?? 0}</div>
              <div style={{ fontSize:12, color:'#7c7c8a', marginTop:4, fontWeight:500 }}>{c.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:20, marginBottom:20 }}>
        <div style={panel}>
          <h3 style={pTitle}>Equipment status</h3>
          {data?.equipment_status?.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.equipment_status.map(e => ({ ...e, value:parseInt(e.value) }))} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {data.equipment_status.map((e,i) => <Cell key={i} fill={PIE_COLORS[e.status] || '#ccc'} stroke="none"/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', gap:16, paddingTop:14, borderTop:'1px solid #f0f0f6', flexWrap:'wrap' }}>
                {data.equipment_status.map(e => (
                  <div key={e.status} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[e.status] || '#ccc' }}/>
                    <span style={{ color:'#7c7c8a', textTransform:'capitalize', fontWeight:500 }}>{e.status}</span>
                    <span style={{ color:'#16161f', fontWeight:700 }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState title="No equipment data" subtitle="Add equipment for this lab to see status."/>}
        </div>
        <div style={panel}>
          <h3 style={pTitle}>Weekly bookings</h3>
          {data?.weekly_slots?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weekly_slots}>
                <XAxis dataKey="day" tick={{ fontSize:11, fill:'#a8a8b8' }} axisLine={{ stroke:'#e9e9f0' }} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{ fontSize:11, fill:'#a8a8b8' }} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{ fill:'#f7f7fb' }}/>
                <Bar dataKey="bookings" fill={style.color} radius={[4,4,0,0]} maxBarSize={28}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No bookings this week"/>}
        </div>
      </div>
      <div style={panel}>
        <h3 style={pTitle}>Maintenance due — next 14 days</h3>
        {data?.maintenance_due?.length ? (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Equipment','Technician','Date','Cost','Status'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'10px', color:'#a8a8b8', fontWeight:700, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'2px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.maintenance_due.map(m => (
                <tr key={m.id}>
                  <td style={td}>{m.equipment_name}</td>
                  <td style={{ ...td, color:'#9494a3' }}>{m.technician}</td>
                  <td style={{ ...td, color:'#9494a3' }}>{new Date(m.scheduled_date).toLocaleDateString('en-IN')}</td>
                  <td style={td}>₹{Number(m.cost).toLocaleString()}</td>
                  <td style={td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:m.status === 'in_progress' ? '#fef3e2' : '#e8f0fe', color:m.status === 'in_progress' ? '#d97706' : '#2563eb' }}>
                      {m.status.replace('_',' ')}
                    </span>
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

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [dept,    setDept]    = useState(null);
  const [lab,     setLab]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/labs/departments')
      .then(r => setDepartments(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const style = dept ? getStyle(dept.department) : null;

  if (lab && dept) return (
    <div style={page}>
      <div style={{ height:3, width:64, borderRadius:2, background:style.color, marginBottom:16 }}/>
      <LabDashboard lab={lab} dept={dept} onBack={() => setLab(null)} onBackToDept={() => { setLab(null); setDept(null); }}/>
    </div>
  );

  if (dept) return (
    <div style={page}>
      <div style={{ height:3, width:64, borderRadius:2, background:style.color, marginBottom:16 }}/>
      <LabSelector dept={dept} onSelect={l => setLab(l)} onBack={() => setDept(null)}/>
    </div>
  );

  return (
    <div style={page}>
      <div style={{ height:3, width:64, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:16 }}/>
      <div style={{ marginBottom:28, borderBottom:'1px solid #e9e9f0', paddingBottom:20 }}>
        <h1 style={{ fontSize:23, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' }}>Dashboard</h1>
        <p style={{ fontSize:13, color:'#7c7c8a', marginTop:3 }}>Select a department to explore its labs</p>
      </div>
      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 }}>Loading departments</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {departments.map(d => <DepartmentCard key={d.department} dept={d} onClick={() => setDept(d)}/>)}
        </div>
      )}
    </div>
  );
}

const page   = { padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' };
const panel  = { background:'#fff', border:'1px solid #e9e9f0', borderRadius:14, padding:'22px 24px', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' };
const pTitle = { fontSize:14, fontWeight:700, color:'#16161f', marginBottom:18 };
const td     = { padding:'13px 10px', color:'#16161f', borderBottom:'1px solid #f0f0f6' };
const backBtn= { background:'#f5f5f7', border:'none', color:'#555', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 };
