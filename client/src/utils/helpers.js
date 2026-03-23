export const fmtTime = ts => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export const fmtDate = d => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// FIX: calcHours — sirf actual working time count karo
// Agar user currently online hai toh current time se calculate karo
// Agar logout ho gaya toh login→logout ke beech ka time
export const calcHours = (loginTime, logoutTime, isOnline = false) => {
  if (!loginTime) return '—';

  const login  = new Date(loginTime).getTime();
  const end    = logoutTime ? new Date(logoutTime).getTime() : (isOnline ? Date.now() : null);

  if (!end) return '0h 0m';

  const diff = end - login;
  if (diff <= 0) return '0h 0m';

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
};

// Format milliseconds to hours/minutes
export const fmtMs = ms => {
  if (!ms || ms <= 0) return '0h 0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const today = () => new Date().toISOString().slice(0, 10);

export const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444',
  '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6',
];

export const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];