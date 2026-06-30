import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';
import Button from '../components/Button';

const STATUS_TONE = { scheduled:'info', in_progress:'warning', completed:'success', overdue:'danger' };

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
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="Maintenance"
        subtitle="Schedule and track equipment maintenance"
        action={<Button onClick={()=>setModal(true)}>Schedule maintenance</Button>}
      />

      <StatRow stats={[
        { label:'Total',       value: counts.total },
        { label:'Scheduled',   value: counts.scheduled },
        { label:'In progress', value: counts.in_progress },
        { label:'Completed',   value: counts.completed },
        { label:'Overdue',     value: counts.overdue },
      ]} />

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Equipment','Lab','Scheduled date','Technician','Cost','Status','']}
            rows={items}
            emptyTitle="No maintenance records"
            emptySubtitle="Scheduled maintenance will appear here."
            renderRow={item => (
              <tr key={item.id}>
                <td style={td}>
                  <div style={{ fontWeight:500 }}>{item.equipment_name}</div>
                  <div style={{ fontSize:11, color:'#aaa' }}>{item.category}</div>
                </td>
                <td style={{ ...td, color:'#999' }}>{item.lab_name}</td>
                <td style={{ ...td, color:'#999' }}>{new Date(item.scheduled_date).toLocaleDateString('en-IN')}</td>
                <td style={{ ...td, color:'#999' }}>{item.technician}</td>
                <td style={td}>₹{Number(item.cost).toLocaleString()}</td>
                <td style={td}><Badge tone={STATUS_TONE[item.status]}>{item.status?.replace('_',' ')}</Badge></td>
                <td style={td}>
                  <Button variant="secondary" onClick={()=>openEdit(item)} style={{ padding:'5px 12px', fontSize:12 }}>Update</Button>
                </td>
              </tr>
            )}
          />
        )}
      </Panel>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Schedule maintenance</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={labelStyle}>Equipment</label>
                <select value={form.equipment_id} onChange={e=>setForm({...form,equipment_id:e.target.value})} style={selectStyle}>
                  <option value="">Select equipment</option>
                  {equipment.map(e=><option key={e.id} value={e.id}>{e.name} — {e.lab_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Scheduled date</label>
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
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Describe the maintenance work" style={{...inputStyle,resize:'vertical'}}/>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
              <Button onClick={save}>Schedule</Button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Update maintenance</h2>
              <button onClick={()=>setEditModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
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
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setEditModal(false)}>Cancel</Button>
              <Button onClick={update}>Update</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td         = { padding:'12px 10px', color:'#1a1a2e', borderBottom:'1px solid #f5f5f7' };
const inputStyle = { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', outline:'none' };
const selectStyle= { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', background:'#fff', outline:'none' };
const labelStyle = { fontSize:11, fontWeight:500, color:'#888', display:'block', marginBottom:4 };
const overlay    = { position:'fixed', inset:0, background:'rgba(26,26,46,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalBox   = { background:'#fff', borderRadius:12, padding:28, width:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' };