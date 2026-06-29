import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts';
import api from '../api/axios';

const COLORS = ['#667eea','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

function StatCard({ label, value, sub, color='#667eea', icon }) {
  return (
    <div style={{background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:12,color:'#888',marginBottom:6}}>{label}</div>
          <div style={{fontSize:28,fontWeight:700,color}}>{value}</div>
          {sub && <div style={{fontSize:11,color:'#aaa',marginTop:4}}>{sub}</div>}
        </div>
        {icon && <span style={{fontSize:28}}>{icon}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, height=220 }) {
  return (
    <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
      <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:16}}>{title}</h3>
      <div style={{height}}>{children}</div>
    </div>
  );
}

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading analytics...</div>;
  if (!data)   return <div style={{padding:40,textAlign:'center',color:'#888'}}>Failed to load analytics</div>;

  const totalMachines  = data.machine_uptime?.length || 0;
  const onlineMachines = data.machine_uptime?.filter(m => m.status === 'online').length || 0;
  const totalBookings  = data.daily_bookings?.reduce((s, d) => s + parseInt(d.bookings), 0) || 0;
  const avgCpu         = data.peak_hours?.length
    ? Math.round(data.peak_hours.reduce((s, h) => s + parseFloat(h.avg_cpu || 0), 0) / data.peak_hours.length)
    : 0;

  const tabs = ['overview','machines','processes','energy'];

  return (
    <div style={{padding:28}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Analytics</h1>
        <p style={{fontSize:13,color:'#888',marginTop:4}}>Lab usage insights and performance data</p>
      </div>

      {/* Summary stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:24}}>
        <StatCard label="Total machines"    value={totalMachines}  icon="🖥️"  color="#3b82f6" sub="across all labs"/>
        <StatCard label="Currently online"  value={onlineMachines} icon="🟢"  color="#22c55e" sub={`${totalMachines>0?Math.round(onlineMachines/totalMachines*100):0}% uptime`}/>
        <StatCard label="Bookings (14 days)"value={totalBookings}  icon="📅"  color="#8b5cf6" sub="lab slot bookings"/>
        <StatCard label="Avg CPU usage"     value={`${avgCpu}%`}   icon="⚡"  color="#f59e0b" sub="last 7 days"/>
        <StatCard label="Energy cost (30d)" value={`₹${data.energy?.estimated_cost_inr||0}`} icon="💡" color="#ef4444" sub={`${data.energy?.total_kwh||0} kWh`}/>
      </div>

      {/* Tab navigation */}
      <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:'1.5px solid #f0f0f0',paddingBottom:0}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 18px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:tab===t?600:400,color:tab===t?'#667eea':'#888',borderBottom:tab===t?'2.5px solid #667eea':'2.5px solid transparent',marginBottom:-1.5,textTransform:'capitalize'}}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab==='overview' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

            <ChartCard title="CPU usage by hour (7 days)" height={200}>
              {data.peak_hours?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peak_hours.map(h=>({hour:`${h.hour}:00`,cpu:Math.round(parseFloat(h.avg_cpu)||0),ram:Math.round(parseFloat(h.avg_ram)||0)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="hour" style={{fontSize:11}} interval={3}/>
                    <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} style={{fontSize:11}}/>
                    <Tooltip formatter={v=>`${v}%`}/>
                    <Legend/>
                    <Bar dataKey="cpu" fill="#667eea" name="CPU %" radius={[2,2,0,0]}/>
                    <Bar dataKey="ram" fill="#22c55e" name="RAM %" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#aaa',fontSize:13}}>No telemetry data yet — run the agent to collect data</div>}
            </ChartCard>

            <ChartCard title="Daily lab bookings (14 days)" height={200}>
              {data.daily_bookings?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily_bookings.map(d=>({day:d.day,bookings:parseInt(d.bookings)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="day" style={{fontSize:11}}/>
                    <YAxis allowDecimals={false} style={{fontSize:11}}/>
                    <Tooltip/>
                    <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} dot={{r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#aaa',fontSize:13}}>No booking data yet</div>}
            </ChartCard>
          </div>

          <ChartCard title="Lab utilization overview" height={180}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.lab_utilization?.map(l=>({lab:l.lab_name.replace(' Lab',''),machines:parseInt(l.total_machines),bookings:parseInt(l.total_bookings||0),online:parseInt(l.online_machines||0)}))||[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="lab" style={{fontSize:11}}/>
                <YAxis allowDecimals={false} style={{fontSize:11}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="machines" fill="#3b82f6" name="Machines" radius={[2,2,0,0]}/>
                <Bar dataKey="bookings" fill="#8b5cf6" name="Bookings" radius={[2,2,0,0]}/>
                <Bar dataKey="online"   fill="#22c55e" name="Online now" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {data.complaints_trend?.length > 0 && (
            <ChartCard title="Complaint trends" height={180}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.complaints_trend.map(d=>({day:d.day,total:parseInt(d.count),high:parseInt(d.high),resolved:parseInt(d.resolved)}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="day" style={{fontSize:11}}/>
                  <YAxis allowDecimals={false} style={{fontSize:11}}/>
                  <Tooltip/>
                  <Legend/>
                  <Bar dataKey="total"    fill="#f59e0b" name="Total" radius={[2,2,0,0]}/>
                  <Bar dataKey="high"     fill="#ef4444" name="High priority" radius={[2,2,0,0]}/>
                  <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* MACHINES TAB */}
      {tab==='machines' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'#f8fafc'}}>
                {['Machine','Lab','Status','Avg CPU (24h)','Avg RAM (24h)','Data points','Last seen'].map(h=>(
                  <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.machine_uptime?.map(m => (
                <tr key={m.hostname} style={{borderTop:'1px solid #f0f0f0'}}>
                  <td style={{padding:'12px 14px',fontWeight:500,color:'#1a1a2e'}}>{m.hostname}</td>
                  <td style={{padding:'12px 14px',color:'#555'}}>{m.lab_name}</td>
                  <td style={{padding:'12px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:m.status==='online'?'#dcfce7':'#f1f5f9',color:m.status==='online'?'#16a34a':'#64748b'}}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{padding:'12px 14px'}}>
                    {m.avg_cpu ? (
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,maxWidth:80}}>
                          <div style={{height:6,borderRadius:3,background:parseFloat(m.avg_cpu)>70?'#ef4444':'#667eea',width:`${Math.min(parseFloat(m.avg_cpu),100)}%`}}></div>
                        </div>
                        <span style={{fontSize:12,color:'#555'}}>{Math.round(parseFloat(m.avg_cpu))}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{padding:'12px 14px'}}>
                    {m.avg_ram ? (
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,maxWidth:80}}>
                          <div style={{height:6,borderRadius:3,background:parseFloat(m.avg_ram)>80?'#ef4444':'#22c55e',width:`${Math.min(parseFloat(m.avg_ram),100)}%`}}></div>
                        </div>
                        <span style={{fontSize:12,color:'#555'}}>{Math.round(parseFloat(m.avg_ram))}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{padding:'12px 14px',color:'#555'}}>{m.telemetry_count||0}</td>
                  <td style={{padding:'12px 14px',color:'#888',fontSize:12}}>
                    {m.last_seen ? new Date(m.last_seen).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PROCESSES TAB */}
      {tab==='processes' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <ChartCard title="Top 10 most frequent processes (7 days)" height={260}>
            {data.top_processes?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_processes.slice(0,10).map(p=>({name:p.process_name.slice(0,16),freq:parseInt(p.frequency),cpu:Math.round(parseFloat(p.avg_cpu)||0)}))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis type="number" style={{fontSize:11}}/>
                  <YAxis type="category" dataKey="name" width={110} style={{fontSize:11}}/>
                  <Tooltip/>
                  <Bar dataKey="freq" name="Frequency" radius={[0,2,2,0]}>
                    {data.top_processes.slice(0,10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#aaa',fontSize:13}}>No process data yet</div>}
          </ChartCard>

          <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  {['Process','Frequency','Avg CPU %','Avg Memory (MB)'].map(h=>(
                    <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.top_processes?.map((p,i) => (
                  <tr key={i} style={{borderTop:'1px solid #f0f0f0'}}>
                    <td style={{padding:'10px 14px',fontWeight:500,color:'#1a1a2e',fontFamily:'monospace',fontSize:12}}>{p.process_name}</td>
                    <td style={{padding:'10px 14px',color:'#555'}}>{parseInt(p.frequency).toLocaleString()}</td>
                    <td style={{padding:'10px 14px',color:parseFloat(p.avg_cpu)>50?'#ef4444':'#555'}}>{Math.round(parseFloat(p.avg_cpu||0))}%</td>
                    <td style={{padding:'10px 14px',color:'#555'}}>{Math.round(parseFloat(p.avg_mem||0))} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENERGY TAB */}
      {tab==='energy' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
            <StatCard label="Total energy (30 days)" value={`${data.energy?.total_kwh||0} kWh`} icon="⚡" color="#f59e0b"/>
            <StatCard label="Estimated cost"         value={`₹${data.energy?.estimated_cost_inr||0}`} icon="💰" color="#ef4444" sub="@ ₹8 per kWh"/>
            <StatCard label="Machines tracked"       value={data.energy?.machines?.length||0} icon="🖥️" color="#3b82f6"/>
            <div style={{background:'#fff5e6',borderRadius:12,padding:'18px 20px',border:'1.5px solid #fed7aa'}}>
              <div style={{fontSize:12,color:'#92400e',marginBottom:6}}>💡 Saving tip</div>
              <div style={{fontSize:13,color:'#92400e',fontWeight:500}}>Enable auto-shutdown policy to reduce idle machine costs by up to 40%</div>
            </div>
          </div>

          <ChartCard title="Energy usage per machine (30 days estimated)" height={240}>
            {data.energy?.machines?.filter(m=>parseFloat(m.estimated_kwh)>0).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.energy.machines.filter(m=>parseFloat(m.estimated_kwh)>0).slice(0,12).map(m=>({machine:m.hostname,kwh:parseFloat(m.estimated_kwh),lab:m.lab_name}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="machine" style={{fontSize:10}} angle={-20} textAnchor="end" height={40}/>
                  <YAxis style={{fontSize:11}} tickFormatter={v=>`${v}kWh`}/>
                  <Tooltip formatter={v=>`${v} kWh`}/>
                  <Bar dataKey="kwh" name="Energy (kWh)" radius={[2,2,0,0]}>
                    {data.energy.machines.filter(m=>parseFloat(m.estimated_kwh)>0).slice(0,12).map((_,i)=>(
                      <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10}}>
                <span style={{fontSize:32}}>⚡</span>
                <div style={{color:'#aaa',fontSize:13}}>No energy data yet — run the agent to collect telemetry</div>
              </div>
            )}
          </ChartCard>

          <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  {['Machine','Lab','Active readings','Estimated kWh','Est. cost (₹)'].map(h=>(
                    <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.energy?.machines?.map((m,i) => (
                  <tr key={i} style={{borderTop:'1px solid #f0f0f0'}}>
                    <td style={{padding:'10px 14px',fontWeight:500,color:'#1a1a2e'}}>{m.hostname}</td>
                    <td style={{padding:'10px 14px',color:'#555'}}>{m.lab_name}</td>
                    <td style={{padding:'10px 14px',color:'#555'}}>{parseInt(m.active_readings).toLocaleString()}</td>
                    <td style={{padding:'10px 14px',color:'#f59e0b',fontWeight:500}}>{parseFloat(m.estimated_kwh).toFixed(3)} kWh</td>
                    <td style={{padding:'10px 14px',color:'#ef4444',fontWeight:500}}>₹{Math.round(parseFloat(m.estimated_kwh)*8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}