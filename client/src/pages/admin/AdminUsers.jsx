import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, calcHours } from '../../utils/helpers';

export default function AdminUsers() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const load = async () => {
    try { const { data } = await api.get('/admin/users'); setUsers(data.users); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async u => {
    try { await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive }); toast.success(u.isActive?'Deactivated':'Activated'); load(); }
    catch { toast.error('Failed'); }
  };

  const del = async u => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${u._id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const override = async (uid, status) => {
    try { await api.patch(`/admin/users/${uid}/status`, { status }); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || (u.role||'').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' || u.status === filter;
    return ms && mf;
  });

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={S.title}>User Management</h1>
          <p style={S.sub}>{users.length} total members</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input className="input" style={{ flex:1, maxWidth:300 }} placeholder="Search name, email or role…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={{ display:'flex', gap:6 }}>
          {['all','online','offline','leave'].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline'}`} onClick={()=>setFilter(f)}>
              {f==='all'?'All':f==='online'?'Online':f==='offline'?'Offline':'On Leave'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Member</th><th>Status</th><th>Today's Hours</th><th>Account</th><th>Override</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign:'center', padding:36, color:'var(--text-3)' }}>No users found.</td></tr>
                : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ position:'relative' }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:u.color||avatarColor(u.name), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.74rem', color:'#fff' }}>{initials(u.name)}</div>
                        <span className={`dot dot-${u.status}`} style={{ position:'absolute', bottom:-1, right:-1, border:'2px solid #fff' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'.84rem', display:'flex', alignItems:'center', gap:6 }}>
                          {u.name}
                          {u.isAdmin && <span style={{ fontSize:'.62rem', background:'#EDE9FE', color:'#6D28D9', padding:'1px 6px', borderRadius:99, fontWeight:700 }}>Admin</span>}
                        </div>
                        <div style={{ fontSize:'.71rem', color:'var(--text-2)' }}>{u.email} · {u.role||'Team Member'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${u.status}`}>{u.status==='online'?'Online':u.status==='leave'?'On Leave':'Offline'}</span></td>
                  <td style={{ fontWeight:700, color:'var(--primary)' }}>{u.loginTime ? calcHours(u.loginTime, u.logoutTime) : '—'}</td>
                  <td><span className={`badge ${u.isActive?'badge-online':'badge-offline'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                  <td>
                    <select className="input" style={{ padding:'4px 8px', fontSize:'.78rem', width:'auto' }}
                      value={u.status} onChange={e => override(u._id, e.target.value)}>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="leave">On Leave</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/users/${u._id}`)}>View</button>
                      <button className={`btn btn-sm ${u.isActive?'btn-amber':'btn-success'}`} onClick={() => toggle(u)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const S = {
  title: { fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.03em' },
  sub:   { fontSize:'.8rem', color:'var(--text-2)', marginTop:4 },
};
const Loader = () => <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'var(--text-2)', fontSize:'.88rem' }}><span className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'var(--primary)' }} />Loading…</div>;
