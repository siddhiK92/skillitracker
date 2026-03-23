import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function Register() {
  const { login } = useAuth();
  const toast     = useToast();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false); // success state

  const strength = password.length >= 10 ? ['Strong','#10B981','100%']
                 : password.length >= 6  ? ['Good','#F59E0B','65%']
                 : password.length > 0   ? ['Weak','#EF4444','25%']
                 : null;

  const submit = async e => {
    e.preventDefault();
    if (!name.trim())  { toast.error('Name is required'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await api.post('/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password });
      setDone(true);
      toast.success('Account created! Signing you in…');
      setTimeout(async () => {
        try { await login(email.trim(), password); }
        catch { toast.error('Auto-login failed. Please sign in manually.'); }
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setBusy(false); }
  };

  if (done) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign:'center', padding:'12px 0' }}>
          <div style={{ width:64, height:64, background:'#D1FAE5', borderRadius:'50%', display:'grid', placeItems:'center', margin:'0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'var(--text-1)', marginBottom:8 }}>Account Created!</h2>
          <p style={{ fontSize:'.88rem', color:'var(--text-2)' }}>Signing you in automatically…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={S.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <h1 style={S.h1}>Create Account</h1>
        </div>
        <p style={S.sub}>Join your team on SkilliTrack</p>

        <form onSubmit={submit} style={{ marginTop:28 }}>
          {/* Name */}
          <div className="field">
            <label>Full Name</label>
            <input className="input" placeholder="e.g. Alice Johnson"
              value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Email */}
          <div className="field">
            <label>Email Address</label>
            <div style={{ position:'relative' }}>
              <input className="input" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft:40 }} />
              <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', display:'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label>Password <span style={{ color:'var(--text-3)', fontWeight:400, fontSize:'.74rem' }}>(min 6 characters)</span></label>
            <div style={{ position:'relative' }}>
              <input className="input" type={show ? 'text' : 'password'} placeholder="Create a strong password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ paddingRight:44 }} />
              <button type="button" onClick={() => setShow(!show)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center', padding:4 }}>
                {show
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {strength && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
                <div style={{ flex:1, height:3, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, background:strength[1], width:strength[2], transition:'all .3s' }} />
                </div>
                <span style={{ fontSize:'.71rem', fontWeight:700, color:strength[1], minWidth:40 }}>{strength[0]}</span>
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={busy} style={{ marginTop:8 }}>
            {busy
              ? <><span className="spinner" /> Creating account…</>
              : 'Create Account'
            }
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:'.83rem', color:'var(--text-2)' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--primary)', fontWeight:700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const S = {
  page:      { minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
  card:      { width:'100%', maxWidth:420, background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)', padding:'36px 32px' },
  brandIcon: { width:38, height:38, background:'var(--primary)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  h1:        { fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.04em' },
  sub:       { fontSize:'.86rem', color:'var(--text-2)' },
};