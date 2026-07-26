import { useState } from 'react';
import api from '../api/axios';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [status, setStatus] = useState(null); // { type: 'error'|'success', message }
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (form.newPassword !== form.confirm) {
      setStatus({ type:'error', message:'New password and confirmation do not match' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setStatus({ type:'success', message: res.data.message || 'Password updated successfully' });
      setForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      setStatus({ type:'error', message: err.response?.data?.message || 'Something went wrong' });
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
    <div className="lc-page" style={{ padding:'36px 40px', maxWidth:520, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:24, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Change password</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Update the password for your account</p>
      </div>

      <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'28px' }}>
        {status && (
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:18, padding:'10px 14px', borderRadius:10, fontSize:13,
            background: status.type==='success' ? '#eefbf3' : '#fef2f2',
            color: status.type==='success' ? '#0f9d58' : '#b91c1c',
            border: '1px solid ' + (status.type==='success' ? '#bce8cc' : '#fecaca'),
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={styles.label}>Current password</label>
            <input
              type="password"
              style={inputStyle('current')}
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              onFocus={() => setFocused('current')}
              onBlur={() => setFocused(null)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label style={styles.label}>New password</label>
            <input
              type="password"
              style={inputStyle('new')}
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              onFocus={() => setFocused('new')}
              onBlur={() => setFocused(null)}
              autoComplete="new-password"
              minLength={6}
              required
            />
            <p style={{ fontSize:11.5, color:'#bbb', marginTop:5 }}>At least 6 characters.</p>
          </div>
          <div>
            <label style={styles.label}>Confirm new password</label>
            <input
              type="password"
              style={inputStyle('confirm')}
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading?0.7:1 }}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  label: { display:'block', fontSize:11.5, fontWeight:600, color:'#7c7c8a', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' },
  input: {
    padding:'10px 13px', border:'1.5px solid #e5e5ec', borderRadius:10, fontSize:14,
    outline:'none', width:'100%', boxSizing:'border-box', color:'#16161f', fontFamily:'inherit',
    transition:'border-color .15s ease, box-shadow .15s ease',
  },
  btn: {
    padding:'11px', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff',
    border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:6,
    boxShadow:'0 6px 16px rgba(79,70,229,0.25)',
  },
};
