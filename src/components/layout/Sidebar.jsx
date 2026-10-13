import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

/** Every item leads to a real page. Items are filtered by the signed-in role. */
export function navFor(user) {
  const r = user?.role;
  const hospital = r !== 'ADMIN';
  return [
    { group: 'Overview', items: [{ to: '/app', label: 'Dashboard', icon: 'LayoutDashboard', end: true }] },
    { group: 'Referrals', items: [
      { to: '/app/referrals', label: r === 'RECEIVING_HOSPITAL' ? 'Incoming referrals' : 'Referrals', icon: 'FileText', end: true },
      ...(r === 'REFERRING_HOSPITAL' ? [{ to: '/app/referrals/new', label: 'New referral', icon: 'FilePlus2' }] : []),
    ] },
    { group: 'Hospital network', items: [
      { to: '/app/network', label: 'Emergency network', icon: 'Network' },
      { to: '/app/resources', label: 'Resource availability', icon: 'Gauge' },
    ] },
    { group: 'Communication', items: [
      { to: '/app/messages', label: 'Messages', icon: 'MessageSquare' },
      { to: '/app/notifications', label: 'Notifications', icon: 'Bell', badge: true },
    ] },
    { group: 'Insight', items: [
      { to: '/app/analytics', label: 'Analytics', icon: 'BarChart3' },
      { to: '/app/assistant', label: 'AI coordination assistant', icon: 'Bot' },
    ] },
    ...(r === 'ADMIN' ? [{ group: 'Administration', items: [{ to: '/app/admin', label: 'Administration', icon: 'ShieldCheck' }] }] : []),
    { group: 'Support', items: [
      { to: '/app/help', label: 'Help & documentation', icon: 'LifeBuoy' },
      { to: '/app/status', label: 'System status', icon: 'Server' },
    ] },
  ].filter((g) => g.items.length && (hospital || true));
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const { unread } = useApp();
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <nav>
        {navFor(user).map((g) => (
          <div key={g.group}>
            <div className="nav-group-title">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onNavigate} title={it.label}>
                <Icon name={it.icon} size={18} /><span className="nav-label">{it.label}</span>
                {it.badge && unread > 0 && <span className="nav-badge" aria-label={`${unread} unread`}>{unread}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot nav-label"><strong>Staff decide.</strong> Scores and availability support, but never replace, clinical judgement.</div>
    </aside>
  );
}
