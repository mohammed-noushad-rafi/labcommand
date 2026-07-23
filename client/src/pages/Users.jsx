import { useEffect, useState } from 'react';
import api from '../api/axios';
import DeptIcon from '../components/DeptIcon';

const ROLE_META = {
  admin:       { color:'#4f46e5', bg:'#eef2ff', border:'#c7d2fe', label:'Admin' },
  staff:       { color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc', label:'Staff' },
  invigilator: { color:'#d97706', bg:'#fef8ee', border:'#fde68a', label:'Invigilator' },
  student:     { color:'#0f9d58', bg:'#eefbf3', border:'#bce8cc', label:'Student' },
};

const DEPARTMENTS = ['Computer Science', 'Physics', 'Chemistry'];

const DEPT_META = {
  'Computer Science': { color:'#4f46e5' },
  'Physics':          { color:'#0891b2' },
  'Chemistry':        { color:'#0f9d58' },
};

const emptyForm = { name:'', email:'', password:'', role:'student', department:'' };

export default function Users() {
  const [users,    setUsers]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editModal,setEditModal]= useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [editForm, setEditForm] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterRole, setFilterRole] = useState('');

  const load = () => {
    api.get('/users').then(r => setUsers(r.data.data||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name||!form.email||!form.password) return alert('Please fill all required fields');
    if ((form.role==='staff'||form.role==='student') && !form.department) return alert('Please assign a department');
    try {
      await api.post('/users', form);
      setModal(false); setForm(emptyForm); load();
    } catch (err) { alert(err.response?.data?.message||'Error'); }
  };

  const update = async () => {
    if ((editForm.role==='staff'||editForm.role==='student') && !editForm.department) return alert('Please assign a department');
    try {
      await api.put('/users/'+editForm.id, editForm);
      setEditModal(false); load();
    } catch (err) { alert(err.response?.data?.message||'Error'); }
  };

  const toggleActive = async (u) => {
    await api.put('/users/'+u.id, { ...u, is_active:!u.is_active });
    load();
  };

  const counts = {
    total:       users.length,
    admin:       users.filter(u=>u.role==='admin').length,
    staff:       users.filter(u=>u.role==='staff').length,
    invigilator: users.filter(u=>u.role==='invigilator').length,
    student:     users.filter(u=>u.role==='student').length,
  };

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (filterRole ? u.role === filterRole : true)
  );

  return (
    <div style={{ padding:'36px 40px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, borderBottom:'1px solid #ebebf0', paddingBottom:24 }}>
        <div>
          <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Users</h1>
          <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Manage accounts, roles and department access</p>
        </div>
        <button onClick={()=>setModal(true)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:20 }}>
          + Add user
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total',       value:counts.total,       color:'#4f46e5' },
          { label:'Admin',       value:counts.admin,       color:'#7c3aed' },
          { label:'Staff',       value:counts.staff,       color:'#0891b2' },
          { label:'Invigilator', value:counts.invigilator, color:'#d97706' },
          { label:'Student',     value:counts.student,     color:'#0f9d58' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'16px', textAlign:'center', cursor:'pointer' }}
            onClick={()=>setFilterRole(filterRole===s.label.toLowerCase()&&s.label!=='Total'?'':s.label==='Total'?'':s.label.toLowerCase())}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9494a3', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..."
          style={{ flex:1, padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none' }}/>
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
          style={{ padding:'9px 14px', border:'1px solid #ebebf0', borderRadius:10, fontSize:13, outline:'none', background:'#fff', color:'#555' }}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="invigilator">Invigilator</option>
          <option value="student">Student</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#c4c4cc', fontSize:13 }}>Loading</div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['User','Email','Role','Department','Status','Joined',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#bbb', fontWeight:600, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f0f6', background:'#fafafd' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center', color:'#bbb', fontSize:13 }}>No users found</td></tr>
              ) : filtered.map(u => {
                const rm = ROLE_META[u.role]||ROLE_META.student;
                const dm = u.department ? DEPT_META[u.department] : null;
                return (
                  <tr key={u.id} style={{ opacity:u.is_active?1:0.45 }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafafd'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={td}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:rm.bg, border:'1px solid '+rm.border, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:rm.color, flexShrink:0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600, color:'#16161f' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ ...td, color:'#9494a3' }}>{u.email}</td>
                    <td style={td}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:rm.bg, color:rm.color, border:'1px solid '+rm.border }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={td}>
                      {dm ? (
                        <span style={{ fontSize:12, color:dm.color, fontWeight:500, display:'inline-flex', alignItems:'center', gap:5 }}><DeptIcon department={u.department} size={13}/> {u.department}</span>
                      ) : (
                        <span style={{ fontSize:12, color:'#bbb' }}>—</span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                        background:u.is_active?'#eefbf3':'#f5f5f7', color:u.is_active?'#0f9d58':'#9494a3',
                        border:'1px solid '+(u.is_active?'#bce8cc':'#e0e0e6') }}>
                        {u.is_active?'Active':'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...td, color:'#9494a3' }}>{new Date(u.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={td}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={()=>{setEditForm({...u});setEditModal(true);}}
                          style={{ background:'none', border:'1px solid #ebebf0', borderRadius:7, padding:'4px 12px', fontSize:12, cursor:'pointer', color:'#555' }}>Edit</button>
                        <button onClick={()=>toggleActive(u)}
                          style={{ background:'none', border:'1px solid '+(u.is_active?'#f5bcbc':'#bce8cc'), borderRadius:7, padding:'4px 12px', fontSize:12, cursor:'pointer', color:u.is_active?'#dc2626':'#0f9d58' }}>
                          {u.is_active?'Deactivate':'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Add user</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>Create a new account and assign role</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Full name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Ravi Kumar" style={inp}/>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Email *</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="e.g. ravi@college.edu" style={inp}/>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Password *</label>
                  <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Minimum 6 characters" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Role *</label>
                  <select value={form.role} onChange={e=>setForm({...form,role:e.target.value,department:''})} style={inp}>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="invigilator">Invigilator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {(form.role === 'staff' || form.role === 'student') && (
                  <div>
                    <label style={lbl}>Department *</label>
                    <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} style={inp}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>


            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={save} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Create user</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlay} onClick={e=>e.target===e.currentTarget&&setEditModal(false)}>
          <div style={modalBox}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#16161f', margin:0 }}>Edit user</h2>
              <p style={{ fontSize:12, color:'#9494a3', marginTop:4 }}>{editForm.email}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Full name</label>
                <input value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inp}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Role</label>
                  <select value={editForm.role||'student'} onChange={e=>setEditForm({...editForm,role:e.target.value,department:''})} style={inp}>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="invigilator">Invigilator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {(editForm.role==='staff' || editForm.role==='student') && (
                  <div>
                    <label style={lbl}>Department *</label>
                    <select value={editForm.department||''} onChange={e=>setEditForm({...editForm,department:e.target.value})} style={inp}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {editForm.role==='staff' && editForm.department && (
                <div style={{ background:'#f7f7ff', border:'1px solid #ebebf0', borderRadius:8, padding:'12px 14px', fontSize:12 }}>
                  <div style={{ fontWeight:600, color:'#16161f', display:'flex', alignItems:'center', gap:6 }}>
                    <DeptIcon department={editForm.department} size={15}/> {editForm.department} Staff — department-scoped access
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={()=>setEditModal(false)} style={{ background:'none', border:'1px solid #ebebf0', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', color:'#555' }}>Cancel</button>
              <button onClick={update} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td      = { padding:'12px 14px', color:'#16161f', borderBottom:'1px solid #f7f7fb', fontSize:13 };
const lbl     = { display:'block', fontSize:11.5, fontWeight:600, color:'#7c7c8a', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' };
const inp     = { padding:'9px 12px', border:'1px solid #ebebf0', borderRadius:9, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f' };
const overlay = { position:'fixed', inset:0, background:'rgba(16,16,31,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalBox= { background:'#fff', borderRadius:18, padding:'32px', width:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(16,16,31,0.18)' };
