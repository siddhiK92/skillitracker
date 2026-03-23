import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type = 'default') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const toast = {
    success: m => add(m, 'success'),
    error:   m => add(m, 'error'),
    warn:    m => add(m, 'warn'),
    info:    m => add(m, 'default'),
  };

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
