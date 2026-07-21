export default function PageHeader({ title, subtitle, action }) {
  return (
    <div>
      <div style={s.accentBar} />
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{title}</h1>
          {subtitle && <p style={s.sub}>{subtitle}</p>}
        </div>
        {action}
      </div>
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

const PALETTE = [
  { dot:'#4f46e5', bg:'#f5f4fe' },
  { dot:'#0f9d58', bg:'#eefbf3' },
  { dot:'#d97706', bg:'#fef8ee' },
  { dot:'#dc2626', bg:'#fef2f2' },
  { dot:'#2563eb', bg:'#eff5fe' },
  { dot:'#7c3aed', bg:'#f6f1fe' },
];

export function StatRow({ stats }) {
  return (
    <div className="lc-stagger" style={s.grid6}>
      {stats.map((stat, i) => {
        const c = PALETTE[i % PALETTE.length];
        return (
          <div key={stat.label} className="lc-card-hover" style={{ ...s.card, background:c.bg, border:'1px solid transparent' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:c.dot, marginBottom:10 }} />
            <div style={{ ...s.statNum, color:c.dot }}>{stat.value ?? 0}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  accentBar:  { height:3, width:64, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:16 },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:14, borderBottom:'1px solid #e9e9f0', paddingBottom:20 },
  title:      { fontSize:23, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' },
  sub:        { fontSize:13, color:'#7c7c8a', marginTop:3 },
  panel:      { background:'#fff', border:'1px solid #e9e9f0', borderRadius:14, padding:'22px 24px', marginBottom:20, boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  panelTitle: { fontSize:14, fontWeight:700, color:'#16161f', marginBottom:18 },
  grid6:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 },
  card:       { borderRadius:14, padding:'18px 18px', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' },
  statNum:    { fontSize:28, fontWeight:800, letterSpacing:'-0.02em' },
  statLabel:  { fontSize:12, color:'#7c7c8a', marginTop:4, fontWeight:500 },
};