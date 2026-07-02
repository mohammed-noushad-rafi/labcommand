import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';
import Button from '../components/Button';

const STATUS_TONE = { scheduled:'info', active:'success', completed:'default', cancelled:'danger' };

const empty = { lab_id:'', title:'', exam_date:'', start_time:'', end_time:'', auto_lock_threshold:40 };

export default function ExamSetup() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [labs,     setLabs]     = useState([]);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(empty);
  const [loading,  setLoading]  = useState(true);

  const load = () => {
    api.get('/exams').then(r => setSessions(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); api.get('/labs').then(r => setLabs(r.data.data || [])); }, []);

  const save = async () => {
    try {
      await api.post('/exams', form);
      setModal(false); setForm(empty); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const startExam = async (id, title) => {
    if (!window.confirm(`Start exam: "${title}"? This will lock all online machines in the lab.`)) return;
    try {
      const r = await api.post(`/exams/${id}/start`);
      alert(`Exam started — ${r.data.machines} machines locked`);
      navigate(`/exam/war-room/${id}`);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const endExam = async (id, title) => {
    if (!window.confirm(`End exam: "${title}"?`)) return;
    await api.post(`/exams/${id}/end`);
    load();
  };

  const counts = {
    total:     sessions.length,
    scheduled: sessions.filter(s=>s.status==='scheduled').length,
    active:    sessions.filter(s=>s.status==='active').length,
    completed: sessions.filter(s=>s.status==='completed').length,
  };

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="Exam monitor"
        subtitle="Create and manage proctored exam sessions"
        action={<Button onClick={()=>setModal(true)}>Create exam session</Button>}
      />

      <StatRow stats={[
        { label:'Total',     value: counts.total },
        { label:'Scheduled', value: counts.scheduled },
        { label:'Active',    value: counts.active },
        { label:'Completed', value: counts.completed },
      ]} />

      {sessions.filter(s=>s.status==='active').map(s=>(
        <div key={s.id} style={liveBanner}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:9, height:9, borderRadius:'50%', background:'#dc2626', flexShrink:0 }} />
            <div>
              <div style={{ fontWeight:700, color:'#b91c1c' }}>Exam in progress: {s.title}</div>
              <div style={{ fontSize:12, color:'#dc2626' }}>{s.lab_name} · Active</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="danger" onClick={()=>navigate(`/exam/war-room/${s.id}`)} style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', border:'none' }}>Open war room</Button>
            <Button variant="secondary" onClick={()=>endExam(s.id,s.title)}>End exam</Button>
          </div>
        </div>
      ))}

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Title','Lab','Date','Time','Status','Created by','']}
            rows={sessions}
            emptyTitle="No exam sessions yet"
            emptySubtitle="Create a session to begin proctoring."
            renderRow={s => (
              <tr key={s.id}>
                <td style={td}><span style={{ fontWeight:500 }}>{s.title}</span></td>
                <td style={{ ...td, color:'#999' }}>{s.lab_name}</td>
                <td style={{ ...td, color:'#999' }}>{new Date(s.exam_date).toLocaleDateString('en-IN')}</td>
                <td style={{ ...td, color:'#999', fontSize:12 }}>{s.start_time} – {s.end_time}</td>
                <td style={td}><Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge></td>
                <td style={{ ...td, color:'#999' }}>{s.created_by_name}</td>
                <td style={td}>
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    {s.status==='scheduled' && <Button onClick={()=>startExam(s.id,s.title)} style={{ padding:'5px 12px', fontSize:12 }}>Start</Button>}
                    {s.status==='active' && (
                      <>
                        <Button variant="danger" onClick={()=>navigate(`/exam/war-room/${s.id}`)} style={{ padding:'5px 12px', fontSize:12 }}>War room</Button>
                        <Button variant="secondary" onClick={()=>endExam(s.id,s.title)} style={{ padding:'5px 12px', fontSize:12 }}>End</Button>
                      </>
                    )}
                    {s.status==='completed' && <Button variant="secondary" onClick={()=>navigate(`/exam/war-room/${s.id}`)} style={{ padding:'5px 12px', fontSize:12 }}>View report</Button>}
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </Panel>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Create exam session</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={labelStyle}>Exam title</label>
                <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. MCA Semester Exam — Python" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Lab</label>
                <select value={form.lab_id} onChange={e=>setForm({...form,lab_id:e.target.value})} style={selectStyle}>
                  <option value="">Select lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Exam date</label>
                <input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} style={inputStyle}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Start time</label>
                  <input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>End time</label>
                  <input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={inputStyle}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Auto-lock threshold</label>
                <input type="number" min={0} max={100} value={form.auto_lock_threshold} onChange={e=>setForm({...form,auto_lock_threshold:e.target.value})} style={inputStyle}/>
                <div style={{ fontSize:11, color:'#a8a8b8', marginTop:4 }}>Machine locks when trust score drops below this (default: 40)</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
              <Button onClick={save}>Create session</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td         = { padding:'12px 10px', color:'#1a1a2e', borderBottom:'1px solid #f5f5f7' };
const liveBanner = { background:'#fde9e9', border:'1px solid #f8caca', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 };
const inputStyle = { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', outline:'none' };
const selectStyle= { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', background:'#fff', outline:'none' };
const labelStyle = { fontSize:11, fontWeight:500, color:'#888', display:'block', marginBottom:4 };
const overlay    = { position:'fixed', inset:0, background:'rgba(26,26,46,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalBox   = { background:'#fff', borderRadius:12, padding:28, width:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' };