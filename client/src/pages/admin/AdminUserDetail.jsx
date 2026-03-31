import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, fmtDate, fmtTime, fmtMs, COLORS } from '../../utils/helpers';

const TABS = [
  { key:'overview',   label:'Overview' },
  { key:'attendance', label:'Attendance Log' },
  { key:'afk',        label:'AFK History' },
  { key:'eod',        label:'EOD Reports' },
  { key:'settings',   label:'Settings' },
];

export default function AdminUserDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');
  const [editMode,  setEditMode]  = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [resetPwd,  setResetPwd]  = useState('');
  const [showReset, setShowReset] = useState(false);
  const [eodExp,    setEodExp]    = useState(null);
  const [attFilter, setAttFilter] = useState('all');

  const load = async () => {
    try {
      const { data: d } = await api.get(`/admin/users/${id}`);
      setData(d);
      setEditForm({ name:d.user.name, role:d.user.role, color:d.user.color });
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    try { await api.patch(`/admin/users/${id}`, editForm); toast.success('Updated!'); setEditMode(false); load(); }
    catch { toast.error('Failed'); }
  };
  const toggleActive = async () => {
    try { await api.patch(`/admin/users/${id}`, { isActive:!data.user.isActive }); toast.success('Updated!'); load(); }
    catch { toast.error('Failed'); }
  };
  const toggleAdmin = async () => {
    try { await api.patch(`/admin/users/${id}`, { isAdmin:!data.user.isAdmin }); toast.success('Updated!'); load(); }
    catch { toast.error('Failed'); }
  };
  const doReset = async () => {
    if (!resetPwd||resetPwd.length<6) { toast.error('Min 6 characters'); return; }
    try { await api.patch(`/admin/users/${id}/reset-pass`, { newPassword:resetPwd }); toast.success('Password reset!'); setShowReset(false); setResetPwd(''); }
    catch { toast.error('Failed'); }
  };
  const doDelete = async () => {
    if (!confirm(`Delete ${data?.user?.name}? Cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('Deleted'); navigate('/admin/users'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Loader />;
  if (!data)   return null;

  const { user, logs=[], eods=[], stats={} } = data;

  const filteredLogs = logs.filter(l => attFilter==='all' || l.status===attFilter);

  // All AFK sessions across all days
  const allAFKSessions = logs
    .filter(l => l.afkSessions && l.afkSessions.length > 0)
    .flatMap(l => l.afkSessions.map(s => ({ ...s, date: l.date })))
    .filter(s => s.end) // only completed sessions
    .sort((a,b) => new Date(b.start) - new Date(a.start));

  const totalAfkMs = logs.reduce((s,l) => s+(l.totalAfkMs||0), 0);

  return (
    <div className="fade-in">
      <button onClick={() => navigate('/admin/users')} style={S.back}>← Back to Users</button>

      {/* Profile Card */}
      <div className="card" style={{ padding:'22px 26px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            <div style={{ width:58, height:58, borderRadius:14, background:user.color||avatarColor(user.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#fff', flexShrink:0 }}>
              {initials(user.name)}
            </div>
            {editMode ? (
              <div style={{ minWidth:280 }}>
                <div className="field" style={{ marginBottom:10 }}><label>Name</label><input className="input" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></div>
                <div className="field" style={{ marginBottom:10 }}><label>Role</label><input className="input" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} /></div>
                <div className="field" style={{ marginBottom:12 }}>
                  <label>Color</label>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:4 }}>
                    {COLORS.map(c => <div key={c} onClick={()=>setEditForm(f=>({...f,color:c}))} style={{ width:22,height:22,borderRadius:6,background:c,cursor:'pointer',border:`2.5px solid ${editForm.color===c?'#0F172A':'transparent'}`,transform:editForm.color===c?'scale(1.1)':'scale(1)',transition:'all .15s' }} />)}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.05rem', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                  {user.name}
                  {user.isAdmin && <span style={{ fontSize:'.64rem', background:'#EDE9FE', color:'#6D28D9', padding:'2px 8px', borderRadius:99, fontWeight:700 }}>Admin</span>}
                  <span style={{ fontSize:'.64rem', padding:'2px 8px', borderRadius:99, fontWeight:700, background:user.isActive?'#D1FAE5':'#FEE2E2', color:user.isActive?'#065F46':'#B91C1C' }}>
                    {user.isActive?'Active':'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize:'.82rem', color:'#64748B', marginBottom:2 }}>{user.role||'Team Member'}</div>
                <div style={{ fontSize:'.78rem', color:'#94A3B8' }}>@{user.username} · {user.email}</div>
                {user.phone && <div style={{ fontSize:'.75rem', color:'#94A3B8', marginTop:2 }}>📱 +91 {user.phone}</div>}
                <div style={{ fontSize:'.72rem', color:'#94A3B8', marginTop:3 }}>
                  Joined {new Date(user.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                </div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {!editMode && <button className="btn btn-outline btn-sm" onClick={()=>setEditMode(true)}>✏ Edit</button>}
            <button className={`btn btn-sm ${user.isActive?'btn-amber':'btn-success'}`} onClick={toggleActive}>{user.isActive?'Deactivate':'Activate'}</button>
            <button className={`btn btn-sm ${user.isAdmin?'btn-danger':'btn-outline'}`} onClick={toggleAdmin}>{user.isAdmin?'Revoke Admin':'Make Admin'}</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Days Present',    value:stats.present||0,       color:'#10B981' },
          { label:'Days on Leave',   value:stats.leave||0,         color:'#F59E0B' },
          { label:'Total Hours',     value:stats.hours||'0h 0m',   color:'#6366F1' },
          { label:'Total AFK Time',  value:fmtMs(totalAfkMs),      color:'#F59E0B' },
          { label:'EOD Reports',     value:stats.eods||0,          color:'#06B6D4' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 16px', borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'.71rem', color:'#64748B', marginTop:3, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'2px solid #E2E8F0', marginBottom:20, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ padding:'9px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'.82rem', fontWeight:600, color:tab===t.key?'#6366F1':'#64748B', borderBottom:`2px solid ${tab===t.key?'#6366F1':'transparent'}`, marginBottom:-2, transition:'color .15s', whiteSpace:'nowrap' }}>
            {t.label}
            {t.key==='attendance' && <span style={{ marginLeft:5, fontSize:'.65rem', background:'#F1F5F9', padding:'1px 6px', borderRadius:99 }}>{logs.length}</span>}
            {t.key==='afk'        && <span style={{ marginLeft:5, fontSize:'.65rem', background:'#FEF3C7', color:'#92400E', padding:'1px 6px', borderRadius:99 }}>{allAFKSessions.length}</span>}
            {t.key==='eod'        && <span style={{ marginLeft:5, fontSize:'.65rem', background:'#F1F5F9', padding:'1px 6px', borderRadius:99 }}>{eods.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div>
          <div style={{ fontWeight:700, fontSize:'.85rem', color:'#0F172A', marginBottom:12 }}>Recent Attendance</div>
          <div className="card table-wrap" style={{ marginBottom:20 }}>
            <table className="table">
              <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Work Time</th><th>AFK Time</th></tr></thead>
              <tbody>
                {logs.slice(0,10).length===0
                  ? <tr><td colSpan={7} style={S.empty}>No records yet</td></tr>
                  : logs.slice(0,10).map(l => (
                  <tr key={l._id}>
                    <td style={{ fontFamily:'monospace', fontSize:'.8rem', fontWeight:600 }}>{fmtDate(l.date)}</td>
                    <td style={{ fontSize:'.78rem', color:'#64748B' }}>{new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</td>
                    <td><span style={{ fontSize:'.72rem', fontWeight:600, padding:'3px 9px', borderRadius:99, background:l.status==='present'?'#D1FAE5':'#FEE2E2', color:l.status==='present'?'#065F46':'#B91C1C' }}>{l.status}</span></td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'#64748B' }}>{fmtTime(l.loginTime)}</td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'#64748B' }}>{fmtTime(l.logoutTime)}</td>
                    <td style={{ fontWeight:700, color:'#6366F1' }}>{l.workingMs>0?fmtMs(l.workingMs):'—'}</td>
                    <td>
                      {l.totalAfkMs > 0
                        ? <span style={{ fontSize:'.75rem', fontWeight:600, color:'#92400E', background:'#FEF3C7', padding:'2px 8px', borderRadius:99 }}>💤 {fmtMs(l.totalAfkMs)}</span>
                        : <span style={{ color:'#94A3B8', fontSize:'.75rem' }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Attendance Tab ── */}
      {tab === 'attendance' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {['all','present','leave'].map(f => (
              <button key={f} className={`btn btn-sm ${attFilter===f?'btn-primary':'btn-outline'}`} onClick={()=>setAttFilter(f)}>
                {f==='all'?'All':f==='present'?'Present':'On Leave'}
              </button>
            ))}
            <span style={{ alignSelf:'center', fontSize:'.78rem', color:'#64748B' }}>{filteredLogs.length} records</span>
          </div>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Total Hours</th><th>AFK Time</th><th>Net Work Time</th></tr></thead>
              <tbody>
                {filteredLogs.length===0
                  ? <tr><td colSpan={8} style={S.empty}>No records</td></tr>
                  : filteredLogs.map(l => {
                  const hrs = Math.floor((l.workingMs||0)/3600000);
                  const overtime = hrs > 8 ? `+${hrs-8}h` : null;
                  const netMs = Math.max((l.workingMs||0)-(l.totalAfkMs||0), 0);
                  return (
                    <tr key={l._id}>
                      <td style={{ fontFamily:'monospace', fontSize:'.8rem', fontWeight:600 }}>{fmtDate(l.date)}</td>
                      <td style={{ fontSize:'.78rem', color:'#64748B' }}>{new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</td>
                      <td><span style={{ fontSize:'.72rem', fontWeight:600, padding:'3px 9px', borderRadius:99, background:l.status==='present'?'#D1FAE5':l.status==='leave'?'#FEF3C7':'#FEE2E2', color:l.status==='present'?'#065F46':l.status==='leave'?'#92400E':'#B91C1C' }}>{l.status}</span></td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'#64748B' }}>{fmtTime(l.loginTime)}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'#64748B' }}>{fmtTime(l.logoutTime)}</td>
                      <td>
                        <span style={{ fontWeight:700, color:hrs>=8?'#065F46':'#6366F1', background:hrs>=8?'#D1FAE5':'#EEF2FF', padding:'3px 9px', borderRadius:7, fontSize:'.82rem' }}>
                          {l.workingMs>0?fmtMs(l.workingMs):'—'}
                        </span>
                        {overtime && <span style={{ fontSize:'.7rem', fontWeight:700, color:'#D97706', background:'#FEF3C7', padding:'2px 7px', borderRadius:99, marginLeft:4 }}>{overtime}</span>}
                      </td>
                      <td>
                        {l.totalAfkMs>0
                          ? <span style={{ fontSize:'.75rem', fontWeight:600, color:'#92400E', background:'#FEF3C7', padding:'2px 8px', borderRadius:99 }}>💤 {fmtMs(l.totalAfkMs)} ({l.afkSessions?.filter(s=>s.end).length||0} sessions)</span>
                          : <span style={{ color:'#94A3B8', fontSize:'.75rem' }}>—</span>
                        }
                      </td>
                      <td style={{ fontWeight:700, color:'#0F172A' }}>{netMs>0?fmtMs(netMs):'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AFK History Tab ── */}
      {tab === 'afk' && (
        <div>
          {/* AFK Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
            {[
              { label:'Total AFK Sessions', value:allAFKSessions.length,  color:'#F59E0B' },
              { label:'Total AFK Time',     value:fmtMs(totalAfkMs),      color:'#EF4444' },
              { label:'Avg AFK per Session',value:allAFKSessions.length>0?fmtMs(Math.floor(totalAfkMs/allAFKSessions.length)):'—', color:'#6366F1' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding:'14px 16px', borderLeft:`3px solid ${s.color}` }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:'.72rem', color:'#64748B', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* AFK sessions table */}
          {allAFKSessions.length === 0 ? (
            <div className="card" style={{ padding:48, textAlign:'center', color:'#94A3B8' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>💤</div>
              <div style={{ fontWeight:600, color:'#64748B' }}>No AFK sessions recorded</div>
              <div style={{ fontSize:'.82rem', marginTop:6 }}>AFK sessions will appear here when the user marks themselves as Away.</div>
            </div>
          ) : (
            <div className="card table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>AFK Start</th><th>AFK End</th><th>Duration</th></tr></thead>
                <tbody>
                  {allAFKSessions.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily:'monospace', fontSize:'.8rem', fontWeight:600 }}>{fmtDate(s.date)}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'#64748B' }}>{fmtTime(s.start)}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'#64748B' }}>{fmtTime(s.end)}</td>
                      <td>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'3px 9px', borderRadius:99 }}>
                          💤 {fmtMs(s.ms)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── EOD Tab ── */}
      {tab === 'eod' && (
        <div>
          {eods.length===0
            ? <div className="card" style={{ padding:48, textAlign:'center', color:'#94A3B8' }}>No EOD reports yet.</div>
            : eods.map(eod => {
            const open  = eodExp===eod._id;
            const total = (eod.projects?.length||0)+(eod.completed?.length||0)+(eod.planned?.length||0);
            return (
              <div key={eod._id} className="card" style={{ marginBottom:10, overflow:'hidden', border:open?'1.5px solid #6366F1':'1px solid #E2E8F0' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', cursor:'pointer', userSelect:'none' }}
                  onClick={()=>setEodExp(open?null:eod._id)}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'.85rem' }}>{fmtDate(eod.date)}</div>
                    <div style={{ fontSize:'.71rem', color:'#64748B' }}>{new Date(eod.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:'.73rem', color:'#64748B', background:'#F8FAFC', padding:'3px 9px', borderRadius:99, border:'1px solid #E2E8F0' }}>
                      {new Date(eod.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                    </span>
                    <span style={{ fontSize:'.71rem', fontWeight:700, color:'#6366F1', background:'#EEF2FF', padding:'3px 9px', borderRadius:99 }}>{total} items</span>
                    <span style={{ color:'#94A3B8', transition:'transform .2s', display:'inline-block', transform:open?'rotate(180deg)':'none' }}>▾</span>
                  </div>
                </div>
                {open && (
                  <div style={{ padding:'0 18px 16px', borderTop:'1px solid #E2E8F0', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
                    {[['🗂 Projects',eod.projects],['✅ Completed',eod.completed],['📋 Planned',eod.planned]].map(([l,items]) =>
                      items?.length>0 && (
                        <div key={l}>
                          <div style={{ fontSize:'.68rem', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', margin:'14px 0 6px' }}>{l}</div>
                          {items.map((it,i) => <div key={i} style={{ fontSize:'.79rem', paddingLeft:13, position:'relative', marginBottom:3 }}><span style={{ position:'absolute', left:0, color:'#6366F1', fontWeight:700 }}>•</span>{it}</div>)}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Settings Tab ── */}
      {tab === 'settings' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0F172A', marginBottom:4 }}>Reset Password</div>
            <div style={{ fontSize:'.8rem', color:'#64748B', marginBottom:14 }}>Set a new password for this user.</div>
            {showReset ? (
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <input className="input" type="password" placeholder="New password (min 6 chars)" value={resetPwd} onChange={e=>setResetPwd(e.target.value)} style={{ maxWidth:280 }} />
                <button className="btn btn-primary btn-sm" onClick={doReset}>Set Password</button>
                <button className="btn btn-outline btn-sm" onClick={()=>{setShowReset(false);setResetPwd('');}}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={()=>setShowReset(true)}>🔑 Reset Password</button>
            )}
          </div>
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0F172A', marginBottom:4 }}>Account Status</div>
            <div style={{ fontSize:'.8rem', color:'#64748B', marginBottom:14 }}>
              Currently: <span style={{ fontWeight:700, color:user.isActive?'#10B981':'#EF4444' }}>{user.isActive?'Active':'Inactive'}</span>
            </div>
            <button className={`btn btn-sm ${user.isActive?'btn-amber':'btn-success'}`} onClick={toggleActive}>{user.isActive?'Deactivate Account':'Activate Account'}</button>
          </div>
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0F172A', marginBottom:4 }}>Admin Role</div>
            <div style={{ fontSize:'.8rem', color:'#64748B', marginBottom:14 }}>
              Currently: <span style={{ fontWeight:700, color:user.isAdmin?'#6D28D9':'#64748B' }}>{user.isAdmin?'Administrator':'Regular User'}</span>
            </div>
            <button className={`btn btn-sm ${user.isAdmin?'btn-danger':'btn-outline'}`} onClick={toggleAdmin}>{user.isAdmin?'Revoke Admin Access':'Grant Admin Access'}</button>
          </div>
          <div className="card" style={{ padding:'20px 24px', border:'1.5px solid #FEE2E2' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'#EF4444', marginBottom:4 }}>⚠ Danger Zone</div>
            <div style={{ fontSize:'.8rem', color:'#64748B', marginBottom:14 }}>Permanently delete this user and all their data.</div>
            <button className="btn btn-danger btn-sm" onClick={doDelete}>🗑 Delete User Permanently</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  back:  { background:'none', border:'none', cursor:'pointer', color:'#64748B', fontFamily:'DM Sans,sans-serif', fontSize:'.83rem', fontWeight:500, padding:0, marginBottom:18, display:'flex', alignItems:'center', gap:6 },
  empty: { textAlign:'center', padding:'32px', color:'#94A3B8', fontSize:'.84rem' },
};

const Loader = () => (
  <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'#64748B', fontSize:'.88rem' }}>
    <span className="spinner" style={{ borderColor:'rgba(99,102,241,.2)', borderTopColor:'#6366F1' }} />Loading…
  </div>
);