import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';
import Button from '../components/Button';

const PRIORITY_TONE = { low:'success', medium:'warning', high:'danger' };
const STATUS_TONE   = { open:'info', in_progress:'warning', resolved:'success', closed:'default' };

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
  const counts = {
    total: items.length,
    open: items.filter(i=>i.status==='open').length,
    in_progress: items.filter(i=>i.status==='in_progress').length,
    resolved: items.filter(i=>i.status==='resolved').length,
  };

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="Complaints"
        subtitle="Raise and track equipment complaints"
        action={<Button onClick={()=>setModal(true)}>Raise complaint</Button>}
      />

      <StatRow stats={[
        { label:'Total',       value: counts.total },
        { label:'Open',        value: counts.open },
        { label:'In progress', value: counts.in_progress },
        { label:'Resolved',    value: counts.resolved },
      ]} />

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {['','open','in_progress','resolved','closed'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{
            padding:'6px 14px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer',
            background: filter===s ? '#1a1a2e' : '#fff',
            color: filter===s ? '#fff' : '#888',
            borderColor: filter===s ? '#1a1a2e' : '#ececf0',
          }}>
            {s===''?'All':s.replace('_',' ')}
          </button>
        ))}
      </div>

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Title','Equipment','Lab','Raised by','Priority','Status','SLA','']}
            rows={filtered}
            emptyTitle="No complaints found"
            emptySubtitle="Complaints raised by users will appear here."
            renderRow={item => {
              const slaBreached = item.sla_deadline && new Date(item.sla_deadline) < new Date() && item.status !== 'resolved';
              return (
                <tr key={item.id} style={slaBreached ? { background:'#fdf8f8' } : undefined}>
                  <td style={td}>
                    <div style={{ fontWeight:500 }}>{item.title}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>
                      {item.description?.slice(0,50)}{item.description?.length>50?'…':''}
                    </div>
                  </td>
                  <td style={{ ...td, color:'#999' }}>{item.equipment_name}</td>
                  <td style={{ ...td, color:'#999' }}>{item.lab_name}</td>
                  <td style={{ ...td, color:'#999' }}>{item.raised_by_name}</td>
                  <td style={td}><Badge tone={PRIORITY_TONE[item.priority]}>{item.priority}</Badge></td>
                  <td style={td}><Badge tone={STATUS_TONE[item.status]}>{item.status?.replace('_',' ')}</Badge></td>
                  <td style={{ ...td, fontSize:11 }}>
                    {item.sla_deadline ? (
                      <span style={{ color: slaBreached ? '#b91c1c' : '#aaa', fontWeight: slaBreached ? 600 : 400 }}>
                        {slaBreached ? 'Breached' : new Date(item.sla_deadline).toLocaleDateString('en-IN')}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={td}>
                    {(user.role==='admin'||user.role==='staff') && (
                      <Button variant="secondary" onClick={()=>{setEditForm({...item});setEditModal(true);}} style={{ padding:'5px 12px', fontSize:12 }}>
                        Update
                      </Button>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        )}
      </Panel>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Raise complaint</h2>
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
                <label style={labelStyle}>Title</label>
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
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} placeholder="Describe the issue in detail" style={{...inputStyle,resize:'vertical'}}/>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
              <Button onClick={save}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Update complaint</h2>
              <button onClick={()=>setEditModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
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
const modalBox   = { background:'#fff', borderRadius:12, padding:28, width:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' };