import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DeptIcon from '../components/DeptIcon';
import { sortDepts } from '../utils/deptOrder';

const DEPT_META = {
  'Computer Science': { color:'#4f46e5' },
  'Physics':          { color:'#0891b2' },
  'Chemistry':        { color:'#0f9d58' },
};
function getMeta(n) { return DEPT_META[n] || { color:'#4f46e5' }; }

const STATUS_STYLE = {
  booked:     { bg:'#eff5fe', color:'#2563eb', border:'#bfdbfe' },
  checked_in: { bg:'#eefbf3', color:'#0f9d58', border:'#bce8cc' },
  completed:  { bg:'#f5f5f7', color:'#9494a3', border:'#e0e0e6' },
  cancelled:  { bg:'#fef2f2', color:'#dc2626', border:'#f5bcbc' },
  no_show:    { bg:'#fef8ee', color:'#d97706', border:'#fbd38a' },
};

const PURPOSE_OPTIONS = [
  'Practical session','Lab exam','Project work','Research','Demo class',
  'Faculty experiment','Student project','Workshop','Viva exam','Other',
];

const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
];

function today() { return new Date().toISOString().split('T')[0]; }

// LEVEL 1 — Departments
function DeptLevel({ departments, slots, onSelect }) {
  const todayStr = today();
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Lab booking</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Select a department to book a lab slot</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          const todaySlots = slots.filter(s =>
            d.labs.some(l => l.id === s.lab_id) &&
            s.date?.split('T')[0] === todayStr &&
            s.status === 'booked'
          );
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px '+meta.color+'12'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ marginBottom:18 }}><DeptIcon department={d.department} size={34}/></div>
              <div style={{ fontSize:18, fontWeight:700, color:'#16161f', marginBottom:4 }}>{d.department}</div>
              <div style={{ fontSize:12, color:'#bbb', fontWeight:500 }}>{d.lab_count} lab{d.lab_count>1?'s':''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LEVEL 2 — Labs in department
function LabLevel({ dept, slots, onSelect, onBack }) {
  const meta = getMeta(dept.department);
  const todayStr = today();
  return (
    <div>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ marginBottom:36, marginTop:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <DeptIcon department={dept.department} size={22}/>
          <span style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{dept.department}</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>Select a lab</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>Click a lab to view availability and book a slot</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => {
          const labSlots = slots.filter(s => s.lab_id===lab.id && s.date?.split('T')[0]===todayStr && s.status==='booked');
          const totalSlots = TIME_SLOTS.length - 1;
          const bookedCount = labSlots.length;
          const pct = Math.round((bookedCount/totalSlots)*100);
          const avail = pct < 50 ? 'mostly-free' : pct < 80 ? 'partly-booked' : 'mostly-booked';
          const availColor = avail==='mostly-free' ? '#0f9d58' : avail==='partly-booked' ? '#d97706' : '#dc2626';
          const availLabel = avail==='mostly-free' ? 'Mostly available' : avail==='partly-booked' ? 'Partially booked' : 'Nearly full';
          return (
            <div key={lab.id} onClick={() => onSelect(lab)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>L{idx+1}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · Capacity: {lab.capacity}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:availColor, fontWeight:600 }}>{availLabel}</div>
                  <div style={{ fontSize:10, color:'#bbb', marginTop:2 }}>{bookedCount} of {totalSlots} slots booked today</div>
                </div>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'#f5f5f7', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  <svg width="40" height="40" style={{ position:'absolute', top:0, left:0 }}>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#f0f0f6" strokeWidth="3"/>
                    <circle cx="20" cy="20" r="16" fill="none" stroke={availColor} strokeWidth="3"
                      strokeDasharray={2*Math.PI*16} strokeDashoffset={2*Math.PI*16*(1-pct/100)}
                      strokeLinecap="round" transform="rotate(-90 20 20)"/>
                  </svg>
                  <span style={{ fontSize:10, fontWeight:700, color:availColor, position:'relative' }}>{pct}%</span>
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

// LEVEL 3 — Lab booking page
function LabBooking({ lab, dept, allSlots, onBack, onBackToDept, onRefresh, user }) {
  const meta = getMeta(dept.department);
  const [date,       setDate]       = useState(today());
  const [modal,      setModal]      = useState(false);
  const [users,      setUsers]      = useState([]);
  const [assignedUser, setAssignedUser] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [purposeInput, setPurposeInput] = useState('');
  const [form,       setForm]       = useState({ lab_id:lab.id, date:today(), start_time:'', end_time:'', notes:'' });

  useEffect(() => {
    api.get('/users/assignable').then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const labSlots = allSlots.filter(s => s.lab_id===lab.id && s.date?.split('T')[0]===date && s.status!=='cancelled');

  const isBooked = (start, end) => labSlots.some(s => s.start_time<=start && s.end_time>=end);

  const openBook = (start) => {
    const endIdx = TIME_SLOTS.indexOf(start) + 1;
    const end = TIME_SLOTS[endIdx] || '18:00';
    setForm({ lab_id:lab.id, date, start_time:start, end_time:end, notes:'' });
    setPurposeInput('');
    setAssignedUser(null);
    setModal(true);
  };

  const save = async () => {
    if (!form.start_time || !form.end_time) return alert('Please select time');
    const purpose = purposeInput;
    if (!purpose) return alert('Please enter purpose');
    setLoading(true);
    try {
      await api.post('/booking', {
        ...form,
        purpose,
        assigned_to: assignedUser?.id || null,
        assigned_name: assignedUser?.name || null,
      });
      setModal(false);
      onRefresh();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    await api.put('/booking/'+id+'/cancel');
    onRefresh();
  };

  const checkin = async (id) => {
    await api.put('/booking/'+id+'/checkin');
    onRefresh();
  };

  const userBookings = allSlots.filter(s => s.lab_id===lab.id && (
    (user.role==='student' || user.role==='invigilator')
      ? s.user_id===user.id || s.user_name===user.name
      : true
  ));

  // Only people in this lab's own department can be assigned — auto-scoped,
  // no separate department picker needed.
  const assignableUsers = users.filter(u =>
    u.department === dept.department && ['student','invigilator'].includes(u.role)
  );

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
          <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Capacity: {lab.capacity} seats · Click an available slot to book</p>
        </div>
        <button onClick={() => openBook('')} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Book a slot
        </button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#16161f' }}>Availability for</div>
        <input type="date" value={date} min={today()} onChange={e=>setDate(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', color:'#16161f' }}/>
        <div style={{ display:'flex', gap:14, marginLeft:'auto', fontSize:11 }}>
          {[{c:'#eefbf3',b:'#bce8cc',l:'Available'},{c:'#eff5fe',b:'#bfdbfe',l:'Booked'},{c:'#fef2f2',b:'#f5bcbc',l:'Unavailable'}].map(s=>(
            <div key={s.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, borderRadius:3, background:s.c, border:'1px solid '+s.b }}/>
              <span style={{ color:'#9494a3', fontWeight:500 }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, padding:'20px', marginBottom:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8 }}>
          {TIME_SLOTS.slice(0,-1).map((slot, i) => {
            const end  = TIME_SLOTS[i+1];
            const booked = isBooked(slot, end);
            const isMySlot = labSlots.find(s => s.start_time===slot && (user.role==='student'? s.user_id===user.id||s.user_name===user.name : true));
            return (
              <div key={slot} onClick={() => !booked && openBook(slot)}
                style={{
                  padding:'12px 8px', borderRadius:10, textAlign:'center', cursor:booked?'default':'pointer',
                  background: booked ? (isMySlot?'#eff5fe':'#fef2f2') : '#eefbf3',
                  border: '1px solid '+(booked ? (isMySlot?'#bfdbfe':'#f5bcbc') : '#bce8cc'),
                  transition:'all .1s',
                }}
                onMouseEnter={e => { if(!booked) e.currentTarget.style.transform='scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; }}>
                <div style={{ fontSize:13, fontWeight:700, color:booked?(isMySlot?'#2563eb':'#dc2626'):'#0f9d58' }}>{slot}</div>
                <div style={{ fontSize:10, color:booked?(isMySlot?'#2563eb':'#dc2626'):'#0f9d58', marginTop:3, fontWeight:500 }}>
                  {booked ? (isMySlot?'My booking':'Booked') : 'Available'}
                </div>
                {booked && labSlots.find(s=>s.start_time===slot) && (
                  <div style={{ fontSize:9, color:'#9494a3', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {labSlots.find(s=>s.start_time===slot)?.user_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'#16161f', marginBottom:16 }}>
          {user.role==='student' ? 'My bookings in this lab' : 'All bookings in this lab'}
        </h2>
        {userBookings.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
            No bookings yet
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>{['Date','Time','Purpose','Booked by','Assigned to','Status',''].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {userBookings.map(slot => {
                  const ss = STATUS_STYLE[slot.status] || STATUS_STYLE.booked;
                  return (
                    <tr key={slot.id} onMouseEnter={e=>e.currentTarget.style.background='#fafafd'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={td}>{new Date(slot.date).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'})}</td>
                      <td style={{ ...td, color:'#9494a3', fontWeight:500 }}>{slot.start_time} – {slot.end_time}</td>
                      <td style={{ ...td, color:'#555' }}>{slot.purpose||'—'}</td>
                      <td style={{ ...td, color:'#9494a3' }}>{slot.user_name}</td>
                      <td style={td}>
                        {slot.assigned_to_name
                          ? <span style={{ fontSize:12, color:'#4f46e5', fontWeight:600 }}>→ {slot.assigned_to_name}</span>
                          : <span style={{ fontSize:12, color:'#bbb' }}>—</span>}
                      </td>
                      <td style={td}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:ss.bg, color:ss.color, border:'1px solid '+ss.border }}>
                          {slot.status?.replace('_',' ')}
                        </span>
                      </td>
                      <td style={td}>
                        {slot.status==='booked' && (
                          <div style={{ display:'flex', gap:8 }}>
                            {(user.role==='admin'||user.role==='staff') && (
                              <button onClick={()=>checkin(slot.id)} style={{ background:'#eefbf3', border:'1px solid #bce8cc', color:'#0f9d58', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer', fontWeight:600 }}>Check in</button>
                            )}
                            {(user.role==='admin'||user.role==='staff'||slot.user_id===user.id) && (
                          <button onClick={()=>cancel(slot.id)} style={{ background:'none', border:'1px solid #f5bcbc', color:'#dc2626', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer' }}>Cancel</button>
                        )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Book a slot</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{lab.name} · {dept.department}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lbl}>Date</label>
                <input type="date" value={form.date} min={today()} onChange={e=>setForm({...form,date:e.target.value})} style={inp}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Start time</label>
                  <select value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={inp}>
                    <option value="">Select</option>
                    {TIME_SLOTS.slice(0,-1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>End time</label>
                  <select value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={inp}>
                    <option value="">Select</option>
                    {TIME_SLOTS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Purpose *</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6, marginBottom:8 }}>
                  {PURPOSE_OPTIONS.slice(0,6).map(p => (
                    <button key={p} onClick={() => setPurposeInput(p)}
                      style={{ padding:'7px 10px', border:'1.5px solid', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, textAlign:'left',
                        background:purposeInput===p?meta.color+'14':'#fff', color:purposeInput===p?meta.color:'#9494a3', borderColor:purposeInput===p?meta.color:'#ebebf0' }}>
                      {p}
                    </button>
                  ))}
                </div>
                <input value={purposeInput} onChange={e=>setPurposeInput(e.target.value)} placeholder="Or type custom purpose..." style={inp}/>
              </div>

              {(user.role==='admin'||user.role==='staff') && (
                <div>
                  <label style={lbl}>Assign to — {dept.department} (optional)</label>
                  <select value={assignedUser?.id||''} onChange={e=>{
                    const u = assignableUsers.find(u=>u.id===parseInt(e.target.value));
                    setAssignedUser(u||null);
                  }} style={{ ...inp, color: assignedUser?'#16161f':'#bbb' }}>
                    <option value="">Select person ({dept.department})</option>
                    {assignableUsers.map(u=>(
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  {assignedUser && (
                    <div style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:8, padding:'10px 14px', marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#4f46e5' }}>✓ {assignedUser.name}</div>
                        <div style={{ fontSize:11, color:'#9494a3', marginTop:2 }}>{assignedUser.role} · {assignedUser.department}</div>
                      </div>
                      <button onClick={()=>setAssignedUser(null)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#bbb', fontSize:18, lineHeight:1 }}>×</button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={lbl}>Notes (optional)</label>
                <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any additional notes..." style={inp}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} disabled={loading} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1 }}>
                {loading ? 'Booking...' : 'Confirm booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Booking() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [slots,       setSlots]       = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      api.get('/labs/departments').then(r => setDepartments(sortDepts(r.data.data || []))),
      api.get('/booking').then(r => setSlots(r.data.data || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1100, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabBooking lab={lab} dept={dept} allSlots={slots} user={user}
          onBack={()=>setLab(null)} onBackToDept={()=>{setLab(null);setDept(null);}} onRefresh={loadAll}/>
      ) : dept ? (
        <LabLevel dept={dept} slots={slots} onSelect={l=>setLab(l)} onBack={()=>setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} slots={slots} onSelect={d=>setDept(d)}/>
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
