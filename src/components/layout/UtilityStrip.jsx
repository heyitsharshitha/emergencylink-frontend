import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/format';

export default function UtilityStrip() {
  const { status, largeText, setLargeText, contrast, setContrast } = useApp();
  const { user } = useAuth();
  const base = user ? '/app' : '';
  const last = status.data?.lastResourceUpdate;
  return (
    <div className="utility">
      <div className="utility-in">
        <div className="row wrap" style={{ gap: 14 }}>
          <span className="hide-sm">Emergency healthcare referral coordination</span>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="hide-sm" title="Most recent resource update reported by any hospital">
            <Icon name="Clock" size={12} /> Resources last updated: {status.data ? (last ? timeAgo(last) : 'never') : status.error ? 'unavailable' : '…'}
          </span>
          <Link to={`${base}/status`}><Icon name="Server" size={12} />System status</Link>
          <Link to={`${base}/help`}><Icon name="LifeBuoy" size={12} />Help</Link>
          <button type="button" aria-pressed={largeText} onClick={() => setLargeText(!largeText)}><Icon name="Type" size={12} />Larger text</button>
          <button type="button" aria-pressed={contrast} onClick={() => setContrast(!contrast)}><Icon name="Contrast" size={12} />High contrast</button>
        </div>
      </div>
    </div>
  );
}
