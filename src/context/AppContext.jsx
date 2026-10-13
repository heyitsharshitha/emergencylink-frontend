import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationApi, publicApi } from '../api/services';
import { useAuth } from './AuthContext';
import { useLocalPref } from '../hooks';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

/** Shared application state: unread notifications, backend status, accessibility preferences, product tour. */
export function AppProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState({ loading: true, data: null, error: null });
  const [largeText, setLargeText] = useLocalPref('el_large_text', false);
  const [contrast, setContrast] = useLocalPref('el_high_contrast', false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDone, setTourDone] = useLocalPref('el_tour_done', false);

  useEffect(() => { document.documentElement.dataset.size = largeText ? 'large' : 'normal'; }, [largeText]);
  useEffect(() => { document.documentElement.dataset.contrast = contrast ? 'high' : 'normal'; }, [contrast]);

  const refreshUnread = useCallback(() => {
    if (!user) return;
    notificationApi.unread().then((r) => setUnread(r.unread)).catch(() => {});
  }, [user]);

  const refreshStatus = useCallback(() => {
    setStatus((s) => ({ ...s, loading: true }));
    publicApi.status().then((data) => setStatus({ loading: false, data, error: null })).catch((error) => setStatus({ loading: false, data: null, error }));
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);
  useEffect(() => {
    refreshUnread();
    if (!user) return undefined;
    const t = setInterval(refreshUnread, 30000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  const value = useMemo(() => ({
    unread, setUnread, refreshUnread, status, refreshStatus, largeText, setLargeText, contrast, setContrast,
    tourOpen, setTourOpen, tourDone, setTourDone,
  }), [unread, refreshUnread, status, refreshStatus, largeText, setLargeText, contrast, setContrast, tourOpen, tourDone, setTourDone]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
