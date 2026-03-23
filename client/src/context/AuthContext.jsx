import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('st_user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = localStorage.getItem('st_token');
      if (!t) { setLoading(false); return; }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('st_user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('st_token');
        localStorage.removeItem('st_user');
        setUser(null);
      } finally { setLoading(false); }
    })();
  }, []);

  // FIX: Send client's actual current time with login
  const login = useCallback(async (email, password) => {
    const clientTime = new Date().toISOString(); // actual device time
    const { data } = await api.post('/auth/login', { email, password, clientTime });
    localStorage.setItem('st_token', data.token);
    localStorage.setItem('st_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('st_token');
    localStorage.removeItem('st_user');
    setUser(null);
  }, []);

  const updateUser = useCallback(u => {
    setUser(u);
    localStorage.setItem('st_user', JSON.stringify(u));
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, isAdmin: !!user?.isAdmin, login, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);