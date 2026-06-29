import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_COLORS = {
  scheduled:   { bg:'#e0f2fe', color:'#0369a1' },
  in_progress: { bg:'#fef9c3', color:'#92400e' },
  completed:   { bg:'#dcfce7', color:'#16a34a' },
  overdue:     { bg:'#fee2e2', color:'#dc2626' },
};

const empty = { equipment_id:'', scheduled_date:'', description:'', technician:'', cost:'' };

export default function Maintenance() {
  const [items,     setItems]     = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [form,      setForm]      = useState(empty);
  const [editForm,  setEditForm]  = useState({});
  const [loading,   setLoading]   = useState(true);

  const load = () => {
    api.get('/maintenance').then(r => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/equipment').then(r => setEquipment(r.data.data || []));
  }, []);

  const save = async () => {
    try {
      await api.post('/maintenance', form);
      setModal(false); setForm(empty); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const update = async () => {
    try {
      await api.put(`/maintenance/${editForm.id}`, editForm);
      setEditModal(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (item) => {
    setEditForm({ ...item, scheduled_date: item.scheduled_date?.split('T')[0]||'', completed_date: item.completed_date?.split('T')[0]||'' });
    setEditModal(true);
  };

  const counts = {
    total:       items.length,
    scheduled:   items.filter(i=>i.status==='scheduled').length,
    in_progress: items.filter(i=>i.status==='in_progress').length,
    completed:   items.filter(i=>i.status==='completed').length,
    overdue:     items.filter(i=>i.status==='overdue').length,
  };

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Maintenance</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Schedule and track equipment maintenance</p>
        </div>
        <button onClick={()=>setModal(true)} style={btn('#667eea')}>+ Schedule maintenance</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:counts.total,c:'#64748b'},{l:'Scheduled',v:counts.scheduled,c:'#0369a1'},{l:'In progress',v:counts.in_progress,c:'#ca8a04'},{l:'Completed',v:counts.completed,c:'#16a34a'},{l:'Overdue',v:counts.overdue,c:'#dc2626'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Equipment','Lab','Scheduled date','Technician','Cost','Status','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#aaa'}}>No maintenance records</td></tr>
            ) : items.map(item => (
              <tr key={item.id} style={{borderTop:'1px solid #f0f0f0'}}>
                <td style={{padding:'12px 14px'}}>
                  <div style={{fontWeight:500,color:'#1a1a2e'}}>{item.equipment_name}</div>
                  <div style={{fontSize:11,color:'#888'}}>{item.category}</div>
                </td>
                <td style={{padding:'12px 14px',color:'#555'}}>{item.lab_name}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{new Date(item.scheduled_date).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{item.technician}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>₹{Number(item.cost).toLocaleString()}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...(STATUS_COLORS[item.status]||{})}}>
                    {item.status?.replace('_',' ')}
                  </span>
                </td>
                <td style={{padding:'12px 14px'}}>
                  <button onClick={()=>openEdit(item)} style={smallBtn('#3b82f6')}>Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Schedule maintenance</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={labelStyle}>Equipment *</label>
                <select value={form.equipment_id} onChange={e=>setForm({...form,equipment_id:e.target.value})} style={selectStyle}>
                  <option value="">Select equipment</option>
                  {equipment.map(e=><option key={e.id} value={e.id}>{e.name} — {e.lab_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Scheduled date *</label>
                <input type="date" value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Technician</label>
                <input type="text" value={form.technician} onChange={e=>setForm({...form,technician:e.target.value})} placeholder="Technician name" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Estimated cost (₹)</label>
                <input type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Describe the maintenance work..." style={{...inputStyle,resize:'vertical'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={save} style={btn('#667eea')}>Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/update modal */}
      {editModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Update maintenance</h2>
              <button onClick={()=>setEditModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status||''} onChange={e=>setEditForm({...editForm,status:e.target.value})} style={selectStyle}>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Completed date</label>
                <input type="date" value={editForm.completed_date||''} onChange={e=>setEditForm({...editForm,completed_date:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Technician</label>
                <input type="text" value={editForm.technician||''} onChange={e=>setEditForm({...editForm,technician:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Actual cost (₹)</label>
                <input type="number" value={editForm.cost||''} onChange={e=>setEditForm({...editForm,cost:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={editForm.description||''} onChange={e=>setEditForm({...editForm,description:e.target.value})} rows={3} style={{...inputStyle,resize:'vertical'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setEditModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={update} style={btn('#667eea')}>Update</button>
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
const modalBox   = {background:'#fff',borderRadius:14,padding:28,width:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};