import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = {
  low:    { bg:'#f0fdf4', color:'#16a34a' },
  medium: { bg:'#fef9c3', color:'#92400e' },
  high:   { bg:'#fee2e2', color:'#dc2626' },
};
const STATUS_COLORS = {
  open:        { bg:'#e0f2fe', color:'#0369a1' },
  in_progress: { bg:'#fef9c3', color:'#92400e' },
  resolved:    { bg:'#dcfce7', color:'#16a34a' },
  closed:      { bg:'#f1f5f9', color:'#64748b' },
};

const empty = { equipment_id:'', title:'', description:'', priority:'medium' };

export default function Complaints() {
  const { user }   = useAuth();
  const [items,     setItems]     = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [form,      setForm]      = useState(empty);
  const [editForm,  setEditForm]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('');

  const load = () => {
    api.get('/complaints').then(r => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/equipment').then(r => setEquipment(r.data.data || []));
  }, []);

  const save = async () => {
    try {
      await api.post('/complaints', form);
      setModal(false); setForm(empty); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const update = async () => {
    try {
      await api.put(`/complaints/${editForm.id}`, editForm);
      setEditModal(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const filtered = filter ? items.filter(i => i.status === filter) : items;
  const counts = { total: items.length, open: items.filter(i=>i.status==='open').length, in_progress: items.filter(i=>i.status==='in_progress').length, resolved: items.filter(i=>i.status==='resolved').length };

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Complaints</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Raise and track equipment complaints</p>
        </div>
        <button onClick={()=>setModal(true)} style={btn('#667eea')}>+ Raise complaint</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:counts.total,c:'#64748b'},{l:'Open',v:counts.open,c:'#0369a1'},{l:'In progress',v:counts.in_progress,c:'#ca8a04'},{l:'Resolved',v:counts.resolved,c:'#16a34a'}].map(s=>(
          <div key={s.l} onClick={()=>setFilter(s.l==='Total'?'':s.l.toLowerCase().replace(' ','_'))} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',cursor:'pointer'}}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {['','open','in_progress','resolved','closed'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,cursor:'pointer',background:filter===s?'#667eea':'#fff',color:filter===s?'#fff':'#555',borderColor:filter===s?'#667eea':'#e0e0e0'}}>
            {s===''?'All':s.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Title','Equipment','Lab','Raised by','Priority','Status','SLA','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#aaa'}}>No complaints found</td></tr>
            ) : filtered.map(item => {
              const slaBreached = item.sla_deadline && new Date(item.sla_deadline) < new Date() && item.status !== 'resolved';
              return (
                <tr key={item.id} style={{borderTop:'1px solid #f0f0f0',background:slaBreached?'#fff5f5':''}}>
                  <td style={{padding:'12px 14px'}}>
                    <div style={{fontWeight:500,color:'#1a1a2e'}}>{item.title}</div>
                    <div style={{fontSize:11,color:'#888',marginTop:2}}>{item.description?.slice(0,50)}{item.description?.length>50?'...':''}</div>
                  </td>
                  <td style={{padding:'12px 14px',color:'#555'}}>{item.equipment_name}</td>
                  <td style={{padding:'12px 14px',color:'#555'}}>{item.lab_name}</td>
                  <td style={{padding:'12px 14px',color:'#555'}}>{item.raised_by_name}</td>
                  <td style={{padding:'12px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...(PRIORITY_COLORS[item.priority]||{})}}>{item.priority}</span>
                  </td>
                  <td style={{padding:'12px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...(STATUS_COLORS[item.status]||{})}}>{item.status?.replace('_',' ')}</span>
                  </td>
                  <td style={{padding:'12px 14px',fontSize:11}}>
                    {item.sla_deadline ? (
                      <span style={{color:slaBreached?'#dc2626':'#888'}}>
                        {slaBreached?'⚠ Breached':new Date(item.sla_deadline).toLocaleDateString('en-IN')}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{padding:'12px 14px'}}>
                    {(user.role==='admin'||user.role==='staff') && (
                      <button onClick={()=>{setEditForm({...item});setEditModal(true);}} style={smallBtn('#3b82f6')}>Update</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Raise complaint modal */}
      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Raise complaint</h2>
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
                <label style={labelStyle}>Title *</label>
                <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Brief description of the issue" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={selectStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} placeholder="Describe the issue in detail..." style={{...inputStyle,resize:'vertical'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={save} style={btn('#667eea')}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Update modal */}
      {editModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Update complaint</h2>
              <button onClick={()=>setEditModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status||''} onChange={e=>setEditForm({...editForm,status:e.target.value})} style={selectStyle}>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={editForm.priority||'medium'} onChange={e=>setEditForm({...editForm,priority:e.target.value})} style={selectStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
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
const modalBox   = {background:'#fff',borderRadius:14,padding:28,width:500,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};