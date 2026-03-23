import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime, fmtMs, today, daysAgo } from '../utils/helpers';

const TABS = [
  { key:'attendance', label:'Attendance' },
  { key:'eod',        label:'EOD Reports' },
  { key:'summary',    label:'Summary' },
];

const RANGES = [
  { label:'Last 7 days',  from: daysAgo(6),  to: today() },
  { label:'Last 30 days', from: daysAgo(29), to: today() },
  { label:'This month',   from: today().slice(0,7)+'-01', to: today() },
];

export default function MyHistory({ onClose }) {
  const { user } = useAuth();
  const toast    = useToast();
  const [tab,     setTab]     = useState('attendance');
  const [logs,    setLogs]    = useState([]);
  const [eods,    setEods]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [eodExp,  setEodExp]  = useState(null);
  const [attFilter, setAttFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const [att, eod] = await Promise.all([
          api.get(`/admin/attendance?userId=${user._id}`).catch(() => ({ data: { logs: [] } })),
          api.get('/eod/my'),
        ]);
        setLogs(att.data.logs || []);
        setEods(eod.data.eods || []);
      } catch { toast.error('Failed to load history'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filteredLogs = logs.filter(l => attFilter === 'all' || l.status === attFilter);
  const totalMs      = logs.reduce((s, l) => s + (l.workingMs || 0), 0);
  const presentDays  = logs.filter(l => l.status === 'present').length;
  const leaveDays    = logs.filter(l => l.status === 'leave').length;
  const avgMs        = presentDays > 0 ? totalMs / presentDays : 0;

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth:720, maxHeight:'90vh', padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.05rem', fontWeight:800, color:'var(--text-1)' }}>My History</div>
            <div style={{ fontSize:'.78rem', color:'var(--text-2)', marginTop:2 }}>{user.name} · {user.role || 'Team Member'}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding:'11px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'.82rem', fontWeight:600, color:tab===t.key?'var(--primary)':'var(--text-2)', borderBottom:`2px solid ${tab===t.key?'var(--primary)':'transparent'}`, marginBottom:-1, transition:'color .15s', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
          {loading ? (
            <div style={{ padding:'48px 0', display:'flex', alignItems:'center', gap:10, color:'var(--text-2)', justifyContent:'center' }}>
              <span className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'var(--primary)' }} /> Loading…
            </div>
          ) : (

            <>
              {/* ── Summary Tab ── */}
              {tab === 'summary' && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
                    {[
                      { label:'Days Present',      value:presentDays,     color:'#10B981' },
                      { label:'Days on Leave',     value:leaveDays,       color:'#F59E0B' },
                      { label:'Total Hours',       value:fmtMs(totalMs),  color:'#6366F1' },
                      { label:'Avg Daily Hours',   value:fmtMs(avgMs),    color:'#06B6D4' },
                      { label:'EOD Reports',       value:eods.length,     color:'#8B5CF6' },
                      { label:'Total Days Logged', value:logs.length,     color:'#EC4899' },
                    ].map(s => (
                      <div key={s.label} className="card" style={{ padding:'14px 16px', borderLeft:`3px solid ${s.color}` }}>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:800, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:'.72rem', color:'var(--text-2)', marginTop:3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly bar chart */}
                  {logs.slice(0,7).length > 0 && (
                    <div className="card" style={{ padding:'18px 20px' }}>
                      <div style={{ fontSize:'.76rem', fontWeight:700, color:'var(--text-2)', marginBottom:14, textTransform:'uppercase', letterSpacing:'.06em' }}>Last 7 Days</div>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:60 }}>
                        {logs.slice(0,7).reverse().map((l,i) => {
                          const pct = Math.min(((l.workingMs||0) / (9*3600000)) * 100, 100);
                          const h   = Math.floor((l.workingMs||0)/3600000);
                          const m   = Math.floor(((l.workingMs||0)%3600000)/60000);
                          return (
                            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                              <div style={{ fontSize:'.6rem', color:'var(--text-3)', fontWeight:600 }}>
                                {l.workingMs>0?`${h}h${m>0?m+'m':''}`:(l.status==='leave'?'L':'—')}
                              </div>
                              <div style={{ width:'100%', height:44, background:'var(--border-l)', borderRadius:5, overflow:'hidden', display:'flex', alignItems:'flex-end' }}>
                                <div style={{ width:'100%', height:`${Math.max(pct,l.status==='present'?4:0)}%`, background:l.status==='leave'?'#FDE68A':pct>=80?'#10B981':'#6366F1', borderRadius:'4px 4px 0 0', transition:'height .3s' }} />
                              </div>
                              <div style={{ fontSize:'.58rem', color:'var(--text-3)' }}>
                                {new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'}).slice(0,2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Attendance Tab ── */}
              {tab === 'attendance' && (
                <div>
                  <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                    {['all','present','leave'].map(f => (
                      <button key={f} className={`btn btn-sm ${attFilter===f?'btn-primary':'btn-outline'}`} onClick={() => setAttFilter(f)}>
                        {f==='all'?'All':f==='present'?'Present':'On Leave'}
                      </button>
                    ))}
                    <span style={{ alignSelf:'center', fontSize:'.78rem', color:'var(--text-2)' }}>{filteredLogs.length} records</span>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'36px 0', color:'var(--text-3)', fontSize:'.84rem' }}>No records found.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Hours</th></tr></thead>
                        <tbody>
                          {filteredLogs.map(l => (
                            <tr key={l._id}>
                              <td style={{ fontFamily:'monospace', fontSize:'.79rem', fontWeight:600 }}>{fmtDate(l.date)}</td>
                              <td style={{ fontSize:'.77rem', color:'var(--text-2)' }}>{new Date(l.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</td>
                              <td><span className={`badge ${l.status==='present'?'badge-online':l.status==='leave'?'badge-leave':'badge-offline'}`}>{l.status}</span></td>
                              <td style={{ fontFamily:'monospace', fontSize:'.78rem', color:'var(--text-2)' }}>{fmtTime(l.loginTime)}</td>
                              <td style={{ fontFamily:'monospace', fontSize:'.78rem', color:'var(--text-2)' }}>{fmtTime(l.logoutTime)}</td>
                              <td style={{ fontWeight:700, color:'var(--primary)', fontSize:'.81rem' }}>{l.workingMs>0?fmtMs(l.workingMs):'—'}</td>
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
                  {eods.length === 0
                    ? <div style={{ textAlign:'center', padding:'36px 0', color:'var(--text-3)', fontSize:'.84rem' }}>No EOD reports yet.</div>
                    : eods.map(eod => {
                    const open  = eodExp === eod._id;
                    const total = (eod.projects?.length||0)+(eod.completed?.length||0)+(eod.planned?.length||0);
                    return (
                      <div key={eod._id} className="card" style={{ marginBottom:10, overflow:'hidden', border:open?'1.5px solid var(--primary)':'1px solid var(--border)' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', cursor:'pointer', userSelect:'none' }}
                          onClick={() => setEodExp(open?null:eod._id)}>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'.84rem' }}>{fmtDate(eod.date)}</div>
                            <div style={{ fontSize:'.71rem', color:'var(--text-2)' }}>{new Date(eod.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:'.71rem', fontWeight:700, color:'var(--primary)', background:'var(--primary-l)', padding:'3px 8px', borderRadius:99 }}>{total} items</span>
                            <span style={{ color:'var(--text-3)', transition:'transform .2s', display:'inline-block', transform:open?'rotate(180deg)':'none' }}>▾</span>
                          </div>
                        </div>
                        {open && (
                          <div style={{ padding:'0 16px 14px', borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
                            {[['Projects',eod.projects],['Completed',eod.completed],['Planned',eod.planned]].map(([l,items]) =>
                              items?.length > 0 && (
                                <div key={l}>
                                  <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'.06em', margin:'12px 0 5px' }}>{l}</div>
                                  {items.map((it,i) => <div key={i} style={{ fontSize:'.78rem', paddingLeft:12, position:'relative', marginBottom:2 }}><span style={{ position:'absolute', left:0, color:'var(--primary)' }}>•</span>{it}</div>)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}