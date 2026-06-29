import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { working: '#22c55e', faulty: '#ef4444', maintenance: '#f59e0b' };

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading dashboard...</div>;

  const stats = data?.stats || {};
  const cards = [
    { label:'PCs Online',       value: stats.machines_online, color:'#3b82f6', icon:'🖥️' },
    { label:'Active Alerts',    value: stats.active_alerts,   color:'#ef4444', icon:'🚨' },
    { label:'Open Complaints',  value: stats.open_complaints, color:'#f59e0b', icon:'🎫' },
    { label:'Low Stock Items',  value: stats.low_stock,       color:'#8b5cf6', icon:'📦' },
    { label:'Exams Today',      value: stats.exams_today,     color:'#06b6d4', icon:'📝' },
    { label:'AI Critical Risk', value: stats.critical_ai,     color:'#ec4899', icon:'🤖' },
  ];

  return (
    <div style={{padding:28,maxWidth:1200}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:700,color:'#1a1a2e',margin:0}}>Dashboard</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Welcome back — here is what is happening in your labs</p>
        </div>
        <div style={{fontSize:13,color:'#888',marginTop:4}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:20}}>
        {cards.map(c => (
          <div key={c.label} style={{background:'#fff',borderRadius:12,padding:'20px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:28}}>{c.icon}</div>
            <div style={{fontSize:32,fontWeight:700,margin:'8px 0 4px',color:c.color}}>{c.value ?? 0}</div>
            <div style={{fontSize:12,color:'#888'}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:16,marginBottom:20}}>
        <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:15,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Equipment status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
             <Pie data={(data?.equipment_status||[]).map(e=>({...e,value:parseInt(e.value)}))} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({status,value})=>`${status}: ${value}`}>
                {(data?.equipment_status||[]).map((e,i)=><Cell key={i} fill={COLORS[e.status]||'#94a3b8'}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:15,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Weekly lab bookings</h3>
          {data?.weekly_slots?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekly_slots}>
                <XAxis dataKey="day"/><YAxis allowDecimals={false}/>
                <Tooltip/>
                <Bar dataKey="bookings" fill="#667eea" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{color:'#aaa',fontSize:13,padding:'30px 0',textAlign:'center'}}>No bookings this week yet</div>
          )}
        </div>
      </div>

      <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <h3 style={{fontSize:15,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Maintenance due (next 14 days)</h3>
        {data?.maintenance_due?.length ? (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr>{['Equipment','Lab','Technician','Date','Cost','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'#888',fontWeight:500,borderBottom:'1px solid #f0f0f0'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.maintenance_due.map(m=>(
                <tr key={m.id}>
                  <td style={{padding:'10px',borderBottom:'1px solid #f9f9f9'}}>{m.equipment_name}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f9f9f9'}}>{m.lab_name}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f9f9f9'}}>{m.technician}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f9f9f9'}}>{new Date(m.scheduled_date).toLocaleDateString('en-IN')}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f9f9f9'}}>₹{Number(m.cost).toLocaleString()}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f9f9f9'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:m.status==='in_progress'?'#fef3c7':'#e0f2fe',color:m.status==='in_progress'?'#92400e':'#0369a1'}}>
                      {m.status.replace('_',' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{color:'#aaa',fontSize:13,padding:'30px 0',textAlign:'center'}}>No maintenance due</div>
        )}
      </div>
    </div>
  );
}
