// Shared department icon set
// scalable SVG glyphs. Colors intentionally match each department's
// established accent (CS indigo, Physics cyan, Chemistry green) so this
// drops in wherever the old emoji was rendered, same visual role.

function Base({ children, size, viewBox = '0 0 24 24' }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', flexShrink:0 }}>
      {children}
    </svg>
  );
}

function ComputerScienceIcon({ size }) {
  return (
    <Base size={size}>
      <rect x="2.5" y="4" width="19" height="12" rx="2" stroke="#4f46e5" strokeWidth="1.6"/>
      <path d="M9 20h6M12 16v4" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M6.5 8.5l2 2-2 2M12 12.5h2.5" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Base>
  );
}

function PhysicsIcon({ size }) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="1.8" fill="#0891b2"/>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="#0891b2" strokeWidth="1.5"/>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="#0891b2" strokeWidth="1.5" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="#0891b2" strokeWidth="1.5" transform="rotate(120 12 12)"/>
    </Base>
  );
}

function ChemistryIcon({ size }) {
  return (
    <Base size={size}>
      <path d="M10 3h4M10.5 3v5.2L5.8 17.4C5.1 18.8 6.1 20.5 7.7 20.5h8.6c1.6 0 2.6-1.7 1.9-3.1L13.5 8.2V3" stroke="#0f9d58" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9.5" cy="16.5" r="1" fill="#0f9d58"/>
      <circle cx="13" cy="18" r="0.8" fill="#0f9d58"/>
      <circle cx="15" cy="15.5" r="0.7" fill="#0f9d58"/>
    </Base>
  );
}

function GenericLabIcon({ size }) {
  return (
    <Base size={size}>
      <path d="M4 21V9l4-5h8l4 5v12" stroke="#7c7c8a" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M4 13h16M9 4v9M15 4v9" stroke="#7c7c8a" strokeWidth="1.4"/>
    </Base>
  );
}

const ICONS = {
  'Computer Science': ComputerScienceIcon,
  'Physics': PhysicsIcon,
  'Chemistry': ChemistryIcon,
};

// department: e.g. "Computer Science" | "Physics" | "Chemistry" (falls back
// to a generic lab icon for anything else). size: pixel dimension, default 24.
export default function DeptIcon({ department, size = 24 }) {
  const Icon = ICONS[department] || GenericLabIcon;
  return <Icon size={size} />;
}
