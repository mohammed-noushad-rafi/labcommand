// Single source of truth for the backend's address. Reads VITE_API_URL from
// the environment (set this in Vercel's project settings once deployed —
// e.g. VITE_API_URL=https://labcommand-production.up.railway.app). Falls
// back to localhost so local development keeps working with zero setup.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
