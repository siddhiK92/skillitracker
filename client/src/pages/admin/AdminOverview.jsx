import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, fmtTime, calcHours, today } from '../../utils/helpers';

export default function AdminOverview() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [users,   setUsers]   = useState([]);
  const [eods,    setEods]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('live');
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [updated, setUpdated] = useState(null);
  const [expandEOD, setExpandEOD] = useState(null);

  const load = useCallback(async (showLoad=false) => {
    if (showLoad) setLoading(true);
    try {
      const t = today();
      const [ov, us, ed] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get(`/admin/eod?date=${t}`),
      ]);
      setData(ov.data);
      setUsers(us.data.users);
      setEods(ed.data.eods);
      setUpdated(new Date());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(false), 30000);
    return () => clearInterval(t);
  }, [load]);

  const override = async (uid, status) => {
    try { await api.patch(`/admin/users/${uid}/status`, { status }); load(); toast.success('Status updated'); }
    catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || (u.role||'').toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' || u.status === filter;
    return ms && mf;
  });

  const eodMap = {};
  eods.forEach(e => { eodMap[e.user?._id] = e; });

  if (loading) return <Loader />;

  const { stats } = data || { stats:{} };

  return (
    <div className="fade-in">
      {/* Page title */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={S.title}>Live Dashboard</h1>
          <p style={S.sub}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {updated && <span style={{ color:'var(--text-3)', fontSize:'.73rem' }}> · Updated {updated.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => load(false)}>↻ Refresh</button>
      </div>

      {/* Stat cards */}
      <div style={S.grid6}>
        {[
          { label:'Total Members',  value:stats.total,    color:'#6366F1', bg:'#EEF2FF' },
          { label:'Online Now',     value:stats.online,   color:'#10B981', bg:'#D1FAE5' },
          { label:'Offline',        value:stats.offline,  color:'#EF4444', bg:'#FEE2E2' },
          { label:'On Leave',       value:stats.leave,    color:'#F59E0B', bg:'#FEF3C7' },
          { label:'Avg Work Hours', value:stats.avgHours, color:'#06B6D4', bg:'#CFFAFE' },
          { label:'EOD Submitted',  value:stats.eodCount, color:'#8B5CF6', bg:'#EDE9FE' },
        ].map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.55rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value ?? '—'}</div>
            <div style={{ fontSize:'.71rem', color:'var(--text-2)', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status pills */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:`${users.filter(u=>u.status==='online').length} Online`,  color:'#10B981', bg:'#D1FAE5' },
          { label:`${users.filter(u=>u.status==='offline').length} Offline`, color:'#EF4444', bg:'#FEE2E2' },
          { label:`${users.filter(u=>u.status==='leave').length} On Leave`,  color:'#F59E0B', bg:'#FEF3C7' },
          { label:`${eods.length} EOD Done`,                                  color:'#6366F1', bg:'#EEF2FF' },
        ].map(p => (
          <div key={p.label} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, background:p.bg, fontSize:'.76rem', fontWeight:600, color:p.color }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }} />{p.label}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[['live','Live Team Status'],['eod',`EOD Reports (${eods.length})`],['attendance',"Today's Attendance"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...S.tab, ...(tab===k ? S.tabActive : {}) }}>{l}</button>
        ))}
      </div>

      {/* Tab: Live */}
      {tab === 'live' && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input className="input" style={{ flex:1, maxWidth:280 }} placeholder="Search member…" value={search} onChange={e=>setSearch(e.target.value)} />
            <div style={{ display:'flex', gap:6 }}>
              {['all','online','offline','leave'].map(f => (
                <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline'}`} onClick={()=>setFilter(f)}>
                  {f==='all'?'All':f==='online'?'Online':f==='offline'?'Offline':'On Leave'}
                </button>
              ))}
            </div>
          </div>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>Member</th><th>Status</th><th>Login</th><th>Logout</th><th>Hours</th><th>EOD</th><th>Override</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign:'center', padding:36, color:'var(--text-3)' }}>No members found.</td></tr>
                  : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ position:'relative' }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:u.color||avatarColor(u.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.73rem', color:'#fff' }}>{initials(u.name)}</div>
                          <span className={`dot dot-${u.status}`} style={{ position:'absolute', bottom:-1, right:-1, border:'2px solid #fff' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'.84rem' }}>{u.name}</div>
                          <div style={{ fontSize:'.71rem', color:'var(--text-2)' }}>{u.role||'Team Member'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.status}`}>{u.status==='online'?'Online':u.status==='leave'?'On Leave':'Offline'}</span></td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(u.loginTime)}</td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(u.logoutTime)}</td>
                    <td>
                      <span style={{ fontWeight:700, color:'var(--primary)', fontSize:'.83rem', background:'var(--primary-l)', padding:'3px 9px', borderRadius:7 }}>
                        {u.loginTime ? calcHours(u.loginTime, u.status==='online'?null:u.logoutTime) : '—'}
                      </span>
                    </td>
                    <td>
                      {eodMap[u._id]
                        ? <span style={{ fontSize:'.75rem', color:'#065F46', background:'#D1FAE5', padding:'3px 9px', borderRadius:99, fontWeight:600 }}>✓ Done</span>
                        : <span style={{ fontSize:'.75rem', color:'var(--text-3)' }}>Pending</span>
                      }
                    </td>
                    <td>
                      <select className="input" style={{ padding:'4px 8px', fontSize:'.78rem', width:'auto' }}
                        value={u.status} onChange={e => override(u._id, e.target.value)}>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="leave">On Leave</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/users/${u._id}`)}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: EOD */}
      {tab === 'eod' && (
        <div>
          {eods.length === 0
            ? <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-3)' }}>No EOD reports submitted today.</div>
            : eods.map(eod => {
              const u = eod.user || {};
              const open = expandEOD === eod._id;
              const total = (eod.projects?.length||0)+(eod.completed?.length||0)+(eod.planned?.length||0);
              return (
                <div key={eod._id} className="card" style={{ marginBottom:10, overflow:'hidden', border:open?'1.5px solid var(--primary)':'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer' }}
                    onClick={() => setExpandEOD(open ? null : eod._id)}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:u.color||avatarColor(u.name||''), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.73rem', color:'#fff' }}>{initials(u.name||'?')}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'.85rem' }}>{u.name}</div>
                        <div style={{ fontSize:'.71rem', color:'var(--text-2)' }}>{u.role}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:'.73rem', color:'var(--text-2)', background:'var(--bg)', padding:'3px 9px', borderRadius:99, border:'1px solid var(--border)' }}>
                        {new Date(eod.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </span>
                      <span style={{ fontSize:'.71rem', fontWeight:700, color:'var(--primary)', background:'var(--primary-l)', padding:'3px 8px', borderRadius:99 }}>{total} items</span>
                      <span style={{ color:'var(--text-3)', transition:'transform .2s', display:'inline-block', transform:open?'rotate(180deg)':'none' }}>▾</span>
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding:'0 18px 16px', borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
                      {[['Projects',eod.projects],['Completed',eod.completed],['Planned',eod.planned]].map(([l,items]) =>
                        items?.length > 0 && (
                          <div key={l}>
                            <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.06em', margin:'14px 0 6px' }}>{l}</div>
                            {items.map((it,i) => <div key={i} style={{ fontSize:'.79rem', paddingLeft:12, position:'relative', marginBottom:3 }}>
                              <span style={{ position:'absolute', left:0, color:'var(--primary)' }}>•</span>{it}
                            </div>)}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}

      {/* Tab: Attendance */}
      {tab === 'attendance' && (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Member</th><th>Status</th><th>Login</th><th>Logout</th><th>Hours Worked</th></tr></thead>
            <tbody>
              {data?.todayLogs?.length === 0
                ? <tr><td colSpan={5} style={{ textAlign:'center', padding:36, color:'var(--text-3)' }}>No attendance records today.</td></tr>
                : data?.todayLogs?.map(log => {
                  const u = log.user || {};
                  return (
                    <tr key={log._id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:9, background:u.color||avatarColor(u.name||''), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.72rem', color:'#fff' }}>{initials(u.name||'?')}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'.84rem' }}>{u.name}</div>
                            <div style={{ fontSize:'.71rem', color:'var(--text-2)' }}>{u.role}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge badge-${log.status==='present'?'online':log.status==='leave'?'leave':'offline'}`}>{log.status}</span></td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(log.loginTime)}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(log.logoutTime)}</td>
                      <td style={{ fontWeight:700, color:'var(--primary)' }}>
                        {log.workingMs > 0 ? `${Math.floor(log.workingMs/3600000)}h ${Math.floor((log.workingMs%3600000)/60000)}m` : log.loginTime ? calcHours(log.loginTime,log.logoutTime) : '—'}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const S = {
  title:    { fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.03em' },
  sub:      { fontSize:'.8rem', color:'var(--text-2)', marginTop:4 },
  grid6:    { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:18 },
  statCard: { background:'var(--surface)', borderRadius:'var(--r-lg)', padding:'16px 18px', border:'1px solid var(--border)', boxShadow:'var(--shadow)' },
  tabs:     { display:'flex', gap:2, borderBottom:'2px solid var(--border)', marginBottom:18 },
  tab:      { padding:'9px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'.83rem', fontWeight:600, color:'var(--text-2)', borderBottom:'2px solid transparent', marginBottom:-2, transition:'color .15s' },
  tabActive:{ color:'var(--primary)', borderBottomColor:'var(--primary)' },
};

const Loader = () => <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'var(--text-2)', fontSize:'.88rem' }}><span className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'var(--primary)' }} />Loading…</div>;
