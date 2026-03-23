import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor } from '../../utils/helpers';

// ── Icons defined FIRST before use ──
const HomeIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UsersIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CalIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const DocIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

const NAV = [
  { to:'/admin',            label:'Overview',    end:true, icon:<HomeIcon /> },
  { to:'/admin/users',      label:'Users',                 icon:<UsersIcon /> },
  { to:'/admin/attendance', label:'Attendance',            icon:<CalIcon /> },
  { to:'/admin/eod',        label:'EOD Reports',           icon:<DocIcon /> },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch { toast.error('Logout failed'); }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 228,
        background: '#1E1B4B',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
        transition: 'transform .25s',
        ...(open ? {} : {}),
      }}>
        {/* Header */}
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'rgba(99,102,241,.35)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'.95rem', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>SkilliTrack</div>
              <div style={{ fontSize:'.63rem', color:'rgba(255,255,255,.4)' }}>Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.4)', fontSize:16, lineHeight:1 }}>✕</button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:3 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:9,
                padding:'10px 12px', borderRadius:9,
                color: isActive ? '#fff' : 'rgba(255,255,255,.55)',
                fontFamily:'DM Sans,sans-serif', fontSize:'.84rem',
                fontWeight: isActive ? 600 : 500,
                textDecoration:'none', transition:'all .15s',
                background: isActive ? 'rgba(99,102,241,.22)' : 'transparent',
                borderLeft: isActive ? '3px solid #818CF8' : '3px solid transparent',
              })}>
              {n.icon}{n.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:user?.color||avatarColor(user?.name||''), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.7rem', color:'#fff', flexShrink:0 }}>
            {initials(user?.name||'A')}
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <div style={{ fontSize:'.8rem', fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:'.65rem', color:'#818CF8' }}>Administrator</div>
          </div>
          <button onClick={doLogout} title="Logout"
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.35)', padding:6, borderRadius:7, display:'flex', alignItems:'center', transition:'color .15s' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        {/* Mobile topbar */}
        <div style={{ display:'flex', padding:'12px 20px', background:'var(--surface)', borderBottom:'1px solid var(--border)', alignItems:'center', gap:12 }}>
          <button onClick={() => setOpen(true)}
            style={{ background:'var(--bg)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-2)', padding:'6px 10px', borderRadius:8, fontSize:16 }}>☰</button>
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.95rem', color:'var(--text-1)' }}>Admin Panel</span>
        </div>

        <div style={{ flex:1, padding:'28px', maxWidth:1180, width:'100%' }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50 }} />}
    </div>
  );
}