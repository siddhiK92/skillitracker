import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast     = useToast();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [errors,   setErrors]   = useState({});

  // ── Validation ──
  const validate = () => {
    const e = {};

    if (!email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Please enter a valid email address';
    }

    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setErrors({});

    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name}!`);
      if (u.isAdmin) navigate('/admin');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      const status = err.response?.status;

      // ── Specific error messages ──
      if (status === 401 || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('email')) {
        setErrors({
          credentials: 'The email or password you entered is incorrect. Please try again.'
        });
      } else if (status === 403 || msg.toLowerCase().includes('deactivated')) {
        setErrors({
          credentials: 'Your account has been deactivated. Please contact your admin.'
        });
      } else if (status === 404 || msg.toLowerCase().includes('not found')) {
        setErrors({
          credentials: 'No account found with this email. Please register first.'
        });
      } else {
        setErrors({
          credentials: 'Something went wrong. Please try again.'
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.page}>
      <form style={S.form} onSubmit={submit} noValidate>

        {/* Brand */}
        <div style={S.brandRow}>
          <div style={S.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <h1 style={S.h1}>SkilliTrack</h1>
        </div>
        <p style={S.sub}>Sign in to your workspace</p>

        {/* ── Credential Error Banner (like Instagram) ── */}
        {errors.credentials && (
          <div style={S.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errors.credentials}
          </div>
        )}

        {/* Email */}
        <div style={{ marginTop: errors.credentials ? 16 : 28 }}>
          <label style={S.label}>Email Address</label>
          <input
            style={{ ...S.input, borderColor: errors.email ? '#EF4444' : errors.credentials ? '#EF4444' : '#E5E7EB' }}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors({}); }}
            autoComplete="email"
          />
          {errors.email && <p style={S.fieldError}>⚠ {errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ marginTop:16 }}>
          <label style={S.label}>Password</label>
          <div style={{ position:'relative' }}>
            <input
              style={{ ...S.input, paddingRight:44, borderColor: errors.password ? '#EF4444' : errors.credentials ? '#EF4444' : '#E5E7EB' }}
              type={show ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors({}); }}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShow(!show)} style={S.eye}>
              {show ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
          {errors.password && <p style={S.fieldError}>⚠ {errors.password}</p>}
        </div>

        {/* Submit */}
        <button type="submit" style={{ ...S.btn, opacity: busy ? .7 : 1 }} disabled={busy}>
          {busy
            ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .6s linear infinite', display:'inline-block' }} />
                Signing in…
              </span>
            : 'Sign In'
          }
        </button>

        <p style={S.foot}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#6366F1', fontWeight:600, textDecoration:'none' }}>Create one</Link>
        </p>

        <p style={S.hint}>Logging in records your punch-in time automatically.</p>
      </form>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC', padding:16 },
  form: { width:'100%', maxWidth:400, background:'#fff', padding:'40px 36px', borderRadius:16, boxShadow:'0 15px 40px rgba(0,0,0,.08)', border:'1px solid #F1F5F9' },
  brandRow: { display:'flex', alignItems:'center', gap:10, marginBottom:6 },
  brandIcon: { width:40, height:40, background:'#6366F1', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  h1: { fontSize:'1.25rem', fontWeight:800, color:'#0F172A', fontFamily:'Outfit,sans-serif', letterSpacing:'-0.02em' },
  sub: { fontSize:'.84rem', color:'#64748B', marginBottom:0 },
  label: { display:'block', fontSize:'.78rem', fontWeight:600, color:'#0F172A', marginBottom:6 },
  input: { width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, marginTop:0, outline:'none', fontSize:'.88rem', fontFamily:'DM Sans,sans-serif', color:'#0F172A', transition:'border-color .15s', boxSizing:'border-box' },
  eye: { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', alignItems:'center', padding:4 },
  btn: { width:'100%', padding:'12px', marginTop:20, background:'linear-gradient(135deg,#6366F1,#4F46E5)', color:'#fff', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:'.9rem', fontFamily:'Outfit,sans-serif', boxShadow:'0 4px 12px rgba(99,102,241,.3)', transition:'opacity .15s' },

  // Error styles
  errorBanner: { display:'flex', alignItems:'flex-start', gap:10, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 14px', color:'#B91C1C', fontSize:'.83rem', fontWeight:500, lineHeight:1.5, marginTop:16 },
  fieldError: { color:'#EF4444', fontSize:'.75rem', marginTop:5, fontWeight:500 },

  foot: { textAlign:'center', marginTop:20, fontSize:'.83rem', color:'#64748B' },
  hint: { textAlign:'center', marginTop:10, fontSize:'.73rem', color:'#94A3B8' },
};

const EyeOn  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;