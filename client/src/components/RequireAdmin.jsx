import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Client-side gate mirroring middleware/requireAdmin.js's behavior, purely
// for UX (instant redirect instead of a flash of protected content) — the
// real enforcement is server-side on every /api/admin/* route.
export default function RequireAdmin({ children }) {
  const { isAdmin, checking } = useAuth();
  const location = useLocation();

  if (checking) return null;
  if (!isAdmin) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
}
