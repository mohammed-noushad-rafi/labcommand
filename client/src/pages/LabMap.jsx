import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  online:    { bg:'#dcfce7', border:'#22c55e', dot:'#16a34a', label:'Online' },
  offline:   { bg:'#f1f5f9', border:'#cbd5e1', dot:'#94a3b8', label:'Offline' },
  locked:    { bg:'#fef9c3', border:'#eab308', dot:'#ca8a04', label:'Locked' },
  exam:      { bg:'#fee2e2', border:'#ef4444', dot:'#dc2626', label:'Exam' },
  classroom: { bg:'#ede9fe', border:'#8b5cf6', dot:'#7c3aed', label:'Classroom' },
};

export default function LabMap() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [machines, setMachines] = useState([]);
  const [labs, setLabs]         = useState([]);
  const [selectedLab, setSelectedLab] = useState('all');
  const [loading, setLoading]   = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:3001', {
      auth: { token }
    });

    socketRef.current.on('machine:status', ({ machineId, status }) => {
      setMachines(prev => prev.map(m =>
        m.id === machineId ? { ...m, status } : m
      ));
    });

    socketRef.current.on('machine:telemetry', ({ machineId, cpu, ram, disk }) => {
      setMachines(prev => prev.map(m =>
        m.id === machineId ? { ...m, cpu_percent: cpu, ram_percent: ram, disk_percent: disk } : m
      ));
    });

    api.get('/machines').then(r => setMachines(r.data.data || [])).finally(() => setLoading(false));
    api.get('/labs').then(r => setLabs(r.data.data || []));

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

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading lab map...</div>;

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:700,color:'#1a1a2e',margin:0}}>Lab Map</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Live view of all lab computers</p>
        </div>
        <select
          value={selectedLab}
          onChange={e => setSelectedLab(e.target.value)}
          style={{padding:'8px 14px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,background:'#fff',cursor:'pointer'}}
        >
          <option value="all">All Labs</option>
          {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Summary bar */}
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        {[
          { label:'Total',   value: counts.total,   color:'#64748b' },
          { label:'Online',  value: counts.online,  color:'#16a34a' },
          { label:'Offline', value: counts.offline, color:'#94a3b8' },
          { label:'Locked',  value: counts.locked,  color:'#ca8a04' },
        ].map(c => (
          <div key={c.label} style={{background:'#fff',borderRadius:10,padding:'12px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:c.color}}></div>
            <span style={{fontSize:13,color:'#555'}}>{c.label}</span>
            <span style={{fontSize:18,fontWeight:700,color:c.color}}>{c.value}</span>
          </div>
        ))}

        {/* Legend */}
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {Object.entries(STATUS_COLOR).map(([k,v]) => (
            <div key={k} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#666'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:v.dot}}></div>
              {v.label}
            </div>
          ))}
        </div>
      </div>

      {/* Lab grids */}
      {Object.entries(grouped).map(([labName, labMachines]) => (
        <div key={labName} style={{marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <h2 style={{fontSize:16,fontWeight:600,color:'#1a1a2e'}}>{labName}</h2>
            <span style={{fontSize:12,color:'#888'}}>{labMachines.length} machines</span>
            <span style={{fontSize:12,color:'#16a34a',fontWeight:500}}>
              {labMachines.filter(m=>m.status==='online').length} online
            </span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
            {labMachines.map(m => {
              const st = STATUS_COLOR[m.status] || STATUS_COLOR.offline;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/machines/${m.id}`)}
                  style={{
                    background: st.bg,
                    border: `1.5px solid ${st.border}`,
                    borderRadius: 10,
                    padding: '14px 12px',
                    cursor: 'pointer',
                    transition: 'transform .15s, box-shadow .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                >
                  {/* Status dot + hostname */}
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:st.dot,flexShrink:0}}></div>
                    <span style={{fontSize:12,fontWeight:600,color:'#1a1a2e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.hostname}</span>
                  </div>

                  {/* IP */}
                  <div style={{fontSize:10,color:'#888',marginBottom:8}}>{m.ip_address}</div>

                  {/* CPU bar */}
                  {m.status === 'online' && m.cpu_percent != null ? (
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#666',marginBottom:2}}>
                        <span>CPU</span><span>{Math.round(m.cpu_percent)}%</span>
                      </div>
                      <div style={{height:4,background:'rgba(0,0,0,0.08)',borderRadius:2,marginBottom:4}}>
                        <div style={{height:4,borderRadius:2,background: m.cpu_percent>80?'#ef4444':m.cpu_percent>60?'#f59e0b':'#22c55e',width:`${Math.min(m.cpu_percent,100)}%`}}></div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#666',marginBottom:2}}>
                        <span>RAM</span><span>{Math.round(m.ram_percent)}%</span>
                      </div>
                      <div style={{height:4,background:'rgba(0,0,0,0.08)',borderRadius:2}}>
                        <div style={{height:4,borderRadius:2,background: m.ram_percent>80?'#ef4444':m.ram_percent>60?'#f59e0b':'#3b82f6',width:`${Math.min(m.ram_percent,100)}%`}}></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{fontSize:11,color:st.dot,fontWeight:500,textAlign:'center',marginTop:4}}>{st.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{textAlign:'center',color:'#aaa',padding:60,fontSize:14}}>No machines found</div>
      )}
    </div>
  );
}