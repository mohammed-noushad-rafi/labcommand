import { useEffect, useState } from 'react';
import api from '../api/axios';
import { sortDepts } from '../utils/deptOrder';
import { useAuth } from '../context/AuthContext';

const DEPT_META = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5' },
  'Physics':          { icon:'⚛️',  color:'#0891b2' },
  'Chemistry':        { icon:'🧪', color:'#0f9d58' },
};
function getMeta(n) { return DEPT_META[n] || { icon:'🏫', color:'#4f46e5' }; }

const PRIORITY_STYLE = {
  low:    { bg:'#eefbf3', color:'#0f9d58', border:'#bce8cc' },
  medium: { bg:'#fef8ee', color:'#d97706', border:'#fde68a' },
  high:   { bg:'#fef2f2', color:'#dc2626', border:'#f5bcbc' },
};
const STATUS_STYLE = {
  open:        { bg:'#eff5fe', color:'#2563eb', border:'#bfdbfe' },
  in_progress: { bg:'#fef8ee', color:'#d97706', border:'#fde68a' },
  resolved:    { bg:'#eefbf3', color:'#0f9d58', border:'#bce8cc' },
  closed:      { bg:'#f5f5f7', color:'#9494a3', border:'#e0e0e6' },
};

function SearchInput({ value, onChange, suggestions, onSelect, placeholder }) {
  const [show, setShow] = useState(false);
  const filtered = suggestions.filter(s =>
    (typeof s === 'string' ? s : s.label).toLowerCase().includes(value.toLowerCase()) && value.length > 0
  );
  return (
    <div style={{ position:'relative' }}>
      <input value={value} onChange={e => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        style={inp}/>
      {show && filtered.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ebebf0', borderRadius:10, boxShadow:'0 8px 24px rgba(16,16,31,0.1)', zIndex:300, maxHeight:180, overflowY:'auto', marginTop:4 }}>
          {filtered.map((s, i) => {
            const label = typeof s === 'string' ? s : s.label;
            const sub   = typeof s === 'string' ? null : s.sub;
            return (
              <div key={i} onClick={() => { onSelect(s); setShow(false); }}
                style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f7f7fb' }}
                onMouseEnter={e => e.currentTarget.style.background='#f7f7ff'}
                onMouseLeave={e => e.currentTarget.style.background=''}>
                <div style={{ fontSize:13, color:'#16161f', fontWeight:500 }}>{label}</div>
                {sub && <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{sub}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// STUDENT VIEW — simple form + own complaints
function StudentView({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [equipment,  setEquipment]  = useState([]);
  const [modal,      setModal]      = useState(false);
  const [eqSearch,   setEqSearch]   = useState('');
  const [filter,     setFilter]     = useState('');
  const [form,       setForm]       = useState({ equipment_id:'', title:'', description:'', priority:'medium' });
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    api.get('/complaints').then(r => setComplaints(r.data.data || [])).finally(() => setLoading(false));
    api.get('/equipment').then(r => setEquipment(r.data.data || []));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.equipment_id) return alert('Please select equipment');
    if (!form.title) return alert('Please enter a title');
    try {
      await api.post('/complaints', form);
      setModal(false);
      setForm({ equipment_id:'', title:'', description:'', priority:'medium' });
      setEqSearch('');
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const eqSuggestions = equipment.map(e => ({ label:e.name, sub:e.lab_name+' · '+e.serial_number, id:e.id }));
  const filtered = filter ? complaints.filter(c=>c.status===filter) : complaints;
  const counts = {
    total:complaints.length, open:complaints.filter(c=>c.status==='open').length,
    in_progress:complaints.filter(c=>c.status==='in_progress').length, resolved:complaints.filter(c=>c.status==='resolved').length,
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, borderBottom:'1px solid #ebebf0', paddingBottom:24 }}>
        <div>
          <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0 }}>Complaints</h1>
          <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Raise and track your equipment complaints</p>
        </div>
        <button onClick={() => setModal(true)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:20 }}>
          + Raise complaint
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',       value:counts.total,       color:'#4f46e5' },
          { label:'Open',        value:counts.open,        color:'#2563eb' },
          { label:'In progress', value:counts.in_progress, color:'#d97706' },
          { label:'Resolved',    value:counts.resolved,    color:'#0f9d58' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['','open','in_progress','resolved','closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer', background:filter===s?'#16161f':'#fff', color:filter===s?'#fff':'#9494a3', borderColor:filter===s?'#16161f':'#ebebf0' }}>
            {s===''?'All':s.replace('_',' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          {complaints.length === 0 ? 'No complaints raised yet.' : 'No complaints match this filter.'}
        </div>
      ) : (
        <ComplaintTable records={filtered} showUser={false} isAdmin={false} onUpdate={load}/>
      )}

      {modal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Raise a complaint</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>Report a faulty or damaged equipment</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lbl}>Equipment *</label>
                <SearchInput value={eqSearch} onChange={setEqSearch}
                  suggestions={eqSuggestions}
                  onSelect={s => { setEqSearch(s.label); setForm({...form,equipment_id:s.id}); }}
                  placeholder="Search for equipment by name or lab..."/>
              </div>
              {form.equipment_id && (() => {
                const eq = equipment.find(e=>e.id===parseInt(form.equipment_id));
                return eq ? (
                  <div style={{ background:'#f7f7ff', border:'1px solid #ebebf0', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                    <div style={{ fontWeight:600, color:'#16161f' }}>{eq.name}</div>
                    <div style={{ color:'#9494a3', marginTop:2 }}>{eq.lab_name} · {eq.serial_number}</div>
                  </div>
                ) : null;
              })()}
              <div>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Brief description of the issue" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['low','medium','high'].map(p => {
                    const ps = PRIORITY_STYLE[p];
                    return (
                      <button key={p} onClick={() => setForm({...form,priority:p})}
                        style={{ flex:1, padding:'8px', border:'1.5px solid', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize',
                          background:form.priority===p?ps.bg:'#fff', color:form.priority===p?ps.color:'#9494a3', borderColor:form.priority===p?ps.border:'#ebebf0' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} placeholder="Describe the issue in detail — what happened, when it started..." style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Submit complaint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared complaint table
function ComplaintTable({ records, isAdmin, onUpdate }) {
  const [editItem, setEditItem] = useState(null);
  const [users,    setUsers]    = useState([]);

  useEffect(() => {
    if (isAdmin) api.get('/users').then(r => setUsers(r.data.data || [])).catch(()=>{});
  }, [isAdmin]);

  const update = async () => {
    try {
      await api.put('/complaints/'+editItem.id, editItem);
      setEditItem(null);
      onUpdate();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <>
      <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>{['Title','Equipment','Raised by','Priority','Status','SLA',''].map(h=>(
              <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {records.map(item => {
              const ps = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium;
              const ss = STATUS_STYLE[item.status]     || STATUS_STYLE.open;
              const slaBreached = item.sla_deadline && new Date(item.sla_deadline) < new Date() && item.status !== 'resolved';
              return (
                <tr key={item.id} style={{ background: slaBreached?'#fffaf9':'' }}
                  onMouseEnter={e=>e.currentTarget.style.background=slaBreached?'#fff5f5':'#fafafd'}
                  onMouseLeave={e=>e.currentTarget.style.background=slaBreached?'#fffaf9':''}>
                  <td style={td}>
                    <div style={{ fontWeight:600, color:'#16161f' }}>{item.title}</div>
                    <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{item.description?.slice(0,55)}{item.description?.length>55?'…':''}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight:500, color:'#555' }}>{item.equipment_name}</div>
                    <div style={{ fontSize:10.5, color:'#bbb', fontFamily:'monospace' }}>{item.serial_number}</div>
                  </td>
                  <td style={{ ...td, color:'#9494a3' }}>{item.raised_by_name}</td>
                  <td style={td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:ps.bg, color:ps.color, border:'1px solid '+ps.border }}>
                      {item.priority}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:ss.bg, color:ss.color, border:'1px solid '+ss.border }}>
                      {item.status?.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize:11 }}>
                    {item.sla_deadline ? (
                      <span style={{ color:slaBreached?'#dc2626':'#9494a3', fontWeight:slaBreached?700:400 }}>
                        {slaBreached ? '⚠ Breached' : new Date(item.sla_deadline).toLocaleDateString('en-IN')}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={td}>
                    {isAdmin && (
                      <button onClick={()=>setEditItem({...item})}
                        style={{ background:'none', border:'1px solid #ebebf0', borderRadius:7, padding:'4px 12px', fontSize:12, cursor:'pointer', color:'#555' }}>
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editItem && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setEditItem(null)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Update complaint</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{editItem.title} · {editItem.equipment_name}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Status</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {['open','in_progress','resolved','closed'].map(s => {
                    const ss = STATUS_STYLE[s];
                    return (
                      <button key={s} onClick={() => setEditItem({...editItem,status:s})}
                        style={{ padding:'9px', border:'1.5px solid', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize',
                          background:editItem.status===s?ss.bg:'#fff', color:editItem.status===s?ss.color:'#9494a3', borderColor:editItem.status===s?ss.border:'#ebebf0' }}>
                        {s.replace('_',' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['low','medium','high'].map(p => {
                    const ps = PRIORITY_STYLE[p];
                    return (
                      <button key={p} onClick={() => setEditItem({...editItem,priority:p})}
                        style={{ flex:1, padding:'8px', border:'1.5px solid', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize',
                          background:editItem.priority===p?ps.bg:'#fff', color:editItem.priority===p?ps.color:'#9494a3', borderColor:editItem.priority===p?ps.border:'#ebebf0' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label style={lbl}>Assign to</label>
                  <select value={editItem.assigned_to||''} onChange={e=>setEditItem({...editItem,assigned_to:e.target.value})} style={inp}>
                    <option value="">Unassigned</option>
                    {users.filter(u=>['admin','staff'].includes(u.role)).map(u=>(
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setEditItem(null)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={update} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ADMIN/STAFF — Level 1: Departments
function DeptLevel({ departments, complaints, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Complaints</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Choose a department to view complaints</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:32 }}>
        {[
          { label:'Total',       value:complaints.length,                             color:'#4f46e5' },
          { label:'Open',        value:complaints.filter(c=>c.status==='open').length, color:'#2563eb' },
          { label:'In progress', value:complaints.filter(c=>c.status==='in_progress').length, color:'#d97706' },
          { label:'Resolved',    value:complaints.filter(c=>c.status==='resolved').length, color:'#0f9d58' },
          { label:'SLA breached',value:complaints.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&c.status!=='resolved').length, color:'#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          const deptC = complaints.filter(c => d.labs.some(l => l.id === c.lab_id));
          const open   = deptC.filter(c=>c.status==='open').length;
          const inProg = deptC.filter(c=>c.status==='in_progress').length;
          const breached = deptC.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&c.status!=='resolved').length;
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px '+meta.color+'12'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ fontSize:34, marginBottom:18 }}>{meta.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#16161f', marginBottom:4 }}>{d.department}</div>
              <div style={{ fontSize:12, color:'#bbb', fontWeight:500 }}>{d.lab_count} lab{d.lab_count>1?'s':''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ADMIN/STAFF — Level 2: Labs
function LabLevel({ dept, complaints, onSelect, onBack }) {
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
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs — click to view complaints</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => {
          const labC    = complaints.filter(c => c.lab_id === lab.id);
          const open    = labC.filter(c=>c.status==='open').length;
          const inProg  = labC.filter(c=>c.status==='in_progress').length;
          const resolved= labC.filter(c=>c.status==='resolved').length;
          const breached= labC.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&c.status!=='resolved').length;
          return (
            <div key={lab.id} onClick={() => onSelect(lab)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>L{idx+1}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ display:'flex', gap:10, fontSize:11 }}>
                  {open>0    && <span style={{ color:'#2563eb', fontWeight:600 }}>{open} open</span>}
                  {inProg>0  && <span style={{ color:'#d97706', fontWeight:600 }}>{inProg} in progress</span>}
                  {resolved>0&& <span style={{ color:'#0f9d58', fontWeight:600 }}>{resolved} resolved</span>}
                  {breached>0&& <span style={{ color:'#dc2626', fontWeight:600 }}>⚠ {breached}</span>}
                  {labC.length===0 && <span style={{ color:'#bbb' }}>No complaints</span>}
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

// ADMIN/STAFF — Level 3: Complaints for lab
function LabComplaints({ lab, dept, complaints, onBack, onBackToDept, onRefresh }) {
  const meta = getMeta(dept.department);
  const [equipment, setEquipment] = useState([]);
  const [modal,     setModal]     = useState(false);
  const [eqSearch,  setEqSearch]  = useState('');
  const [filter,    setFilter]    = useState('');
  const [form,      setForm]      = useState({ equipment_id:'', title:'', description:'', priority:'medium' });
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/complaints?lab_id='+lab.id).then(r => setRecords(r.data.data||[])),
      api.get('/equipment?lab_id='+lab.id).then(r => setEquipment(r.data.data||[])),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [lab.id]);

  const save = async () => {
    if (!form.equipment_id) return alert('Please select equipment');
    if (!form.title) return alert('Please enter a title');
    try {
      await api.post('/complaints', form);
      setModal(false); setForm({ equipment_id:'', title:'', description:'', priority:'medium' }); setEqSearch('');
      load(); onRefresh();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const eqSuggestions = equipment.map(e => ({ label:e.name, sub:e.serial_number+' · '+e.status, id:e.id }));
  const filtered = filter ? records.filter(c=>c.status===filter) : records;
  const counts = {
    total:records.length, open:records.filter(c=>c.status==='open').length,
    in_progress:records.filter(c=>c.status==='in_progress').length, resolved:records.filter(c=>c.status==='resolved').length,
    breached:records.filter(c=>c.sla_deadline&&new Date(c.sla_deadline)<new Date()&&c.status!=='resolved').length,
  };

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
          <div style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{dept.department}</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>{lab.name}</h1>
          <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Complaints management</p>
        </div>
        <button onClick={() => setModal(true)} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Raise complaint
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',       value:counts.total,       color:'#4f46e5' },
          { label:'Open',        value:counts.open,        color:'#2563eb' },
          { label:'In progress', value:counts.in_progress, color:'#d97706' },
          { label:'Resolved',    value:counts.resolved,    color:'#0f9d58' },
          { label:'SLA breached',value:counts.breached,    color:'#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['','open','in_progress','resolved','closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer', background:filter===s?'#16161f':'#fff', color:filter===s?'#fff':'#9494a3', borderColor:filter===s?'#16161f':'#ebebf0' }}>
            {s===''?'All':s.replace('_',' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          {records.length===0 ? 'No complaints for this lab yet.' : 'No complaints match this filter.'}
        </div>
      ) : (
        <ComplaintTable records={filtered} isAdmin={true} onUpdate={() => { load(); onRefresh(); }}/>
      )}

      {modal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Raise complaint</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{lab.name} · {dept.department}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lbl}>Equipment *</label>
                <SearchInput value={eqSearch} onChange={setEqSearch}
                  suggestions={eqSuggestions}
                  onSelect={s => { setEqSearch(s.label); setForm({...form,equipment_id:s.id}); }}
                  placeholder={'Search equipment in '+lab.name+'...'}/>
                {equipment.length===0 && <div style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>No equipment found. Add equipment first.</div>}
              </div>
              {form.equipment_id && (() => {
                const eq = equipment.find(e=>e.id===parseInt(form.equipment_id));
                return eq ? (
                  <div style={{ background:'#f7f7ff', border:'1px solid #ebebf0', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                    <div style={{ fontWeight:600 }}>{eq.name}</div>
                    <div style={{ color:'#9494a3', fontFamily:'monospace', fontSize:11 }}>{eq.serial_number}</div>
                  </div>
                ) : null;
              })()}
              <div>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Brief issue title" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['low','medium','high'].map(p => {
                    const ps = PRIORITY_STYLE[p];
                    return (
                      <button key={p} onClick={() => setForm({...form,priority:p})}
                        style={{ flex:1, padding:'8px', border:'1.5px solid', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize',
                          background:form.priority===p?ps.bg:'#fff', color:form.priority===p?ps.color:'#9494a3', borderColor:form.priority===p?ps.border:'#ebebf0' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Describe the issue..." style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Complaints() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [complaints,  setComplaints]  = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      api.get('/labs/departments').then(r => setDepartments(sortDepts(r.data.data||[]))),
      api.get('/complaints').then(r => setComplaints(r.data.data||[])),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  // Students get simple view
  if (user.role === 'student' || user.role === 'invigilator') {
    return (
      <div style={{ padding:'36px 40px', maxWidth:1100, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
        <StudentView user={user}/>
      </div>
    );
  }

  // Admin/Staff get 3-level drill-down
  return (
    <div style={{ padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabComplaints lab={lab} dept={dept} complaints={complaints} onBack={()=>setLab(null)} onBackToDept={()=>{setLab(null);setDept(null);}} onRefresh={loadAll}/>
      ) : dept ? (
        <LabLevel dept={dept} complaints={complaints} onSelect={l=>setLab(l)} onBack={()=>setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} complaints={complaints} onSelect={d=>setDept(d)}/>
      )}
    </div>
  );
}

const backBtn = { background:'none', border:'1px solid #ebebf0', color:'#7c7c8a', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500 };
const td      = { padding:'12px 14px', color:'#16161f', borderBottom:'1px solid #f7f7fb', fontSize:13 };
const lbl     = { display:'block', fontSize:11.5, fontWeight:600, color:'#7c7c8a', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' };
const inp     = { padding:'9px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f' };
const overlay = { position:'fixed', inset:0, background:'rgba(16,16,31,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalBox= { background:'#fff', borderRadius:18, padding:'32px', width:540, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(16,16,31,0.18)' };
