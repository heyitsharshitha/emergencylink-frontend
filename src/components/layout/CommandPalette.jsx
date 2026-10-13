import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Modal } from '../ui/feedback';
import { searchApi } from '../../api/services';
import { useDebounce } from '../../hooks';
import { StatusBadge } from '../ui/display';
import { navFor } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

/** Global quick search + navigation. Results come from scoped backend endpoints, so users only see records they may access. */
export default function CommandPalette({ open, onClose }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const dq = useDebounce(q, 280);
  const listRef = useRef(null);

  useEffect(() => { if (open) { setQ(''); setRes(null); setError(null); setIdx(0); } }, [open]);
  useEffect(() => {
    if (!open || dq.trim().length < 2) { setRes(null); return; }
    let live = true;
    setLoading(true); setError(null);
    searchApi.search(dq.trim()).then((r) => live && setRes(r)).catch((e) => live && setError(e)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [dq, open]);

  const items = useMemo(() => {
    const out = [];
    const needle = q.trim().toLowerCase();
    const pages = navFor(user).flatMap((g) => g.items.map((i) => ({ ...i, group: 'Go to' })));
    pages.filter((p) => !needle || p.label.toLowerCase().includes(needle)).slice(0, needle ? 4 : 8)
      .forEach((p) => out.push({ group: 'Go to', icon: p.icon, label: p.label, to: p.to }));
    (res?.referrals || []).forEach((r) => out.push({ group: 'Referrals', icon: 'FileText', label: `${r.referralCode} · ${r.emergencyCondition}`, sub: r.requiredSpecialty, badge: r.status, to: `/app/referrals/${r.id}` }));
    (res?.hospitals || []).forEach((h) => out.push({ group: 'Hospitals', icon: 'Building2', label: h.name, sub: h.city, to: `/app/hospitals/${h.id}` }));
    (res?.specialties || []).forEach((s) => out.push({ group: 'Specialties', icon: 'Stethoscope', label: s, sub: 'Show hospitals listing this specialty', to: `/app/network?specialty=${encodeURIComponent(s)}` }));
    (res?.facilities || []).forEach((s) => out.push({ group: 'Facilities', icon: 'Wrench', label: s, sub: 'Show hospitals with this facility', to: `/app/network?facility=${encodeURIComponent(s)}` }));
    return out;
  }, [q, res, user]);

  useEffect(() => { setIdx(0); }, [items.length]);
  const go = (it) => { onClose(); nav(it.to); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && items[idx]) { e.preventDefault(); go(items[idx]); }
  };
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [idx]);

  if (!open) return null;
  let lastGroup = null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd" role="dialog" aria-modal="true" aria-label="Quick search and navigation" onKeyDown={onKey}>
        <div className="cmd-input">
          <Icon name="Search" size={18} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search referral ID, hospital, specialty, facility…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="cmd-list" />
          {loading && <span className="spinner" aria-label="Searching" />}
        </div>
        <div className="cmd-list" id="cmd-list" role="listbox" ref={listRef}>
          {error && <p className="small" style={{ padding: 12, color: 'var(--danger)' }}>{error.message}</p>}
          {!loading && q.trim().length >= 2 && items.length === 0 && <p className="small muted" style={{ padding: 16 }}>No results for “{q}”.</p>}
          {items.map((it, i) => {
            const head = it.group !== lastGroup; lastGroup = it.group;
            return (
              <div key={`${it.group}-${i}`}>
                {head && <div className="cmd-group" role="presentation">{it.group}</div>}
                <button role="option" aria-selected={i === idx} className="cmd-item" onMouseEnter={() => setIdx(i)} onClick={() => go(it)}>
                  <Icon name={it.icon} size={16} style={{ color: 'var(--teal-700)' }} />
                  <span className="grow"><span style={{ fontWeight: 600 }} className="truncate">{it.label}</span>{it.sub && <span className="xs muted" style={{ display: 'block' }}>{it.sub}</span>}</span>
                  {it.badge && <StatusBadge status={it.badge} />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="cmd-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span className="muted">Results respect your role's access.</span></div>
      </div>
    </div>
  );
}
