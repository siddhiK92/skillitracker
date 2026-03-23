import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { initials, avatarColor, fmtTime, calcHours, today, daysAgo } from '../../utils/helpers';

const RANGES = [
  { label:'Today',       from:today(),     to:today() },
  { label:'Yesterday',   from:daysAgo(1),  to:daysAgo(1) },
  { label:'Last 7 days', from:daysAgo(6),  to:today() },
  { label:'Last 30 days',from:daysAgo(29), to:today() },
];

export default function AdminAttendance() {
  const toast = useToast();
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [from,    setFrom]    = useState(today());
  const [to,      setTo]      = useState(today());
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('all');

  const load = async (f=from, t=to) => {
    setLoading(true);
    try { const { data } = await api.get(`/admin/attendance?from=${f}&to=${t}`); setLogs(data.logs); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l => {
    const nm = (l.user?.name||'').toLowerCase().includes(search.toLowerCase());
    const sf = status === 'all' || l.status === status;
    return nm && sf;
  });

  const fmtMs = ms => ms > 0 ? `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m` : '—';

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <h1 style={S.title}>Attendance Report</h1>
        <p style={S.sub}>Filter by date range to view attendance history</p>
      </div>

      {/* Quick range + date picker */}
      <div className="card" style={{ padding:'18px 20px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          {RANGES.map(r => (
            <button key={r.label} className={`btn btn-sm ${from===r.from&&to===r.to?'btn-primary':'btn-outline'}`}
              onClick={() => { setFrom(r.from); setTo(r.to); load(r.from,r.to); }}>{r.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
          <div><label style={S.label}>From</label><input type="date" className="input" value={from} max={to} onChange={e=>setFrom(e.target.value)} /></div>
          <span style={{ paddingBottom:8, color:'var(--text-3)' }}>—</span>
          <div><label style={S.label}>To</label><input type="date" className="input" value={to} min={from} max={today()} onChange={e=>setTo(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => load()}>Apply</button>
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding:'14px 22px', marginBottom:16, display:'flex', gap:0 }}>
        {[['Total',logs.length],['Present',logs.filter(l=>l.status==='present').length],['On Leave',logs.filter(l=>l.status==='leave').length]].map(([l,v],i) => (
          <div key={l} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, borderRight:i<2?'1px solid var(--border)':'none' }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.45rem', fontWeight:800, color:i===1?'var(--green)':i===2?'var(--amber)':'var(--text-1)' }}>{v}</div>
            <div style={{ fontSize:'.72rem', color:'var(--text-2)', fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <input className="input" style={{ flex:1, maxWidth:280 }} placeholder="Search member…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={{ display:'flex', gap:6 }}>
          {['all','present','leave'].map(s => (
            <button key={s} className={`btn btn-sm ${status===s?'btn-primary':'btn-outline'}`} onClick={()=>setStatus(s)}>
              {s==='all'?'All':s==='present'?'Present':'On Leave'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Member</th><th>Date</th><th>Status</th><th>Login</th><th>Logout</th><th>Hours</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign:'center', padding:36, color:'var(--text-3)' }}>No records found.</td></tr>
                : filtered.map(l => {
                const u = l.user || {};
                return (
                  <tr key={l._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:u.color||avatarColor(u.name||''), display:'grid', placeItems:'center', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'.72rem', color:'#fff' }}>{initials(u.name||'?')}</div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'.83rem' }}>{u.name||'Unknown'}</div>
                          <div style={{ fontSize:'.71rem', color:'var(--text-2)' }}>{u.role||'Team Member'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>
                      {new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </td>
                    <td><span className={`badge ${l.status==='present'?'badge-online':l.status==='leave'?'badge-leave':'badge-offline'}`}>{l.status}</span></td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(l.loginTime)}</td>
                    <td style={{ fontFamily:'monospace', fontSize:'.79rem', color:'var(--text-2)' }}>{fmtTime(l.logoutTime)}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{l.workingMs>0?fmtMs(l.workingMs):l.loginTime?calcHours(l.loginTime,l.logoutTime):'—'}</td>
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

const S = {
  title: { fontFamily:'Outfit,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.03em' },
  sub:   { fontSize:'.8rem', color:'var(--text-2)', marginTop:4 },
  label: { display:'block', fontSize:'.76rem', fontWeight:600, color:'var(--text-1)', marginBottom:5 },
};
const Loader = () => <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'var(--text-2)', fontSize:'.88rem' }}><span className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'var(--primary)' }} />Loading…</div>;
