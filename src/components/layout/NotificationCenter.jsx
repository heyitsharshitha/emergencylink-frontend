import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Button } from '../ui/forms';
import { LoadingState, EmptyState } from '../ui/feedback';
import { notificationApi } from '../../api/services';
import { useApp } from '../../context/AppContext';
import { useOnClickOutside } from '../../hooks';
import { timeAgo } from '../../utils/format';

export function NotificationItem({ n, onOpen }) {
  const icon = { NEW_REFERRAL: 'Siren', REFERRAL_ACCEPTED: 'CircleCheck', REFERRAL_DECLINED: 'CircleX', INFO_REQUESTED: 'MessageCircleQuestion', INFO_PROVIDED: 'MessageCircleReply', NEW_MESSAGE: 'MessageSquare' }[n.type] || 'Bell';
  return (
    <button className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => onOpen(n)}>
      {n.read ? <span style={{ width: 9, flex: 'none' }} /> : <span className="unread-dot" aria-label="Unread" />}
      <Icon name={icon} size={18} style={{ marginTop: 2, color: 'var(--teal-700)', flex: 'none' }} />
      <span className="grow"><span className="nt">{n.title}</span>{n.message && <span className="small muted" style={{ display: 'block' }}>{n.message}</span>}
        <span className="xs muted">{timeAgo(n.createdAt)}{n.referralCode ? ` · ${n.referralCode}` : ''}</span></span>
    </button>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: false, items: [], error: null });
  const ref = useRef(null);
  const { unread, refreshUnread } = useApp();
  const nav = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));

  const load = () => { setState((s) => ({ ...s, loading: true })); notificationApi.list(0, 8).then((p) => setState({ loading: false, items: p.content, error: null })).catch((e) => setState({ loading: false, items: [], error: e })); };
  useEffect(() => { if (open) load(); }, [open]);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) { try { await notificationApi.read(n.id); refreshUnread(); } catch { /* ignore */ } }
    if (n.referralId) nav(`/app/referrals/${n.referralId}`); else nav('/app/notifications');
  };
  const readAll = async () => { await notificationApi.readAll(); refreshUnread(); load(); };

  return (
    <div className="rel" ref={ref}>
      <button className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <Icon name="Bell" size={20} />{unread > 0 && <span className="count">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="popover" role="region" aria-label="Notifications">
          <div className="popover-head"><strong>Notifications</strong><Button size="sm" variant="ghost" onClick={readAll} disabled={!unread}>Mark all read</Button></div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {state.loading && <div style={{ padding: 16 }}><LoadingState card={false} rows={3} /></div>}
            {state.error && <p className="small" style={{ padding: 16, color: 'var(--danger)' }}>{state.error.message}</p>}
            {!state.loading && !state.error && state.items.length === 0 && <EmptyState icon="Bell" title="You're all caught up">New referrals, decisions and messages will appear here.</EmptyState>}
            {state.items.map((n) => <NotificationItem key={n.id} n={n} onOpen={openItem} />)}
          </div>
          <div style={{ padding: 10, textAlign: 'center', borderTop: '1px solid var(--border)' }}><Link to="/app/notifications" onClick={() => setOpen(false)}>View all notifications</Link></div>
        </div>
      )}
    </div>
  );
}
