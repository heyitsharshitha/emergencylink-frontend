import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { TOKEN_KEY } from '../api/client';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
const USER_KEY = 'el_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });
  const [ready, setReady] = useState(!localStorage.getItem(TOKEN_KEY));

  const clear = useCallback(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); }, []);
  const persist = useCallback((res) => { localStorage.setItem(TOKEN_KEY, res.token); localStorage.setItem(USER_KEY, JSON.stringify(res.user)); setUser(res.user); return res.user; }, []);

  // Validate any stored session once on load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.me().then((u) => { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u); }).catch(() => clear()).finally(() => setReady(true));
  }, [clear]);

  useEffect(() => { const h = () => clear(); window.addEventListener('el:unauthorized', h); return () => window.removeEventListener('el:unauthorized', h); }, [clear]);

  const login = useCallback(async (email, password) => persist(await authApi.login({ email, password })), [persist]);
  const register = useCallback(async (body) => persist(await authApi.register(body)), [persist]);
  const logout = useCallback(async () => { try { await authApi.logout(); } catch { /* token may already be invalid */ } clear(); }, [clear]);

  const value = useMemo(() => ({
    user, ready, login, register, logout,
    isAdmin: user?.role === 'ADMIN', isReferring: user?.role === 'REFERRING_HOSPITAL', isReceiving: user?.role === 'RECEIVING_HOSPITAL',
  }), [user, ready, login, register, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
