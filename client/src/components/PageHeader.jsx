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
  return (
    <div style={s.grid6}>
      {stats.map(stat => (
        <div key={stat.label} style={s.card}>
          <div style={s.statNum}>{stat.value ?? 0}</div>
          <div style={s.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

const s = {
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:14, borderBottom:'1px solid #ececf0', paddingBottom:20 },
  title:      { fontSize:22, fontWeight:600, color:'#1a1a2e', margin:0, letterSpacing:'-0.01em' },
  sub:        { fontSize:13, color:'#999', marginTop:3 },
  panel:      { background:'#fff', border:'1px solid #ececf0', borderRadius:12, padding:'22px 24px', marginBottom:20 },
  panelTitle: { fontSize:13.5, fontWeight:600, color:'#1a1a2e', marginBottom:18 },
  grid6:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:1, marginBottom:28, background:'#ececf0', border:'1px solid #ececf0', borderRadius:12, overflow:'hidden' },
  card:       { background:'#fff', padding:'22px 18px' },
  statNum:    { fontSize:28, fontWeight:600, color:'#1a1a2e', letterSpacing:'-0.02em' },
  statLabel:  { fontSize:12, color:'#999', marginTop:4 },
};