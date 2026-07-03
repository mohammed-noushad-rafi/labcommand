import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const DEPT_META = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5', hasComputers:true },
  'Physics':          { icon:'⚛️',  color:'#0891b2', hasComputers:false },
  'Chemistry':        { icon:'🧪', color:'#0f9d58', hasComputers:false },
};
function getMeta(n) { return DEPT_META[n] || { icon:'🏫', color:'#4f46e5', hasComputers:false }; }

const EXAM_SUBJECTS = {
  'Computer Science': [
    'Python Programming','Data Structures','Database Management','Computer Networks',
    'Operating Systems','Web Technologies','Software Engineering','Java Programming',
    'C Programming','Algorithms','Computer Architecture','Cloud Computing',
  ],
  'Physics': [
    'Mechanics','Optics','Electromagnetism','Thermodynamics','Quantum Physics',
    'Nuclear Physics','Wave Motion','Modern Physics','Semiconductor Physics',
  ],
  'Chemistry': [
    'Organic Chemistry','Inorganic Chemistry','Physical Chemistry','Analytical Chemistry',
    'Biochemistry','Environmental Chemistry','Polymer Chemistry','Industrial Chemistry',
  ],
};

const STATUS_STYLE = {
  scheduled: { bg:'#eff5fe', color:'#2563eb', border:'#bfdbfe', dot:'#2563eb' },
  active:    { bg:'#fef2f2', color:'#dc2626', border:'#f5bcbc', dot:'#dc2626' },
  completed: { bg:'#f5f5f7', color:'#9494a3', border:'#e0e0e6', dot:'#9494a3' },
  cancelled: { bg:'#fef8ee', color:'#d97706', border:'#fde68a', dot:'#d97706' },
};

// LEVEL 1 — Departments
function DeptLevel({ departments, sessions, onSelect }) {
  const activeAll = sessions.filter(s=>s.status==='active');
  return (
    <div>
      <div style={{ marginBottom: activeAll.length>0 ? 20 : 40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Exam monitor</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Create and manage proctored exam sessions</p>
      </div>

      {activeAll.length > 0 && (
        <div style={{ marginBottom:28 }}>
          {activeAll.map(s => (
            <ActiveBanner key={s.id} session={s}/>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          const deptSessions = sessions.filter(s => d.labs.some(l=>l.id===s.lab_id));
          const active    = deptSessions.filter(s=>s.status==='active').length;
          const scheduled = deptSessions.filter(s=>s.status==='scheduled').length;
          const completed = deptSessions.filter(s=>s.status==='completed').length;
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid '+(active>0?'#f5bcbc':'#ebebf0'), borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px '+meta.color+'12'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=active>0?'#f5bcbc':'#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ fontSize:34, marginBottom:18 }}>{meta.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#16161f', marginBottom:4 }}>{d.department}</div>
              <div style={{ fontSize:12, color:'#bbb', marginBottom:8 }}>{d.lab_count} lab{d.lab_count>1?'s':''}</div>
              <div style={{ marginBottom:12 }}>
                <span style={{ fontSize:10.5, fontWeight:600, padding:'3px 8px', borderRadius:6,
                  background: meta.hasComputers ? '#eef2ff' : '#f5f5f7',
                  color: meta.hasComputers ? '#4f46e5' : '#9494a3' }}>
                  {meta.hasComputers ? '🖥️ Full monitoring' : '📋 Schedule only'}
                </span>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {active>0    && <span style={{ fontSize:11, color:'#dc2626', fontWeight:700 }}>🔴 {active} live</span>}
                {scheduled>0 && <span style={{ fontSize:11, color:'#2563eb', fontWeight:600 }}>{scheduled} scheduled</span>}
                {completed>0 && <span style={{ fontSize:11, color:'#9494a3', fontWeight:500 }}>{completed} completed</span>}
                {deptSessions.length===0 && <span style={{ fontSize:11, color:'#bbb' }}>No sessions yet</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveBanner({ session }) {
  const navigate = useNavigate();
  const endExam = async () => {
    if (!window.confirm('End exam: "'+session.title+'"?')) return;
    await api.post('/exams/'+session.id+'/end');
    window.location.reload();
  };
  return (
    <div style={{ background:'#fef2f2', border:'1px solid #f5bcbc', borderRadius:12, padding:'14px 20px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ width:9, height:9, borderRadius:'50%', background:'#dc2626', animation:'pulse 1s infinite', flexShrink:0 }}/>
        <div>
          <div style={{ fontWeight:700, color:'#b91c1c', fontSize:14 }}>Live: {session.title}</div>
          <div style={{ fontSize:12, color:'#dc2626', marginTop:2 }}>{session.lab_name} · Started</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>navigate('/exam/war-room/'+session.id)} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:9, padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          Open War Room
        </button>
        <button onClick={endExam} style={{ background:'none', border:'1px solid #f5bcbc', color:'#dc2626', borderRadius:9, padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          End exam
        </button>
      </div>
    </div>
  );
}

// LEVEL 2 — Labs
function LabLevel({ dept, sessions, onSelect, onBack }) {
  const meta = getMeta(dept.department);
  return (
    <div>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ marginBottom:36, marginTop:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <span style={{ fontSize:22 }}>{meta.icon}</span>
          <span style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{dept.department}</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>Select a lab</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs — click to manage exam sessions</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab,idx) => {
          const isComputer  = getMeta(dept.department).hasComputers;
  const labSessions = sessions.filter(s=>s.lab_id===lab.id);
          const active    = labSessions.filter(s=>s.status==='active').length;
          const scheduled = labSessions.filter(s=>s.status==='scheduled').length;
          const completed = labSessions.filter(s=>s.status==='completed').length;
          return (
            <div key={lab.id} onClick={()=>onSelect(lab)}
              style={{ background:'#fff', border:'1px solid '+(active>0?'#f5bcbc':'#ebebf0'), borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=active>0?'#f5bcbc':'#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:active>0?'#fef2f2':meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:active>0?'#dc2626':meta.color }}>
                  {active>0?'🔴':'L'+(idx+1)}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · {lab.capacity} seats</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ display:'flex', gap:10, fontSize:11 }}>
                  {active>0    && <span style={{ color:'#dc2626', fontWeight:700 }}>🔴 {active} live</span>}
                  {scheduled>0 && <span style={{ color:'#2563eb', fontWeight:600 }}>{scheduled} scheduled</span>}
                  {completed>0 && <span style={{ color:'#9494a3' }}>{completed} completed</span>}
                  {labSessions.length===0 && <span style={{ color:'#bbb' }}>No sessions</span>}
                </div>
                <span style={{ fontSize:18, color:'#ddd' }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LEVEL 3 — Exam sessions for lab
function LabExams({ lab, dept, sessions, onBack, onBackToDept, onRefresh }) {
  const navigate = useNavigate();
  const meta     = getMeta(dept.department);
  const subjects = EXAM_SUBJECTS[dept.department] || [];
  const [modal,    setModal]   = useState(false);
  const [loading,  setLoading] = useState(false);
  const [subjInput,setSubjInput]=useState('');
  const [showSubj, setShowSubj]=useState(false);
  const [form, setForm] = useState({
    lab_id:lab.id, title:'', exam_date:'', start_time:'', end_time:'', auto_lock_threshold:40,
  });

  const labSessions = sessions.filter(s=>s.lab_id===lab.id);
  const counts = {
    total:labSessions.length,
    active:labSessions.filter(s=>s.status==='active').length,
    scheduled:labSessions.filter(s=>s.status==='scheduled').length,
    completed:labSessions.filter(s=>s.status==='completed').length,
  };

  const save = async () => {
    if (!subjInput) return alert('Please enter exam title');
    if (!form.exam_date||!form.start_time||!form.end_time) return alert('Please fill date and time');
    setLoading(true);
    try {
      await api.post('/exams', { ...form, title:subjInput });
      setModal(false);
      setSubjInput('');
      onRefresh();
    } catch (err) { alert(err.response?.data?.message||'Error'); }
    finally { setLoading(false); }
  };

  const startExam = async (id, title) => {
    const msg = isComputer
      ? 'Start exam: "'+title+'"? This will lock all online machines.'
      : 'Start exam: "'+title+'"?';
    if (!window.confirm(msg)) return;
    try {
      const r = await api.post('/exams/'+id+'/start');
      if (isComputer) {
        alert('Exam started — '+r.data.machines+' machines locked');
        navigate('/exam/war-room/'+id);
      } else {
        alert('Exam session started');
        onRefresh();
      }
    } catch (err) { alert(err.response?.data?.message||'Error'); }
  };

  const endExam = async (id, title) => {
    if (!window.confirm('End exam: "'+title+'"?')) return;
    await api.post('/exams/'+id+'/end');
    onRefresh();
  };

  const subjSuggestions = subjects.filter(s=>s.toLowerCase().includes(subjInput.toLowerCase())&&subjInput.length>0);

  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:28, flexWrap:'wrap' }}>
        <button onClick={onBackToDept} style={backBtn}>← Departments</button>
        <span style={{ color:'#e0e0e6' }}>›</span>
        <button onClick={onBack} style={{ ...backBtn, color:meta.color }}>{dept.department}</button>
        <span style={{ color:'#e0e0e6' }}>›</span>
        <span style={{ fontSize:12, color:'#9494a3', fontWeight:500 }}>{lab.name}</span>
      </div>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, borderBottom:'1px solid #ebebf0', paddingBottom:24 }}>
        <div>
          <div style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{dept.department} Department</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>{lab.name}</h1>
          <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Exam sessions · Capacity: {lab.capacity} seats</p>
        </div>
        <button onClick={()=>setModal(true)} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Create exam session
        </button>
      </div>

      {isComputer && labSessions.filter(s=>s.status==='active').map(s=>(
        <ActiveBanner key={s.id} session={s}/>
      ))}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',     value:counts.total,     color:'#4f46e5' },
          { label:'Live',      value:counts.active,    color:'#dc2626' },
          { label:'Scheduled', value:counts.scheduled, color:'#2563eb' },
          { label:'Completed', value:counts.completed, color:'#9494a3' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {labSessions.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          No exam sessions for this lab yet. Click Create exam session to get started.
        </div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Exam title','Date','Time','Machines','Status','Created by',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {labSessions.map(s => {
                const ss = STATUS_STYLE[s.status]||STATUS_STYLE.scheduled;
                return (
                  <tr key={s.id} onMouseEnter={e=>e.currentTarget.style.background='#fafafd'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={td}>
                      <div style={{ fontWeight:600, color:'#16161f' }}>{s.title}</div>
                      <div style={{ fontSize:10.5, color:'#bbb', marginTop:2 }}>Threshold: {s.auto_lock_threshold}%</div>
                    </td>
                    <td style={{ ...td, color:'#9494a3' }}>{new Date(s.exam_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={{ ...td, color:'#9494a3', fontWeight:500 }}>{s.start_time} – {s.end_time}</td>
                    <td style={{ ...td, color:'#9494a3' }}>{s.machine_count||0}</td>
                    <td style={td}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:ss.bg, color:ss.color, border:'1px solid '+ss.border }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:ss.dot }}/>{s.status}
                      </span>
                    </td>
                    <td style={{ ...td, color:'#9494a3' }}>{s.created_by_name}</td>
                    <td style={td}>
                      <div style={{ display:'flex', gap:6 }}>
                        {s.status==='scheduled' && (
                          <button onClick={()=>startExam(s.id,s.title)} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Start</button>
                        )}
                        {s.status==='active' && (
                          <>
                            {isComputer && <button onClick={()=>navigate('/exam/war-room/'+s.id)} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>War Room</button>}
                            <button onClick={()=>endExam(s.id,s.title)} style={{ background:'none', border:'1px solid #f5bcbc', color:'#dc2626', borderRadius:7, padding:'5px 12px', fontSize:12, cursor:'pointer' }}>End</button>
                          </>
                        )}
                        {s.status==='completed' && isComputer && (
                          <button onClick={()=>navigate('/exam/war-room/'+s.id)} style={{ background:'none', border:'1px solid #ebebf0', color:'#555', borderRadius:7, padding:'5px 12px', fontSize:12, cursor:'pointer' }}>Report</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Create exam session</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{lab.name} · {dept.department}</p>
              {!isComputer && (
                <div style={{ background:'#f5f5f7', borderRadius:8, padding:'8px 12px', marginTop:8, fontSize:12, color:'#9494a3' }}>
                  📋 Schedule-only mode — no machine monitoring for {dept.department} labs
                </div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lbl}>Subject / Exam title *</label>
                <div style={{ position:'relative' }}>
                  <input value={subjInput} onChange={e=>{setSubjInput(e.target.value);setShowSubj(true);}}
                    onFocus={()=>setShowSubj(true)}
                    placeholder={'Search '+dept.department+' subjects or type custom...'}
                    style={inp}/>
                  {showSubj && subjSuggestions.length>0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ebebf0', borderRadius:10, boxShadow:'0 8px 24px rgba(16,16,31,0.1)', zIndex:300, maxHeight:180, overflowY:'auto', marginTop:4 }}>
                      {subjSuggestions.map(s=>(
                        <div key={s} onClick={()=>{setSubjInput(s);setShowSubj(false);}}
                          style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, color:'#16161f', borderBottom:'1px solid #f7f7fb' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#f7f7ff'}
                          onMouseLeave={e=>e.currentTarget.style.background=''}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={lbl}>Exam date *</label>
                <input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} style={inp}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Start time *</label>
                  <input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>End time *</label>
                  <input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={inp}/>
                </div>
              </div>

              <div>
                <label style={lbl}>Auto-lock threshold (%)</label>
                <input type="range" min={0} max={100} value={form.auto_lock_threshold}
                  onChange={e=>setForm({...form,auto_lock_threshold:parseInt(e.target.value)})}
                  style={{ width:'100%', accentColor:meta.color }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#9494a3', marginTop:4 }}>
                  <span>0% — Never lock</span>
                  <span style={{ fontWeight:700, color:meta.color }}>{form.auto_lock_threshold}%</span>
                  <span>100% — Always lock</span>
                </div>
                <div style={{ fontSize:11, color:'#bbb', marginTop:4 }}>Machine locks when trust score drops below this value</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} disabled={loading} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1 }}>
                {loading?'Creating...':'Create session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamSetup() {
  const [departments, setDepartments] = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      api.get('/labs/departments').then(r => setDepartments(r.data.data||[])),
      api.get('/exams').then(r => setSessions(r.data.data||[])),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabExams lab={lab} dept={dept} sessions={sessions} onBack={()=>setLab(null)} onBackToDept={()=>{setLab(null);setDept(null);}} onRefresh={loadAll}/>
      ) : dept ? (
        <LabLevel dept={dept} sessions={sessions} onSelect={l=>setLab(l)} onBack={()=>setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} sessions={sessions} onSelect={d=>setDept(d)}/>
      )}
    </div>
  );
}

const backBtn = { background:'none', border:'1px solid #ebebf0', color:'#7c7c8a', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500 };
const td      = { padding:'12px 14px', color:'#16161f', borderBottom:'1px solid #f7f7fb', fontSize:13 };
const lbl     = { display:'block', fontSize:11.5, fontWeight:600, color:'#7c7c8a', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' };
const inp     = { padding:'9px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f' };
const overlay = { position:'fixed', inset:0, background:'rgba(16,16,31,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalBox= { background:'#fff', borderRadius:18, padding:'32px', width:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(16,16,31,0.18)' };
