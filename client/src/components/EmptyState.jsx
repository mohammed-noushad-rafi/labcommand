export default function EmptyState({ title='Nothing here yet', subtitle='' }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'56px 20px', textAlign:'center',
    }}>
      <div style={{
        width:36, height:36, borderRadius:'50%',
        border:'1.5px solid #ececf0',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, marginBottom:14, color:'#bbb',
      }}>
        —
      </div>
      <div style={{fontSize:13, fontWeight:500, color:'#999', marginBottom:3}}>{title}</div>
      {subtitle && <div style={{fontSize:12, color:'#ccc', maxWidth:260, lineHeight:1.5}}>{subtitle}</div>}
    </div>
  );
}