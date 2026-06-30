export default function Button({ children, variant='primary', onClick, disabled, type='button', style }) {
  const variants = {
    primary:   { bg:'#4f46e5', color:'#fff', border:'1px solid #4f46e5', shadow:'0 2px 8px rgba(79,70,229,0.25)' },
    secondary: { bg:'#fff', color:'#16161f', border:'1px solid #e9e9f0', shadow:'none' },
    danger:    { bg:'#fde9e9', color:'#dc2626', border:'1px solid #f8caca', shadow:'none' },
    ghost:     { bg:'transparent', color:'#7c7c8a', border:'1px solid transparent', shadow:'none' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:600,
        background:v.bg, color:v.color, border:v.border, boxShadow:v.shadow,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace:'nowrap',
        transition:'transform .1s, box-shadow .15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}