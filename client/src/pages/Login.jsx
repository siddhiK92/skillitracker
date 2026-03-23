import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast     = useToast();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [busy,     setBusy]     = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div style={S.page}>
      {/* Left */}
      <div style={S.left}>
        <div style={S.blob1} /><div style={S.blob2} />
        <div style={S.leftInner}>
          <div style={S.logoBox}>
            <LogoIcon />
          </div>
          <h2 style={S.leftH}>Track your team,<br />in real time.</h2>
          <p style={S.leftP}>Punch in, submit EOD reports, and stay aligned — all in one place.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {['Live attendance tracking','Working hours auto-calculation','Daily EOD reports','Admin oversight panel'].map(f => (
              <div key={f} style={S.feat}><span style={S.featDot} />{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={S.right}>
        <form style={S.form} onSubmit={submit}>
          <div style={S.brandRow}>
            <div style={S.brandIcon}><LogoIcon size={20} /></div>
            <h1 style={S.h1}>SkilliTrack</h1>
          </div>
          <p style={S.sub}>Sign in to your workspace</p>

          <div className="field" style={{ marginTop:28 }}>
            <label>Email Address</label>
            <input className="input" type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label>Password</label>
            <div style={{ position:'relative' }}>
              <input className="input" type={show ? 'text' : 'password'} placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight:44 }} />
              <button type="button" onClick={() => setShow(!show)} style={S.eye}>
                {show ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={busy} style={{ marginTop:4 }}>
            {busy ? <><span className="spinner" />Signing in…</> : 'Sign In'}
          </button>

          <p style={S.foot}>Don't have an account? <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Create one</Link></p>
          <p style={S.hint}>Logging in records your punch-in time automatically.</p>
        </form>
      </div>
    </div>
  );
}

const S = {
  page:    { display:'flex', minHeight:'100vh', background:'var(--bg)' },
  left:    { width:'42%', background:'#1E1B4B', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px', position:'relative', overflow:'hidden' },
  blob1:   { position:'absolute', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.18),transparent)', top:-150, right:-120 },
  blob2:   { position:'absolute', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.12),transparent)', bottom:-80, left:-60 },
  leftInner:{ position:'relative', zIndex:1, maxWidth:340 },
  logoBox: { width:60, height:60, background:'rgba(99,102,241,.25)', border:'1px solid rgba(99,102,241,.4)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28 },
  leftH:   { fontFamily:'Outfit,sans-serif', fontSize:'2rem', fontWeight:800, color:'#fff', marginBottom:14, letterSpacing:'-0.03em' },
  leftP:   { fontSize:'.88rem', color:'rgba(255,255,255,.5)', lineHeight:1.7, marginBottom:32 },
  feat:    { display:'flex', alignItems:'center', gap:10, fontSize:'.84rem', color:'rgba(255,255,255,.72)', fontWeight:500 },
  featDot: { width:7, height:7, borderRadius:'50%', background:'#818CF8', flexShrink:0 },
  right:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 32px', background:'var(--bg)' },
  form:    { width:'100%', maxWidth:400 },
  brandRow:{ display:'flex', alignItems:'center', gap:10, marginBottom:6 },
  brandIcon:{ width:38, height:38, background:'var(--primary)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  h1:      { fontFamily:'Outfit,sans-serif', fontSize:'1.6rem', fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.04em' },
  sub:     { fontSize:'.86rem', color:'var(--text-2)', marginBottom:0 },
  eye:     { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center', padding:4 },
  foot:    { textAlign:'center', marginTop:22, fontSize:'.83rem', color:'var(--text-2)' },
  hint:    { textAlign:'center', marginTop:10, fontSize:'.73rem', color:'var(--text-3)' },
};

const LogoIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01M12 7h.01M16 7h.01"/>
  </svg>
);
const EyeOn  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
