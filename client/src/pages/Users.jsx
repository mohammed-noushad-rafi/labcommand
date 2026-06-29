import { useEffect, useState } from 'react';
import api from '../api/axios';

const ROLE_COLORS = {
  admin:       { bg:'#ede9fe', color:'#5b21b6' },
  staff:       { bg:'#e0f2fe', color:'#0369a1' },
  invigilator: { bg:'#fef9c3', color:'#92400e' },
  student:     { bg:'#f0fdf4', color:'#166534' },
};

const empty = { name:'', email:'', password:'', role:'student' };

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editModal,setEditModal] = useState(false);
  const [form,    setForm]    = useState(empty);
  const [editForm,setEditForm]= useState({});
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = () => {
    api.get('/users').then(r => setUsers(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.post('/users', form);
      setModal(false); setForm(empty); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const update = async () => {
    try {
      await api.put(`/users/${editForm.id}`, editForm);
      setEditModal(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const toggleActive = async (user) => {
    await api.put(`/users/${user.id}`, { ...user, is_active: !user.is_active });
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
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',margin:0}}>Users</h1>
          <p style={{fontSize:13,color:'#888',marginTop:4}}>Manage user accounts and roles</p>
        </div>
        <button onClick={()=>setModal(true)} style={btn('#667eea')}>+ Add user</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:counts.total,c:'#64748b'},{l:'Admin',v:counts.admin,c:'#5b21b6'},{l:'Staff',v:counts.staff,c:'#0369a1'},{l:'Invigilator',v:counts.invigilator,c:'#92400e'},{l:'Student',v:counts.student,c:'#166534'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#888'}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:16}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." style={{...inp,maxWidth:360}}/>
      </div>

      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Name','Email','Role','Status','Created','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#888',fontWeight:500,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#888'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#aaa'}}>No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} style={{borderTop:'1px solid #f0f0f0',opacity:u.is_active?1:0.5}}>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:'#667eea22',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#667eea',flexShrink:0}}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{fontWeight:500,color:'#1a1a2e'}}>{u.name}</span>
                  </div>
                </td>
                <td style={{padding:'12px 14px',color:'#555'}}>{u.email}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,...(ROLE_COLORS[u.role]||{})}}>
                    {u.role}
                  </span>
                </td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:u.is_active?'#dcfce7':'#fee2e2',color:u.is_active?'#16a34a':'#dc2626'}}>
                    {u.is_active?'Active':'Inactive'}
                  </span>
                </td>
                <td style={{padding:'12px 14px',color:'#888',fontSize:12}}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>{setEditForm({...u});setEditModal(true);}} style={smallBtn('#3b82f6')}>Edit</button>
                    <button onClick={()=>toggleActive(u)} style={smallBtn(u.is_active?'#ef4444':'#16a34a')}>
                      {u.is_active?'Deactivate':'Activate'}
                    </button>
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
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Add user</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[{l:'Full name *',key:'name',type:'text'},{l:'Email *',key:'email',type:'email'},{l:'Password *',key:'password',type:'password'}].map(f=>(
                <div key={f.key}>
                  <label style={lbl}>{f.l}</label>
                  <input type={f.type} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={inp}/>
                </div>
              ))}
              <div>
                <label style={lbl}>Role</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={sel}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="invigilator">Invigilator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={save} style={btn('#667eea')}>Create user</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:600,margin:0}}>Edit user</h2>
              <button onClick={()=>setEditModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={lbl}>Full name</label>
                <input type="text" value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Role</label>
                <select value={editForm.role||'student'} onChange={e=>setEditForm({...editForm,role:e.target.value})} style={sel}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="invigilator">Invigilator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button onClick={()=>setEditModal(false)} style={smallBtn('#888')}>Cancel</button>
              <button onClick={update} style={btn('#667eea')}>Save changes</button>
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
const modalBox = {background:'#fff',borderRadius:14,padding:28,width:440,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'};