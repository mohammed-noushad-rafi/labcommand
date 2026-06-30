export function Table({ columns, rows, renderRow, emptyTitle, emptySubtitle }) {
  if (!rows?.length) {
    return (
      <div style={s.emptyWrap}>
        <div style={s.emptyDot}>—</div>
        <div style={s.emptyTitle}>{emptyTitle || 'Nothing here yet'}</div>
        {emptySubtitle && <div style={s.emptySub}>{emptySubtitle}</div>}
      </div>
    );
  }

  return (
    <table style={s.table}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col} style={s.th}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <RowWrap key={i}>{renderRow(row, i)}</RowWrap>
        ))}
      </tbody>
    </table>
  );
}

function RowWrap({ children }) {
  return children;
}

export function Td({ children, muted, style }) {
  return <td style={{ ...s.td, ...(muted ? { color:'#9494a3' } : {}), ...style }}>{children}</td>;
}

export function Badge({ children, tone='default' }) {
  const tones = {
    default: { bg:'#f1f1f6', color:'#5a5a6c' },
    success: { bg:'#e3f7ea', color:'#0f9d58' },
    warning: { bg:'#fef3e2', color:'#d97706' },
    danger:  { bg:'#fde9e9', color:'#dc2626' },
    info:    { bg:'#e8f0fe', color:'#2563eb' },
    purple:  { bg:'#f1ebfe', color:'#7c3aed' },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:t.bg, color:t.color, whiteSpace:'nowrap', letterSpacing:'0.01em' }}>
      {children}
    </span>
  );
}

const s = {
  table:     { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:        { textAlign:'left', padding:'11px 12px', color:'#a8a8b8', fontWeight:700, fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:'2px solid #f0f0f6', background:'#fafafd' },
  td:        { padding:'14px 12px', color:'#16161f', borderBottom:'1px solid #f0f0f6' },
  emptyWrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px', textAlign:'center' },
  emptyDot:  { width:40, height:40, borderRadius:'50%', background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, marginBottom:14, color:'#4f46e5' },
  emptyTitle:{ fontSize:13, fontWeight:600, color:'#5a5a6c', marginBottom:3 },
  emptySub:  { fontSize:12, color:'#a8a8b8', maxWidth:260, lineHeight:1.5 },
};