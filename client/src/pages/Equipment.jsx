import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Badge } from '../components/Table';
import Button from '../components/Button';

const DEPT_META = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5' },
  'Physics':          { icon:'⚛️',  color:'#0891b2' },
  'Chemistry':        { icon:'🧪', color:'#0f9d58' },
};

const EQUIPMENT_CATALOG = {
  'Computer Science': [
    'Desktop Computer','Laptop','Monitor','Keyboard','Mouse','UPS','Printer','Scanner',
    'Network Switch','Router','Projector','Webcam','Speaker','Headset','Hard Drive',
    'RAM Module','Graphics Card','Server','Raspberry Pi','Arduino Kit',
  ],
  'Physics': [
    'Oscilloscope','Function Generator','Power Supply','Multimeter','Signal Generator',
    'CRO (Cathode Ray Oscilloscope)','Voltmeter','Ammeter','Galvanometer','Spectrometer',
    'Potentiometer','Transformer','Rheostat','Capacitor Kit','Inductor Kit',
    'Optical Bench','Laser Source','Prism Set','Lens Kit','Tuning Fork Set',
  ],
  'Chemistry': [
    'Centrifuge','Spectrophotometer','Hot Plate','Magnetic Stirrer','pH Meter',
    'Analytical Balance','Distillation Unit','Water Bath','Heating Mantle','Rotary Evaporator',
    'Micropipette','Burette Stand','Volumetric Flask Set','Beaker Set','Conical Flask Set',
    'Separating Funnel','Reflux Condenser','Bunsen Burner','Thermometer Set','Digital Titrator',
  ],
};

const CATEGORY_CATALOG = {
  'Computer Science': [
    'Computer','Peripheral','Networking','Storage','Display',
    'Audio','Printing','Server','Microcontroller','Power',
  ],
  'Physics': [
    'Measurement','Signal','Power Supply','Optics','Mechanics',
    'Electronics','Thermal','Waves','Magnetism','General',
  ],
  'Chemistry': [
    'Separation','Analysis','Heating','Mixing','Measurement',
    'Glassware','Safety','Filtration','Titration','General',
  ],
};

function generateSerial(dept, labName) {
  const prefix = dept === 'Computer Science' ? 'CS' : dept === 'Physics' ? 'PH' : 'CH';
  const labNum = labName.match(/d+/) ? labName.match(/d+/)[0] : '1';
  const rand = Math.random().toString(36).substr(2,4).toUpperCase();
  const year = new Date().getFullYear().toString().substr(2);
  return prefix + '-L' + labNum + '-' + year + '-' + rand;
}

function getMeta(name) {
  return DEPT_META[name] || { icon:'🏫', color:'#4f46e5' };
}

const STATUS_COLOR = {
  working:     { bg:'#eefbf3', color:'#0f9d58', border:'#bce8cc' },
  faulty:      { bg:'#fef2f2', color:'#dc2626', border:'#f5bcbc' },
  maintenance: { bg:'#fef8ee', color:'#d97706', border:'#f6dba8' },
};

// LEVEL 1 — Department cards
function DeptLevel({ departments, equipment, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Equipment</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Choose a department to manage its equipment</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          const deptEquip = equipment.filter(e => d.labs.some(l => l.id === e.lab_id));
          const working = deptEquip.filter(e => e.status === 'working').length;
          const faulty  = deptEquip.filter(e => e.status === 'faulty').length;
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

// LEVEL 2 — Labs in department
function LabLevel({ dept, equipment, onSelect, onBack }) {
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
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs — click to manage equipment</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => {
          const labEquip   = equipment.filter(e => e.lab_id === lab.id);
          const working    = labEquip.filter(e=>e.status==='working').length;
          const faulty     = labEquip.filter(e=>e.status==='faulty').length;
          const maint      = labEquip.filter(e=>e.status==='maintenance').length;
          return (
            <div key={lab.id} onClick={() => onSelect(lab)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>
                  L{idx+1}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · {lab.capacity} seats</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#16161f' }}>{labEquip.length}</div>
                  <div style={{ fontSize:10, color:'#bbb', fontWeight:500 }}>items</div>
                </div>
                {labEquip.length > 0 && (
                  <div style={{ display:'flex', gap:8, fontSize:11 }}>
                    <span style={{ color:'#0f9d58', fontWeight:600 }}>{working}✓</span>
                    {faulty>0 && <span style={{ color:'#dc2626', fontWeight:600 }}>{faulty}✗</span>}
                    {maint>0  && <span style={{ color:'#d97706', fontWeight:600 }}>{maint}⚙</span>}
                  </div>
                )}
                <span style={{ fontSize:18, color:'#ddd' }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryInput({ value, onChange, categories }) {
  const [input, setInput] = useState(value || '');
  const [show, setShow]   = useState(false);
  const sugg = categories.filter(s => s.toLowerCase().includes(input.toLowerCase()) && input.length > 0);
  useEffect(() => { setInput(value || ''); }, [value]);
  return (
    <div style={{ position:'relative' }}>
      <input value={input}
        onChange={e => { setInput(e.target.value); onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder="Search or type a category..."
        style={{ padding:'9px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f' }}/>
      {show && sugg.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ebebf0', borderRadius:10, boxShadow:'0 8px 24px rgba(16,16,31,0.1)', zIndex:200, maxHeight:160, overflowY:'auto', marginTop:4 }}>
          {sugg.map(s => (
            <div key={s} onClick={() => { setInput(s); onChange(s); setShow(false); }}
              style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, color:'#16161f', borderBottom:'1px solid #f7f7fb' }}
              onMouseEnter={e => e.currentTarget.style.background='#f7f7ff'}
              onMouseLeave={e => e.currentTarget.style.background=''}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// LEVEL 3 — Equipment in lab
function LabEquipment({ lab, dept, equipment, onBack, onBackToDept, onRefresh }) {
  const meta     = getMeta(dept.department);
  const catalog  = EQUIPMENT_CATALOG[dept.department] || [];
  const labEquip = equipment.filter(e => e.lab_id === lab.id);

  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [nameInput,setNameInput]= useState('');
  const [showSugg, setShowSugg] = useState(false);
  const [form,     setForm]     = useState({
    lab_id: lab.id, name:'', category:'', serial_number:'',
    status:'working', purchase_date:'', last_service_date:'',
    warranty_expiry_date:'', amc_vendor:'', amc_expiry_date:'',
  });

  const suggestions = catalog.filter(n => n.toLowerCase().includes(nameInput.toLowerCase()) && nameInput.length > 0);

  const openAdd = () => {
    const serial = generateSerial(dept.department, lab.name, labEquip);
    setForm({ lab_id:lab.id, name:'', category:'', serial_number:serial, status:'working', purchase_date:'', last_service_date:'', warranty_expiry_date:'', amc_vendor:'', amc_expiry_date:'' });
    setNameInput('');
    setEditing(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setForm({ ...item, purchase_date:item.purchase_date?.split('T')[0]||'', last_service_date:item.last_service_date?.split('T')[0]||'', warranty_expiry_date:item.warranty_expiry_date?.split('T')[0]||'', amc_expiry_date:item.amc_expiry_date?.split('T')[0]||'' });
    setNameInput(item.name);
    setEditing(item.id);
    setModal(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, name: nameInput };
      if (editing) await api.put('/equipment/'+editing, payload);
      else         await api.post('/equipment', payload);
      setModal(false);
      onRefresh();
    } catch (err) { alert(err.response?.data?.message || 'Error saving'); }
  };

  const del = async (id, name) => {
    if (!window.confirm('Delete ' + name + '?')) return;
    await api.delete('/equipment/'+id);
    onRefresh();
  };

  const filtered = labEquip.filter(i =>
    (i.name.toLowerCase().includes(search.toLowerCase()) || (i.serial_number||'').toLowerCase().includes(search.toLowerCase())) &&
    (filter ? i.status === filter : true)
  );

  const counts = {
    total:       labEquip.length,
    working:     labEquip.filter(i=>i.status==='working').length,
    faulty:      labEquip.filter(i=>i.status==='faulty').length,
    maintenance: labEquip.filter(i=>i.status==='maintenance').length,
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
          <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Equipment management · {lab.capacity} seats</p>
        </div>
        <button onClick={openAdd} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Add equipment
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',       value:counts.total,       color:'#4f46e5' },
          { label:'Working',     value:counts.working,     color:'#0f9d58' },
          { label:'Faulty',      value:counts.faulty,      color:'#dc2626' },
          { label:'Maintenance', value:counts.maintenance, color:'#d97706' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center', cursor:'pointer' }}
            onClick={() => setFilter(filter === s.label.toLowerCase() ? '' : s.label.toLowerCase() === 'total' ? '' : s.label.toLowerCase())}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or serial number..."
          style={{ flex:1, padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none', background:'#fff' }}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{ padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none', background:'#fff', color:'#555' }}>
          <option value="">All status</option>
          <option value="working">Working</option>
          <option value="faulty">Faulty</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          {labEquip.length === 0 ? 'No equipment added yet. Click Add equipment to get started.' : 'No items match your search.'}
        </div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Name','Serial No.','Category','Status','Purchase Date','Warranty','Actions'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd', whiteSpace:'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const sc = STATUS_COLOR[item.status] || STATUS_COLOR.working;
                return (
                  <tr key={item.id} style={{ transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafafd'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={td}>
                      <div style={{ fontWeight:600, color:'#16161f' }}>{item.name}</div>
                      {item.amc_vendor && <div style={{ fontSize:10.5, color:'#bbb', marginTop:2 }}>{item.amc_vendor}</div>}
                    </td>
                    <td style={{ ...td, fontFamily:'monospace', fontSize:11.5, color:'#7c7c8a' }}>{item.serial_number || '—'}</td>
                    <td style={{ ...td, color:'#9494a3' }}>{item.category || '—'}</td>
                    <td style={td}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:sc.bg, color:sc.color, border:'1px solid '+sc.border }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ ...td, color:'#9494a3' }}>{item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ ...td, color: item.warranty_expiry_date && new Date(item.warranty_expiry_date) < new Date() ? '#dc2626' : '#9494a3' }}>
                      {item.warranty_expiry_date ? new Date(item.warranty_expiry_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={td}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={()=>openEdit(item)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#555' }}>Edit</button>
                        <button onClick={()=>del(item.id,item.name)} style={{ background:'none', border:'1px solid #f5bcbc', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#dc2626' }}>Delete</button>
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
        <div style={{ position:'fixed', inset:0, background:'rgba(16,16,31,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'#fff', borderRadius:18, padding:'32px', width:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(16,16,31,0.18)' }}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>{editing ? 'Edit equipment' : 'Add equipment'}</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{lab.name} · {dept.department}</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={label}>Equipment name *</label>
                <div style={{ position:'relative' }}>
                  <input value={nameInput} onChange={e=>{setNameInput(e.target.value);setShowSugg(true);}}
                    onFocus={()=>setShowSugg(true)}
                    placeholder={'Search or type a ' + dept.department + ' equipment name...'}
                    style={{ ...inp, width:'100%', boxSizing:'border-box' }}/>
                  {showSugg && suggestions.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ebebf0', borderRadius:10, boxShadow:'0 8px 24px rgba(16,16,31,0.1)', zIndex:100, maxHeight:200, overflowY:'auto', marginTop:4 }}>
                      {suggestions.map(s => (
                        <div key={s} onClick={()=>{setNameInput(s);setShowSugg(false);}}
                          style={{ padding:'10px 14px', cursor:'pointer', fontSize:13, color:'#16161f', borderBottom:'1px solid #f7f7fb' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#f7f7ff'}
                          onMouseLeave={e=>e.currentTarget.style.background=''}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize:10.5, color:'#bbb', marginTop:4 }}>Showing {dept.department} equipment. Type to search or add custom name.</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={label}>Category</label>
                  <CategoryInput
                    value={form.category}
                    onChange={v => setForm({...form, category:v})}
                    categories={CATEGORY_CATALOG[dept.department] || []}
                  />
                </div>
                <div>
                  <label style={label}>Serial number</label>
<input value={form.serial_number} readOnly style={{ ...inp, background:'#fafafd', color:'#9494a3', cursor:'default' }}/>
                </div>
              </div>

              <div>
                <label style={label}>Status</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{ ...inp, width:'100%' }}>
                  <option value="working">Working</option>
                  <option value="faulty">Faulty</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={label}>Purchase date</label>
                  <input type="date" value={form.purchase_date} onChange={e=>setForm({...form,purchase_date:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={label}>Last service date</label>
                  <input type="date" value={form.last_service_date} onChange={e=>setForm({...form,last_service_date:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={label}>Warranty expiry</label>
                  <input type="date" value={form.warranty_expiry_date} onChange={e=>setForm({...form,warranty_expiry_date:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={label}>AMC vendor</label>
                  <input value={form.amc_vendor||''} onChange={e=>setForm({...form,amc_vendor:e.target.value})} placeholder="Vendor name" style={inp}/>
                </div>
                <div>
                  <label style={label}>AMC expiry</label>
                  <input type="date" value={form.amc_expiry_date||''} onChange={e=>setForm({...form,amc_expiry_date:e.target.value})} style={inp}/>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:28, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {editing ? 'Save changes' : 'Add equipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Equipment() {
  const [departments, setDepartments] = useState([]);
  const [equipment,   setEquipment]   = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      api.get('/labs/departments').then(r => setDepartments(r.data.data || [])),
      api.get('/equipment').then(r => setEquipment(r.data.data || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabEquipment lab={lab} dept={dept} equipment={equipment}
          onBack={() => setLab(null)}
          onBackToDept={() => { setLab(null); setDept(null); }}
          onRefresh={loadAll}/>
      ) : dept ? (
        <LabLevel dept={dept} equipment={equipment} onSelect={l => setLab(l)} onBack={() => setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} equipment={equipment} onSelect={d => setDept(d)}/>
      )}
    </div>
  );
}

const backBtn = { background:'none', border:'1px solid #ebebf0', color:'#7c7c8a', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500 };
const td      = { padding:'12px 14px', color:'#16161f', borderBottom:'1px solid #f7f7fb', fontSize:13 };
const label   = { display:'block', fontSize:11.5, fontWeight:600, color:'#7c7c8a', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' };
const inp     = { padding:'9px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f' };
