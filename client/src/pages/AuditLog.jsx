import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';

const ACTION_TONE = { CREATE:'success', UPDATE:'info', DELETE:'danger', LOGIN:'purple' };

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
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader title="Audit log" subtitle="Complete record of all system actions" />

      <StatRow stats={[
        { label:'Total',   value: counts.total },
        { label:'Creates', value: counts.CREATE },
        { label:'Updates', value: counts.UPDATE },
        { label:'Deletes', value: counts.DELETE },
        { label:'Logins',  value: counts.LOGIN },
      ]} />

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by user, table, or detail" style={{ ...inputStyle, flex:1, minWidth:200 }}/>
        <div style={{ display:'flex', gap:6 }}>
          {['','CREATE','UPDATE','DELETE','LOGIN'].map(a=>(
            <button key={a} onClick={()=>setFilter(a)} style={{
              padding:'6px 12px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer',
              background: filter===a ? '#1a1a2e' : '#fff',
              color: filter===a ? '#fff' : '#888',
              borderColor: filter===a ? '#1a1a2e' : '#ececf0',
            }}>
              {a===''?'All':a}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Time','User','Action','Table','Record','Details']}
            rows={filtered}
            emptyTitle="No audit records found"
            emptySubtitle="System actions will appear here."
            renderRow={log => (
              <tr key={log.id}>
                <td style={{ ...td, fontSize:11, color:'#9494a3', whiteSpace:'nowrap' }}>
                  {new Date(log.created_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                </td>
                <td style={td}>
                  <div style={{ fontWeight:500, fontSize:12 }}>{log.user_name||'System'}</div>
                  <div style={{ fontSize:10, color:'#a8a8b8', textTransform:'capitalize' }}>{log.user_role}</div>
                </td>
                <td style={td}><Badge tone={ACTION_TONE[log.action]||'default'}>{log.action}</Badge></td>
                <td style={{ ...td, fontFamily:'monospace', fontSize:11, color:'#7c7c8a' }}>{log.table_name}</td>
                <td style={{ ...td, color:'#a8a8b8', fontSize:11 }}>#{log.record_id}</td>
                <td style={{ ...td, color:'#7c7c8a', fontSize:12 }}>{log.details}</td>
              </tr>
            )}
          />
        )}
      </Panel>
    </div>
  );
}

const td         = { padding:'12px 10px', color:'#16161f', borderBottom:'1px solid #f0f0f6' };
const inputStyle = { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, boxSizing:'border-box', outline:'none' };