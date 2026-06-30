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
        {rows.map((row, i) => renderRow(row, i))}
      </tbody>
    </table>
  );
}

export function Td({ children, muted, style }) {
  return <td style={{ ...s.td, ...(muted ? { color:'#999' } : {}), ...style }}>{children}</td>;
}

export function Badge({ children, tone='default' }) {
  const tones = {
    default: { bg:'#f3f4f6', color:'#374151' },
    success: { bg:'#eaf6ef', color:'#1a8754' },
    warning: { bg:'#fdf6e3', color:'#a16207' },
    danger:  { bg:'#fcecec', color:'#b91c1c' },
    info:    { bg:'#f0f4fd', color:'#2c4a9e' },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500, background:t.bg, color:t.color, whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

const s = {
  table:     { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:        { textAlign:'left', padding:'9px 10px', color:'#bbb', fontWeight:500, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #ececf0' },
  td:        { padding:'12px 10px', color:'#1a1a2e', borderBottom:'1px solid #f5f5f7' },
  emptyWrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px', textAlign:'center' },
  emptyDot:  { width:36, height:36, borderRadius:'50%', border:'1.5px solid #ececf0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginBottom:14, color:'#bbb' },
  emptyTitle:{ fontSize:13, fontWeight:500, color:'#999', marginBottom:3 },
  emptySub:  { fontSize:12, color:'#ccc', maxWidth:260, lineHeight:1.5 },
};