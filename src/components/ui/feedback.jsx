import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { Button } from './forms';
import { Alert } from './display';

export function Skeleton({ h = 14, w = '100%', style }) { return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden="true" />; }

export function LoadingState({ rows = 4, label = 'Loading…', card = true }) {
  const body = (
    <div className="stack-sm" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} h={i === 0 ? 20 : 14} w={i === 0 ? '40%' : `${90 - i * 8}%`} />)}
    </div>
  );
  return card ? <div className="card card-body">{body}</div> : body;
}

export function EmptyState({ icon = 'Inbox', title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-art"><Icon name={icon} size={40} strokeWidth={1.4} /></div>
      <h3>{title}</h3>{children && <p>{children}</p>}{action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this' }) {
  return (
    <Alert tone="danger" title={title} actions={onRetry && <Button size="sm" variant="secondary" icon="RefreshCw" onClick={onRetry}>Try again</Button>}>
      {error?.message || 'Something went wrong.'}
    </Alert>
  );
}

/** Convenience wrapper: shows skeleton, error, or children(data). */
export function Async({ state, children, rows, empty }) {
  if (state.loading && !state.data) return <LoadingState rows={rows} />;
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data == null) return empty || null;
  return children(state.data);
}

export function Modal({ open, onClose, title, children, footer, wide, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const list = [...f].filter((el) => !el.disabled);
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    setTimeout(() => ref.current?.querySelector('input, textarea, select, .btn-primary, .btn-danger')?.focus(), 30);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        <div className="modal-head"><h2 id={labelledBy} style={{ fontSize: 'var(--fs-lg)' }}>{title}</h2><Button variant="ghost" size="sm" icon="X" aria-label="Close dialog" onClick={onClose} /></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmation for consequential actions. Optionally collects a note (required or optional). */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, busy, noteLabel, noteRequired, notePlaceholder, children }) {
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setNote(''); setTouched(false); } }, [open]);
  const invalid = noteLabel && noteRequired && !note.trim();
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={() => { setTouched(true); if (!invalid) onConfirm(note.trim() || undefined); }}>{confirmLabel}</Button></>}>
      <div className="stack">
        {message && <p className="muted">{message}</p>}
        {children}
        {noteLabel && (
          <div className="field">
            <label htmlFor="confirm-note">{noteLabel}{noteRequired && <span className="req" aria-hidden="true">*</span>}</label>
            <textarea id="confirm-note" className="textarea" value={note} maxLength={1000} placeholder={notePlaceholder} aria-invalid={touched && invalid ? true : undefined}
              onChange={(e) => setNote(e.target.value)} />
            {touched && invalid && <span className="field-error" role="alert">This field is required.</span>}
          </div>
        )}
      </div>
    </Modal>
  );
}

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), type === 'error' ? 7000 : 4500);
  }, [remove]);
  const api = useRef({}).current;
  api.success = (m) => push('success', m); api.error = (m) => push('error', m); api.info = (m) => push('info', m); api.warning = (m) => push('warning', m);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <Icon name={t.type === 'success' ? 'CheckCircle2' : t.type === 'error' ? 'AlertCircle' : t.type === 'warning' ? 'TriangleAlert' : 'Info'} size={18} />
            <span>{t.message}</span>
            <button aria-label="Dismiss notification" onClick={() => remove(t.id)}><Icon name="X" size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
