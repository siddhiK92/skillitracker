import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, today } from '../../utils/helpers';

export default function AdminEOD() {
  const toast = useToast();
  const [eods,    setEods]    = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [date,    setDate]    = useState(today());
  const [userId,  setUserId]  = useState('');
  const [search,  setSearch]  = useState('');
  const [expand,  setExpand]  = useState(null);

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data.users)).catch(() => {});
    load();
  }, []);

  const load = async (d=date, u=userId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (d) params.append('date', d);
      if (u) params.append('userId', u);
      const { data } = await api.get(`/admin/eod?${params}`);
      setEods(data.eods);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const filtered = eods.filter(e =>
    (e.user?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.title}>EOD Reports</h1>
        <p style={S.sub}>All end-of-day submissions from the team</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={S.label}>Date</label>
            <input type="date" className="input" value={date} max={today()} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Member</label>
            <select className="input" value={userId} onChange={e => setUserId(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">All Members</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => load(date, userId)}>Apply</button>
            <button className="btn btn-outline" onClick={() => { setDate(today()); setUserId(''); load(today(), ''); }}>Clear</button>
          </div>
        </div>
      </div>

      {/* Search + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <input className="input" style={{ flex: 1, maxWidth: 300 }} placeholder="Search member…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 500 }}>
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* EOD Cards */}
      {loading ? <Loader /> : filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
          No EOD reports found for this filter.
        </div>
      ) : filtered.map(eod => {
        const u     = eod.user || {};
        const open  = expand === eod._id;
        const total = (eod.projects?.length || 0) + (eod.completed?.length || 0) + (eod.planned?.length || 0);

        return (
          <div key={eod._id} className="card"
            style={{ marginBottom: 10, overflow: 'hidden', border: open ? '1.5px solid var(--primary)' : '1px solid var(--border)', transition: 'border-color .15s' }}>

            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setExpand(open ? null : eod._id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: u.color || avatarColor(u.name || ''), display: 'grid', placeItems: 'center', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '.74rem', color: '#fff', flexShrink: 0 }}>
                  {initials(u.name || '?')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{u.name || 'Unknown'}</div>
                  <div style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{u.role || 'Team Member'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: '.73rem', color: 'var(--text-2)', background: 'var(--bg)', padding: '3px 9px', borderRadius: 99, border: '1px solid var(--border)' }}>
                  {new Date(eod.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
                <span style={{ fontSize: '.71rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-l)', padding: '3px 9px', borderRadius: 99 }}>
                  {total} items
                </span>
                <span style={{ color: 'var(--text-3)', transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
              </div>
            </div>

            {/* Card body */}
            {open && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                {[['Projects', eod.projects], ['Completed', eod.completed], ['Planned', eod.planned]].map(([l, items]) =>
                  items?.length > 0 && (
                    <div key={l}>
                      <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '14px 0 6px' }}>{l}</div>
                      {items.map((it, i) => (
                        <div key={i} style={{ fontSize: '.79rem', paddingLeft: 13, position: 'relative', marginBottom: 3, color: 'var(--text-1)' }}>
                          <span style={{ position: 'absolute', left: 0, color: 'var(--primary)', fontWeight: 700 }}>•</span>{it}
                        </div>
                      ))}
                    </div>
                  )
                )}
                <div style={{ gridColumn: '1/-1', paddingTop: 10, marginTop: 6, borderTop: '1px solid var(--border)', fontSize: '.71rem', color: 'var(--text-3)' }}>
                  Submitted at {new Date(eod.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const S = {
  title: { fontFamily: 'Outfit,sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' },
  sub:   { fontSize: '.8rem', color: 'var(--text-2)', marginTop: 4 },
  label: { display: 'block', fontSize: '.76rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 5 },
};
const Loader = () => (
  <div style={{ padding: '48px 0', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', fontSize: '.88rem' }}>
    <span className="spinner" style={{ borderColor: 'rgba(79,70,229,.2)', borderTopColor: 'var(--primary)' }} />Loading…
  </div>
);
