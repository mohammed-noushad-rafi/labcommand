import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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

  const STATUS_COLORS = {
    scheduled: { bg:'#e0f2fe', color:'#0369a1' },
    active:    { bg:'#dcfce7', color:'#16a34a' },
    completed: { bg:'#f1f5f9', color:'#64748b' },
    cancelled: { bg:'#fee2e2', color:'#dc2626' },
  };

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Exam Monitor</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Create and manage proctored exam sessions</p>
        </div>
        <button onClick={()=>setModal(true)} style={btn('#667eea')}>+ Create exam session</button>
      </div>

      {sessions.filter(s=>s.status==='active').map(s=>(
        <div key={s.id} style={{background:'#fee2e2',border:'1.5px solid #fca5a5',borderRadius:10,padding:'14px 18px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>🔴</span>
            <div>
              <div style={{fontWeight:600,color:'#dc2626'}}>EXAM IN PROGRESS: {s.title}</div>
              <div style={{fontSize:12,color:'#ef4444'}}>{s.lab_name} · Active</div>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>navigate(`/exam/war-room/${s.id}`)} style={btn('#dc2626')}>🎯 Open war room</button>
            <button onClick={()=>endExam(s.id,s.title)} style={{...btn('#fff'),color:'#dc2626',border:'1.5px solid #dc2626'}}>End exam</button>
          </div>
        </div>
      ))}

      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Title','Lab','Date','Time','Status','Created by','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#aaa'}}>No exam sessions yet</td></tr>
            ) : sessions.map(s => (
              <tr key={s.id} style={{borderTop:'1px solid #f0f0f0'}}>
                <td style={{padding:'12px 14px',fontWeight:500,color:'#1a1a2e'}}>{s.title}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{s.lab_name}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{new Date(s.exam_date).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'12px 14px',color:'#555',fontSize:12}}>{s.start_time} – {s.end_time}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...(STATUS_COLORS[s.status]||{})}}>
                    {s.status}
                  </span>
                </td>
                <td style={{padding:'12px 14px',color:'#555'}}>{s.created_by_name}</td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    {s.status==='scheduled' && (
                      <button onClick={()=>startExam(s.id,s.title)} style={smallBtn('#16a34a')}>▶ Start</button>
                    )}
                    {s.status==='active' && (
                      <>
                        <button onClick={()=>navigate(`/exam/war-room/${s.id}`)} style={smallBtn('#dc2626')}>War room</button>
                        <button onClick={()=>endExam(s.id,s.title)} style={smallBtn('#64748b')}>End</button>
                      </>
                    )}
                    {s.status==='completed' && (
                      <button onClick={()=>navigate(`/exam/war-room/${s.id}`)} style={smallBtn('#64748b')}>View report</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Create exam session</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={lbl}>Exam title *</label>
                <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. MCA Semester Exam — Python" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Lab *</label>
                <select value={form.lab_id} onChange={e=>setForm({...form,lab_id:e.target.value})} style={sel}>
                  <option value="">Select lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Exam date *</label>
                <input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} style={inp}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={lbl}>Start time</label>
                  <input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>End time</label>
                  <input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={inp}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Auto-lock threshold (trust score)</label>
                <input type="number" min={0} max={100} value={form.auto_lock_threshold} onChange={e=>setForm({...form,auto_lock_threshold:e.target.value})} style={inp}/>
                <div style={{fontSize:11,color:'#888',marginTop:4}}>Machine locks when trust score drops below this (default: 40)</div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={save} style={btn('#667eea')}>Create session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btn      = c => ({padding:'9px 18px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500});
const smallBtn = c => ({padding:'5px 12px',background:`${c}22`,color:c,border:`1px solid ${c}`,borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:500});
const inp      = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box'};
const sel      = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box',background:'#fff'};
const lbl      = {fontSize:11,fontWeight:500,color:'#555',display:'block',marginBottom:4};
const overlay  = {position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000};
const modalBox = {background:'#fff',borderRadius:14,padding:28,width:500,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};