import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLab } from '../context/LabContext';
import BookingToast from './BookingToast';

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
      { path:'/emaillog', label:'Email log' },
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
    { group:'Reports', items:[
      { path:'/emaillog', label:'Email log' },
    ]},
  ],
  invigilator: [
    { group:'Exams', items:[
      { path:'/exam', label:'Exam monitor' },
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
  '/booking':'Lab booking', '/analytics':'Analytics', '/users':'Users', '/audit':'Audit log', '/emaillog':'Email log',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/machines/')) return 'Machine detail';
  if (pathname.startsWith('/exam/war-room/')) return 'Exam war room';
  return 'LabCommand';
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const groups = NAV[user?.role] || [];


  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f7f7fb', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <aside style={{
        width: collapsed ? 56 : 212,
        background: '#fff',
        borderRight: '1px solid #e9e9f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width .18s',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div>
          <div style={{ padding:'16px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #e9e9f0' }}>
            {!collapsed && <span style={{ fontWeight:700, fontSize:14, color:'#16161f', letterSpacing:'-0.01em' }}>LabCommand</span>}
            <button onClick={() => setCollapsed(!collapsed)} style={{ background:'none', border:'none', color:'#b4b4c0', cursor:'pointer', fontSize:13, marginLeft: collapsed ? 'auto' : 0, padding:2 }}>
              {collapsed ? '\u203a' : '\u2039'}
            </button>
          </div>

          <nav style={{ padding:'14px 0' }}>
            {groups.map(group => (
              <div key={group.group} style={{ marginBottom:18 }}>
                {!collapsed && (
                  <div style={{ fontSize:10, fontWeight:700, color:'#c4c4cc', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 16px 6px' }}>
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
                      color: active ? '#4f46e5' : '#7c7c8a',
                      textDecoration:'none', fontSize:13,
                      fontWeight: active ? 600 : 400,
                      background: active ? '#eef2ff' : 'transparent',
                      whiteSpace:'nowrap',
                      position:'relative',
                      borderRadius: collapsed ? 0 : 8,
                      margin: collapsed ? 0 : '0 8px',
                      width: collapsed ? '100%' : 'auto',
                      transition:'background .15s ease, color .15s ease, transform .12s ease',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f4f4fb'; e.currentTarget.style.color = '#4f46e5'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7c7c8a'; } }}
                    >
                      {active && !collapsed && (
                        <span style={{ position:'absolute', left:-8, top:2, bottom:2, width:2.5, borderRadius:2, background:'linear-gradient(180deg,#4f46e5,#7c3aed)' }} />
                      )}
                      {collapsed ? <span className={active ? 'lc-live-dot' : ''} style={{width:5,height:5,borderRadius:'50%',background:active?'#4f46e5':'#ddd'}}/> : item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div style={{ padding:14, borderTop:'1px solid #e9e9f0' }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#fff', flexShrink:0, boxShadow:'0 2px 8px rgba(79,70,229,0.35)' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'#16161f', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'#a8a8b8', textTransform:'capitalize' }}>{user?.role}</div>
                {user?.role === 'staff' && user?.department && (
                  <div style={{ fontSize:10, color:'#0891b2', fontWeight:600, marginTop:2,
                    background:'#ecfeff', border:'1px solid #a5f3fc', borderRadius:4,
                    padding:'1px 6px', display:'inline-block' }}>
                    {user.department === 'Computer Science' ? '🖥️' : user.department === 'Physics' ? '⚛️' : '🧪'} {user.department}
                  </div>
                )}
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9e9f0'; e.currentTarget.style.color = '#7c7c8a'; e.currentTarget.style.background = 'transparent'; }}
            style={{
            width:'100%', padding:'7px', background:'transparent',
            border:'1px solid #e9e9f0', color:'#7c7c8a', borderRadius:8,
            cursor:'pointer', fontSize:12.5, fontWeight:500, display:'flex', alignItems:'center',
            gap:6, justifyContent:'center', transition:'border-color .15s, color .15s, background .15s',
          }}>
            {collapsed ? '\u23fb' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{
          height:48, borderBottom:'1px solid #e9e9f0', background:'#fff',
          display:'flex', alignItems:'center', padding:'0 24px', flexShrink:0,
          gap:8,
        }}>
          <span style={{ fontSize:12.5, color:'#b4b4c0' }}>LabCommand</span>
          <span style={{ fontSize:12.5, color:'#ddd' }}>/</span>
          <span style={{ fontSize:12.5, color:'#16161f', fontWeight:600 }}>{getPageTitle(location.pathname)}</span>


        </div>

       <main key={location.pathname} className="lc-page" style={{ flex:1, overflow:'auto' }}>
          {children}
        </main>
      </div>
      <BookingToast />
    </div>
  );
}
