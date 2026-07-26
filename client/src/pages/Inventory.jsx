import { useEffect, useState } from 'react';
import api from '../api/axios';
import DeptIcon from '../components/DeptIcon';
import { sortDepts } from '../utils/deptOrder';

const DEPT_META = {
  'Computer Science': { color:'#4f46e5' },
  'Physics':          { color:'#0891b2' },
  'Chemistry':        { color:'#0f9d58' },
};
function getMeta(n) { return DEPT_META[n] || { color:'#4f46e5' }; }

const ITEM_CATALOG = {
  'Computer Science': [
    'Toner Cartridge','Printer Paper (A4)','USB Cable','HDMI Cable','Ethernet Cable',
    'Mouse Pad','Keyboard Cover','Screen Cleaning Kit','Thermal Paste','Cable Ties',
    'Power Strip','Extension Cord','Dust Blower','Anti-static Wrist Band','Blank CD/DVD',
    'Pen Drive','SD Card','CMOS Battery','Zip Ties','Network Patch Cable',
  ],
  'Physics': [
    'Graph Paper','Chart Paper','Batteries (AA)','Batteries (AAA)','9V Battery',
    'Connecting Wires','Alligator Clips','Resistors Kit','Capacitors Kit','LED Kit',
    'Sandpaper','Lab Coat','Safety Goggles','Rubber Gloves','Glass Slides',
    'Cover Slips','Fuse Wire','Soldering Wire','Flux','Heat Shrink Tube',
  ],
  'Chemistry': [
    'Distilled Water (L)','Acetone (ml)','Ethanol (ml)','HCl Solution (ml)',
    'NaOH Pellets (g)','H2SO4 (ml)','Filter Paper','Litmus Paper (Red)',
    'Litmus Paper (Blue)','pH Strips','Lab Coat','Safety Goggles','Rubber Gloves',
    'Disposable Gloves','Bench Paper','Tissue Paper','Soap Solution (ml)',
    'Boric Acid (g)','Sodium Chloride (g)','Calcium Carbonate (g)',
  ],
};

const CATEGORY_CATALOG = {
  'Computer Science': ['Consumable','Cable','Cleaning','Storage','Power','Accessory'],
  'Physics':          ['Consumable','Electronic Component','Safety','Stationery','Battery','Wire'],
  'Chemistry':        ['Chemical','Reagent','Safety','Glassware','Consumable','Paper'],
};

const UNIT_OPTIONS = ['pieces','ml','L','g','kg','packets','boxes','rolls','sheets','pairs'];

function SearchInput({ value, onChange, suggestions, onSelect, placeholder, color }) {
  const [show, setShow] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && value.length > 0);
  return (
    <div style={{ position:'relative' }}>
      <input value={value} onChange={e => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        style={inp}/>
      {show && filtered.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ebebf0', borderRadius:10, boxShadow:'0 8px 24px rgba(16,16,31,0.1)', zIndex:300, maxHeight:180, overflowY:'auto', marginTop:4 }}>
          {filtered.map((s,i) => (
            <div key={i} onClick={() => { onSelect(s); setShow(false); }}
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

// LEVEL 1 — Departments
function DeptLevel({ departments, inventory, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Inventory</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Track lab supplies and consumables by department</p>
      </div>

      {inventory.filter(i=>i.is_low).length > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #f5bcbc', borderRadius:12, padding:'14px 18px', marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#dc2626' }}>{inventory.filter(i=>i.is_low).length} items below minimum stock level</div>
            <div style={{ fontSize:11, color:'#ef4444', marginTop:2 }}>Click on the department to restock</div>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          const deptInv = inventory.filter(i => d.labs.some(l => l.id === i.lab_id));
          const lowItems = deptInv.filter(i=>i.is_low).length;
          const totalItems = deptInv.length;
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid '+(lowItems>0?'#f5bcbc':'#ebebf0'), borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px '+meta.color+'12'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=lowItems>0?'#f5bcbc':'#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
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

// LEVEL 2 — Labs
function LabLevel({ dept, inventory, onSelect, onBack }) {
  const meta = getMeta(dept.department);
  return (
    <div>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ marginBottom:36, marginTop:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <DeptIcon department={dept.department} size={22}/>
          <span style={{ fontSize:11, color:'#bbb', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{dept.department}</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#16161f', margin:0 }}>Select a lab</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>{dept.labs.length} labs — click to manage inventory</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {dept.labs.map((lab, idx) => {
          const labInv  = inventory.filter(i => i.lab_id === lab.id);
          const lowItems = labInv.filter(i=>i.is_low).length;
          const total    = labInv.length;
          return (
            <div key={lab.id} onClick={() => onSelect(lab)}
              style={{ background:'#fff', border:'1px solid '+(lowItems>0?'#f5bcbc':'#ebebf0'), borderRadius:12, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.background='#fafafe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=lowItems>0?'#f5bcbc':'#ebebf0'; e.currentTarget.style.background='#fff'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:meta.color+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:meta.color }}>L{idx+1}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#16161f' }}>Lab {idx+1}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{lab.name} · {total} items</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                {lowItems > 0
                  ? <span style={{ fontSize:11, color:'#dc2626', fontWeight:700 }}>⚠ {lowItems} low stock</span>
                  : total > 0
                    ? <span style={{ fontSize:11, color:'#0f9d58', fontWeight:600 }}>✓ All stocked</span>
                    : <span style={{ fontSize:11, color:'#bbb' }}>Empty</span>
                }
                <span style={{ fontSize:18, color:'#ddd' }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LEVEL 3 — Inventory for lab
function LabInventory({ lab, dept, onBack, onBackToDept }) {
  const meta = getMeta(dept.department);
  const catalog    = ITEM_CATALOG[dept.department]    || [];
  const catCatalog = CATEGORY_CATALOG[dept.department] || [];

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [nameInput,setNameInput]= useState('');
  const [catInput, setCatInput] = useState('');
  const [form,     setForm]     = useState({
    lab_id:lab.id, item_name:'', category:'', quantity:0,
    min_threshold:5, unit:'pieces', supplier_name:'', supplier_contact:'',
  });

  const load = () => {
    setLoading(true);
    api.get('/inventory?lab_id='+lab.id).then(r => setItems(r.data.data||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, [lab.id]);

  const openAdd = () => {
    setForm({ lab_id:lab.id, item_name:'', category:'', quantity:0, min_threshold:5, unit:'pieces', supplier_name:'', supplier_contact:'' });
    setNameInput(''); setCatInput(''); setEditing(null); setModal(true);
  };
  const openEdit = (item) => {
    setForm({...item}); setNameInput(item.item_name); setCatInput(item.category||''); setEditing(item.id); setModal(true);
  };

  const save = async () => {
    if (!nameInput) return alert('Please enter an item name');
    try {
      const payload = { ...form, item_name:nameInput, category:catInput, lab_id:lab.id };
      if (editing) await api.put('/inventory/'+editing, payload);
      else         await api.post('/inventory', payload);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.message||'Error'); }
  };

  const del = async (id, name) => {
    if (!window.confirm('Delete '+name+'?')) return;
    await api.delete('/inventory/'+id); load();
  };

  const adjustQty = async (item, delta) => {
    const newQty = Math.max(0, item.quantity + delta);
    await api.put('/inventory/'+item.id, { ...item, quantity:newQty });
    load();
  };

  const filtered = filter==='low' ? items.filter(i=>i.is_low) : items;
  const lowCount = items.filter(i=>i.is_low).length;
  const counts   = { total:items.length, low:lowCount, stocked:items.length-lowCount };

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
          <p style={{ fontSize:13, color:'#9494a3', marginTop:4 }}>Inventory management · Supplies & consumables</p>
        </div>
        <button onClick={openAdd} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Add item
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total items', value:counts.total,   color:'#4f46e5' },
          { label:'Low stock',   value:counts.low,     color:'#dc2626' },
          { label:'Well stocked',value:counts.stocked, color:'#0f9d58' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {lowCount > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #f5bcbc', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
          <span>⚠️</span>
          <span style={{ color:'#dc2626', fontWeight:600 }}>{lowCount} item{lowCount>1?'s':''} below minimum stock — reorder required</span>
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[{v:'all',l:'All items'},{v:'low',l:'Low stock ('+lowCount+')'}].map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer', background:filter===f.v?'#16161f':'#fff', color:filter===f.v?'#fff':'#9494a3', borderColor:filter===f.v?'#16161f':'#ebebf0' }}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#bbb', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #ebebf0' }}>
          {items.length===0 ? 'No inventory items yet. Click Add item to get started.' : 'No low stock items.'}
        </div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Item','Category','Quantity','Min Stock','Supplier',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ background:item.is_low?'#fffaf9':'' }}
                  onMouseEnter={e=>e.currentTarget.style.background=item.is_low?'#fff5f5':'#fafafd'}
                  onMouseLeave={e=>e.currentTarget.style.background=item.is_low?'#fffaf9':''}>
                  <td style={td}>
                    <div style={{ fontWeight:600, color:'#16161f' }}>{item.item_name}</div>
                    {item.is_low && <div style={{ fontSize:10, color:'#dc2626', fontWeight:700, marginTop:2 }}>⚠ LOW STOCK</div>}
                  </td>
                  <td style={{ ...td, color:'#9494a3' }}>{item.category||'—'}</td>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button onClick={()=>adjustQty(item,-1)} style={{ width:26, height:26, borderRadius:6, border:'1px solid #ebebf0', background:'#f7f7f9', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>−</button>
                      <span style={{ fontWeight:700, color:item.is_low?'#dc2626':'#16161f', minWidth:32, textAlign:'center', fontSize:15 }}>{item.quantity}</span>
                      <button onClick={()=>adjustQty(item,+1)} style={{ width:26, height:26, borderRadius:6, border:'1px solid #ebebf0', background:'#f7f7f9', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>+</button>
                      <span style={{ fontSize:11, color:'#bbb' }}>{item.unit}</span>
                    </div>
                  </td>
                  <td style={{ ...td, color:'#9494a3' }}>{item.min_threshold} {item.unit}</td>
                  <td style={td}>
                    <div style={{ fontSize:12, color:'#555' }}>{item.supplier_name||'—'}</div>
                    {item.supplier_contact && <div style={{ fontSize:11, color:'#bbb' }}>{item.supplier_contact}</div>}
                  </td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>openEdit(item)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#555' }}>Edit</button>
                      <button onClick={()=>del(item.id,item.item_name)} style={{ background:'none', border:'1px solid #f5bcbc', borderRadius:7, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#dc2626' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>{editing?'Edit item':'Add inventory item'}</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{lab.name} · {dept.department}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lbl}>Item name *</label>
                <SearchInput value={nameInput} onChange={setNameInput}
                  suggestions={catalog}
                  onSelect={s => setNameInput(s)}
                  placeholder={'Search '+dept.department+' supplies or type custom...'}
                  color={meta.color}/>
                <div style={{ fontSize:10.5, color:'#bbb', marginTop:4 }}>Showing {dept.department} consumables. Type to search or add custom.</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <SearchInput value={catInput} onChange={setCatInput}
                    suggestions={catCatalog}
                    onSelect={s => setCatInput(s)}
                    placeholder="Search or type category..."/>
                </div>
                <div>
                  <label style={lbl}>Unit</label>
                  <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={inp}>
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Current quantity</label>
                  <input type="number" min="0" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Minimum threshold</label>
                  <input type="number" min="0" value={form.min_threshold} onChange={e=>setForm({...form,min_threshold:parseInt(e.target.value)||0})} style={inp}/>
                  <div style={{ fontSize:10.5, color:'#bbb', marginTop:3 }}>Alert when stock falls below this</div>
                </div>
                <div>
                  <label style={lbl}>Supplier name</label>
                  <input value={form.supplier_name||''} onChange={e=>setForm({...form,supplier_name:e.target.value})} placeholder="e.g. Rohan Enterprises" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Supplier contact</label>
                  <input value={form.supplier_contact||''} onChange={e=>setForm({...form,supplier_contact:e.target.value})} placeholder="Phone or email" style={inp}/>
                </div>
              </div>

              {form.quantity <= form.min_threshold && form.quantity >= 0 && (
                <div style={{ background:'#fef2f2', border:'1px solid #f5bcbc', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#dc2626', fontWeight:600 }}>
                  ⚠ Current quantity is at or below minimum threshold — this item will be flagged as low stock
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} style={{ background:meta.color, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {editing ? 'Save changes' : 'Add item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Inventory() {
  const [departments, setDepartments] = useState([]);
  const [inventory,   setInventory]   = useState([]);
  const [dept, setDept] = useState(null);
  const [lab,  setLab]  = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      api.get('/labs/departments').then(r => setDepartments(sortDepts(r.data.data||[]))),
      api.get('/inventory').then(r => setInventory(r.data.data||[])),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>;

  return (
    <div style={{ padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {lab && dept ? (
        <LabInventory lab={lab} dept={dept} onBack={()=>setLab(null)} onBackToDept={()=>{setLab(null);setDept(null);}}/>
      ) : dept ? (
        <LabLevel dept={dept} inventory={inventory} onSelect={l=>setLab(l)} onBack={()=>setDept(null)}/>
      ) : (
        <DeptLevel departments={departments} inventory={inventory} onSelect={d=>setDept(d)}/>
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
