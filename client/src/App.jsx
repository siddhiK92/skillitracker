import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login    from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminLayout   from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers    from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminEOD      from './pages/admin/AdminEOD';

const Loading = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', gap:12, color:'#64748B', fontFamily:'DM Sans,sans-serif' }}>
    <div className="spinner" style={{ borderColor:'rgba(79,70,229,.2)', borderTopColor:'#4F46E5' }} />
    Loading…
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spinner{display:inline-block;width:20px;height:20px;border:2.5px solid;border-radius:50%;animation:spin .6s linear infinite}`}</style>
  </div>
);

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminGuard({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Loading />;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function PublicGuard({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"    element={<PublicGuard><Login /></PublicGuard>} />
            <Route path="/register" element={<PublicGuard><Register /></PublicGuard>} />
            <Route path="/"         element={<Guard><Dashboard /></Guard>} />
            <Route path="/admin"    element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index              element={<AdminOverview />} />
              <Route path="users"       element={<AdminUsers />} />
              <Route path="users/:id"   element={<AdminUserDetail />} />
              <Route path="attendance"  element={<AdminAttendance />} />
              <Route path="eod"         element={<AdminEOD />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
