import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useOnClickOutside } from '../../hooks';
import { ROLE_LABEL, initials } from '../../utils/format';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { setTourOpen } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));
  const close = () => setOpen(false);
  return (
    <div className="rel" ref={ref}>
      <button className="profile-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="avatar" aria-hidden="true">{initials(user.fullName)}</span>
        <span className="profile-meta" style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <span className="small" style={{ display: 'block', fontWeight: 650 }}>{user.fullName.replace(/\s*\(Demo\)/, '')}</span>
          <span className="xs muted">{ROLE_LABEL[user.role]}</span>
        </span>
        <Icon name="ChevronDown" size={14} />
      </button>
      {open && (
        <div className="popover sm" role="menu">
          <div className="popover-head" style={{ display: 'block' }}>
            <strong className="small">{user.fullName}</strong>
            <div className="xs muted">{user.email}</div>{user.hospitalName && <div className="xs muted">{user.hospitalName}</div>}
          </div>
          {user.hospitalId && <Link role="menuitem" className="menu-item" to={`/app/hospitals/${user.hospitalId}`} onClick={close}><Icon name="Building2" />My hospital profile</Link>}
          <Link role="menuitem" className="menu-item" to="/app/help" onClick={close}><Icon name="LifeBuoy" />Help &amp; documentation</Link>
          <button role="menuitem" className="menu-item" onClick={() => { close(); setTourOpen(true); }}><Icon name="Play" />Take the product tour</button>
          <button role="menuitem" className="menu-item danger" onClick={async () => { close(); await logout(); nav('/login', { replace: true }); }}><Icon name="LogOut" />Sign out</button>
        </div>
      )}
    </div>
  );
}
