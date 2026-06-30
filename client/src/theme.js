export const theme = {
  // Single accent color, used sparingly — everything else is grayscale
  accent:      '#1a1a2e',
  accentSoft:  '#f4f4f8',
  text:        '#1a1a2e',
  textMuted:   '#888888',
  textFaint:   '#bbbbbb',
  border:      '#ececf0',
  borderSoft:  '#f5f5f7',
  bg:          '#fafafa',
  surface:     '#ffffff',

  status: {
    success: '#1a8754',
    successSoft: '#eaf6ef',
    warning: '#a16207',
    warningSoft: '#fdf6e3',
    danger:  '#b91c1c',
    dangerSoft: '#fcecec',
    info:    '#374151',
    infoSoft: '#f3f4f6',
  },

  radius: { sm:6, md:10, lg:12, pill:20 },
  shadow: '0 1px 2px rgba(0,0,0,0.04)',
};

export const cardBase = {
  background: theme.surface,
  borderRadius: theme.radius.lg,
  border: `1px solid ${theme.border}`,
  boxShadow: theme.shadow,
};

export const badge = (status='info') => {
  const s = theme.status[status] || theme.status.info;
  const bg = theme.status[`${status}Soft`] || theme.status.infoSoft;
  return {
    padding:'3px 10px', borderRadius: theme.radius.pill,
    fontSize:11, fontWeight:500, background:bg, color:s,
    letterSpacing:'0.01em',
  };
};