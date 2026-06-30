export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={s.header}>
      <div>
        <h1 style={s.title}>{title}</h1>
        {subtitle && <p style={s.sub}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, style }) {
  return (
    <div style={{ ...s.panel, ...style }}>
      {title && <h3 style={s.panelTitle}>{title}</h3>}
      {children}
    </div>
  );
}

export function StatRow({ stats }) {
  const colors = ['#4f46e5','#0f9d58','#d97706','#dc2626','#2563eb','#7c3aed'];
  return (
    <div style={s.grid6}>
      {stats.map((stat, i) => (
        <div key={stat.label} style={s.card}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: colors[i % colors.length], marginBottom:10 }} />
          <div style={s.statNum}>{stat.value ?? 0}</div>
          <div style={s.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

const s = {
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:14, borderBottom:'1px solid #e9e9f0', paddingBottom:20 },
  title:      { fontSize:23, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' },
  sub:        { fontSize:13, color:'#7c7c8a', marginTop:3 },
  panel:      { background:'#fff', border:'1px solid #e9e9f0', borderRadius:14, padding:'22px 24px', marginBottom:20, boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  panelTitle: { fontSize:14, fontWeight:700, color:'#16161f', marginBottom:18 },
  grid6:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 },
  card:       { background:'#fff', border:'1px solid #e9e9f0', borderRadius:14, padding:'18px 18px', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  statNum:    { fontSize:28, fontWeight:800, color:'#16161f', letterSpacing:'-0.02em' },
  statLabel:  { fontSize:12, color:'#7c7c8a', marginTop:4, fontWeight:500 },
};