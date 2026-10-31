import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler, tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While a saved token is being checked we do not know yet whether the user
  // is logged in, so protected pages wait instead of redirecting to /login.
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()));
  // Set when the session check failed for a reason other than a bad token
  // (server down, network error). The token is kept so the user can retry.
  const [sessionError, setSessionError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback((message = '') => {
    tokenStorage.clear();
    setUser(null);
    setSessionError('');
    setSessionMessage(message);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout('Your session has ended. Please log in again.'));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Turns a saved token back into a logged-in user (on page load and on retry).
  // A 401 is handled by the axios interceptor, which clears the token.
  const restoreSession = useCallback(async (isCancelled = () => false) => {
    if (!tokenStorage.get()) {
      setInitializing(false);
      return;
    }
    setInitializing(true);
    setSessionError('');
    try {
      const profile = await authApi.me();
      if (!isCancelled()) setUser(profile);
    } catch (err) {
      if (!isCancelled() && err.response?.status !== 401) {
        setSessionError('We could not reach the server to restore your session.');
      }
    } finally {
      if (!isCancelled()) setInitializing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    restoreSession(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  const startSession = useCallback(({ user: profile, token }) => {
    tokenStorage.set(token);
    setUser(profile);
    setSessionError('');
    setSessionMessage('');
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await authApi.login(credentials)),
    [startSession]
  );

  const register = useCallback(
    async (details) => startSession(await authApi.register(details)),
    [startSession]
  );

  const value = useMemo(
    () => ({
      user,
      initializing,
      sessionError,
      sessionMessage,
      login,
      register,
      logout,
      retrySession: () => restoreSession(),
    }),
    [user, initializing, sessionError, sessionMessage, login, register, logout, restoreSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
