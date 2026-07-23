import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null); // 'email' | 'password' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'student' || res.data.user.role === 'invigilator' ? '/booking' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    ...styles.input,
    borderColor: focused === name ? '#4f46e5' : '#e5e5ec',
    boxShadow: focused === name ? '0 0 0 3px rgba(79,70,229,0.12)' : 'none',
  });

  return (
    <div className="lc-page" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.accentBar} />

        <div style={styles.logoMark}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.95"/>
            <rect x="13" y="3" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.65"/>
            <rect x="3" y="13" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.65"/>
            <rect x="13" y="13" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.95"/>
          </svg>
        </div>

        <h1 style={styles.title}>LabCommand</h1>
        <p style={styles.sub}>Sign in to your account</p>

        {error && (
          <div style={styles.error}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
              <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
              <path d="M12 8v5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="#dc2626"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={inputStyle('email')}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoComplete="email"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={inputStyle('password')}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            style={{ ...styles.btn, opacity: loading ? 0.75 : 1 }}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0) scale(0.98)'; }}
            onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px) scale(1)'; }}
          >
            {loading ? (
              <span style={styles.btnLoading}>
                <span style={styles.spinner} />
                Signing in
              </span>
            ) : 'Sign in'}
          </button>
        </form>
      </div>

      <div style={styles.footer}>LabCommand · Lab Network Management System</div>

      <style>{'@keyframes lc-spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 0%, #eef0fb 0%, #f5f6fb 45%, #f2f3f8 100%)',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 18,
    padding: '44px 40px 36px',
    width: 400,
    maxWidth: '100%',
    boxShadow: '0 1px 2px rgba(16,16,30,0.04), 0 20px 48px rgba(16,16,30,0.10)',
    border: '1px solid #eeeef4',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
  },
  logoMark: {
    width: 52, height: 52, borderRadius: 14,
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '4px auto 18px',
    boxShadow: '0 8px 20px rgba(79,70,229,0.28)',
  },
  title: { fontSize: 23, fontWeight: 800, color: '#16161f', margin: 0, letterSpacing: '-0.02em' },
  sub:   { fontSize: 13, color: '#9494a3', marginTop: 6, marginBottom: 28 },
  error: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 18, textAlign: 'left',
  },
  form:  { display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11.5, fontWeight: 700, color: '#7c7c8a', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '11px 13px', border: '1.5px solid #e5e5ec', borderRadius: 10,
    fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#16161f',
    transition: 'border-color .15s ease, box-shadow .15s ease',
  },
  btn: {
    padding: '12px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', marginTop: 6, boxShadow: '0 6px 16px rgba(79,70,229,0.30)',
    transition: 'transform .13s cubic-bezier(.2,.8,.2,1), opacity .15s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnLoading: { display: 'flex', alignItems: 'center', gap: 9 },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
    animation: 'lc-spin .7s linear infinite', display: 'inline-block',
  },
  footer: { marginTop: 24, fontSize: 11.5, color: '#b4b4c0', letterSpacing: '0.02em' },
};
