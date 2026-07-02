import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';

export default function EmailLog() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/emaillog').then(r => setLogs(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader title="Email log" subtitle="Proof of all booking notification emails sent" />

      <StatRow stats={[
        { label:'Total emails sent', value: logs.length },
        { label:'Today',             value: logs.filter(l => new Date(l.sent_at).toDateString() === new Date().toDateString()).length },
      ]} />

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Sent at','Subject','Lab','Booked by','Recipients','Preview']}
            rows={logs}
            emptyTitle="No emails sent yet"
            emptySubtitle="Emails will appear here when a lab is booked."
            renderRow={log => (
              <tr key={log.id}>
                <td style={td}>
                  <div style={{ fontSize:12, fontWeight:500 }}>
                    {new Date(log.sent_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </td>
                <td style={td}><span style={{ fontWeight:500 }}>{log.subject}</span></td>
                <td style={{ ...td, color:'#7c7c8a' }}>{log.lab_name}</td>
                <td style={{ ...td, color:'#7c7c8a' }}>{log.booked_by}</td>
                <td style={td}>
                  <div style={{ fontSize:11, color:'#7c7c8a', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {log.recipients}
                  </div>
                </td>
                <td style={td}>
                  {log.preview_url ? (
                    <a href={log.preview_url} target="_blank" rel="noreferrer" style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                      background:'#eef2ff', color:'#4f46e5', textDecoration:'none',
                    }}>
                      View email ↗
                    </a>
                  ) : '—'}
                </td>
              </tr>
            )}
          />
        )}
      </Panel>
    </div>
  );
}

const td = { padding:'12px 10px', color:'#16161f', borderBottom:'1px solid #f0f0f6' };
