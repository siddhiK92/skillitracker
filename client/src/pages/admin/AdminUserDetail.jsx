import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, fmtDate, fmtTime, fmtMs, COLORS } from '../../utils/helpers';

const TAB = [
  { key:'overview',    label:'Overview' },
  { key:'attendance',  label:'Attendance Log' },
  { key:'eod',         label:'EOD Reports' },
  { key:'settings',    label:'Settings' },
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
  const [eodExpand, setEodExpand] = useState(null);
  const [attFilter, setAttFilter] = useState('all');
  const [attSearch, setAttSearch] = useState('');

  const load = async () => {
    try {
      const { data: d } = await api.get(`/admin/users/${id}`);
      setData(d);
      setEditForm({ name: d.user.name, role: d.user.role, color: d.user.color });
    } catch { toast.error('Failed to load user'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    try {
      await api.patch(`/admin/users/${id}`, editForm);
      toast.success('Updated!'); setEditMode(false); load();
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async () => {
    try {
      await api.patch(`/admin/users/${id}`, { isActive: !data.user.isActive });
      toast.success('Updated!'); load();
    } catch { toast.error('Failed'); }
  };

  const toggleAdmin = async () => {
    try {
      await api.patch(`/admin/users/${id}`, { isAdmin: !data.user.isAdmin });
      toast.success('Updated!'); load();
    } catch { toast.error('Failed'); }
  };

  const doReset = async () => {
    if (!resetPwd || resetPwd.length < 6) { toast.error('Min 6 characters'); return; }
    try {
      await api.patch(`/admin/users/${id}/reset-pass`, { newPassword: resetPwd });
      toast.success('Password reset!'); setShowReset(false); setResetPwd('');
    } catch { toast.error('Failed'); }
  };

  const doDelete = async () => {
    if (!confirm(`Delete ${data?.user?.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Loader />;
  if (!data)   return null;

  const { user, logs = [], eods = [], stats = {} } = data;

  // Attendance filter
  const filteredLogs = logs.filter(l => {
    const sf = attFilter === 'all' || l.status === attFilter;
    const dt = attSearch ? l.date.includes(attSearch) : true;
    return sf && dt;
  });

  // Calculate streaks & summary
  const presentDays = logs.filter(l => l.status === 'present').length;
  const leaveDays   = logs.filter(l => l.status === 'leave').length;
  const totalMs     = logs.reduce((s, l) => s + (l.workingMs || 0), 0);
  const avgMs       = presentDays > 0 ? totalMs / presentDays : 0;

  // Working hours per day for mini chart
  const last7 = logs.slice(0, 7).reverse();

  return (
    <div className="fade-in">
      {/* Back */}
      <button onClick={() => navigate('/admin/users')} style={S.back}>← Back to Users</button>

      {/* Profile Card */}
      <div className="card" style={{ padding:'24px 28px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            {/* Avatar */}
            <div style={{ width:64, height:64, borderRadius:16, background: user.color || avatarColor(user.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#fff', flexShrink:0 }}>
              {initials(user.name)}
            </div>

            {editMode ? (
              <div style={{ minWidth:280 }}>
                <div className="field" style={{ marginBottom:10 }}>
                  <label>Name</label>
                  <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="field" style={{ marginBottom:10 }}>
                  <label>Role / Designation</label>
                  <input className="input" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} />
                </div>
                <div className="field" style={{ marginBottom:12 }}>
                  <label>Avatar Color</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                    {COLORS.map(c => (
                      <div key={c} onClick={() => setEditForm(f => ({ ...f, color: c }))}
                        style={{ width:24, height:24, borderRadius:7, background:c, cursor:'pointer', border:`2.5px solid ${editForm.color===c?'#0F172A':'transparent'}`, transform:editForm.color===c?'scale(1.1)':'scale(1)', transition:'all .15s' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" onClick={save}>Save Changes</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.15rem', fontWeight:800, color:'var(--text-1)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:2 }}>
                  {user.name}
                  {user.isAdmin && <span style={{ fontSize:'.65rem', background:'#EDE9FE', color:'#6D28D9', padding:'2px 8px', borderRadius:99, fontWeight:700 }}>Admin</span>}
                  <span className={`badge ${user.isActive ? 'badge-online' : 'badge-offline'}`} style={{ fontSize:'.64rem' }}>{user.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ fontSize:'.82rem', color:'var(--text-2)', marginBottom:3 }}>{user.role || 'Team Member'}</div>
                <div style={{ fontSize:'.78rem', color:'var(--text-3)' }}>@{user.username} · {user.email}</div>
                <div style={{ fontSize:'.75rem', color:'var(--text-3)', marginTop:3 }}>
                  Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {!editMode && <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>✏ Edit</button>}
            <button className={`btn btn-sm ${user.isActive ? 'btn-amber' : 'btn-success'}`} onClick={toggleActive}>
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button className={`btn btn-sm ${user.isAdmin ? 'btn-danger' : 'btn-outline'}`} onClick={toggleAdmin}>
              {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={doDelete}>Delete User</button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Days Present',      value: presentDays,        color:'#10B981', bg:'#D1FAE5' },
          { label:'Days on Leave',     value: leaveDays,          color:'#F59E0B', bg:'#FEF3C7' },
          { label:'Total Hours (30d)', value: fmtMs(totalMs),     color:'#6366F1', bg:'#EEF2FF' },
          { label:'Avg Daily Hours',   value: fmtMs(avgMs),       color:'#06B6D4', bg:'#CFFAFE' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'16px 18px', borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.35rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'.72rem', color:'var(--text-2)', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Last 7 days mini bar chart */}
      {last7.length > 0 && (
        <div className="card" style={{ padding:'18px 22px', marginBottom:20 }}>
          <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--text-2)', marginBottom:14, textTransform:'uppercase', letterSpacing:'.06em' }}>Last 7 Days Activity</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:60 }}>
            {last7.map((l, i) => {
              const pct = totalMs > 0 ? Math.min((l.workingMs / (9 * 3600000)) * 100, 100) : 0;
              const h   = Math.floor(l.workingMs / 3600000);
              const m   = Math.floor((l.workingMs % 3600000) / 60000);
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:'.62rem', color:'var(--text-3)', fontWeight:600 }}>
                    {l.workingMs > 0 ? `${h}h${m}m` : l.status==='leave'?'L':'—'}
                  </div>
                  <div style={{ width:'100%', height:44, background:'var(--border-l)', borderRadius:6, overflow:'hidden', display:'flex', alignItems:'flex-end' }}>
                    <div style={{
                      width:'100%',
                      height:`${pct}%`,
                      minHeight: l.status==='present'&&l.workingMs>0 ? 4 : 0,
                      background: l.status==='leave' ? '#FDE68A' : pct >= 80 ? '#10B981' : pct >= 50 ? '#6366F1' : '#94A3B8',
                      borderRadius:'4px 4px 0 0',
                      transition:'height .3s',
                    }} />
                  </div>
                  <div style={{ fontSize:'.6rem', color:'var(--text-3)' }}>
                    {new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'}).slice(0,2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:10 }}>
            {[['#10B981','8+ hours'],['#6366F1','4-8 hours'],['#94A3B8','< 4 hours'],['#FDE68A','On Leave']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.68rem', color:'var(--text-2)' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:c }} />{l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'2px solid var(--border)', marginBottom:20 }}>
        {TAB.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'.83rem', fontWeight:600, color:tab===t.key?'var(--primary)':'var(--text-2)', borderBottom:`2px solid ${tab===t.key?'var(--primary)':'transparent'}`, marginBottom:-2, transition:'color .15s' }}>
            {t.label}
            {t.key==='attendance' && <span style={{ marginLeft:5, fontSize:'.65rem', background:'var(--border)', padding:'1px 6px', borderRadius:99 }}>{logs.length}</span>}
            {t.key==='eod'        && <span style={{ marginLeft:5, fontSize:'.65rem', background:'var(--border)', padding:'1px 6px', borderRadius:99 }}>{eods.length}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {tab === 'overview' && (
        <div>
          {/* Recent attendance */}
          <div style={{ fontWeight:700, fontSize:'.85rem', color:'var(--text-1)', marginBottom:12 }}>Recent Attendance (Last 10 Days)</div>
          <div className="card table-wrap" style={{ marginBottom:20 }}>
            <table className="table">
              <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Login</th><th>Logout</th><th>Hours Worked</th></tr></thead>
              <tbody>
                {logs.slice(0,10).length === 0
                  ? <tr><td colSpan={6} style={S.empty}>No records yet</td></tr>
                  : logs.slice(0,10).map(l => (
                  <tr key={l._id}>
                    <td style={{ fontFamily:'monospace', fontSize:'.8rem', fontWeight:600 }}>{fmtDate(l.date)}</td>
                    <td style={{ fontSize:'.78rem', color:'var(--text-2)' }}>{new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</td>
                    <td><span className={`badge ${l.status==='present'?'badge-online':l.status==='leave'?'badge-leave':'badge-offline'}`}>{l.status}</span></td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(l.loginTime)}</td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(l.logoutTime)}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{l.workingMs > 0 ? fmtMs(l.workingMs) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent EODs */}
          <div style={{ fontWeight:700, fontSize:'.85rem', color:'var(--text-1)', marginBottom:12 }}>Recent EOD Reports (Last 5)</div>
          {eods.slice(0,5).length === 0
            ? <div className="card" style={{ padding:24, textAlign:'center', color:'var(--text-3)', fontSize:'.84rem' }}>No EOD reports yet</div>
            : eods.slice(0,5).map(e => (
            <div key={e._id} className="card" style={{ marginBottom:10, padding:'14px 18px' }}>
              <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--text-2)', marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                <span>{fmtDate(e.date)} · {new Date(e.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</span>
                <span style={{ fontSize:'.7rem', color:'var(--text-3)' }}>Submitted {new Date(e.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
              </div>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {[['Projects',e.projects],['Completed',e.completed],['Planned',e.planned]].map(([l,items]) =>
                  items?.length > 0 && (
                    <div key={l} style={{ flex:1, minWidth:140 }}>
                      <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>{l}</div>
                      {items.map((it,i) => <div key={i} style={{ fontSize:'.79rem', paddingLeft:12, position:'relative', marginBottom:2 }}><span style={{ position:'absolute', left:0, color:'var(--primary)' }}>•</span>{it}</div>)}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Attendance ── */}
      {tab === 'attendance' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input className="input" style={{ flex:1, maxWidth:200 }} type="month" value={attSearch}
              onChange={e => setAttSearch(e.target.value)} placeholder="Filter by month" />
            <div style={{ display:'flex', gap:6 }}>
              {['all','present','leave'].map(f => (
                <button key={f} className={`btn btn-sm ${attFilter===f?'btn-primary':'btn-outline'}`} onClick={() => setAttFilter(f)}>
                  {f==='all'?'All':f==='present'?'Present':'On Leave'}
                </button>
              ))}
            </div>
            <span style={{ alignSelf:'center', fontSize:'.78rem', color:'var(--text-2)' }}>{filteredLogs.length} records</span>
          </div>

          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours Worked</th>
                  <th>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0
                  ? <tr><td colSpan={7} style={S.empty}>No attendance records found</td></tr>
                  : filteredLogs.map(l => {
                  const hrs = Math.floor((l.workingMs||0) / 3600000);
                  const overtime = hrs > 8 ? `+${hrs-8}h` : null;
                  return (
                    <tr key={l._id}>
                      <td style={{ fontFamily:'monospace', fontSize:'.8rem', fontWeight:600 }}>{fmtDate(l.date)}</td>
                      <td style={{ fontSize:'.78rem', color:'var(--text-2)' }}>{new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</td>
                      <td><span className={`badge ${l.status==='present'?'badge-online':l.status==='leave'?'badge-leave':'badge-offline'}`}>{l.status}</span></td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(l.loginTime)}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(l.logoutTime)}</td>
                      <td>
                        <span style={{ fontWeight:700, color: hrs>=8?'var(--green)':'var(--primary)', background: hrs>=8?'#D1FAE5':'var(--primary-l)', padding:'3px 9px', borderRadius:7, fontSize:'.82rem' }}>
                          {l.workingMs > 0 ? fmtMs(l.workingMs) : '—'}
                        </span>
                      </td>
                      <td>
                        {overtime
                          ? <span style={{ fontSize:'.74rem', fontWeight:700, color:'#D97706', background:'#FEF3C7', padding:'2px 8px', borderRadius:99 }}>{overtime}</span>
                          : <span style={{ color:'var(--text-3)', fontSize:'.75rem' }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: EOD Reports ── */}
      {tab === 'eod' && (
        <div>
          {eods.length === 0
            ? <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-3)' }}>No EOD reports submitted yet.</div>
            : eods.map(eod => {
            const open  = eodExpand === eod._id;
            const total = (eod.projects?.length||0)+(eod.completed?.length||0)+(eod.planned?.length||0);
            return (
              <div key={eod._id} className="card" style={{ marginBottom:10, overflow:'hidden', border:open?'1.5px solid var(--primary)':'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer', userSelect:'none' }}
                  onClick={() => setEodExpand(open ? null : eod._id)}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'.85rem' }}>{fmtDate(eod.date)}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text-2)' }}>{new Date(eod.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:'.73rem', color:'var(--text-2)', background:'var(--bg)', padding:'3px 9px', borderRadius:99, border:'1px solid var(--border)' }}>
                      {new Date(eod.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                    </span>
                    <span style={{ fontSize:'.71rem', fontWeight:700, color:'var(--primary)', background:'var(--primary-l)', padding:'3px 9px', borderRadius:99 }}>
                      {total} items
                    </span>
                    <span style={{ color:'var(--text-3)', transition:'transform .2s', display:'inline-block', transform:open?'rotate(180deg)':'none' }}>▾</span>
                  </div>
                </div>
                {open && (
                  <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
                    {[['🗂 Projects',eod.projects],['✅ Completed Today',eod.completed],['📋 Planned Tomorrow',eod.planned]].map(([l,items]) =>
                      items?.length > 0 && (
                        <div key={l}>
                          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.06em', margin:'14px 0 7px' }}>{l}</div>
                          {items.map((it,i) => (
                            <div key={i} style={{ fontSize:'.8rem', paddingLeft:13, position:'relative', marginBottom:4, color:'var(--text-1)', lineHeight:1.5 }}>
                              <span style={{ position:'absolute', left:0, color:'var(--primary)', fontWeight:700 }}>•</span>{it}
                            </div>
                          ))}
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

      {/* ── TAB: Settings ── */}
      {tab === 'settings' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Reset password */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--text-1)', marginBottom:4 }}>Reset Password</div>
            <div style={{ fontSize:'.8rem', color:'var(--text-2)', marginBottom:16 }}>Set a new password for this user.</div>
            {showReset ? (
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <input className="input" type="password" placeholder="New password (min 6 chars)" value={resetPwd}
                  onChange={e => setResetPwd(e.target.value)} style={{ maxWidth:280 }} />
                <button className="btn btn-primary btn-sm" onClick={doReset}>Set Password</button>
                <button className="btn btn-outline btn-sm" onClick={() => { setShowReset(false); setResetPwd(''); }}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={() => setShowReset(true)}>🔑 Reset Password</button>
            )}
          </div>

          {/* Account status */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--text-1)', marginBottom:4 }}>Account Status</div>
            <div style={{ fontSize:'.8rem', color:'var(--text-2)', marginBottom:16 }}>
              Currently: <span style={{ fontWeight:700, color: user.isActive ? 'var(--green)' : 'var(--red)' }}>{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <button className={`btn btn-sm ${user.isActive ? 'btn-amber' : 'btn-success'}`} onClick={toggleActive}>
              {user.isActive ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>

          {/* Admin role */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--text-1)', marginBottom:4 }}>Admin Role</div>
            <div style={{ fontSize:'.8rem', color:'var(--text-2)', marginBottom:16 }}>
              Currently: <span style={{ fontWeight:700, color: user.isAdmin ? '#6D28D9' : 'var(--text-2)' }}>{user.isAdmin ? 'Administrator' : 'Regular User'}</span>
            </div>
            <button className={`btn btn-sm ${user.isAdmin ? 'btn-danger' : 'btn-outline'}`} onClick={toggleAdmin}>
              {user.isAdmin ? 'Revoke Admin Access' : 'Grant Admin Access'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ padding:'20px 24px', border:'1.5px solid #FEE2E2' }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--red)', marginBottom:4 }}>⚠ Danger Zone</div>
            <div style={{ fontSize:'.8rem', color:'var(--text-2)', marginBottom:16 }}>
              Permanently delete this user and all their data (attendance, EODs). This cannot be undone.
            </div>
            <button className="btn btn-danger btn-sm" onClick={doDelete}>🗑 Delete User Permanently</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  back:  { background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', fontFamily:'DM Sans,sans-serif', fontSize:'.83rem', fontWeight:500, padding:0, marginBottom:18, display:'flex', alignItems:'center', gap:6 },
  empty: { textAlign:'center', padding:'36px !important', color:'var(--text-3)', fontSize:'.84rem' },
};

const Loader = () => (
  <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'var(--text-2)', fontSize:'.88rem' }}>
    <span className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'var(--primary)' }} />Loading…
  </div>
);