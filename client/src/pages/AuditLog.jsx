import { useEffect, useState } from 'react';
import api from '../api/axios';

const ACTION_STYLE = {
  CREATE: { bg:'#eefbf3', color:'#0f9d58', border:'#bce8cc', icon:'＋' },
  UPDATE: { bg:'#eff5fe', color:'#2563eb', border:'#bfdbfe', icon:'✎' },
  DELETE: { bg:'#fef2f2', color:'#dc2626', border:'#f5bcbc', icon:'✕' },
  LOGIN:  { bg:'#f6f1fe', color:'#7c3aed', border:'#dccdfb', icon:'→' },
};

const MODULE_LABEL = {
  equipment:      '🔧 Equipment',
  maintenance:    '🛠 Maintenance',
  complaints:     '📢 Complaints',
  inventory:      '📦 Inventory',
  slots:          '📅 Booking',
  exam_sessions:  '📝 Exam',
  users:          '👤 Users',
  labs:           '🏫 Labs',
  machines:       '🖥️ Machine',
  audit_log:      '📋 Audit',
};

function moduleLabel(table) {
  return MODULE_LABEL[table] || table;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 7)   return days + 'd ago';
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
}

function groupByDate(logs) {
  const groups = {};
  logs.forEach(l => {
    const d = new Date(l.created_at).toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    if (!groups[d]) groups[d] = [];
    groups[d].push(l);
  });
  return groups;
}

export default function AuditLog() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable,  setFilterTable]  = useState('');
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 50;

  useEffect(() => {
    api.get('/auditlog').then(r => setLogs(r.data.data||[])).finally(()=>setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      l.user_name?.toLowerCase().includes(s) ||
      l.table_name?.toLowerCase().includes(s) ||
      l.details?.toLowerCase().includes(s);
    const matchAction = !filterAction || l.action === filterAction;
    const matchTable  = !filterTable  || l.table_name === filterTable;
    return matchSearch && matchAction && matchTable;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore   = filtered.length > paginated.length;

  const counts = {
    total:  logs.length,
    CREATE: logs.filter(l=>l.action==='CREATE').length,
    UPDATE: logs.filter(l=>l.action==='UPDATE').length,
    DELETE: logs.filter(l=>l.action==='DELETE').length,
    LOGIN:  logs.filter(l=>l.action==='LOGIN').length,
  };

  const tables = [...new Set(logs.map(l=>l.table_name).filter(Boolean))].sort();
  const grouped = groupByDate(paginated);

  return (
    <div style={{ padding:'36px 40px', maxWidth:1100, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ marginBottom:32, borderBottom:'1px solid #ebebf0', paddingBottom:24 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Audit log</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Complete record of all system actions</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total',   value:counts.total,  color:'#4f46e5', action:'' },
          { label:'Created', value:counts.CREATE,  color:'#0f9d58', action:'CREATE' },
          { label:'Updated', value:counts.UPDATE,  color:'#2563eb', action:'UPDATE' },
          { label:'Deleted', value:counts.DELETE,  color:'#dc2626', action:'DELETE' },
          { label:'Logins',  value:counts.LOGIN,   color:'#7c3aed', action:'LOGIN' },
        ].map(s => (
          <div key={s.label} onClick={() => { setFilterAction(filterAction===s.action&&s.action!==''?'':s.action); setPage(1); }}
            style={{ background:'#fff', border:'1px solid '+(filterAction===s.action&&s.action!==''?s.color:'#ebebf0'), borderRadius:12, padding:'16px', textAlign:'center', cursor:'pointer', transition:'all .12s' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
          placeholder="Search by user, module or details..."
          style={{ flex:1, padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none' }}/>
        <select value={filterTable} onChange={e=>{setFilterTable(e.target.value);setPage(1);}}
          style={{ padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none', background:'#fff', color:'#555' }}>
          <option value="">All modules</option>
          {tables.map(t => <option key={t} value={t}>{moduleLabel(t)}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          No audit records match your filters.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div style={{ fontSize:11, fontWeight:700, color:'#bbb', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{date}</div>
              <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
                {entries.map((log, i) => {
                  const as = ACTION_STYLE[log.action] || ACTION_STYLE.UPDATE;
                  return (
                    <div key={log.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px', borderBottom: i<entries.length-1?'1px solid #f7f7fb':'none', transition:'background .1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fafafd'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <div style={{ width:28, height:28, borderRadius:8, background:as.bg, border:'1px solid '+as.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:as.color, fontWeight:700, flexShrink:0, marginTop:1 }}>
                        {as.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'#16161f' }}>{log.user_name||'System'}</span>
                          <span style={{ fontSize:11, color:'#bbb', fontWeight:500, textTransform:'capitalize' }}>{log.user_role}</span>
                          <span style={{ padding:'1px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:as.bg, color:as.color, border:'1px solid '+as.border }}>
                            {log.action}
                          </span>
                          <span style={{ fontSize:12, color:'#7c7c8a' }}>{moduleLabel(log.table_name)}</span>
                          <span style={{ fontSize:11, color:'#c4c4cc' }}>#{log.record_id}</span>
                        </div>
                        <div style={{ fontSize:12, color:'#7c7c8a', lineHeight:1.5 }}>{log.details}</div>
                      </div>
                      <div style={{ fontSize:11, color:'#bbb', whiteSpace:'nowrap', flexShrink:0, marginTop:2 }}>
                        {timeAgo(log.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div style={{ textAlign:'center' }}>
              <button onClick={()=>setPage(p=>p+1)}
                style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 24px', fontSize:13, cursor:'pointer', color:'#555', fontWeight:500 }}>
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}

          <div style={{ textAlign:'center', fontSize:11, color:'#bbb' }}>
            Showing {paginated.length} of {filtered.length} records
          </div>
        </div>
      )}
    </div>
  );
}
