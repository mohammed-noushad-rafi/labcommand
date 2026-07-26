import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import api from '../api/axios';
import DeptIcon from '../components/DeptIcon';
import { sortDepts } from '../utils/deptOrder';

const DEPT_META = {
  'Computer Science': { color:'#4f46e5', desc:'Programming · Networking · Hardware' },
  'Physics':          { color:'#0891b2', desc:'Optics · Electronics · Research' },
  'Chemistry':        { color:'#0f9d58', desc:'Organic · Inorganic · Analysis' },
};

function getMeta(name) {
  return DEPT_META[name] || { color:'#4f46e5', desc:'College laboratory' };
}

function Empty({ text }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb', fontSize:12 }}>
      {text}
    </div>
  );
}

function Chart({ title, children, height=200 }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, padding:'20px' }}>
      <div style={{ fontSize:13, fontWeight:600, color:'#16161f', marginBottom:16 }}>{title}</div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

// LEVEL 1 — Department cards
function DeptLevel({ departments, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Analytics</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Choose a department to explore its analytics</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px '+meta.color+'12'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ marginBottom:18 }}><DeptIcon department={d.department} size={34}/></div>
              <div style={{ fontSize:18, fontWeight:700, color:'#16161f', marginBottom:4 }}>{d.department}</div>
              <div style={{ fontSize:12, color:'#bbb', fontWeight:500 }}>{d.lab_count} lab{d.lab_count>1?'s':''}</div>
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
          <DeptIcon department={dept.department} size={22}/>
          <span style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{dept.department}</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>Select a lab</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs — click to view analytics</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => (
          <div key={lab.id} onClick={() => onSelect(lab)}
            style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.background='#fff'; }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>
                L{idx+1}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
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

// LEVEL 3 — Full lab analytics
function LabAnalytics({ lab, dept, onBack, onBackToDept }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');
  const meta = getMeta(dept.department);

  useEffect(() => {
    setLoading(true);
    api.get('/analytics?lab_id=' + lab.id)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lab.id]);

  const totalMachines  = data?.machine_uptime?.length || 0;
  const onlineMachines = data?.machine_uptime?.filter(m => m.status === 'online').length || 0;
  const totalBookings  = data?.daily_bookings?.reduce((s,d) => s + parseInt(d.bookings), 0) || 0;
  const avgCpu         = data?.peak_hours?.length
    ? Math.round(data.peak_hours.reduce((s,h) => s + parseFloat(h.avg_cpu||0), 0) / data.peak_hours.length)
    : 0;

  const tabs = ['overview','machines','processes','energy'];

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
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>Analytics · Capacity: {lab.capacity} seats</p>
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading analytics</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:28 }}>
            {[
              { label:'Total machines',    value:totalMachines,                color:'#4f46e5' },
              { label:'Online now',        value:onlineMachines,               color:'#0f9d58' },
              { label:'Bookings (14 days)',value:totalBookings,                color:'#7c3aed' },
              { label:'Avg CPU (7 days)',  value:avgCpu + '%',                 color:'#d97706' },
              { label:'Energy cost (30d)', value:'₹'+(data?.energy?.estimated_cost_inr||0), color:'#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 16px' }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, letterSpacing:'-0.02em' }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#9494a3', marginTop:6, fontWeight:500, lineHeight:1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid #ebebf0', paddingBottom:0 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:tab===t?700:400, color:tab===t?meta.color:'#9494a3', borderBottom:tab===t?'2px solid '+meta.color:'2px solid transparent', marginBottom:-1, textTransform:'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Chart title="CPU & RAM by hour (7 days)">
                {data?.peak_hours?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.peak_hours.map(h=>({ hour:h.hour+':00', cpu:Math.round(parseFloat(h.avg_cpu)||0), ram:Math.round(parseFloat(h.avg_ram)||0) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7"/>
                      <XAxis dataKey="hour" style={{fontSize:10}} interval={3}/>
                      <YAxis domain={[0,100]} tickFormatter={v=>v+'%'} style={{fontSize:10}}/>
                      <Tooltip formatter={v=>v+'%'}/>
                      <Legend wrapperStyle={{fontSize:11}}/>
                      <Bar dataKey="cpu" fill={meta.color} name="CPU %" radius={[2,2,0,0]}/>
                      <Bar dataKey="ram" fill={meta.color+'88'} name="RAM %" radius={[2,2,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty text="No telemetry — connect machines to see data"/>}
              </Chart>

              <Chart title="Daily bookings (14 days)">
                {data?.daily_bookings?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily_bookings.map(d=>({ day:d.day, bookings:parseInt(d.bookings) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7"/>
                      <XAxis dataKey="day" style={{fontSize:10}}/>
                      <YAxis allowDecimals={false} style={{fontSize:10}}/>
                      <Tooltip/>
                      <Line type="monotone" dataKey="bookings" stroke={meta.color} strokeWidth={2} dot={{r:3}}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : <Empty text="No bookings yet for this lab"/>}
              </Chart>

              <Chart title="Complaints trend">
                {data?.complaints_trend?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.complaints_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7"/>
                      <XAxis dataKey="day" style={{fontSize:10}}/>
                      <YAxis allowDecimals={false} style={{fontSize:10}}/>
                      <Tooltip/>
                      <Bar dataKey="count" fill="#dc2626" name="Total" radius={[2,2,0,0]}/>
                      <Bar dataKey="resolved" fill="#0f9d58" name="Resolved" radius={[2,2,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty text="No complaints recorded"/>}
              </Chart>

              <Chart title="Lab utilization">
                {data?.lab_utilization?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.lab_utilization} layout="vertical">
                      <XAxis type="number" style={{fontSize:10}}/>
                      <YAxis type="category" dataKey="lab_name" width={110} style={{fontSize:10}}/>
                      <Tooltip/>
                      <Bar dataKey="total_bookings" fill={meta.color} name="Bookings" radius={[0,2,2,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty text="No utilization data"/>}
              </Chart>
            </div>
          )}

          {tab === 'machines' && (
            <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>{['Machine','Status','Avg CPU','Avg RAM','Lab'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {data?.machine_uptime?.length ? data.machine_uptime.map((m,i) => (
                    <tr key={i}>
                      <td style={td}>{m.hostname}</td>
                      <td style={td}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:m.status==='online'?'#eefbf3':'#fafafd', color:m.status==='online'?'#0f9d58':'#9494a3' }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:m.status==='online'?'#0f9d58':'#c4c4cc' }}/>{m.status}
                        </span>
                      </td>
                      <td style={td}>{m.avg_cpu ? m.avg_cpu+'%' : '—'}</td>
                      <td style={td}>{m.avg_ram ? m.avg_ram+'%' : '—'}</td>
                      <td style={{ ...td, color:'#9494a3' }}>{m.lab_name}</td>
                    </tr>
                  )) : <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>No machine data</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'processes' && (
            <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>{['Process','Frequency','Avg CPU','Avg Memory'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {data?.top_processes?.length ? data.top_processes.map((p,i) => (
                    <tr key={i}>
                      <td style={td}>{p.process_name}</td>
                      <td style={td}>{p.frequency}</td>
                      <td style={td}>{p.avg_cpu}%</td>
                      <td style={td}>{p.avg_mem} MB</td>
                    </tr>
                  )) : <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>No process data — run the agent to collect data</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'energy' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { label:'Total kWh (30 days)', value: data?.energy?.total_kwh||0,          color:'#d97706' },
                  { label:'Estimated cost',       value:'₹'+(data?.energy?.estimated_cost_inr||0), color:'#dc2626' },
                  { label:'Active machines',       value: data?.energy?.machines?.filter(m=>m.active_readings>0).length||0, color:'#4f46e5' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'20px' }}>
                    <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'#9494a3', marginTop:6, fontWeight:500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>{['Machine','Lab','Readings','Est. kWh'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {data?.energy?.machines?.length ? data.energy.machines.map((m,i) => (
                      <tr key={i}>
                        <td style={td}>{m.hostname}</td>
                        <td style={{ ...td, color:'#9494a3' }}>{m.lab_name}</td>
                        <td style={td}>{m.active_readings}</td>
                        <td style={td}>{m.estimated_kwh}</td>
                      </tr>
                    )) : <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>No energy data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Analytics() {
  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/labs/departments')
      .then(r => setDepartments(sortDepts(r.data.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1100, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabAnalytics lab={lab} dept={dept} onBack={() => setLab(null)} onBackToDept={() => { setLab(null); setDept(null); }}/>
      ) : dept ? (
        <LabLevel dept={dept} onSelect={l => setLab(l)} onBack={() => setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} onSelect={d => setDept(d)}/>
      )}
    </div>
  );
}

const backBtn = { background:'none', border:'1px solid #ebebf0', color:'#7c7c8a', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500 };
const td      = { padding:'12px 14px', color:'#16161f', borderBottom:'1px solid #f7f7fb', fontSize:13 };
