import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const empty = { lab_id:'', date:'', start_time:'', end_time:'', purpose:'' };

const STATUS_COLORS = {
  booked:     { bg:'#e0f2fe', color:'#0369a1' },
  checked_in: { bg:'#dcfce7', color:'#16a34a' },
  completed:  { bg:'#f1f5f9', color:'#64748b' },
  cancelled:  { bg:'#fee2e2', color:'#dc2626' },
};

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
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Lab Booking</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Book lab slots for practical sessions</p>
        </div>
        <button onClick={()=>setModal(true)} style={btn('#667eea')}>+ Book a slot</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:counts.total,c:'#64748b'},{l:'Booked',v:counts.booked,c:'#0369a1'},{l:'Checked in',v:counts.checked_in,c:'#16a34a'},{l:'Cancelled',v:counts.cancelled,c:'#dc2626'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',cursor:'pointer'}} onClick={()=>setFilter(s.l==='Total'?'':s.l.toLowerCase().replace(' ','_'))}>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {['','booked','checked_in','completed','cancelled'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,cursor:'pointer',background:filter===s?'#667eea':'#fff',color:filter===s?'#fff':'#555',borderColor:filter===s?'#667eea':'#e0e0e0'}}>
            {s===''?'All':s.replace('_',' ')}
          </button>
        ))}
      </div>

      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Lab','Date','Time','Purpose','Booked by','Status','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#aaa'}}>No bookings found</td></tr>
            ) : filtered.map(slot => (
              <tr key={slot.id} style={{borderTop:'1px solid #f0f0f0'}}>
                <td style={{padding:'12px 14px',fontWeight:500,color:'#1a1a2e'}}>{slot.lab_name}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{new Date(slot.date).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'12px 14px',color:'#555',fontSize:12}}>{slot.start_time} – {slot.end_time}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{slot.purpose || '—'}</td>
                <td style={{padding:'12px 14px',color:'#555'}}>{slot.user_name}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...(STATUS_COLORS[slot.status]||{})}}>
                    {slot.status?.replace('_',' ')}
                  </span>
                </td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    {slot.status==='booked' && (
                      <>
                        {(user.role==='admin'||user.role==='staff') && (
                          <button onClick={()=>checkin(slot.id)} style={smallBtn('#16a34a')}>Check in</button>
                        )}
                        <button onClick={()=>cancel(slot.id)} style={smallBtn('#ef4444')}>Cancel</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Book a lab slot</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={lbl}>Lab *</label>
                <select value={form.lab_id} onChange={e=>setForm({...form,lab_id:e.target.value})} style={sel}>
                  <option value="">Select lab</option>
                  {labs.map(l=><option key={l.id} value={l.id}>{l.name} (capacity: {l.capacity})</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date *</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inp}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={lbl}>Start time *</label>
                  <input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>End time *</label>
                  <input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={inp}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Purpose</label>
                <input type="text" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="e.g. Python practical session" style={inp}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={save} style={btn('#667eea')}>Book slot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btn      = c => ({padding:'9px 18px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500});
const smallBtn = c => ({padding:'5px 12px',background:`${c}22`,color:c,border:`1px solid ${c}`,borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:500});
const inp      = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box'};
const sel      = {padding:'8px 12px',border:'1.5px solid #e0e0e0',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box',background:'#fff'};
const lbl      = {fontSize:11,fontWeight:500,color:'#555',display:'block',marginBottom:4};
const overlay  = {position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000};
const modalBox = {background:'#fff',borderRadius:14,padding:28,width:480,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};