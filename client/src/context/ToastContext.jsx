import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type = 'default', duration = 5000) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    // ERROR stays longer — 6 seconds, others 5 seconds
    const ms = type === 'error' ? 6000 : duration;
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);

  const toast = {
    success: m => add(m, 'success', 5000),
    error:   m => add(m, 'error',   6000),
    warn:    m => add(m, 'warn',    5000),
    info:    m => add(m, 'default', 5000),
  };

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}
            style={{ display:'flex', alignItems:'center', gap:10 }}>
            {t.type === 'success' && <span>✓</span>}
            {t.type === 'error'   && <span>✕</span>}
            {t.type === 'warn'    && <span>⚠</span>}
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);