import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from './ui';

function SessionError() {
  const { sessionError, retrySession, logout } = useAuth();
  return (
    <div className="session-error">
      <Alert onRetry={retrySession}>{sessionError}</Alert>
      <button type="button" className="btn btn--ghost" onClick={() => logout()}>
        Log in again instead
      </button>
    </div>
  );
}

// Only logged-in users can see the pages inside. Others go to /login and
// come back to the page they wanted after logging in.
export function ProtectedRoute() {
  const { user, initializing, sessionError } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner fullPage label="Checking your session…" />;
  if (sessionError) return <SessionError />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// Login and register pages are skipped when the user is already logged in.
// This is also what moves the user on after a successful login or register.
export function PublicOnlyRoute() {
  const { user, initializing, sessionError } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner fullPage label="Checking your session…" />;
  if (sessionError) return <SessionError />;
  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;
  return <Outlet />;
}
