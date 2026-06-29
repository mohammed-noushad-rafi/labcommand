import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_COLORS = {
  critical: { bg:'#fee2e2', color:'#dc2626', bar:'#dc2626' },
  high:     { bg:'#fef9c3', color:'#ca8a04', bar:'#f59e0b' },
  medium:   { bg:'#e0f2fe', color:'#0369a1', bar:'#3b82f6' },
  low:      { bg:'#f0fdf4', color:'#16a34a', bar:'#22c55e' },
};

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
      .then(r => {
        if (r.success) { setData(r.data); setFi(r.feature_importance); }
        else setError(r.message);
      })
      .catch(() => setError('AI service not reachable — make sure it is running on port 8000'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const retrain = async () => {
    setRetraining(true);
    await fetch('http://localhost:8000/train', { method:'POST' });
    setRetraining(false);
    load();
  };

  const counts = {
    critical: data.filter(d=>d.risk_level==='critical').length,
    high:     data.filter(d=>d.risk_level==='high').length,
    medium:   data.filter(d=>d.risk_level==='medium').length,
    low:      data.filter(d=>d.risk_level==='low').length,
    anomaly:  data.filter(d=>d.is_anomaly).length,
  };

  const filtered = filter ? data.filter(d => d.risk_level === filter) : data;

  const fiData = fi ? Object.entries(fi)
    .map(([k,v]) => ({ feature: k.replace('_',' '), importance: Math.round(v*100) }))
    .sort((a,b) => b.importance - a.importance)
    : [];

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Loading AI predictions...</div>;

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>AI Predictions</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>RandomForest maintenance prediction + Isolation Forest anomaly detection</p>
        </div>
        <button onClick={retrain} disabled={retraining} style={{padding:'9px 18px',background:'#667eea',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500,opacity:retraining?0.6:1}}>
          {retraining ? '🔄 Retraining...' : '🔄 Retrain models'}
        </button>
      </div>

      {error && (
        <div style={{background:'#fff5f5',border:'1.5px solid #fca5a5',borderRadius:10,padding:'12px 16px',marginBottom:20,color:'#dc2626',fontSize:13}}>
          ⚠️ {error}
        </div>
      )}

      {/* Risk summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
        {[
          {l:'Critical', v:counts.critical, c:'#dc2626', k:'critical'},
          {l:'High risk', v:counts.high,     c:'#ca8a04', k:'high'},
          {l:'Medium',   v:counts.medium,    c:'#0369a1', k:'medium'},
          {l:'Low risk', v:counts.low,       c:'#16a34a', k:'low'},
          {l:'Anomalies',v:counts.anomaly,   c:'#7c3aed', k:'anomaly'},
        ].map(s=>(
          <div key={s.l} onClick={()=>setFilter(s.k==='anomaly'?filter:filter===s.k?'':s.k)}
            style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',cursor:'pointer',border:filter===s.k?`2px solid ${s.c}`:'2px solid transparent'}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,marginBottom:20}}>
        {/* Feature importance chart */}
        {fiData.length > 0 && (
          <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:6}}>Model feature importance</h3>
            <p style={{fontSize:11,color:'#888',marginBottom:14}}>Which factors drive the maintenance prediction</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={fiData} layout="vertical">
                <XAxis type="number" tickFormatter={v=>`${v}%`} style={{fontSize:11}}/>
                <YAxis type="category" dataKey="feature" width={120} style={{fontSize:11}}/>
                <Tooltip formatter={v=>`${v}%`}/>
                <Bar dataKey="importance" radius={[0,4,4,0]}>
                  {fiData.map((_, i) => <Cell key={i} fill={['#667eea','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i%6]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Model info */}
        <div style={{background:'#fff',borderRadius:12,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:14,fontWeight:600,color:'#1a1a2e',marginBottom:14}}>Model info</h3>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{background:'#f0f9ff',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#0369a1'}}>🌲 RandomForest Regressor</div>
              <div style={{fontSize:11,color:'#888',marginTop:3}}>Predicts days until next maintenance. 100 estimators, trained on {data.length} equipment items.</div>
            </div>
            <div style={{background:'#fdf4ff',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#7c3aed'}}>🔍 Isolation Forest</div>
              <div style={{fontSize:11,color:'#888',marginTop:3}}>Detects anomalous equipment behaviour. Contamination rate: 20%.</div>
            </div>
            <div style={{background:'#f0fdf4',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#16a34a'}}>📊 Features used</div>
              <div style={{fontSize:11,color:'#888',marginTop:3}}>Usage hours, fault count, days since service, maintenance history, complaints, category.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
        <span style={{fontSize:12,color:'#888'}}>Filter:</span>
        {['','critical','high','medium','low'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,cursor:'pointer',background:filter===f?'#667eea':'#fff',color:filter===f?'#fff':'#555',borderColor:filter===f?'#667eea':'#e0e0e0'}}>
            {f===''?'All':f}
          </button>
        ))}
        <span style={{fontSize:12,color:'#888',marginLeft:8}}>{filtered.length} items</span>
      </div>

      {/* Equipment predictions table */}
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Equipment','Lab','Status','Usage hrs','Faults','Days since service','Risk','Days until service','Anomaly'].map(h=>(
                <th key={h} style={{padding:'11px 12px',textAlign:'left',color:'#888',fontWeight:500,fontSize:11}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const risk = RISK_COLORS[item.risk_level] || RISK_COLORS.low;
              const isExp = expanded === item.id;
              return (
                <>
                  <tr key={item.id}
                    onClick={()=>setExpanded(isExp ? null : item.id)}
                    style={{borderTop:'1px solid #f0f0f0',cursor:'pointer',background:isExp?'#f8faff':item.is_anomaly?'#fdfaff':''}}>
                    <td style={{padding:'11px 12px'}}>
                      <div style={{fontWeight:500,color:'#1a1a2e'}}>{item.name}</div>
                      <div style={{fontSize:10,color:'#888'}}>{item.category}</div>
                    </td>
                    <td style={{padding:'11px 12px',color:'#555',fontSize:12}}>{item.lab_name}</td>
                    <td style={{padding:'11px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:500,background:item.status==='working'?'#dcfce7':item.status==='faulty'?'#fee2e2':'#fef9c3',color:item.status==='working'?'#16a34a':item.status==='faulty'?'#dc2626':'#ca8a04'}}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{padding:'11px 12px',color:'#555'}}>{item.usage_hours}</td>
                    <td style={{padding:'11px 12px',color:item.fault_count>2?'#dc2626':'#555',fontWeight:item.fault_count>2?600:400}}>{item.fault_count}</td>
                    <td style={{padding:'11px 12px',color:'#555'}}>{item.days_since_service} days</td>
                    <td style={{padding:'11px 12px'}}>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:risk.bg,color:risk.color}}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td style={{padding:'11px 12px'}}>
                      <div style={{fontWeight:600,color:risk.color}}>{item.days_until_service} days</div>
                    </td>
                    <td style={{padding:'11px 12px'}}>
                      {item.is_anomaly
                        ? <span style={{fontSize:11,color:'#7c3aed',fontWeight:600}}>⚠ Anomaly</span>
                        : <span style={{fontSize:11,color:'#888'}}>Normal</span>}
                    </td>
                  </tr>
                  {isExp && (
                    <tr key={`exp-${item.id}`} style={{background:'#f8faff',borderTop:'1px solid #e8e8f8'}}>
                      <td colSpan={9} style={{padding:'14px 16px'}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#1a1a2e',marginBottom:10}}>
                          Feature importance for {item.name}
                        </div>
                        <div style={{height:120}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(item.feature_importance).map(([k,v])=>({feature:k.replace('_',' '),importance:Math.round(v*100)})).sort((a,b)=>b.importance-a.importance)} layout="vertical">
                              <XAxis type="number" tickFormatter={v=>`${v}%`} style={{fontSize:10}}/>
                              <YAxis type="category" dataKey="feature" width={130} style={{fontSize:10}}/>
                              <Tooltip formatter={v=>`${v}%`}/>
                              <Bar dataKey="importance" fill="#667eea" radius={[0,3,3,0]}/>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{fontSize:11,color:'#888',marginTop:8}}>
                          Anomaly score: <strong>{item.anomaly_score}</strong> · 
                          Click row again to collapse
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}