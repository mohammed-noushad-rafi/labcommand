const DEPT_ORDER = ['Computer Science', 'Chemistry', 'Physics'];
 
// Returns a new array sorted into the standard department display order.
// Departments not in DEPT_ORDER are pushed to the end, in their original order.
export function sortDepts(list) {
  return [...list].sort((a, b) => {
    const ai = DEPT_ORDER.indexOf(a.department);
    const bi = DEPT_ORDER.indexOf(b.department);
    return (ai === -1 ? DEPT_ORDER.length : ai) - (bi === -1 ? DEPT_ORDER.length : bi);
  });
}
 