import { useEffect, useState } from 'react';
import api from '../api/axios';
import { sortDepts } from '../utils/deptOrder';

const DEPT_META = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5' },
  'Physics':          { icon:'⚛️',  color:'#0891b2' },
  'Chemistry':        { icon:'🧪', color:'#0f9d58' },
};
function getMeta(n) { return DEPT_META[n] || { icon:'🏫', color:'#4f46e5' }; }

const STATUS_STYLE = {
  scheduled:   { bg:'#eff5fe', color:'#2563eb', border:'#bfdbfe' },
  in_progress: { bg:'#fef8ee', color:'#d97706', border:'#fde68a' },
  completed:   { bg:'#eefbf3', color:'#0f9d58', border:'#bce8cc' },
  overdue:     { bg:'#fef2f2', color:'#dc2626', border:'#f5bcbc' },
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

// LEVEL 1 — Departments
function DeptLevel({ departments, maintenance, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Maintenance</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Choose a department to manage maintenance</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          const deptMaint = maintenance.filter(m => d.labs.some(l => l.id === m.lab_id));
          const scheduled   = deptMaint.filter(m=>m.status==='scheduled').length;
          const in_progress = deptMaint.filter(m=>m.status==='in_progress').length;
          const overdue     = deptMaint.filter(m=>m.status==='overdue').length;
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

// LEVEL 2 — Labs
function LabLevel({ dept, maintenance, onSelect, onBack }) {
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
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs — click to manage maintenance</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => {
          const labMaint    = maintenance.filter(m => m.lab_id === lab.id);
          const scheduled   = labMaint.filter(m=>m.status==='scheduled').length;
          const in_progress = labMaint.filter(m=>m.status==='in_progress').length;
          const completed   = labMaint.filter(m=>m.status==='completed').length;
          const overdue     = labMaint.filter(m=>m.status==='overdue').length;
          return (
            <div key={lab.id} onClick={() => onSelect(lab)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>L{idx+1}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · {lab.capacity} seats</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ display:'flex', gap:8, fontSize:11 }}>
                  {scheduled>0   && <span style={{ color:'#2563eb', fontWeight:600 }}>{scheduled} scheduled</span>}
                  {in_progress>0 && <span style={{ color:'#d97706', fontWeight:600 }}>{in_progress} in progress</span>}
                  {overdue>0     && <span style={{ color:'#dc2626', fontWeight:600 }}>{overdue} overdue</span>}
                  {completed>0   && <span style={{ color:'#0f9d58', fontWeight:600 }}>{completed} done</span>}
                  {labMaint.length===0 && <span style={{ color:'#bbb' }}>No records</span>}
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

// LEVEL 3 — Maintenance records for a lab
function LabMaintenance({ lab, dept, onBack, onBackToDept, onRefreshAll }) {
  const meta = getMeta(dept.department);
  const [records,     setRecords]     = useState([]);
  const [equipment,   setEquipment]   = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [editItem,    setEditItem]    = useState(null);

  const emptyForm = { equipment_id:'', scheduled_date:'', description:'', technician:'', technician_phone:'', cost:'' };
  const [form,     setForm]     = useState(emptyForm);
  const [eqSearch, setEqSearch] = useState('');
  const [techSearch, setTechSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/maintenance?lab_id=' + lab.id).then(r => setRecords(r.data.data || [])),
      api.get('/equipment?lab_id=' + lab.id).then(r => setEquipment(r.data.data || [])),
      api.get('/maintenance/technicians?department=' + encodeURIComponent(dept.department)).then(r => setTechnicians(r.data.data || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [lab.id]);

  const openAdd = () => {
    setForm(emptyForm);
    setEqSearch('');
    setTechSearch('');
    setModal(true);
  };

  const save = async () => {
    if (!form.equipment_id) return alert('Please select equipment');
    if (!form.scheduled_date) return alert('Please select a date');
    if (!form.technician) return alert('Please select a technician');
    try {
      await api.post('/maintenance', form);
      setModal(false);
      load();
      onRefreshAll();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const update = async () => {
    try {
      await api.put('/maintenance/' + editItem.id, editItem);
      setUpdateModal(false);
      load();
      onRefreshAll();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const eqSuggestions = equipment.map(e => ({
    label: e.name,
    sub: e.serial_number + ' · ' + e.status,
    id: e.id,
    serial: e.serial_number,
  }));

  const techSuggestions = technicians.map(t => ({
    label: t.name,
    sub: t.specialization + (t.phone ? ' · ' + t.phone : ''),
    phone: t.phone,
  }));

  const counts = {
    total:       records.length,
    scheduled:   records.filter(r=>r.status==='scheduled').length,
    in_progress: records.filter(r=>r.status==='in_progress').length,
    completed:   records.filter(r=>r.status==='completed').length,
    overdue:     records.filter(r=>r.status==='overdue').length,
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
          <div style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{dept.department} Department</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>{lab.name}</h1>
          <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Maintenance management</p>
        </div>
        <button onClick={openAdd} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Schedule maintenance
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',       value:counts.total,       color:'#4f46e5' },
          { label:'Scheduled',   value:counts.scheduled,   color:'#2563eb' },
          { label:'In progress', value:counts.in_progress, color:'#d97706' },
          { label:'Completed',   value:counts.completed,   color:'#0f9d58' },
          { label:'Overdue',     value:counts.overdue,     color:'#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : records.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          No maintenance records for this lab. Click Schedule maintenance to add one.
        </div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Equipment','Serial No.','Technician','Scheduled','Cost','Status',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {records.map(r => {
                const sc = STATUS_STYLE[r.status] || STATUS_STYLE.scheduled;
                return (
                  <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='#fafafd'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={td}>
                      <div style={{ fontWeight:600, color:'#16161f' }}>{r.equipment_name}</div>
                      <div style={{ fontSize:10.5, color:'#bbb', marginTop:2 }}>{r.category}</div>
                    </td>
                    <td style={{ ...td, fontFamily:'monospace', fontSize:11.5, color:'#7c7c8a' }}>{r.serial_number||'—'}</td>
                    <td style={{ ...td, color:'#555' }}>{r.technician}</td>
                    <td style={{ ...td, color:'#9494a3' }}>{new Date(r.scheduled_date).toLocaleDateString('en-IN')}</td>
                    <td style={td}>₹{Number(r.cost||0).toLocaleString()}</td>
                    <td style={td}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:sc.bg, color:sc.color, border:'1px solid '+sc.border }}>
                        {r.status.replace('_',' ')}
                      </span>
                    </td>
                    <td style={td}>
                      <button onClick={() => { setEditItem({...r, scheduled_date:r.scheduled_date?.split('T')[0]||'', completed_date:r.completed_date?.split('T')[0]||''}); setUpdateModal(true); }}
                        style={{ background:'none', border:'1px solid #ebebf0', borderRadius:7, padding:'4px 12px', fontSize:12, cursor:'pointer', color:'#555' }}>
                        Update
                      </button>
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
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Schedule maintenance</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{lab.name} · {dept.department}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              <div>
                <label style={lbl}>Equipment *</label>
                <SearchInput
                  value={eqSearch}
                  onChange={setEqSearch}
                  suggestions={eqSuggestions}
                  onSelect={s => { setEqSearch(s.label); setForm({...form, equipment_id:s.id}); }}
                  placeholder={'Search equipment in ' + lab.name + '...'}
                />
                {equipment.length === 0 && <div style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>No equipment found for this lab. Add equipment first.</div>}
              </div>

              {form.equipment_id && (() => {
                const eq = equipment.find(e => e.id === parseInt(form.equipment_id));
                return eq ? (
                  <div style={{ background:'#f7f7ff', border:'1px solid #ebebf0', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                    <div style={{ fontWeight:600, color:'#16161f' }}>{eq.name}</div>
                    <div style={{ color:'#9494a3', marginTop:2, fontFamily:'monospace', fontSize:11 }}>{eq.serial_number}</div>
                  </div>
                ) : null;
              })()}

              <div>
                <label style={lbl}>Assign technician *</label>
                <SearchInput
                  value={techSearch}
                  onChange={setTechSearch}
                  suggestions={techSuggestions}
                  onSelect={s => { setTechSearch(s.label); setForm({...form, technician:s.label, technician_phone:s.phone||''}); }}
                  placeholder={'Search technician for ' + dept.department + '...'}
                />
                {techSearch.length > 0 && !techSuggestions.some(t=>t.label===techSearch) && (
                  <div style={{ fontSize:11, color:'#9494a3', marginTop:4 }}>Not in list — will be saved as typed</div>
                )}
              </div>

              {form.technician && (() => {
                const t = technicians.find(t=>t.name===form.technician);
                return t ? (
                  <div style={{ background:'#f0faf4', border:'1px solid #bce8cc', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                    <div style={{ fontWeight:600, color:'#16161f' }}>{t.name}</div>
                    <div style={{ color:'#0f9d58', marginTop:2 }}>{t.specialization}</div>
                    {t.phone && <div style={{ color:'#9494a3', marginTop:2 }}>📞 {t.phone}</div>}
                  </div>
                ) : null;
              })()}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Scheduled date *</label>
                  <input type="date" value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Estimated cost (₹)</label>
                  <input type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0" style={inp}/>
                </div>
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Describe the maintenance work required..." style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}

      {updateModal && editItem && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setUpdateModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Update maintenance</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{editItem.equipment_name} · {editItem.serial_number}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Status</label>
                <select value={editItem.status||'scheduled'} onChange={e=>setEditItem({...editItem,status:e.target.value})} style={inp}>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Completed date</label>
                  <input type="date" value={editItem.completed_date||''} onChange={e=>setEditItem({...editItem,completed_date:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Actual cost (₹)</label>
                  <input type="number" value={editItem.cost||''} onChange={e=>setEditItem({...editItem,cost:e.target.value})} style={inp}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Technician</label>
                <input value={editItem.technician||''} onChange={e=>setEditItem({...editItem,technician:e.target.value})} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <textarea value={editItem.description||''} onChange={e=>setEditItem({...editItem,description:e.target.value})} rows={3} style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setUpdateModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={update} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Maintenance() {
  const [departments, setDepartments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      api.get('/labs/departments').then(r => setDepartments(sortDepts(r.data.data || []))),
      api.get('/maintenance').then(r => setMaintenance(r.data.data || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabMaintenance lab={lab} dept={dept} onBack={()=>setLab(null)} onBackToDept={()=>{setLab(null);setDept(null);}} onRefreshAll={loadAll}/>
      ) : dept ? (
        <LabLevel dept={dept} maintenance={maintenance} onSelect={l=>setLab(l)} onBack={()=>setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} maintenance={maintenance} onSelect={d=>setDept(d)}/>
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
