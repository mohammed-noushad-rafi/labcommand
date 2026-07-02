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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.title}>LabCommand</h1>
        <p style={styles.sub}>Sign in to your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="admin@labcommand.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="password123"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button style={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={styles.hint}>
          <div>Admin: admin@labcommand.com</div>
          <div>Password: password123</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f6fa' },
  card:  { background:'#fff', borderRadius:16, padding:'40px 36px', width:400, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', textAlign:'center' },
  logo:  { fontSize:40, marginBottom:8 },
  title: { fontSize:26, fontWeight:700, color:'#1a1a2e', margin:0 },
  sub:   { fontSize:13, color:'#888', marginTop:6, marginBottom:24 },
  error: { background:'#fff0f0', color:'#c62828', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 },
  form:  { display:'flex', flexDirection:'column', gap:14, textAlign:'left' },
  field: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:12, fontWeight:500, color:'#555' },
  input: { padding:'10px 12px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:13, outline:'none' },
  btn:   { padding:'11px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4 },
  hint:  { marginTop:20, fontSize:11, color:'#aaa', lineHeight:1.8 },
};