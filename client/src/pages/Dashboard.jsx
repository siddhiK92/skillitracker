import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { initials, avatarColor, fmtTime, calcHours, fmtMs, today } from '../utils/helpers';
import MyHistory from './MyHistory';

export default function Dashboard() {
  const { user, logout, updateUser, isAdmin } = useAuth();
  const toast = useToast();

  const [users,       setUsers]       = useState([]);
  const [todayEODs,   setTodayEODs]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showEOD,     setShowEOD]     = useState(false);
  const [viewEOD,     setViewEOD]     = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [eodForm,     setEodForm]     = useState({ projects:[''], completed:[''], planned:[''] });
  const [saving,      setSaving]      = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setUsers(u => [...u]), 60000); // re-render every minute for live hours
    return () => clearInterval(timerRef.current);
  }, []);

  const load = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([api.get('/users'), api.get('/eod/today')]);
      setUsers(u.data.users);
      setTodayEODs(e.data.eods);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    try { await logout(); toast.info('Punched out!'); }
    catch { toast.error('Logout failed'); }
  };

  const handleLeave = async () => {
    const ns = user.status === 'leave' ? 'online' : 'leave';
    try {
      const { data } = await api.patch('/users/status', { status: ns });
      updateUser(data.user);
      setUsers(p => p.map(u => u._id === data.user._id ? data.user : u));
      toast.success(ns === 'leave' ? 'Marked as On Leave' : 'Back to Online');
    } catch { toast.error('Failed'); }
  };

  const openEOD = async () => {
    try {
      const { data } = await api.get('/eod/my');
      const t = data.eods.find(e => e.date === today());
      if (t) setEodForm({
        projects:  t.projects.length  ? t.projects  : [''],
        completed: t.completed.length ? t.completed : [''],
        planned:   t.planned.length   ? t.planned   : [''],
      });
      else setEodForm({ projects:[''], completed:[''], planned:[''] });
    } catch {}
    setShowEOD(true);
  };

  const submitEOD = async () => {
    const clean = a => a.map(s => s.trim()).filter(Boolean);
    const p = clean(eodForm.projects), c = clean(eodForm.completed), pl = clean(eodForm.planned);
    if (!p.length && !c.length && !pl.length) { toast.error('Fill at least one entry'); return; }
    setSaving(true);
    try {
      await api.post('/eod', { projects: p, completed: c, planned: pl });
      toast.success('EOD saved!'); setShowEOD(false); load();
    } catch { toast.error('Failed to save EOD'); }
    finally { setSaving(false); }
  };

  const viewUserEOD = async u => {
    try {
      const { data } = await api.get(`/eod/user/${u._id}`);
      setViewEOD({ user: u, eods: data.eods });
    } catch { toast.error('Failed'); }
  };

  const getHours = u => {
    if (!u.loginTime) return '—';
    if (u.status === 'online') return calcHours(u.loginTime, null, true);
    if (u.logoutTime) return calcHours(u.loginTime, u.logoutTime, false);
    return '—';
  };

  const eodMap = {};
  todayEODs.forEach(e => { eodMap[e.user?._id || e.user] = e; });

  const online  = users.filter(u => u.status === 'online').length;
  const offline = users.filter(u => u.status === 'offline').length;
  const leave   = users.filter(u => u.status === 'leave').length;
  const isLeave = user?.status === 'leave';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.logoRow}>
          <div style={S.logoBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01M12 7h.01M16 7h.01"/>
            </svg>
          </div>
          <span style={S.logoText}>SkilliTrack</span>
        </div>
        <div style={S.headerRight}>
          {user && (
            <div style={S.userChip}>
              <div style={{ ...S.avatar, background: user.color || avatarColor(user.name) }}>{initials(user.name)}</div>
              <div className="hide-sm">
                <div style={S.uName}>{user.name}</div>
                <div style={S.uRole}>{user.role || 'Team Member'}</div>
              </div>
            </div>
          )}
          {/* My History button */}
          <button className="btn btn-sm hide-xs"
            onClick={() => setShowHistory(true)}
            style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.8)', border:'1px solid rgba(255,255,255,.15)' }}>
            📋 My History
          </button>
          {isAdmin && (
            <Link to="/admin" className="btn btn-sm" style={{ background:'#4338CA', color:'#fff' }}>
              <ShieldIcon /> <span className="hide-xs">Admin</span>
            </Link>
          )}
          <button className={`btn btn-sm ${isLeave ? 'btn-success' : 'btn-amber'}`} onClick={handleLeave}>
            {isLeave ? '✓ Back Online' : 'On Leave'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleLogout}>
            <LogoutIcon /> <span className="hide-xs">Punch Out</span>
          </button>
        </div>
      </header>

      <div style={S.body}>
        {/* Stats */}
        <div style={S.statRow}>
          {[
            { label:'Total Members', value:users.length, color:'#6366F1' },
            { label:'Online Now',    value:online,        color:'#10B981' },
            { label:'Offline',       value:offline,       color:'#EF4444' },
            { label:'On Leave',      value:leave,         color:'#F59E0B' },
          ].map(s => (
            <div key={s.label} style={S.stat}>
              <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', background:s.color, borderRadius:'12px 0 0 12px' }} />
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.75rem', fontWeight:800, color:s.color, lineHeight:1, letterSpacing:'-0.03em' }}>{s.value}</div>
              <div style={{ fontSize:'.74rem', color:'var(--text-2)', marginTop:4, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div style={S.sectionHead}>
          <div>
            <h2 style={S.sectionTitle}>Team Members</h2>
            <p style={S.sectionSub}>
              {online} online · {offline} offline · {leave} on leave — {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openEOD}>
            <DocIcon /> Submit EOD
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'var(--text-2)' }}>Loading…</div>
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Status</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Working Hours</th>
                  <th>Today's EOD</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isMe   = u._id === user?._id;
                  const hasEOD = !!eodMap[u._id];
                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ position:'relative' }}>
                            <div style={{ width:36, height:36, borderRadius:10, background: u.color || avatarColor(u.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.74rem', color:'#fff' }}>{initials(u.name)}</div>
                            <span className={`dot dot-${u.status}`} style={{ position:'absolute', bottom:-1, right:-1, border:'2px solid #fff' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'.85rem', display:'flex', alignItems:'center', gap:6 }}>
                              {u.name}
                              {isMe && <span style={{ fontSize:'.64rem', background:'var(--primary-l)', color:'var(--primary)', padding:'1px 7px', borderRadius:99, fontWeight:700 }}>You</span>}
                            </div>
                            <div style={{ fontSize:'.72rem', color:'var(--text-2)' }}>{u.role || 'Team Member'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${u.status}`}>
                          {u.status === 'online' ? 'Online' : u.status === 'leave' ? 'On Leave' : 'Offline'}
                        </span>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:'.8rem', color:'var(--text-2)' }}>{fmtTime(u.loginTime)}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'.8rem', color:'var(--text-2)' }}>
                        {u.status === 'online'
                          ? <span style={{ display:'flex', alignItems:'center', gap:5, color:'var(--green)', fontSize:'.78rem' }}><span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }} />Active</span>
                          : fmtTime(u.logoutTime)
                        }
                      </td>
                      <td>
                        <span style={{ fontWeight:700, color: u.status==='online'?'var(--green)':'var(--primary)', fontSize:'.84rem', background: u.status==='online'?'#D1FAE5':'var(--primary-l)', padding:'3px 10px', borderRadius:8 }}>
                          {getHours(u)}{u.status==='online' && <span style={{ fontSize:'.62rem', marginLeft:4, opacity:.7 }}>live</span>}
                        </span>
                      </td>
                      <td>
                        {hasEOD
                          ? <button className="btn btn-outline btn-sm" onClick={() => viewUserEOD(u)}>View</button>
                          : <span style={{ fontSize:'.75rem', color:'var(--text-3)' }}>Pending</span>
                        }
                      </td>
                      <td>
                        {isMe
                          ? <button className="btn btn-primary btn-sm" onClick={openEOD}>EOD Report</button>
                          : <span style={{ color:'var(--text-3)' }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My History Modal */}
      {showHistory && <MyHistory onClose={() => setShowHistory(false)} />}

      {/* EOD Submit Modal */}
      {showEOD && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowEOD(false); }}>
          <div className="modal" style={{ maxWidth:580 }}>
            <div className="modal-head">
              <div className="modal-title">📝 End of Day Report</div>
              <button className="modal-close" onClick={() => setShowEOD(false)}>✕</button>
            </div>
            <p style={{ fontSize:'.82rem', color:'var(--text-2)', marginBottom:20 }}>
              {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </p>
            {[
              { key:'projects',  label:'🗂 Projects Worked On',        ph:'e.g. Dashboard redesign' },
              { key:'completed', label:'✅ Tasks Completed Today',     ph:'e.g. Fixed login bug' },
              { key:'planned',   label:'📋 Tasks Planned for Tomorrow', ph:'e.g. Write unit tests' },
            ].map(sec => (
              <div key={sec.key} style={{ marginBottom:20 }}>
                <div style={{ fontSize:'.77rem', fontWeight:700, color:'var(--text-2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>{sec.label}</div>
                {eodForm[sec.key].map((val, i) => (
                  <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                    <input className="input" style={{ flex:1 }} placeholder={sec.ph} value={val}
                      onChange={e => { const a=[...eodForm[sec.key]]; a[i]=e.target.value; setEodForm(f=>({...f,[sec.key]:a})); }}
                      onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();const a=[...eodForm[sec.key]];a.splice(i+1,0,'');setEodForm(f=>({...f,[sec.key]:a}));} }}
                    />
                    {eodForm[sec.key].length > 1 && (
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }}
                        onClick={() => { const a=[...eodForm[sec.key]]; a.splice(i,1); setEodForm(f=>({...f,[sec.key]:a})); }}>✕</button>
                    )}
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ width:'100%', border:'1.5px dashed var(--border)', marginTop:2 }}
                  onClick={() => setEodForm(f=>({...f,[sec.key]:[...f[sec.key],'']}))}>+ Add entry</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-outline" onClick={() => setShowEOD(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitEOD} disabled={saving}>
                {saving ? 'Saving…' : 'Save EOD Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EOD View Modal */}
      {viewEOD && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setViewEOD(null); }}>
          <div className="modal" style={{ maxWidth:580 }}>
            <div className="modal-head">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background: viewEOD.user.color || avatarColor(viewEOD.user.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.73rem', color:'#fff' }}>{initials(viewEOD.user.name)}</div>
                <div className="modal-title">{viewEOD.user.name}'s EOD Reports</div>
              </div>
              <button className="modal-close" onClick={() => setViewEOD(null)}>✕</button>
            </div>
            {viewEOD.eods.length === 0
              ? <p style={{ color:'var(--text-3)', textAlign:'center', padding:24 }}>No reports yet.</p>
              : viewEOD.eods.map(e => (
                <div key={e._id} style={{ background:'var(--bg)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:10, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'.74rem', fontWeight:700, color:'var(--text-2)', marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                    <span>{new Date(e.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</span>
                  </div>
                  {[['Projects',e.projects],['Completed',e.completed],['Planned',e.planned]].map(([l,items]) =>
                    items?.length > 0 && (
                      <div key={l} style={{ marginBottom:10 }}>
                        <div style={{ fontSize:'.7rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>{l}</div>
                        {items.map((it,i) => <div key={i} style={{ fontSize:'.8rem', paddingLeft:12, position:'relative', marginBottom:3 }}><span style={{ position:'absolute', left:0, color:'var(--primary)' }}>•</span>{it}</div>)}
                      </div>
                    )
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  header:      { background:'#1E1B4B', padding:'0 28px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 0 rgba(255,255,255,.07)' },
  logoRow:     { display:'flex', alignItems:'center', gap:10 },
  logoBox:     { width:36, height:36, background:'rgba(99,102,241,.3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  logoText:    { fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#fff', letterSpacing:'-0.02em' },
  headerRight: { display:'flex', alignItems:'center', gap:8 },
  userChip:    { display:'flex', alignItems:'center', gap:9, padding:'5px 12px 5px 5px', background:'rgba(255,255,255,.08)', borderRadius:10, marginRight:4 },
  avatar:      { width:32, height:32, borderRadius:'50%', display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.74rem', color:'#fff', flexShrink:0 },
  uName:       { fontWeight:600, color:'#fff', fontSize:'.82rem', lineHeight:1.2 },
  uRole:       { fontSize:'.68rem', color:'rgba(255,255,255,.45)' },
  body:        { maxWidth:1280, margin:'0 auto', padding:'28px 24px' },
  statRow:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 },
  stat:        { background:'var(--surface)', borderRadius:'var(--r-lg)', padding:'18px 20px', border:'1px solid var(--border)', boxShadow:'var(--shadow)', position:'relative', overflow:'hidden' },
  sectionHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, gap:12 },
  sectionTitle:{ fontFamily:'Outfit,sans-serif', fontSize:'1.05rem', fontWeight:700, color:'var(--text-1)' },
  sectionSub:  { fontSize:'.77rem', color:'var(--text-2)', marginTop:3 },
};

const ShieldIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const LogoutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const DocIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;