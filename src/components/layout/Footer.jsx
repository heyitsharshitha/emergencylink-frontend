import { Link } from 'react-router-dom';
import { BrandMark } from './Brand';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { status } = useApp();
  const { user } = useAuth();
  const base = user ? '/app' : '';
  const up = status.data?.status === 'UP';
  return (
    <footer className="footer">
      <div className="footer-in">
        <div>
          <div className="row" style={{ marginBottom: 10 }}><BrandMark size={30} /><strong style={{ color: '#fff', fontSize: 'var(--fs-md)' }}>EmergencyLink</strong></div>
          <p>Emergency healthcare referral coordination between referring and receiving hospitals, with transparent, rule-based matching.</p>
        </div>
        <div><h4>Help</h4><Link to={`${base}/help`}>Workflow guide</Link><Link to={`${base}/status`}>System status</Link>{user && <Link to="/app/assistant">Coordination assistant</Link>}</div>
        <div><h4>Documentation</h4><a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">API documentation (Swagger)</a><Link to={`${base}/help`}>Workflow guide</Link></div>
        <div>
          <h4>Privacy &amp; accessibility</h4>
          <p className="xs">Enter only the minimum patient information a transfer needs. Accessibility options (larger text, high contrast, reduced motion) are available in the top strip. For help or account queries, contact your hospital administrator.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Version 1.0.0 · Demonstration prototype with fictional data. Not a government service, not a certified clinical system, and not a substitute for clinical judgement</span>
        <Link to={`${base}/status`} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span className="dot" style={{ color: status.loading ? '#999' : up ? '#55c08a' : '#ff8a7d' }} />{status.loading ? 'Checking status…' : up ? 'All systems operational' : 'Backend unavailable'}
        </Link>
      </div>
    </footer>
  );
}
