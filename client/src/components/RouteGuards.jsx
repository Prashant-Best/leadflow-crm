import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

// Only logged-in users can see the pages inside. Others go to /login and
// come back to the page they wanted after logging in.
export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner fullPage label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// Login and register pages are skipped when the user is already logged in.
export function PublicOnlyRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <Spinner fullPage label="Checking your session…" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
