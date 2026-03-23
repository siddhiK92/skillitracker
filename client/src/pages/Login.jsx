import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Fill in all fields');
      return;
    }

    setBusy(true);

    try {
      const u = await login(email.trim(), password);

      toast.success(`Welcome back, ${u.name}!`);

      if (u.isAdmin) navigate('/admin-dashboard');
      else navigate('/dashboard');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.page}>
      {/* LEFT */}
      <div style={S.left}>
        <div style={S.blob1} />
        <div style={S.blob2} />

        <div style={S.leftInner}>
          <div style={S.logoBox}>
            <LogoIcon />
          </div>

          <h2 style={S.leftH}>
            Track your team,<br />in real time.
          </h2>

          <p style={S.leftP}>
            Punch in, submit EOD reports, and stay aligned — all in one place.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              'Live attendance tracking',
              'Working hours auto-calculation',
              'Daily EOD reports',
              'Admin oversight panel'
            ].map(f => (
              <div key={f} style={S.feat}>
                <span style={S.featDot} />{f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={S.right}>
        <form style={S.form} onSubmit={submit}>
          <div style={S.brandRow}>
            <div style={S.brandIcon}>
              <LogoIcon size={20} />
            </div>
            <h1 style={S.h1}>SkilliTrack</h1>
          </div>

          <p style={S.sub}>Sign in to your workspace</p>

          {/* Email */}
          <div style={{ marginTop:28 }}>
            <label>Email Address</label>
            <input
              style={S.input}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}

              // ✅ ADD: focus effect
              onFocus={(e)=> e.target.style.border='1px solid #6366F1'}
              onBlur={(e)=> e.target.style.border='1px solid #E5E7EB'}
            />
          </div>

          {/* Password */}
          <div style={{ marginTop:16 }}>
            <label>Password</label>

            <div style={{ position:'relative' }}>
              <input
                style={{ ...S.input, paddingRight:40 }}
                type={show ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}

                // ✅ ADD: focus effect
                onFocus={(e)=> e.target.style.border='1px solid #6366F1'}
                onBlur={(e)=> e.target.style.border='1px solid #E5E7EB'}
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
                style={S.eye}
              >
                {show ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"   // ✅ FIX (important)
            style={S.btn}
            disabled={busy}
          >
            {busy ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={S.foot}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#6366F1', fontWeight:600 }}>
              Create one
            </Link>
          </p>

          <p style={S.hint}>
            Logging in records your punch-in time automatically.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES (UPGRADED) ================= */
const S = {
  page:{ display:'flex', minHeight:'100vh', background:'#F8FAFC' },

  left:{
    width:'45%',
    background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    position:'relative',
    padding:60,
    overflow:'hidden'
  },

  blob1:{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,.08)', top:-150, right:-150 },
  blob2:{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'rgba(255,255,255,.06)', bottom:-100, left:-80 },

  leftInner:{ zIndex:1, maxWidth:380, color:'#fff' },

  logoBox:{
    width:64,
    height:64,
    background:'rgba(255,255,255,.15)',
    borderRadius:16,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    marginBottom:24
  },

  leftH:{ fontSize:'34px', fontWeight:800, marginBottom:14 },
  leftP:{ fontSize:'14px', opacity:0.85, marginBottom:28 },

  feat:{ display:'flex', gap:10, fontSize:'14px' },
  featDot:{ width:7, height:7, borderRadius:'50%', background:'#C7D2FE' },

  right:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' },

  form:{
    width:'100%',
    maxWidth:380,
    background:'#fff',
    padding:'40px',
    borderRadius:'16px',
    boxShadow:'0 15px 40px rgba(0,0,0,0.08)'
  },

  brandRow:{ display:'flex', alignItems:'center', gap:10, marginBottom:6 },

  brandIcon:{
    width:40,
    height:40,
    background:'#6366F1',
    borderRadius:10,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    color:'#fff'
  },

  h1:{ fontSize:'20px', fontWeight:700 },
  sub:{ fontSize:'13px', color:'#6B7280', marginBottom:20 },

  input:{
    width:'100%',
    padding:'12px',
    border:'1px solid #E5E7EB',
    borderRadius:'10px',
    marginTop:6,
    outline:'none'
  },

  eye:{
    position:'absolute',
    right:12,
    top:'50%',
    transform:'translateY(-50%)',
    background:'none',
    border:'none',
    cursor:'pointer'
  },

  btn:{
    width:'100%',
    padding:'12px',
    marginTop:20,
    background:'linear-gradient(135deg,#6366F1,#4F46E5)',
    color:'#fff',
    border:'none',
    borderRadius:'10px',
    fontWeight:600,
    cursor:'pointer'
  },

  foot:{ textAlign:'center', marginTop:18, fontSize:'13px' },
  hint:{ textAlign:'center', fontSize:'12px', color:'#9CA3AF' }
};

/* ICONS SAME */
const LogoIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="3" width="20" height="18" rx="2"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);

const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);