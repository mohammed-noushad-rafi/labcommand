import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';
import Button from '../components/Button';

const empty = { lab_id:'', date:'', start_time:'', end_time:'', purpose:'' };
const STATUS_TONE = { booked:'info', checked_in:'success', completed:'default', cancelled:'danger' };

export default function Booking() {
  const { user }  = useAuth();
  const [slots,   setSlots]   = useState([]);
  const [labs,    setLabs]    = useState([]);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(empty);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  const load = () => {
    api.get('/booking').then(r => setSlots(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); api.get('/labs').then(r => setLabs(r.data.data || [])); }, []);

  const save = async () => {
    try {
      await api.post('/booking', form);
      setModal(false); setForm(empty); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    await api.put(`/booking/${id}/cancel`); load();
  };

  const checkin = async (id) => {
    await api.put(`/booking/${id}/checkin`); load();
  };

  const filtered = filter ? slots.filter(s => s.status === filter) : slots;
  const counts = {
    total:      slots.length,
    booked:     slots.filter(s => s.status === 'booked').length,
    checked_in: slots.filter(s => s.status === 'checked_in').length,
    cancelled:  slots.filter(s => s.status === 'cancelled').length,
  };

  return (
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="Lab booking"
        subtitle="Book lab slots for practical sessions"
        action={<Button onClick={()=>setModal(true)}>Book a slot</Button>}
      />

      <StatRow stats={[
        { label:'Total',       value: counts.total },
        { label:'Booked',      value: counts.booked },
        { label:'Checked in',  value: counts.checked_in },
        { label:'Cancelled',   value: counts.cancelled },
      ]} />

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {['','booked','checked_in','completed','cancelled'].map(s=>(
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
            columns={['Lab','Date','Time','Purpose','Booked by','Status','']}
            rows={filtered}
            emptyTitle="No bookings found"
            emptySubtitle="Book a lab slot to get started."
            renderRow={slot => (
              <tr key={slot.id}>
                <td style={td}><span style={{ fontWeight:500 }}>{slot.lab_name}</span></td>
                <td style={{ ...td, color:'#999' }}>{new Date(slot.date).toLocaleDateString('en-IN')}</td>
                <td style={{ ...td, color:'#999', fontSize:12 }}>{slot.start_time} – {slot.end_time}</td>
                <td style={{ ...td, color:'#999' }}>{slot.purpose || '—'}</td>
                <td style={{ ...td, color:'#999' }}>{slot.user_name}</td>
                <td style={td}><Badge tone={STATUS_TONE[slot.status]}>{slot.status?.replace('_',' ')}</Badge></td>
                <td style={td}>
                  {slot.status==='booked' && (
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      {(user.role==='admin'||user.role==='staff') && (
                        <Button onClick={()=>checkin(slot.id)} style={{ padding:'5px 12px', fontSize:12 }}>Check in</Button>
                      )}
                      <Button variant="danger" onClick={()=>cancel(slot.id)} style={{ padding:'5px 12px', fontSize:12 }}>Cancel</Button>
                    </div>
                  )}
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
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Book a lab slot</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={labelStyle}>Lab</label>
                <select value={form.lab_id} onChange={e=>setForm({...form,lab_id:e.target.value})} style={selectStyle}>
                  <option value="">Select lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name} (capacity: {l.capacity})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputStyle}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Start time</label>
                  <input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>End time</label>
                  <input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={inputStyle}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Purpose</label>
                <input type="text" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="e.g. Python practical session" style={inputStyle}/>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
              <Button onClick={save}>Book slot</Button>
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
const modalBox   = { background:'#fff', borderRadius:12, padding:28, width:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' };