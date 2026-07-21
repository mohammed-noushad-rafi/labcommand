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

const DEPT_META = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5' },
  'Physics':          { icon:'⚛️',  color:'#0891b2' },
  'Chemistry':        { icon:'🧪', color:'#0f9d58' },
};

function getMeta(name) {
  return DEPT_META[name] || { icon:'🏫', color:'#4f46e5' };
}

// LEVEL 1 — Department cards
function DeptLevel({ departments, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Dashboard</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Choose a department to explore</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'28px 24px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.boxShadow = '0 8px 28px ' + meta.color + '14'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#ebebf0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ fontSize:32, marginBottom:16 }}>{meta.icon}</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#16161f', marginBottom:6 }}>{d.department}</div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'#bbb', fontWeight:500 }}>{d.lab_count} lab{d.lab_count > 1 ? 's' : ''}</span>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LEVEL 2 — Labs in department
function LabLevel({ dept, onSelect, onBack }) {
  const meta = getMeta(dept.department);
  return (
    <div>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ marginBottom:36, marginTop:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <span style={{ fontSize:22 }}>{meta.icon}</span>
          <span style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{dept.department}</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' }}>Select a lab</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs in this department</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => (
          <div key={lab.id} onClick={() => onSelect(lab)}
            style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.background = '#fafafe'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ebebf0'; e.currentTarget.style.background = '#fff'; }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background: meta.color + '14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>
                L{idx + 1}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx + 1}</div>
                <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · {lab.capacity} seats</div>
              </div>
            </div>
            <span style={{ fontSize:18, color:'#ddd' }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// LEVEL 3 — Full lab dashboard
function LabDashboard({ lab, dept, onBack, onBackToDept }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const meta = getMeta(dept.department);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/summary?lab_id=' + lab.id)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lab.id]);

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
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:28, flexWrap:'wrap' }}>
        <button onClick={onBackToDept} style={backBtn}>← Departments</button>
        <span style={{ color:'#e0e0e6' }}>›</span>
        <button onClick={onBack} style={{ ...backBtn, color:meta.color }}>{dept.department}</button>
        <span style={{ color:'#e0e0e6' }}>›</span>
        <span style={{ fontSize:12, color:'#9494a3', fontWeight:500 }}>{lab.name}</span>
      </div>

      <div style={{ borderBottom:'1px solid #ebebf0', paddingBottom:24, marginBottom:28 }}>
        <div style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{dept.department} Department</div>
        <h1 style={{ fontSize:24, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' }}>{lab.name}</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>Live dashboard · Capacity: {lab.capacity} seats</p>
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:28 }}>
            {cards.map((c, i) => {
              const p = PALETTE[i % PALETTE.length];
              return (
                <div key={c.label} style={{ background:p.bg, borderRadius:14, padding:'18px 16px' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:p.dot, marginBottom:12 }}/>
                  <div style={{ fontSize:26, fontWeight:800, color:p.dot, letterSpacing:'-0.02em', lineHeight:1 }}>{c.value ?? 0}</div>
                  <div style={{ fontSize:11, color:'#9494a3', marginTop:6, fontWeight:500, lineHeight:1.4 }}>{c.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:16, marginBottom:16 }}>
            <div style={card}>
              <div style={cardTitle}>Equipment status</div>
              {data?.equipment_status?.length ? (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={data.equipment_status.map(e => ({ ...e, value:parseInt(e.value) }))} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3}>
                        {data.equipment_status.map((e,i) => <Cell key={i} fill={PIE_COLORS[e.status] || '#ccc'} stroke="none"/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', gap:16, paddingTop:14, borderTop:'1px solid #f0f0f6', flexWrap:'wrap' }}>
                    {data.equipment_status.map(e => (
                      <div key={e.status} style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:PIE_COLORS[e.status] || '#ccc' }}/>
                        <span style={{ fontSize:11, color:'#9494a3', textTransform:'capitalize' }}>{e.status}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:'#16161f' }}>{e.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="No equipment data" subtitle="Add equipment to see status."/>}
            </div>

            <div style={card}>
              <div style={cardTitle}>Weekly bookings</div>
              {data?.weekly_slots?.length ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={data.weekly_slots}>
                    <XAxis dataKey="day" tick={{ fontSize:11, fill:'#c4c4cc' }} axisLine={false} tickLine={false}/>
                    <YAxis allowDecimals={false} tick={{ fontSize:11, fill:'#c4c4cc' }} axisLine={false} tickLine={false}/>
                    <Tooltip cursor={{ fill:'#f7f7fb' }}/>
                    <Bar dataKey="bookings" fill={meta.color} radius={[4,4,0,0]} maxBarSize={24}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState title="No bookings this week"/>}
            </div>
          </div>

          <div style={card}>
            <div style={cardTitle}>Maintenance due — next 14 days</div>
            {data?.maintenance_due?.length ? (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>{['Equipment','Technician','Date','Cost','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'9px 10px', color:'#c4c4cc', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6' }}>{h}</th>
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
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:m.status==='in_progress'?'#fef3e2':'#f0f0f6', color:m.status==='in_progress'?'#d97706':'#7c7c8a' }}>
                          {m.status.replace('_',' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState title="No maintenance due" subtitle="Nothing scheduled in the next 14 days."/>}
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const DEPT_ORDER = ['Computer Science', 'Chemistry', 'Physics'];

  useEffect(() => {
    api.get('/labs/departments')
      .then(r => {
        const data = r.data.data || [];
        data.sort((a, b) => DEPT_ORDER.indexOf(a.department) - DEPT_ORDER.indexOf(b.department));
        setDepartments(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1100, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabDashboard lab={lab} dept={dept} onBack={() => setLab(null)} onBackToDept={() => { setLab(null); setDept(null); }}/>
      ) : dept ? (
        <LabLevel dept={dept} onSelect={l => setLab(l)} onBack={() => setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} onSelect={d => setDept(d)}/>
      )}
    </div>
  );
}

const backBtn = { background:'none', border:'1px solid #ebebf0', color:'#7c7c8a', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500 };
const card    = { background:'#fff', border:'1px solid #ebebf0', borderRadius:14, padding:'22px', marginBottom:0 };
const cardTitle = { fontSize:13, fontWeight:700, color:'#16161f', marginBottom:16 };
const td      = { padding:'12px 10px', color:'#16161f', borderBottom:'1px solid #f7f7fb', fontSize:13 };
