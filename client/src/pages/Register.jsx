import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const [form,   setForm]   = useState({ name:'', email:'', phone:'', password:'' });
  const [show,   setShow]   = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [errors, setErrors] = useState({});
  const [done,   setDone]   = useState(false);

  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.phone.trim()) {
      const ph = form.phone.replace(/\D/g,'');
      if (ph.length < 10) e.phone = 'Phone must be 10 digits';
      else if (!/^[6-9]/.test(ph)) e.phone = 'Enter a valid Indian mobile number';
    }
    if (!form.password)          e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    else if (!/[A-Za-z]/.test(form.password)||!/[0-9]/.test(form.password)) e.password = 'Must contain letters and numbers';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const strength = !form.password ? null
    : form.password.length >= 10 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? ['Strong','#10B981','100%']
    : form.password.length >= 8  && /[0-9]/.test(form.password) ? ['Good','#6366F1','70%']
    : form.password.length >= 6  ? ['Weak','#F59E0B','40%']
    : ['Too short','#EF4444','20%'];

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await api.post('/auth/register', { name:form.name.trim(), email:form.email.trim().toLowerCase(), phone:form.phone||undefined, password:form.password });
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('email')||msg.toLowerCase().includes('already')) setErrors({ email:'This email is already registered.' });
      else setErrors({ general: msg || 'Registration failed. Try again.' });
    } finally { setBusy(false); }
  };

  // ── Success / Pending screen ──
  if (done) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ width:72, height:72, background:'#FEF3C7', borderRadius:'50%', display:'grid', placeItems:'center', margin:'0 auto 20px', fontSize:36 }}>⏳</div>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#0F172A', marginBottom:10 }}>Registration Submitted!</h2>
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'14px 16px', margin:'16px 0', textAlign:'left' }}>
            <p style={{ color:'#92400E', fontSize:'.85rem', margin:0, lineHeight:1.6 }}>
              ✋ <strong>Admin approval required</strong><br/>
              Your account is under review. You will receive an email once your admin approves your access.
            </p>
          </div>
          <p style={{ fontSize:'.82rem', color:'#64748B', marginTop:12 }}>
            Already approved?{' '}
            <Link to="/login" style={{ color:'#6366F1', fontWeight:700, textDecoration:'none' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={S.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <h1 style={S.h1}>Create Account</h1>
        </div>
        <p style={S.sub}>Join your team on SkilliTrack</p>

        {/* Admin approval notice */}
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, padding:'11px 14px', marginTop:14, display:'flex', gap:8, alignItems:'flex-start' }}>
          <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
          <p style={{ fontSize:'.78rem', color:'#1E40AF', margin:0, lineHeight:1.5 }}>
            Your account will need <strong>admin approval</strong> before you can login.
          </p>
        </div>

        {errors.general && <div style={S.errorBanner}>⚠ {errors.general}</div>}

        <form onSubmit={submit} noValidate style={{ marginTop:18 }}>
          <div style={S.field}>
            <label style={S.label}>Full Name <span style={S.req}>*</span></label>
            <input style={{ ...S.input, borderColor:errors.name?'#EF4444':'#E5E7EB' }}
              placeholder="e.g. Alice Johnson" value={form.name} onChange={set('name')} />
            {errors.name && <p style={S.err}>⚠ {errors.name}</p>}
          </div>

          <div style={S.field}>
            <label style={S.label}>Email Address <span style={S.req}>*</span></label>
            <input style={{ ...S.input, borderColor:errors.email?'#EF4444':'#E5E7EB' }}
              type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
            {errors.email && <p style={S.err}>⚠ {errors.email}</p>}
          </div>

          <div style={S.field}>
            <label style={S.label}>Phone <span style={{ color:'#94A3B8', fontWeight:400, fontSize:'.72rem' }}>(optional)</span></label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:'.82rem', fontWeight:600, color:'#64748B' }}>+91</span>
              <input style={{ ...S.input, paddingLeft:44, borderColor:errors.phone?'#EF4444':'#E5E7EB' }}
                type="tel" placeholder="98765 43210" value={form.phone} maxLength={10}
                onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=10) set('phone')({target:{value:v}}); }} />
            </div>
            {errors.phone && <p style={S.err}>⚠ {errors.phone}</p>}
          </div>

          <div style={S.field}>
            <label style={S.label}>Password <span style={S.req}>*</span></label>
            <div style={{ position:'relative' }}>
              <input style={{ ...S.input, paddingRight:44, borderColor:errors.password?'#EF4444':'#E5E7EB' }}
                type={show?'text':'password'} placeholder="Min 6 chars, letters & numbers"
                value={form.password} onChange={set('password')} autoComplete="new-password" />
              <button type="button" onClick={()=>setShow(!show)} style={S.eye}>
                {show ? <EyeOff/> : <EyeOn/>}
              </button>
            </div>
            {errors.password && <p style={S.err}>⚠ {errors.password}</p>}
            {strength && !errors.password && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
                <div style={{ flex:1, height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:strength[1], width:strength[2], borderRadius:99, transition:'all .3s' }}/>
                </div>
                <span style={{ fontSize:'.71rem', fontWeight:700, color:strength[1], minWidth:56 }}>{strength[0]}</span>
              </div>
            )}
          </div>

          <button type="submit" style={{ ...S.btn, opacity:busy?.7:1 }} disabled={busy}>
            {busy
              ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite',display:'inline-block'}}/>
                  Submitting…
                </span>
              : 'Register'
            }
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:'.83rem', color:'#64748B' }}>
          Already have an account? <Link to="/login" style={{ color:'#6366F1', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  page:      { minHeight:'100vh', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:      { width:'100%', maxWidth:430, background:'#fff', borderRadius:16, border:'1px solid #F1F5F9', boxShadow:'0 15px 40px rgba(0,0,0,.08)', padding:'36px 32px' },
  brandIcon: { width:40, height:40, background:'#6366F1', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  h1:        { fontFamily:'Outfit,sans-serif', fontSize:'1.25rem', fontWeight:800, color:'#0F172A' },
  sub:       { fontSize:'.84rem', color:'#64748B' },
  field:     { marginBottom:14 },
  label:     { display:'block', fontSize:'.78rem', fontWeight:600, color:'#0F172A', marginBottom:6 },
  req:       { color:'#EF4444', marginLeft:2 },
  input:     { width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, outline:'none', fontSize:'.87rem', fontFamily:'DM Sans,sans-serif', color:'#0F172A', boxSizing:'border-box' },
  eye:       { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', padding:4 },
  btn:       { width:'100%', padding:'12px', background:'linear-gradient(135deg,#6366F1,#4F46E5)', color:'#fff', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:'.9rem', fontFamily:'Outfit,sans-serif', marginTop:4 },
  err:       { color:'#EF4444', fontSize:'.74rem', marginTop:5, fontWeight:500 },
  errorBanner:{ display:'flex', alignItems:'center', gap:8, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:9, padding:'11px 14px', color:'#B91C1C', fontSize:'.82rem', marginTop:14 },
};
const EyeOn  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;