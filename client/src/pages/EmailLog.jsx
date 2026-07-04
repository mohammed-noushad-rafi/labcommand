import { useEffect, useState } from 'react';
import api from '../api/axios';

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
    const d = new Date(l.sent_at).toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    if (!groups[d]) groups[d] = [];
    groups[d].push(l);
  });
  return groups;
}

export default function EmailLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    api.get('/emaillog').then(r => setLogs(r.data.data||[])).finally(()=>setLoading(false));
  }, []);

  const today     = logs.filter(l => new Date(l.sent_at).toDateString() === new Date().toDateString()).length;
  const thisWeek  = logs.filter(l => Date.now() - new Date(l.sent_at).getTime() < 7*86400000).length;

  const filtered = logs.filter(l => {
    const s = search.toLowerCase();
    return !search ||
      l.subject?.toLowerCase().includes(s) ||
      l.lab_name?.toLowerCase().includes(s) ||
      l.booked_by?.toLowerCase().includes(s);
  });

  const grouped = groupByDate(filtered);

  return (
    <div style={{ padding:'36px 40px', maxWidth:1000, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ marginBottom:32, borderBottom:'1px solid #ebebf0', paddingBottom:24 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Email log</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Proof of all booking notification emails sent</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total sent',  value:logs.length, color:'#4f46e5' },
          { label:'Today',       value:today,        color:'#0f9d58' },
          { label:'This week',   value:thisWeek,     color:'#0891b2' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px', textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:5, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by subject, lab or user..."
          style={{ width:'100%', padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' }}/>
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          {logs.length === 0 ? 'No emails sent yet. Emails appear here when a lab is booked.' : 'No emails match your search.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div style={{ fontSize:11, fontWeight:700, color:'#bbb', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{date}</div>
              <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
                {entries.map((log, i) => (
                  <div key={log.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'16px 20px', borderBottom:i<entries.length-1?'1px solid #f7f7fb':'none', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafafd'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'#eef2ff', border:'1px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                      ✉️
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#16161f', marginBottom:4 }}>{log.subject}</div>
                      <div style={{ display:'flex', gap:12, fontSize:12, color:'#9494a3', flexWrap:'wrap' }}>
                        {log.lab_name && <span>🏫 {log.lab_name}</span>}
                        {log.booked_by && <span>👤 {log.booked_by}</span>}
                        {log.recipients && (
                          <span>📬 {log.recipients.split(',').length} recipient{log.recipients.split(',').length>1?'s':''}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                      <div style={{ fontSize:11, color:'#bbb' }}>{timeAgo(log.sent_at)}</div>
                      {log.preview_url ? (
                        <a href={log.preview_url} target="_blank" rel="noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, background:'#eef2ff', color:'#4f46e5', textDecoration:'none', border:'1px solid #c7d2fe', whiteSpace:'nowrap' }}>
                          View email ↗
                        </a>
                      ) : (
                        <span style={{ fontSize:11, color:'#bbb' }}>No preview</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ textAlign:'center', fontSize:11, color:'#bbb' }}>
            {filtered.length} email{filtered.length>1?'s':''} total
          </div>
        </div>
      )}
    </div>
  );
}
