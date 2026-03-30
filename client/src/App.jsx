import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login    from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminLayout      from './pages/admin/AdminLayout';
import AdminOverview    from './pages/admin/AdminOverview';
import AdminUsers       from './pages/admin/AdminUsers';
import AdminUserDetail  from './pages/admin/AdminUserDetail';
import AdminAttendance  from './pages/admin/AdminAttendance';
import AdminEOD         from './pages/admin/AdminEOD';

// ── Spinner ──
const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', gap:12, color:'#64748B', fontFamily:'DM Sans,sans-serif' }}>
    <div style={{ width:20, height:20, border:'2.5px solid #E2E8F0', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin .6s linear infinite' }} />
    Loading…
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ── Guards — MUST be inside AuthProvider ──
function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminGuard({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
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

// ── Routes — PublicGuard is INSIDE AuthProvider ──
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicGuard><Login /></PublicGuard>} />
      <Route path="/register" element={<PublicGuard><Register /></PublicGuard>} />
      <Route path="/"         element={<Guard><Dashboard /></Guard>} />
      <Route path="/admin"    element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index               element={<AdminOverview />} />
        <Route path="users"        element={<AdminUsers />} />
        <Route path="users/:id"    element={<AdminUserDetail />} />
        <Route path="attendance"   element={<AdminAttendance />} />
        <Route path="eod"          element={<AdminEOD />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── App — AuthProvider wraps everything ──
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}