export default function Button({ children, variant='primary', onClick, disabled, type='button', style }) {
  const variants = {
    primary:   { bg:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', shadow:'0 4px 14px rgba(79,70,229,0.35)' },
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
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(0) scale(0.97)'; }}
      onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)'; }}
      style={{
        padding:'9px 18px', borderRadius:10, fontSize:13, fontWeight:600,
        background:v.bg, color:v.color, border:v.border, boxShadow:v.shadow,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace:'nowrap',
        transition:'transform .13s cubic-bezier(.2,.8,.2,1), box-shadow .15s ease, opacity .15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}