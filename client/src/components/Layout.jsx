import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLab } from '../context/LabContext';

const NAV = {
  admin: [
    { group:'Monitor', items:[
      { path:'/dashboard', label:'Dashboard' },
      { path:'/lab-map',   label:'Lab map' },
      { path:'/analytics', label:'Analytics' },
    ]},
    { group:'Operate', items:[
      { path:'/equipment',   label:'Equipment' },
      { path:'/maintenance', label:'Maintenance' },
      { path:'/complaints',  label:'Complaints' },
      { path:'/inventory',   label:'Inventory' },
      { path:'/booking',     label:'Lab booking' },
    ]},
    { group:'Exams', items:[
      { path:'/exam',       label:'Exam monitor' },
      { path:'/classroom',  label:'Classroom mode' },
    ]},
    { group:'Intelligence', items:[
      { path:'/predictions', label:'AI predictions' },
    ]},
    { group:'Admin', items:[
      { path:'/users', label:'Users' },
      { path:'/audit', label:'Audit log' },
    ]},
  ],
  staff: [
    { group:'Monitor', items:[
      { path:'/dashboard', label:'Dashboard' },
      { path:'/lab-map',   label:'Lab map' },
    ]},
    { group:'Operate', items:[
      { path:'/equipment',   label:'Equipment' },
      { path:'/maintenance', label:'Maintenance' },
      { path:'/complaints',  label:'Complaints' },
      { path:'/inventory',   label:'Inventory' },
      { path:'/booking',     label:'Lab booking' },
    ]},
  ],
  invigilator: [
    { group:'Exams', items:[
      { path:'/exam',      label:'Exam monitor' },
      { path:'/classroom', label:'Classroom mode' },
    ]},
    { group:'Other', items:[
      { path:'/booking', label:'Lab booking' },
    ]},
  ],
  student: [
    { group:'You', items:[
      { path:'/booking',    label:'Lab booking' },
      { path:'/complaints', label:'Complaints' },
    ]},
  ],
};

const PAGE_TITLES = {
  '/dashboard':'Dashboard', '/lab-map':'Lab map', '/classroom':'Classroom mode',
  '/exam':'Exam monitor', '/equipment':'Equipment', '/maintenance':'Maintenance',
  '/complaints':'Complaints', '/inventory':'Inventory', '/predictions':'AI predictions',
  '/booking':'Lab booking', '/analytics':'Analytics', '/users':'Users', '/audit':'Audit log',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/machines/')) return 'Machine detail';
  if (pathname.startsWith('/exam/war-room/')) return 'Exam war room';
  return 'LabCommand';
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { labs, selectedLab, setSelectedLab } = useLab();
  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const groups = NAV[user?.role] || [];
  const showLabPicker = !['/users','/audit'].includes(location.pathname);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#fafafa', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <aside style={{
        width: collapsed ? 56 : 212,
        background: '#fff',
        borderRight: '1px solid #ececf0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width .18s',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div>
          <div style={{ padding:'16px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #ececf0' }}>
            {!collapsed && <span style={{ fontWeight:600, fontSize:14, color:'#1a1a2e', letterSpacing:'-0.01em' }}>LabCommand</span>}
            <button onClick={() => setCollapsed(!collapsed)} style={{ background:'none', border:'none', color:'#bbb', cursor:'pointer', fontSize:13, marginLeft: collapsed ? 'auto' : 0, padding:2 }}>
              {collapsed ? '\u203a' : '\u2039'}
            </button>
          </div>

          <nav style={{ padding:'14px 0' }}>
            {groups.map(group => (
              <div key={group.group} style={{ marginBottom:18 }}>
                {!collapsed && (
                  <div style={{ fontSize:10, fontWeight:600, color:'#c4c4cc', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 16px 6px' }}>
                    {group.group}
                  </div>
                )}
                {group.items.map(item => {
                  const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link key={item.path} to={item.path} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding: collapsed ? '8px 0' : '7px 16px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      color: active ? '#1a1a2e' : '#888',
                      textDecoration:'none', fontSize:13,
                      fontWeight: active ? 600 : 400,
                      background: active ? '#f4f4f8' : 'transparent',
                      whiteSpace:'nowrap',
                      position:'relative',
                    }}>
                      {active && !collapsed && (
                        <span style={{ position:'absolute', left:0, top:0, bottom:0, width:2.5, background:'#1a1a2e' }} />
                      )}
                      {collapsed ? <span style={{width:5,height:5,borderRadius:'50%',background:active?'#1a1a2e':'#ddd'}}/> : item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div style={{ padding:14, borderTop:'1px solid #ececf0' }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:12, color:'#fff', flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:12.5, fontWeight:500, color:'#1a1a2e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'#aaa', textTransform:'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width:'100%', padding:'7px', background:'transparent',
            border:'1px solid #ececf0', color:'#888', borderRadius:8,
            cursor:'pointer', fontSize:12.5, display:'flex', alignItems:'center',
            gap:6, justifyContent:'center',
          }}>
            {collapsed ? '\u23fb' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{
          height:48, borderBottom:'1px solid #ececf0', background:'#fff',
          display:'flex', alignItems:'center', padding:'0 24px', flexShrink:0,
          gap:8,
        }}>
          <span style={{ fontSize:12.5, color:'#bbb' }}>LabCommand</span>
          <span style={{ fontSize:12.5, color:'#ddd' }}>/</span>
          <span style={{ fontSize:12.5, color:'#1a1a2e', fontWeight:600 }}>{getPageTitle(location.pathname)}</span>

          {showLabPicker && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, border:'1px solid #ececf0', borderRadius:20, padding:'4px 10px 4px 8px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background: selectedLab==='all' ? '#bbb' : '#16a34a', flexShrink:0 }} />
              <select
                value={selectedLab}
                onChange={e => setSelectedLab(e.target.value)}
                style={{ border:'none', outline:'none', background:'transparent', fontSize:12, color:'#555', cursor:'pointer' }}
              >
                <option value="all">All labs</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <main style={{ flex:1, overflow:'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
