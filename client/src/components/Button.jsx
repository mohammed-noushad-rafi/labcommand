export default function Button({ children, variant='primary', onClick, disabled, type='button', style }) {
  const variants = {
    primary:   { bg:'#1a1a2e', color:'#fff', border:'1px solid #1a1a2e' },
    secondary: { bg:'#fff', color:'#1a1a2e', border:'1px solid #ececf0' },
    danger:    { bg:'#fff', color:'#b91c1c', border:'1px solid #f3caca' },
    ghost:     { bg:'transparent', color:'#888', border:'1px solid transparent' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:500,
        background:v.bg, color:v.color, border:v.border,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace:'nowrap',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
