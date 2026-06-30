import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';
import Button from '../components/Button';

const STATUS_TONE = { working:'success', faulty:'danger', maintenance:'warning' };

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

  const counts = {
    total: items.length,
    working: items.filter(i=>i.status==='working').length,
    faulty: items.filter(i=>i.status==='faulty').length,
    maintenance: items.filter(i=>i.status==='maintenance').length,
  };

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="Equipment"
        subtitle="Manage all lab equipment and assets"
        action={<Button onClick={openAdd}>Add equipment</Button>}
      />

      <StatRow stats={[
        { label:'Total',       value: counts.total },
        { label:'Working',     value: counts.working },
        { label:'Faulty',      value: counts.faulty },
        { label:'Maintenance', value: counts.maintenance },
      ]} />

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or serial" style={inputStyle} />
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

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Name','Category','Lab','Serial no.','Status','Last service','']}
            rows={filtered}
            emptyTitle="No equipment found"
            emptySubtitle="Try adjusting your filters or add a new item."
            renderRow={item => (
              <tr key={item.id}>
                <td style={td}><span style={{ fontWeight:500 }}>{item.name}</span></td>
                <td style={{ ...td, color:'#999' }}>{item.category}</td>
                <td style={{ ...td, color:'#999' }}>{item.lab_name}</td>
                <td style={{ ...td, color:'#bbb', fontFamily:'monospace', fontSize:12 }}>{item.serial_number}</td>
                <td style={td}><Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge></td>
                <td style={{ ...td, color:'#999', fontSize:12 }}>
                  {item.last_service_date ? new Date(item.last_service_date).toLocaleDateString('en-IN') : '—'}
                </td>
                <td style={td}>
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    <Button variant="secondary" onClick={()=>openEdit(item)} style={{ padding:'5px 12px', fontSize:12 }}>Edit</Button>
                    <Button variant="danger" onClick={()=>del(item.id,item.name)} style={{ padding:'5px 12px', fontSize:12 }}>Delete</Button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </Panel>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>{editing ? 'Edit equipment' : 'Add equipment'}</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Name', key:'name', type:'text' },
                { label:'Category', key:'category', type:'text' },
                { label:'Serial number', key:'serial_number', type:'text' },
                { label:'AMC vendor', key:'amc_vendor', type:'text' },
                { label:'Purchase date', key:'purchase_date', type:'date' },
                { label:'Last service', key:'last_service_date', type:'date' },
                { label:'Warranty expiry', key:'warranty_expiry_date', type:'date' },
                { label:'AMC expiry', key:'amc_expiry_date', type:'date' },
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
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
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
const modalBox   = { background:'#fff', borderRadius:12, padding:28, width:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' };