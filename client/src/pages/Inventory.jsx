import { useEffect, useState } from 'react';
import api from '../api/axios';

const empty = { lab_id:'', item_name:'', category:'', quantity:0, min_threshold:5, unit:'', supplier_name:'', supplier_contact:'' };

export default function Inventory() {
  const [items,  setItems]  = useState([]);
  const [labs,   setLabs]   = useState([]);
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(empty);
  const [editing,setEditing]= useState(null);
  const [loading,setLoading]= useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => {
    api.get('/inventory').then(r => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); api.get('/labs').then(r => setLabs(r.data.data || [])); }, []);

  const openAdd  = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (item) => { setForm({...item}); setEditing(item.id); setModal(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/inventory/${editing}`, form);
      else         await api.post('/inventory', form);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await api.delete(`/inventory/${id}`); load();
  };

  const adjustQty = async (item, delta) => {
    const newQty = Math.max(0, item.quantity + delta);
    await api.put(`/inventory/${item.id}`, { ...item, quantity: newQty });
    load();
  };

  const filtered = filter === 'low' ? items.filter(i => i.is_low) : items;
  const lowCount = items.filter(i => i.is_low).length;

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Inventory</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Track lab supplies and consumables</p>
        </div>
        <button onClick={openAdd} style={btn('#667eea')}>+ Add item</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[
          {l:'Total items',  v:items.length,  c:'#64748b'},
          {l:'Low stock',    v:lowCount,       c:'#dc2626'},
          {l:'Labs covered', v:[...new Set(items.map(i=>i.lab_id))].length, c:'#667eea'},
        ].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
        {lowCount > 0 && (
          <div style={{background:'#fff5f5',borderRadius:10,padding:'14px 16px',border:'1.5px solid #fca5a5',display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>⚠️</span>
            <div><div style={{fontSize:13,fontWeight:600,color:'#dc2626'}}>{lowCount} items below minimum</div><div style={{fontSize:11,color:'#ef4444'}}>Reorder required</div></div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[{v:'all',l:'All items'},{v:'low',l:`Low stock (${lowCount})`}].map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)} style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,cursor:'pointer',background:filter===f.v?'#667eea':'#fff',color:filter===f.v?'#fff':'#555',borderColor:filter===f.v?'#667eea':'#e0e0e0'}}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Item','Lab','Category','Quantity','Min threshold','Supplier','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#aaa'}}>No items found</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} style={{borderTop:'1px solid #f0f0f0',background:item.is_low?'#fff5f5':''}}>
                <td style={{padding:'12px 14px'}}>
                  <div style={{fontWeight:500,color:'#1a1a2e'}}>{item.item_name}</div>
                  {item.is_low && <span style={{fontSize:10,color:'#dc2626',fontWeight:600}}>⚠ LOW STOCK</span>}
                </td>
                <td style={{padding:'12px 14px',color:'#555'}}>{item.lab_name}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{item.category}</td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <button onClick={()=>adjustQty(item,-1)} style={{width:24,height:24,borderRadius:4,border:'1px solid #e0e0e0',background:'#f8fafc',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                    <span style={{fontWeight:600,color:item.is_low?'#dc2626':'#1a1a2e',minWidth:30,textAlign:'center'}}>{item.quantity}</span>
                    <button onClick={()=>adjustQty(item,+1)} style={{width:24,height:24,borderRadius:4,border:'1px solid #e0e0e0',background:'#f8fafc',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    <span style={{fontSize:11,color:'#888'}}>{item.unit}</span>
                  </div>
                </td>
                <td style={{padding:'12px 14px',color:'#888'}}>{item.min_threshold} {item.unit}</td>
                <td style={{padding:'12px 14px',color:'#555',fontSize:12}}>
                  <div>{item.supplier_name||'—'}</div>
                  {item.supplier_contact && <div style={{color:'#888'}}>{item.supplier_contact}</div>}
                </td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>openEdit(item)} style={smallBtn('#3b82f6')}>Edit</button>
                    <button onClick={()=>del(item.id,item.item_name)} style={smallBtn('#ef4444')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>{editing?'Edit item':'Add inventory item'}</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {label:'Item name *',      key:'item_name',        type:'text'},
                {label:'Category',         key:'category',         type:'text'},
                {label:'Quantity',         key:'quantity',         type:'number'},
                {label:'Min threshold',    key:'min_threshold',    type:'number'},
                {label:'Unit',             key:'unit',             type:'text'},
                {label:'Supplier name',    key:'supplier_name',    type:'text'},
                {label:'Supplier contact', key:'supplier_contact', type:'text'},
              ].map(f=>(
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={inputStyle}/>
                </div>
              ))}
              <div>
                <label style={labelStyle}>Lab</label>
                <select value={form.lab_id||''} onChange={e=>setForm({...form,lab_id:e.target.value})} style={selectStyle}>
                  <option value="">Select lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={save} style={btn('#667eea')}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btn        = c => ({padding:'9px 18px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500});
const smallBtn   = c => ({padding:'5px 12px',background:`${c}11`,color:c,border:`1px solid ${c}`,borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:500});
const inputStyle = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box'};
const selectStyle= {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box',background:'#fff'};
const labelStyle = {fontSize:11,fontWeight:500,color:'#555',display:'block',marginBottom:4};
const overlay    = {position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000};
const modalBox   = {background:'#fff',borderRadius:14,padding:28,width:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};