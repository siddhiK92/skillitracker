import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, fmtTime, calcHours, fmtMs, today } from '../../utils/helpers';

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
  const [eodExp,  setEodExp]  = useState(null);

  const load = useCallback(async (showLoad = false) => {
    if (showLoad) setLoading(true);
    try {
      const t = today();
      const [ov, us, ed] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get(`/admin/eod?date=${t}`),
      ]);
      setData(ov.data);
      setUsers(us.data.users.filter(u => u.isApproved));
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

  const overrideStatus = async (uid, status) => {
    try {
      await api.patch(`/admin/users/${uid}/status`, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || (u.role||'').toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' || u.status === filter;
    return ms && mf;
  });

  const eodMap = {};
  eods.forEach(e => { eodMap[e.user?._id] = e; });

  // AFK users
  const afkUsers = users.filter(u => u.status === 'afk');

  if (loading) return <Loader />;

  const { stats = {} } = data || {};

  return (
    <div className="fade-in">

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={S.title}>Live Dashboard</h1>
          <p style={S.sub}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {updated && <span style={{ color:'#94A3B8', fontSize:'.72rem' }}> · Updated {updated.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => load(false)}>↻ Refresh</button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:18 }}>
        {[
          { label:'Total Members',   value:stats.total||0,        color:'#6366F1', bg:'#EEF2FF' },
          { label:'Online Now',      value:stats.online||0,       color:'#10B981', bg:'#D1FAE5' },
          { label:'AFK',             value:stats.afk||0,          color:'#F59E0B', bg:'#FEF3C7' },
          { label:'On Leave',        value:stats.leave||0,        color:'#06B6D4', bg:'#CFFAFE' },
          { label:'Offline',         value:stats.offline||0,      color:'#EF4444', bg:'#FEE2E2' },
          { label:'EOD Submitted',   value:stats.eodCount||0,     color:'#8B5CF6', bg:'#EDE9FE' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'16px 14px', borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'.69rem', color:'#64748B', marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── AFK Alert Banner ── */}
      {afkUsers.length > 0 && (
        <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12, padding:'14px 18px', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>💤</span>
            <span style={{ fontWeight:700, color:'#92400E', fontSize:'.9rem' }}>
              {afkUsers.length} member{afkUsers.length>1?'s are':' is'} currently AFK
            </span>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {afkUsers.map(u => (
              <div key={u._id} style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #FDE68A', borderRadius:10, padding:'8px 12px' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:u.color||avatarColor(u.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.7rem', color:'#fff' }}>
                  {initials(u.name)}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'.82rem', color:'#0F172A' }}>{u.name}</div>
                  <div style={{ fontSize:'.7rem', color:'#92400E' }}>
                    AFK since {fmtTime(u.loginTime)}
                  </div>
                </div>
                {/* Bring back online button */}
                <button
                  onClick={() => overrideStatus(u._id, 'online')}
                  style={{ marginLeft:4, padding:'4px 10px', background:'#10B981', color:'#fff', border:'none', borderRadius:7, fontSize:'.73rem', fontWeight:700, cursor:'pointer' }}>
                  ✓ Online
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending approval banner */}
      {stats.pendingApproval > 0 && (
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span>⏳</span>
            <span style={{ fontSize:'.84rem', color:'#1E40AF', fontWeight:600 }}>
              {stats.pendingApproval} user{stats.pendingApproval>1?'s':''} waiting for approval
            </span>
          </div>
          <button className="btn btn-sm" onClick={() => navigate('/admin/users')}
            style={{ background:'#6366F1', color:'#fff', border:'none' }}>
            Review →
          </button>
        </div>
      )}

      {/* Status pills */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {[
          { label:`${stats.online||0} Online`,  color:'#10B981', bg:'#D1FAE5' },
          { label:`${stats.afk||0} AFK`,         color:'#F59E0B', bg:'#FEF3C7' },
          { label:`${stats.leave||0} On Leave`,  color:'#06B6D4', bg:'#CFFAFE' },
          { label:`${stats.offline||0} Offline`, color:'#EF4444', bg:'#FEE2E2' },
          { label:`${eods.length} EOD Done`,     color:'#8B5CF6', bg:'#EDE9FE' },
        ].map(p => (
          <div key={p.label} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:99, background:p.bg, fontSize:'.75rem', fontWeight:600, color:p.color }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }} />
            {p.label}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, borderBottom:'2px solid #E2E8F0', marginBottom:18 }}>
        {[
          ['live',       'Live Team Status'],
          ['afk',        `AFK Members (${afkUsers.length})`],
          ['eod',        `EOD Reports (${eods.length})`],
          ['attendance', "Today's Attendance"],
        ].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding:'9px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'.82rem', fontWeight:600, color:tab===k?'#6366F1':'#64748B', borderBottom:`2px solid ${tab===k?'#6366F1':'transparent'}`, marginBottom:-2, whiteSpace:'nowrap' }}>
            {l}
            {k==='afk' && afkUsers.length>0 && <span style={{ marginLeft:5, background:'#F59E0B', color:'#fff', fontSize:'.63rem', fontWeight:700, padding:'1px 6px', borderRadius:99 }}>{afkUsers.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab: Live ── */}
      {tab === 'live' && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input className="input" style={{ flex:1, maxWidth:280 }} placeholder="Search member…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['all','online','afk','offline','leave'].map(f => (
                <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline'}`} onClick={() => setFilter(f)}>
                  {f==='all'?'All':f==='online'?'Online':f==='afk'?'💤 AFK':f==='offline'?'Offline':'On Leave'}
                </button>
              ))}
            </div>
          </div>

          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr><th>Member</th><th>Status</th><th>Login</th><th>Logout</th><th>Hours</th><th>EOD</th><th>Override</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} style={S.empty}>No members found.</td></tr>
                  : filtered.map(u => {
                  const badge = getStatusBadge(u.status);
                  return (
                    <tr key={u._id} style={{ background: u.status==='afk'?'#FFFBEB':'' }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ position:'relative' }}>
                            <div style={{ width:34,height:34,borderRadius:10,background:u.color||avatarColor(u.name),display:'grid',placeItems:'center',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'.73rem',color:'#fff' }}>
                              {initials(u.name)}
                            </div>
                            <span style={{ position:'absolute',bottom:-1,right:-1,width:10,height:10,borderRadius:'50%',border:'2px solid #fff',background:u.status==='online'?'#10B981':u.status==='afk'?'#F59E0B':u.status==='leave'?'#06B6D4':'#94A3B8' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'.84rem' }}>{u.name}</div>
                            <div style={{ fontSize:'.71rem', color:'#64748B' }}>{u.role||'Team Member'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:99,fontSize:'.73rem',fontWeight:600,background:badge.bg,color:badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ fontFamily:'monospace',fontSize:'.79rem',color:'#64748B' }}>{fmtTime(u.loginTime)}</td>
                      <td style={{ fontFamily:'monospace',fontSize:'.79rem',color:'#64748B' }}>
                        {u.status==='online'||u.status==='afk'
                          ? <span style={{ color:'#10B981',fontSize:'.76rem',display:'flex',alignItems:'center',gap:4 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#10B981',display:'inline-block' }}/>Active</span>
                          : fmtTime(u.logoutTime)
                        }
                      </td>
                      <td>
                        <span style={{ fontWeight:700,color:'#6366F1',fontSize:'.82rem',background:'#EEF2FF',padding:'3px 9px',borderRadius:7 }}>
                          {u.loginTime ? calcHours(u.loginTime, u.status==='online'||u.status==='afk'?null:u.logoutTime, u.status==='online'||u.status==='afk') : '—'}
                        </span>
                      </td>
                      <td>
                        {eodMap[u._id]
                          ? <span style={{ fontSize:'.74rem',color:'#065F46',background:'#D1FAE5',padding:'3px 9px',borderRadius:99,fontWeight:600 }}>✓ Done</span>
                          : <span style={{ fontSize:'.74rem',color:'#94A3B8' }}>Pending</span>
                        }
                      </td>
                      <td>
                        <select className="input" style={{ padding:'4px 8px',fontSize:'.77rem',width:'auto' }}
                          value={u.status} onChange={e => overrideStatus(u._id, e.target.value)}>
                          <option value="online">Online</option>
                          <option value="afk">💤 AFK</option>
                          <option value="offline">Offline</option>
                          <option value="leave">On Leave</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/users/${u._id}`)}>Details</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tab: AFK ── */}
      {tab === 'afk' && (
        <div>
          {afkUsers.length === 0 ? (
            <div className="card" style={{ padding:56, textAlign:'center', color:'#94A3B8' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>✅</div>
              <div style={{ fontWeight:600, color:'#64748B', fontSize:'.95rem' }}>No one is AFK right now!</div>
              <div style={{ fontSize:'.82rem', marginTop:6 }}>All team members are active.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'.82rem', color:'#64748B', marginBottom:14, fontWeight:500 }}>
                {afkUsers.length} member{afkUsers.length>1?'s':''} currently away from keyboard
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {afkUsers.map(u => (
                  <div key={u._id} className="card" style={{ padding:'18px 22px', border:'1.5px solid #FDE68A', background:'#FFFBEB' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ position:'relative' }}>
                          <div style={{ width:48,height:48,borderRadius:13,background:u.color||avatarColor(u.name),display:'grid',placeItems:'center',fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'.88rem',color:'#fff' }}>
                            {initials(u.name)}
                          </div>
                          <span style={{ position:'absolute',bottom:-2,right:-2,width:14,height:14,borderRadius:'50%',border:'2.5px solid #FFFBEB',background:'#F59E0B',display:'grid',placeItems:'center',fontSize:8 }}>💤</span>
                        </div>
                        <div>
                          <div style={{ fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'1rem',color:'#0F172A' }}>{u.name}</div>
                          <div style={{ fontSize:'.78rem',color:'#92400E',marginTop:2 }}>{u.role||'Team Member'}</div>
                          <div style={{ fontSize:'.74rem',color:'#B45309',marginTop:3 }}>
                            Logged in at {fmtTime(u.loginTime)} · Total: {u.loginTime?calcHours(u.loginTime,null,true):'—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button
                          onClick={() => overrideStatus(u._id, 'online')}
                          style={{ padding:'9px 18px',background:'#10B981',color:'#fff',border:'none',borderRadius:9,fontWeight:700,cursor:'pointer',fontSize:'.84rem' }}>
                          ✓ Mark Online
                        </button>
                        <button
                          onClick={() => navigate(`/admin/users/${u._id}`)}
                          className="btn btn-outline btn-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: EOD ── */}
      {tab === 'eod' && (
        <div>
          {eods.length === 0
            ? <div className="card" style={{ padding:48,textAlign:'center',color:'#94A3B8' }}>No EOD reports today.</div>
            : eods.map(eod => {
            const u    = eod.user||{};
            const open = eodExp===eod._id;
            const total = (eod.projects?.length||0)+(eod.completed?.length||0)+(eod.planned?.length||0);
            return (
              <div key={eod._id} className="card" style={{ marginBottom:10,overflow:'hidden',border:open?'1.5px solid #6366F1':'1px solid #E2E8F0' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',cursor:'pointer',userSelect:'none' }}
                  onClick={() => setEodExp(open?null:eod._id)}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <div style={{ width:34,height:34,borderRadius:9,background:u.color||avatarColor(u.name||''),display:'grid',placeItems:'center',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'.73rem',color:'#fff' }}>{initials(u.name||'?')}</div>
                    <div>
                      <div style={{ fontWeight:600,fontSize:'.85rem' }}>{u.name}</div>
                      <div style={{ fontSize:'.71rem',color:'#64748B' }}>{u.role}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <span style={{ fontSize:'.73rem',color:'#64748B',background:'#F8FAFC',padding:'3px 9px',borderRadius:99,border:'1px solid #E2E8F0' }}>
                      {new Date(eod.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                    </span>
                    <span style={{ fontSize:'.71rem',fontWeight:700,color:'#6366F1',background:'#EEF2FF',padding:'3px 9px',borderRadius:99 }}>{total} items</span>
                    <span style={{ color:'#94A3B8',transition:'transform .2s',display:'inline-block',transform:open?'rotate(180deg)':'none' }}>▾</span>
                  </div>
                </div>
                {open && (
                  <div style={{ padding:'0 18px 16px',borderTop:'1px solid #E2E8F0',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16 }}>
                    {[['Projects',eod.projects],['Completed',eod.completed],['Planned',eod.planned]].map(([l,items]) =>
                      items?.length>0 && (
                        <div key={l}>
                          <div style={{ fontSize:'.68rem',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em',margin:'14px 0 6px' }}>{l}</div>
                          {items.map((it,i) => <div key={i} style={{ fontSize:'.79rem',paddingLeft:12,position:'relative',marginBottom:3 }}><span style={{ position:'absolute',left:0,color:'#6366F1',fontWeight:700 }}>•</span>{it}</div>)}
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

      {/* ── Tab: Attendance ── */}
      {tab === 'attendance' && (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Member</th><th>Status</th><th>Login</th><th>Logout</th><th>Hours</th></tr></thead>
            <tbody>
              {data?.todayLogs?.length===0
                ? <tr><td colSpan={5} style={S.empty}>No attendance records today.</td></tr>
                : data?.todayLogs?.map(log => {
                const u = log.user||{};
                return (
                  <tr key={log._id}>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:32,height:32,borderRadius:9,background:u.color||avatarColor(u.name||''),display:'grid',placeItems:'center',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'.72rem',color:'#fff' }}>{initials(u.name||'?')}</div>
                        <div>
                          <div style={{ fontWeight:600,fontSize:'.84rem' }}>{u.name}</div>
                          <div style={{ fontSize:'.71rem',color:'#64748B' }}>{u.role}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize:'.72rem',fontWeight:600,padding:'3px 9px',borderRadius:99,background:log.status==='present'?'#D1FAE5':'#FEE2E2',color:log.status==='present'?'#065F46':'#B91C1C' }}>{log.status}</span></td>
                    <td style={{ fontFamily:'monospace',fontSize:'.79rem',color:'#64748B' }}>{fmtTime(log.loginTime)}</td>
                    <td style={{ fontFamily:'monospace',fontSize:'.79rem',color:'#64748B' }}>{fmtTime(log.logoutTime)}</td>
                    <td style={{ fontWeight:700,color:'#6366F1' }}>
                      {log.workingMs>0 ? fmtMs(log.workingMs) : log.loginTime ? calcHours(log.loginTime,log.logoutTime) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Status badge helper
const getStatusBadge = status => {
  switch(status) {
    case 'online':  return { label:'🟢 Online',   bg:'#D1FAE5', color:'#065F46' };
    case 'afk':     return { label:'💤 AFK',       bg:'#FEF3C7', color:'#92400E' };
    case 'leave':   return { label:'🏖 On Leave',  bg:'#CFFAFE', color:'#0E7490' };
    default:        return { label:'⚫ Offline',   bg:'#F1F5F9', color:'#475569' };
  }
};

const S = {
  title: { fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em' },
  sub:   { fontSize:'.8rem', color:'#64748B', marginTop:4 },
  empty: { textAlign:'center', padding:'36px', color:'#94A3B8', fontSize:'.84rem' },
};

const Loader = () => (
  <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'#64748B', fontSize:'.88rem' }}>
    <span className="spinner" style={{ borderColor:'rgba(99,102,241,.2)', borderTopColor:'#6366F1' }} />
    Loading…
  </div>
);