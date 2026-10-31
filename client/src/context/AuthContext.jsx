import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler, tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While a saved token is being checked we do not know yet whether the user
  // is logged in, so protected pages wait instead of redirecting to /login.
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()));
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback((message = '') => {
    tokenStorage.clear();
    setUser(null);
    setSessionMessage(message);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout('Your session has ended. Please log in again.'));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // On page load, turn a saved token back into a logged-in user.
  useEffect(() => {
    if (!tokenStorage.get()) return undefined;
    let cancelled = false;
    authApi
      .me()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) tokenStorage.clear();
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(({ user: profile, token }) => {
    tokenStorage.set(token);
    setUser(profile);
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
    () => ({ user, initializing, sessionMessage, login, register, logout }),
    [user, initializing, sessionMessage, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
