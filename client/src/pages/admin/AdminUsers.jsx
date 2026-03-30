import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, calcHours } from '../../utils/helpers';

export default function AdminUsers() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [users,    setUsers]    = useState([]);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [activeTab,setActiveTab]= useState('approved'); // 'approved' | 'pending'

  const load = async () => {
    try {
      const [u, p] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/users/pending'),
      ]);
      setUsers(u.data.users.filter(u => u.isApproved));
      setPending(p.data.users);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async u => {
    try {
      await api.patch(`/admin/users/${u._id}/approve`);
      toast.success(`✅ ${u.name} approved!`);
      load();
    } catch { toast.error('Failed'); }
  };

  const reject = async u => {
    if (!confirm(`Reject ${u.name}? This will delete their account.`)) return;
    try {
      await api.patch(`/admin/users/${u._id}/reject`);
      toast.success('User rejected');
      load();
    } catch { toast.error('Failed'); }
  };

  const toggle = async u => {
    try {
      await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Deactivated' : 'Activated');
      load();
    } catch { toast.error('Failed'); }
  };

  const del = async u => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const override = async (uid, status) => {
    try { await api.patch(`/admin/users/${uid}/status`, { status }); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.role||'').toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' || u.status === filter;
    return ms && mf;
  });

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={S.title}>User Management</h1>
          <p style={S.sub}>{users.length} approved · {pending.length} pending approval</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <button
          onClick={() => setActiveTab('approved')}
          style={{ ...S.tabBtn, background:activeTab==='approved'?'#6366F1':'#fff', color:activeTab==='approved'?'#fff':'#64748B', border:`1.5px solid ${activeTab==='approved'?'#6366F1':'#E2E8F0'}` }}>
          ✅ Approved Members ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          style={{ ...S.tabBtn, background:activeTab==='pending'?'#F59E0B':'#fff', color:activeTab==='pending'?'#fff':'#64748B', border:`1.5px solid ${activeTab==='pending'?'#F59E0B':'#E2E8F0'}`, position:'relative' }}>
          ⏳ Pending Approval ({pending.length})
          {pending.length > 0 && (
            <span style={{ position:'absolute', top:-6, right:-6, width:18, height:18, background:'#EF4444', borderRadius:'50%', fontSize:'.65rem', fontWeight:700, color:'#fff', display:'grid', placeItems:'center' }}>{pending.length}</span>
          )}
        </button>
      </div>

      {/* ── Pending Approval Tab ── */}
      {activeTab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="card" style={{ padding:48, textAlign:'center', color:'#94A3B8' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
              <div style={{ fontWeight:600, color:'#64748B' }}>No pending approvals!</div>
              <div style={{ fontSize:'.82rem', marginTop:6 }}>All registration requests have been reviewed.</div>
            </div>
          ) : pending.map(u => (
            <div key={u._id} className="card" style={{ padding:'18px 22px', marginBottom:12, border:'1.5px solid #FDE68A' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background: u.color||avatarColor(u.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.85rem', color:'#fff' }}>
                    {initials(u.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0F172A' }}>{u.name}</div>
                    <div style={{ fontSize:'.78rem', color:'#64748B' }}>{u.email}</div>
                    {u.phone && <div style={{ fontSize:'.75rem', color:'#94A3B8' }}>📱 +91 {u.phone}</div>}
                    <div style={{ fontSize:'.72rem', color:'#94A3B8', marginTop:2 }}>
                      Registered {new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={() => approve(u)}
                    style={{ padding:'9px 18px', background:'#10B981', color:'#fff', border:'none', borderRadius:9, fontWeight:700, cursor:'pointer', fontSize:'.84rem' }}>
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => reject(u)}
                    style={{ padding:'9px 18px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', borderRadius:9, fontWeight:600, cursor:'pointer', fontSize:'.84rem' }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Approved Users Tab ── */}
      {activeTab === 'approved' && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <input className="input" style={{ flex:1, maxWidth:300 }} placeholder="Search name, email or role…"
              value={search} onChange={e=>setSearch(e.target.value)} />
            <div style={{ display:'flex', gap:6 }}>
              {['all','online','offline','leave','afk'].map(f => (
                <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline'}`} onClick={()=>setFilter(f)}>
                  {f==='all'?'All':f==='online'?'Online':f==='offline'?'Offline':f==='leave'?'On Leave':'AFK'}
                </button>
              ))}
            </div>
          </div>

          {loading ? <Loader /> : (
            <div className="card table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Member</th><th>Status</th><th>Today's Hours</th><th>Account</th><th>Override</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign:'center', padding:36, color:'#94A3B8' }}>No users found.</td></tr>
                    : filtered.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ position:'relative' }}>
                            <div style={{ width:36, height:36, borderRadius:10, background:u.color||avatarColor(u.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.74rem', color:'#fff' }}>{initials(u.name)}</div>
                            <span style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:u.status==='online'?'#10B981':u.status==='afk'?'#F59E0B':u.status==='leave'?'#F59E0B':'#EF4444', border:'2px solid #fff' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'.84rem', display:'flex', alignItems:'center', gap:5 }}>
                              {u.name}
                              {u.isAdmin && <span style={{ fontSize:'.62rem', background:'#EDE9FE', color:'#6D28D9', padding:'1px 6px', borderRadius:99, fontWeight:700 }}>Admin</span>}
                            </div>
                            <div style={{ fontSize:'.71rem', color:'#64748B' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:99, fontSize:'.72rem', fontWeight:600,
                          background:u.status==='online'?'#D1FAE5':u.status==='afk'?'#FEF3C7':u.status==='leave'?'#FEF3C7':'#FEE2E2',
                          color:u.status==='online'?'#065F46':u.status==='afk'?'#92400E':u.status==='leave'?'#92400E':'#B91C1C' }}>
                          {u.status==='online'?'🟢 Online':u.status==='afk'?'💤 AFK':u.status==='leave'?'🏖 On Leave':'⚫ Offline'}
                        </span>
                      </td>
                      <td style={{ fontWeight:700, color:'#6366F1' }}>{u.loginTime ? calcHours(u.loginTime, u.logoutTime) : '—'}</td>
                      <td><span style={{ fontSize:'.72rem', fontWeight:600, padding:'3px 9px', borderRadius:99, background:u.isActive?'#D1FAE5':'#FEE2E2', color:u.isActive?'#065F46':'#B91C1C' }}>{u.isActive?'Active':'Inactive'}</span></td>
                      <td>
                        <select className="input" style={{ padding:'4px 8px', fontSize:'.78rem', width:'auto' }}
                          value={u.status} onChange={e=>override(u._id,e.target.value)}>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="leave">On Leave</option>
                          <option value="afk">AFK</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-outline btn-sm" onClick={()=>navigate(`/admin/users/${u._id}`)}>View</button>
                          <button className={`btn btn-sm ${u.isActive?'btn-amber':'btn-success'}`} onClick={()=>toggle(u)}>{u.isActive?'Deactivate':'Activate'}</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>del(u)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const S = {
  title:  { fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'#0F172A', letterSpacing:'-0.03em' },
  sub:    { fontSize:'.8rem', color:'#64748B', marginTop:4 },
  tabBtn: { padding:'9px 18px', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:'.84rem', fontWeight:600, cursor:'pointer', transition:'all .15s' },
};

const Loader = () => (
  <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'#64748B', fontSize:'.88rem' }}>
    <span className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'#6366F1' }} />Loading…
  </div>
);