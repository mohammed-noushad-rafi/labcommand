import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Badge } from '../components/Table';
import Button from '../components/Button';

const RISK_TONE  = { critical:'danger', high:'warning', medium:'info', low:'success' };
const PALETTE    = ['#4f46e5','#0f9d58','#d97706','#dc2626','#7c3aed','#2563eb'];

export default function Predictions() {
  const [data,      setData]      = useState([]);
  const [fi,        setFi]        = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [expanded,  setExpanded]  = useState(null);
  const [filter,    setFilter]    = useState('');
  const [retraining,setRetraining]= useState(false);

  const load = () => {
    setLoading(true);
    fetch('http://localhost:8000/predict/all')
      .then(r => r.json())
      .then(r => { if (r.success) { setData(r.data); setFi(r.feature_importance); } else setError(r.message); })
      .catch(() => setError('AI service not reachable — make sure it is running on port 8000'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const retrain = async () => {
    setRetraining(true);
    await fetch('http://localhost:8000/train', { method:'POST' });
    setRetraining(false); load();
  };

  const counts = {
    critical: data.filter(d=>d.risk_level==='critical').length,
    high:     data.filter(d=>d.risk_level==='high').length,
    medium:   data.filter(d=>d.risk_level==='medium').length,
    low:      data.filter(d=>d.risk_level==='low').length,
    anomaly:  data.filter(d=>d.is_anomaly).length,
  };

  const filtered = filter ? data.filter(d => d.risk_level === filter) : data;
  const fiData = fi ? Object.entries(fi).map(([k,v]) => ({ feature:k.replace('_',' '), importance:Math.round(v*100) })).sort((a,b)=>b.importance-a.importance) : [];

  if (loading) return <div style={s.loading}>Loading AI predictions</div>;

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="AI predictions"
        subtitle="RandomForest maintenance prediction + Isolation Forest anomaly detection"
        action={<Button onClick={retrain} disabled={retraining} style={{ opacity:retraining?0.6:1 }}>{retraining ? 'Retraining...' : 'Retrain models'}</Button>}
      />

      {error && (
        <div style={{ background:'#fde9e9', border:'1px solid #f8caca', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'#b91c1c', fontSize:13 }}>
          {error}
        </div>
      )}

      <StatRow stats={[
        { label:'Critical',  value: counts.critical },
        { label:'High risk', value: counts.high },
        { label:'Medium',    value: counts.medium },
        { label:'Low risk',  value: counts.low },
        { label:'Anomalies', value: counts.anomaly },
      ]} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:20 }}>
        {fiData.length > 0 && (
          <Panel title="Model feature importance">
            <p style={{ fontSize:11, color:'#a8a8b8', marginBottom:14 }}>Which factors drive the maintenance prediction</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={fiData} layout="vertical">
                <XAxis type="number" tickFormatter={v=>`${v}%`} tick={{fontSize:11,fill:'#a8a8b8'}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="feature" width={120} tick={{fontSize:11,fill:'#7c7c8a'}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>`${v}%`}/>
                <Bar dataKey="importance" radius={[0,4,4,0]}>
                  {fiData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}

        <Panel title="Model info">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { title:'RandomForest Regressor', color:'#2563eb', bg:'#eff5fe', desc:`Predicts days until next maintenance. 100 estimators, trained on ${data.length} equipment items.` },
              { title:'Isolation Forest',       color:'#7c3aed', bg:'#f6f1fe', desc:'Detects anomalous equipment behaviour. Contamination rate: 20%.' },
              { title:'Features used',          color:'#0f9d58', bg:'#eefbf3', desc:'Usage hours, fault count, days since service, maintenance history, complaints, category.' },
            ].map(m=>(
              <div key={m.title} style={{ background:m.bg, borderRadius:9, padding:'10px 12px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.title}</div>
                <div style={{ fontSize:11, color:'#7c7c8a', marginTop:3 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14, alignItems:'center' }}>
        <span style={{ fontSize:12, color:'#7c7c8a' }}>Filter:</span>
        {['','critical','high','medium','low'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'5px 14px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer',
            background: filter===f ? '#4f46e5' : '#fff',
            color: filter===f ? '#fff' : '#7c7c8a',
            borderColor: filter===f ? '#4f46e5' : '#e9e9f0',
          }}>
            {f===''?'All':f}
          </button>
        ))}
        <span style={{ fontSize:12, color:'#a8a8b8', marginLeft:8 }}>{filtered.length} items</span>
      </div>

      <Panel>
        <table style={s.table}>
          <thead><tr>{['Equipment','Lab','Status','Usage hrs','Faults','Days since service','Risk','Days until service','Anomaly'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(item => {
              const isExp = expanded === item.id;
              return (
                <>
                  <tr key={item.id} onClick={()=>setExpanded(isExp?null:item.id)} style={{ cursor:'pointer', background:isExp?'#f7f7fb':undefined }}>
                    <td style={s.td}><div style={{ fontWeight:500 }}>{item.name}</div><div style={{ fontSize:10, color:'#a8a8b8' }}>{item.category}</div></td>
                    <td style={{ ...s.td, color:'#9494a3' }}>{item.lab_name}</td>
                    <td style={s.td}><Badge tone={item.status==='working'?'success':item.status==='faulty'?'danger':'warning'}>{item.status}</Badge></td>
                    <td style={s.td}>{item.usage_hours}</td>
                    <td style={{ ...s.td, color:item.fault_count>2?'#dc2626':'#16161f', fontWeight:item.fault_count>2?700:400 }}>{item.fault_count}</td>
                    <td style={{ ...s.td, color:'#9494a3' }}>{item.days_since_service} days</td>
                    <td style={s.td}><Badge tone={RISK_TONE[item.risk_level]}>{item.risk_level}</Badge></td>
                    <td style={{ ...s.td, fontWeight:600 }}>{item.days_until_service} days</td>
                    <td style={s.td}>{item.is_anomaly ? <Badge tone="purple">Anomaly</Badge> : <span style={{ fontSize:11, color:'#a8a8b8' }}>Normal</span>}</td>
                  </tr>
                  {isExp && (
                    <tr key={`exp-${item.id}`} style={{ background:'#f7f7fb' }}>
                      <td colSpan={9} style={{ padding:'16px' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#16161f', marginBottom:10 }}>Feature importance for {item.name}</div>
                        <div style={{ height:120 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(item.feature_importance).map(([k,v])=>({feature:k.replace('_',' '),importance:Math.round(v*100)})).sort((a,b)=>b.importance-a.importance)} layout="vertical">
                              <XAxis type="number" tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:'#a8a8b8'}} axisLine={false} tickLine={false}/>
                              <YAxis type="category" dataKey="feature" width={130} tick={{fontSize:10,fill:'#7c7c8a'}} axisLine={false} tickLine={false}/>
                              <Tooltip formatter={v=>`${v}%`}/>
                              <Bar dataKey="importance" fill="#4f46e5" radius={[0,3,3,0]}/>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ fontSize:11, color:'#a8a8b8', marginTop:8 }}>Anomaly score: <strong>{item.anomaly_score}</strong> · Click row to collapse</div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

const s = {
  loading: { padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:      { textAlign:'left', padding:'11px 12px', color:'#a8a8b8', fontWeight:700, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'2px solid #f0f0f6', background:'#fafafd' },
  td:      { padding:'13px 12px', color:'#16161f', borderBottom:'1px solid #f0f0f6' },
};