import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { io } from 'socket.io-client';

export default function MachineDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [machine,   setMachine]   = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState('');
  const [sending,   setSending]   = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/machines/${id}`).then(r => {
      setMachine(r.data.data);
      setTelemetry((r.data.telemetry || []).slice(0,60).reverse());
      setProcesses(r.data.processes || []);
    }).finally(() => setLoading(false));

    socketRef.current = io('http://localhost:3001');

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

    return () => socketRef.current?.disconnect();
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

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</div>;
  if (!machine) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Machine not found</div>;

  const isOnline = machine.status === 'online';
  const statusColors = { online:'#22c55e', offline:'#94a3b8', locked:'#eab308', exam:'#ef4444', classroom:'#8b5cf6' };
  const statusColor  = statusColors[machine.status] || '#94a3b8';

  const Gauge = ({ label, value, color }) => (
    <div style={{flex:1,background:'#f8fafc',borderRadius:10,padding:'16px 12px',textAlign:'center',minWidth:100}}>
      <div style={{fontSize:11,color:'#888',marginBottom:8}}>{label}</div>
      <div style={{position:'relative',height:8,background:'#e2e8f0',borderRadius:4,marginBottom:8}}>
        <div style={{position:'absolute',top:0,left:0,height:8,borderRadius:4,background:color,width:`${Math.min(value||0,100)}%`,transition:'width .5s'}}></div>
      </div>
      <div style={{fontSize:22,fontWeight:700,color}}>{value != null ? `${Math.round(value)}%` : '—'}</div>
    </div>
  );

  return (
    <div style={{padding:28,maxWidth:1100}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={() => navigate('/lab-map')} style={{background:'none',border:'1px solid #e0e0e0',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:13,color:'#555'}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <h1 style={{fontSize:22,fontWeight:700,color:'#1a1a2e',margin:0}}>{machine.hostname}</h1>
            <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:statusColor+'22',color:statusColor,border:`1px solid ${statusColor}`}}>
              {machine.status}
            </span>
          </div>
          <div style={{fontSize:12,color:'#888',marginTop:3}}>{machine.ip_address} · {machine.lab_name} · {machine.os_info}</div>
        </div>
      </div>

      {/* Live gauges */}
      <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Live metrics</h3>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <Gauge label="CPU"  value={machine.cpu_percent}  color={machine.cpu_percent>80?'#ef4444':machine.cpu_percent>60?'#f59e0b':'#22c55e'}/>
          <Gauge label="RAM"  value={machine.ram_percent}  color={machine.ram_percent>80?'#ef4444':machine.ram_percent>60?'#f59e0b':'#3b82f6'}/>
          <Gauge label="Disk" value={machine.disk_percent} color={machine.disk_percent>90?'#ef4444':machine.disk_percent>70?'#f59e0b':'#8b5cf6'}/>
        </div>
      </div>

      {/* Sparkline */}
      {telemetry.length > 0 && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>CPU history (last hour)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={telemetry}>
              <XAxis dataKey="recorded_at" hide />
              <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} width={40} style={{fontSize:11}}/>
              <Tooltip formatter={v=>`${Math.round(v)}%`} labelFormatter={()=>'CPU'}/>
              <Line type="monotone" dataKey="cpu_percent" stroke="#667eea" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* Actions */}
        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Remote actions</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              { label:'🔒 Lock screen',  type:'lock',    color:'#f59e0b' },
              { label:'🔄 Restart',      type:'restart', color:'#3b82f6' },
              { label:'⏻ Shutdown',      type:'shutdown',color:'#ef4444' },
            ].map(a => (
              <button key={a.type} disabled={!isOnline || sending}
                onClick={() => { if(window.confirm(`Send ${a.type} to ${machine.hostname}?`)) sendCommand(a.type); }}
                style={{padding:'9px 14px',border:`1.5px solid ${a.color}`,borderRadius:8,background:`${a.color}11`,color:a.color,cursor:isOnline?'pointer':'not-allowed',fontSize:13,fontWeight:500,opacity:isOnline?1:0.4,textAlign:'left'}}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Send message */}
        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Send message</h3>
          <textarea
            value={msg}
            onChange={e=>setMsg(e.target.value)}
            placeholder="Type a message to display on this machine..."
            style={{width:'100%',height:80,padding:10,border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,resize:'none',outline:'none',boxSizing:'border-box'}}
          />
          <button onClick={sendMessage} disabled={!isOnline||!msg.trim()||sending}
            style={{marginTop:8,width:'100%',padding:'9px',background:'#667eea',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500,opacity:(isOnline&&msg.trim())?1:0.4}}>
            📨 Send message
          </button>
        </div>
      </div>

      {/* Process list */}
      <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Running processes {processes.length > 0 && <span style={{color:'#888',fontWeight:400}}>({processes.length})</span>}</h3>
        {processes.length ? (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr>{['Process','PID','CPU %','Memory (MB)'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 10px',color:'#888',fontWeight:500,borderBottom:'1px solid #f0f0f0',fontSize:12}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {processes.map((p,i)=>(
                <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                  <td style={{padding:'7px 10px',color:'#333'}}>{p.process_name}</td>
                  <td style={{padding:'7px 10px',color:'#888'}}>{p.pid}</td>
                  <td style={{padding:'7px 10px',color: p.cpu_percent>50?'#ef4444':'#333'}}>{p.cpu_percent?.toFixed(1)}%</td>
                  <td style={{padding:'7px 10px',color:'#333'}}>{p.mem_mb?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{color:'#aaa',fontSize:13,padding:'20px 0',textAlign:'center'}}>
            {isOnline ? 'No process data yet' : 'Machine is offline — no process data available'}
          </div>
        )}
      </div>
    </div>
  );
}