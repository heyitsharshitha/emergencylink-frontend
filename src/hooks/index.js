import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

/** Loads data with loading / error / reload handling. Ignores results from stale requests. */
export function useFetch(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const seq = useRef(0);
  const run = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (id === seq.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === seq.current) setState((s) => ({ data: silent ? s.data : null, loading: false, error }));
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (enabled) run(); else setState({ data: null, loading: false, error: null }); }, [run, enabled]);
  return { ...state, reload: run, refresh: () => run(true) };
}

/** useState that survives navigation within the browser session (used for saved referral filters). */
export function useSessionState(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

/** Prevents duplicate submissions: wraps an async action with a busy flag. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const run = useCallback(async (fn) => {
    if (lock.current) return undefined;
    lock.current = true; setBusy(true);
    try { return await fn(); } finally { lock.current = false; setBusy(false); }
  }, []);
  return [busy, run];
}

export function useLocalPref(key, initial) {
  const [v, setV] = useState(() => { try { const r = localStorage.getItem(key); return r == null ? initial : JSON.parse(r); } catch { return initial; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const l = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(e); };
    const k = (e) => { if (e.key === 'Escape') handler(e); };
    document.addEventListener('mousedown', l); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', l); document.removeEventListener('keydown', k); };
  }, [ref, handler]);
}
