import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader, { Panel, StatRow } from '../components/PageHeader';
import { Table, Badge } from '../components/Table';
import Button from '../components/Button';

const ROLE_TONE = { admin:'purple', staff:'info', invigilator:'warning', student:'success' };
const empty = { name:'', email:'', password:'', role:'student' };

export default function Users() {
  const [users,    setUsers]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editModal,setEditModal]= useState(false);
  const [form,     setForm]     = useState(empty);
  const [editForm, setEditForm] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

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
    <div style={{ padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts and roles"
        action={<Button onClick={()=>setModal(true)}>Add user</Button>}
      />

      <StatRow stats={[
        { label:'Total',       value: counts.total },
        { label:'Admin',       value: counts.admin },
        { label:'Staff',       value: counts.staff },
        { label:'Invigilator', value: counts.invigilator },
        { label:'Student',     value: counts.student },
      ]} />

      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email" style={{ ...inputStyle, maxWidth:360 }}/>
      </div>

      <Panel>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#bbb', fontSize:13 }}>Loading</div>
        ) : (
          <Table
            columns={['Name','Email','Role','Status','Created','']}
            rows={filtered}
            emptyTitle="No users found"
            emptySubtitle="Add a user to get started."
            renderRow={u => (
              <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                <td style={td}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={avatarStyle}>{u.name?.[0]?.toUpperCase()}</div>
                    <span style={{ fontWeight:500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ ...td, color:'#999' }}>{u.email}</td>
                <td style={td}><Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge></td>
                <td style={td}><Badge tone={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td style={{ ...td, color:'#999', fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td style={td}>
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    <Button variant="secondary" onClick={()=>{setEditForm({...u});setEditModal(true);}} style={{ padding:'5px 12px', fontSize:12 }}>Edit</Button>
                    <Button variant={u.is_active ? 'danger' : 'primary'} onClick={()=>toggleActive(u)} style={{ padding:'5px 12px', fontSize:12 }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
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
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Add user</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[{ l:'Full name', key:'name', type:'text' },{ l:'Email', key:'email', type:'email' },{ l:'Password', key:'password', type:'password' }].map(f=>(
                <div key={f.key}>
                  <label style={labelStyle}>{f.l}</label>
                  <input type={f.type} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={inputStyle}/>
                </div>
              ))}
              <div>
                <label style={labelStyle}>Role</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={selectStyle}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="invigilator">Invigilator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
              <Button onClick={save}>Create user</Button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:600, margin:0, color:'#1a1a2e' }}>Edit user</h2>
              <button onClick={()=>setEditModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#bbb' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input type="text" value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={editForm.role||'student'} onChange={e=>setEditForm({...editForm,role:e.target.value})} style={selectStyle}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="invigilator">Invigilator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <Button variant="secondary" onClick={()=>setEditModal(false)}>Cancel</Button>
              <Button onClick={update}>Save changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td          = { padding:'12px 10px', color:'#1a1a2e', borderBottom:'1px solid #f5f5f7' };
const avatarStyle = { width:30, height:30, borderRadius:'50%', background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#4f46e5', flexShrink:0 };
const inputStyle  = { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', outline:'none' };
const selectStyle = { padding:'8px 12px', border:'1px solid #ececf0', borderRadius:8, fontSize:13, width:'100%', boxSizing:'border-box', background:'#fff', outline:'none' };
const labelStyle  = { fontSize:11, fontWeight:500, color:'#888', display:'block', marginBottom:4 };
const overlay     = { position:'fixed', inset:0, background:'rgba(26,26,46,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modalBox    = { background:'#fff', borderRadius:12, padding:28, width:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' };