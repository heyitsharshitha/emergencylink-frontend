import Icon from './Icon';
import { STATUS, URGENCY, timeAgo, fmtDateTime } from '../../utils/format';

export function Card({ title, actions, children, className = '', bodyClass = '', as: As = 'section', ...rest }) {
  return (
    <As className={`card ${className}`} {...rest}>
      {title && <div className="card-header"><h2>{title}</h2>{actions && <div className="row">{actions}</div>}</div>}
      {children !== undefined && <div className={`card-body ${bodyClass}`}>{children}</div>}
    </As>
  );
}

export function Badge({ tone = 'neutral', icon, children, title }) {
  return <span className={`badge ${tone}`} title={title}>{icon && <Icon name={icon} size={12} />}{children}</span>;
}

export const StatusBadge = ({ status }) => { const m = STATUS[status] || { label: status, tone: 'neutral', icon: 'Info' }; return <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>; };
export const UrgencyBadge = ({ urgency }) => { const m = URGENCY[urgency] || { label: urgency, tone: 'neutral', icon: 'Info' }; return <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>; };

export function Alert({ tone = 'info', title, children, actions, role }) {
  const icon = { info: 'Info', success: 'CheckCircle2', warning: 'TriangleAlert', danger: 'AlertCircle' }[tone];
  return (
    <div className={`alert ${tone}`} role={role || (tone === 'danger' ? 'alert' : 'status')}>
      <Icon name={icon} size={18} />
      <div className="grow">{title && <strong className="alert-title">{title}</strong>}<div>{children}</div>{actions && <div className="alert-actions">{actions}</div>}</div>
    </div>
  );
}

export function StatCard({ icon, tone, label, value, hint, to, as }) {
  const Comp = to ? as : 'div';
  const inner = (
    <>
      <div className={`stat-icon ${tone || ''}`}><Icon name={icon} size={20} /></div>
      <div><div className="stat-label">{label}</div><div className="stat-value">{value ?? '—'}</div>{hint && <div className="stat-hint">{hint}</div>}</div>
    </>
  );
  return Comp === 'div' ? <div className="card stat">{inner}</div> : <Comp to={to} className="card stat stat-link">{inner}</Comp>;
}

export function CapacityBar({ label, available, total, stale, unit, updatedAt }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  const cls = stale ? 'stale' : available === 0 ? 'none' : pct <= 20 ? 'low' : '';
  const state = available === 0 ? 'None available' : pct <= 20 ? 'Limited' : 'Available';
  return (
    <div className="cap">
      <div className="cap-top"><strong>{label}</strong><span><b>{available}</b> / {total} {unit} · {stale ? 'Needs confirmation' : state}</span></div>
      <div className="cap-track" role="img" aria-label={`${label}: ${available} of ${total} ${unit} available${stale ? ', data is stale' : ''}`}>
        <div className={`cap-fill ${cls}`} style={{ width: `${Math.max(pct, available > 0 ? 3 : 0)}%` }} />
      </div>
      {updatedAt !== undefined && <span className="xs muted">Updated {updatedAt ? `${timeAgo(updatedAt)} (${fmtDateTime(updatedAt)})` : 'never reported'}</span>}
    </div>
  );
}

export function Freshness({ updatedAt, stale, compact }) {
  if (!updatedAt) return <Badge tone="warning" icon="Clock3">No data reported</Badge>;
  return stale
    ? <Badge tone="warning" icon="Clock3" title={fmtDateTime(updatedAt)}>{compact ? 'Stale' : `Stale · updated ${timeAgo(updatedAt)}`}</Badge>
    : <Badge tone="success" icon="Check" title={fmtDateTime(updatedAt)}>{compact ? 'Fresh' : `Fresh · updated ${timeAgo(updatedAt)}`}</Badge>;
}

export function Tooltip({ text, children }) {
  return <span className="tip">{children}<span role="tooltip" className="tip-body">{text}</span></span>;
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map(([v, l, icon]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}>{icon && <Icon name={icon} />}{l}</button>
      ))}
    </div>
  );
}

export function SimNote({ children = 'Demonstration data: availability is simulated. In real use, confirm directly with the hospital.' }) {
  return <span className="sim-note"><Icon name="Info" size={13} />{children}</span>;
}
