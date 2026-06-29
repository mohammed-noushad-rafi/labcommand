import { useEffect, useState } from 'react';
import api from '../api/axios';

const ACTION_COLORS = {
  CREATE: { bg:'#dcfce7', color:'#16a34a' },
  UPDATE: { bg:'#e0f2fe', color:'#0369a1' },
  DELETE: { bg:'#fee2e2', color:'#dc2626' },
  LOGIN:  { bg:'#ede9fe', color:'#5b21b6' },
};

export default function AuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');

  useEffect(() => {
    api.get('/auditlog').then(r => setLogs(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.user_name?.toLowerCase().includes(search.toLowerCase()) || l.table_name?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || l.action === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total:  logs.length,
    CREATE: logs.filter(l=>l.action==='CREATE').length,
    UPDATE: logs.filter(l=>l.action==='UPDATE').length,
    DELETE: logs.filter(l=>l.action==='DELETE').length,
    LOGIN:  logs.filter(l=>l.action==='LOGIN').length,
  };

  return (
    <div style={{padding:28}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Audit Log</h1>
        <p style={{fontSize:13,color:'#888',marginTop:4}}>Complete record of all system actions</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:counts.total,c:'#64748b'},{l:'Creates',v:counts.CREATE,c:'#16a34a'},{l:'Updates',v:counts.UPDATE,c:'#0369a1'},{l:'Deletes',v:counts.DELETE,c:'#dc2626'},{l:'Logins',v:counts.LOGIN,c:'#5b21b6'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by user, table, or action..." style={{...inp,flex:1,minWidth:200}}/>
        <div style={{display:'flex',gap:6}}>
          {['','CREATE','UPDATE','DELETE','LOGIN'].map(a=>(
            <button key={a} onClick={()=>setFilter(a)} style={{padding:'6px 12px',borderRadius:20,border:'1.5px solid',fontSize:12,cursor:'pointer',background:filter===a?'#667eea':'#fff',color:filter===a?'#fff':'#555',borderColor:filter===a?'#667eea':'#e0e0e0'}}>
              {a===''?'All':a}
            </button>
          ))}
        </div>
      </div>

      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Time','User','Action','Table','Record ID','Details'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#aaa'}}>No audit records found</td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} style={{borderTop:'1px solid #f0f0f0'}}>
                <td style={{padding:'10px 14px',color:'#888',fontSize:11,whiteSpace:'nowrap'}}>
                  {new Date(log.created_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                </td>
                <td style={{padding:'10px 14px'}}>
                  <div style={{fontWeight:500,color:'#1a1a2e',fontSize:12}}>{log.user_name||'System'}</div>
                  <div style={{fontSize:10,color:'#888',textTransform:'capitalize'}}>{log.user_role}</div>
                </td>
                <td style={{padding:'10px 14px'}}>
                  <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,...(ACTION_COLORS[log.action]||{bg:'#f1f5f9',color:'#64748b'})}}>
                    {log.action}
                  </span>
                </td>
                <td style={{padding:'10px 14px',color:'#555',fontFamily:'monospace',fontSize:11}}>{log.table_name}</td>
                <td style={{padding:'10px 14px',color:'#888',fontSize:11}}>#{log.record_id}</td>
                <td style={{padding:'10px 14px',color:'#555',fontSize:12}}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inp = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,boxSizing:'border-box'};