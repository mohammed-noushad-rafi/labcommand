import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = {
  admin: [
    { path:'/dashboard',  icon:'📊', label:'Dashboard' },
    { path:'/lab-map',    icon:'🖥️', label:'Lab Map' },
    { path:'/classroom',  icon:'📋', label:'Classroom Mode' },
    { path:'/exam',       icon:'📝', label:'Exam Monitor' },
    { path:'/equipment',  icon:'🔧', label:'Equipment' },
    { path:'/maintenance',icon:'🛠️', label:'Maintenance' },
    { path:'/complaints', icon:'🎫', label:'Complaints' },
    { path:'/inventory',  icon:'📦', label:'Inventory' },
    { path:'/predictions',icon:'🤖', label:'AI Predictions' },
    { path:'/booking',    icon:'📅', label:'Lab Booking' },
    { path:'/analytics',  icon:'📈', label:'Analytics' },
    { path:'/users',      icon:'👥', label:'Users' },
    { path:'/audit',      icon:'🔍', label:'Audit Log' },
  ],
  staff: [
    { path:'/dashboard',  icon:'📊', label:'Dashboard' },
    { path:'/lab-map',    icon:'🖥️', label:'Lab Map' },
    { path:'/equipment',  icon:'🔧', label:'Equipment' },
    { path:'/maintenance',icon:'🛠️', label:'Maintenance' },
    { path:'/complaints', icon:'🎫', label:'Complaints' },
    { path:'/inventory',  icon:'📦', label:'Inventory' },
    { path:'/booking',    icon:'📅', label:'Lab Booking' },
  ],
  invigilator: [
    { path:'/exam',      icon:'📝', label:'Exam Monitor' },
    { path:'/classroom', icon:'📋', label:'Classroom Mode' },
    { path:'/booking',   icon:'📅', label:'Lab Booking' },
  ],
  student: [
    { path:'/booking',   icon:'📅', label:'Lab Booking' },
    { path:'/complaints',icon:'🎫', label:'Complaints' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = NAV[user?.role] || [];

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{
        width: collapsed ? 60 : 220,
        background: '#1a1a2e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width .2s',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div>
          <div style={{ padding:'18px 14px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {!collapsed && <span style={{ fontWeight:700, fontSize:15, whiteSpace:'nowrap' }}>⚡ LabCommand</span>}
            <button onClick={() => setCollapsed(!collapsed)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', cursor:'pointer', borderRadius:6, padding:'4px 8px', fontSize:12, marginLeft: collapsed ? 'auto' : 0 }}>
              {collapsed ? '→' : '←'}
            </button>
          </div>
          <nav style={{ padding:'10px 0', display:'flex', flexDirection:'column', gap:2 }}>
            {items.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 14px',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  textDecoration:'none', fontSize:13,
                  background: active ? 'rgba(102,126,234,0.3)' : 'transparent',
                  borderLeft: active ? '3px solid #667eea' : '3px solid transparent',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ padding:14, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#667eea', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textTransform:'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width:'100%', padding:8, background:'rgba(255,255,255,0.08)',
            border:'none', color:'rgba(255,255,255,0.7)', borderRadius:8,
            cursor:'pointer', fontSize:13, display:'flex', alignItems:'center',
            gap:6, justifyContent:'center',
          }}>
            🚪{!collapsed && ' Logout'}
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflow:'auto', background:'#f5f6fa' }}>
        {children}
      </main>
    </div>
  );
}