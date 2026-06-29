import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_COLORS = {
  working:     { bg:'#dcfce7', color:'#16a34a' },
  faulty:      { bg:'#fee2e2', color:'#dc2626' },
  maintenance: { bg:'#fef9c3', color:'#ca8a04' },
};

const empty = { lab_id:'', name:'', category:'', serial_number:'', status:'working', purchase_date:'', last_service_date:'', warranty_expiry_date:'', amc_vendor:'', amc_expiry_date:'' };

export default function Equipment() {
  const [items, setItems]   = useState([]);
  const [labs, setLabs]     = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLab, setFilterLab]       = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (filterLab)    params.append('lab_id', filterLab);
    api.get(`/equipment?${params}`).then(r => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); api.get('/labs').then(r => setLabs(r.data.data || [])); }, [filterStatus, filterLab]);

  const openAdd  = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (item) => { setForm({ ...item, purchase_date: item.purchase_date?.split('T')[0]||'', last_service_date: item.last_service_date?.split('T')[0]||'', warranty_expiry_date: item.warranty_expiry_date?.split('T')[0]||'', amc_expiry_date: item.amc_expiry_date?.split('T')[0]||'' }); setEditing(item.id); setModal(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/equipment/${editing}`, form);
      else         await api.post('/equipment', form);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await api.delete(`/equipment/${id}`); load();
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.serial_number?.toLowerCase().includes(search.toLowerCase()));

  const counts = { total: items.length, working: items.filter(i=>i.status==='working').length, faulty: items.filter(i=>i.status==='faulty').length, maintenance: items.filter(i=>i.status==='maintenance').length };

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Equipment</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Manage all lab equipment and assets</p>
        </div>
        <button onClick={openAdd} style={btn('#667eea')}>+ Add equipment</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:counts.total,c:'#64748b'},{l:'Working',v:counts.working,c:'#16a34a'},{l:'Faulty',v:counts.faulty,c:'#dc2626'},{l:'Maintenance',v:counts.maintenance,c:'#ca8a04'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or serial..." style={inputStyle} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All status</option>
          <option value="working">Working</option>
          <option value="faulty">Faulty</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select value={filterLab} onChange={e=>setFilterLab(e.target.value)} style={selectStyle}>
          <option value="">All labs</option>
          {labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Name','Category','Lab','Serial No.','Status','Last Service','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#aaa'}}>No equipment found</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} style={{borderTop:'1px solid #f0f0f0'}}>
                <td style={{padding:'12px 14px',fontWeight:500,color:'#1a1a2e'}}>{item.name}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{item.category}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{item.lab_name}</td>
                <td style={{padding:'12px 14px',color:'#888',fontFamily:'monospace',fontSize:12}}>{item.serial_number}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...STATUS_COLORS[item.status]}}>
                    {item.status}
                  </span>
                </td>
                <td style={{padding:'12px 14px',color:'#888',fontSize:12}}>
                  {item.last_service_date ? new Date(item.last_service_date).toLocaleDateString('en-IN') : '—'}
                </td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>openEdit(item)} style={smallBtn('#3b82f6')}>Edit</button>
                    <button onClick={()=>del(item.id,item.name)} style={smallBtn('#ef4444')}>Delete</button>
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
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>{editing ? 'Edit equipment' : 'Add equipment'}</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {label:'Name *',          key:'name',                  type:'text'},
                {label:'Category',        key:'category',              type:'text'},
                {label:'Serial number',   key:'serial_number',         type:'text'},
                {label:'AMC vendor',      key:'amc_vendor',            type:'text'},
                {label:'Purchase date',   key:'purchase_date',         type:'date'},
                {label:'Last service',    key:'last_service_date',     type:'date'},
                {label:'Warranty expiry', key:'warranty_expiry_date',  type:'date'},
                {label:'AMC expiry',      key:'amc_expiry_date',       type:'date'},
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
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status||'working'} onChange={e=>setForm({...form,status:e.target.value})} style={selectStyle}>
                  <option value="working">Working</option>
                  <option value="faulty">Faulty</option>
                  <option value="maintenance">Maintenance</option>
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
const modalBox   = {background:'#fff',borderRadius:14,padding:28,width:600,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};