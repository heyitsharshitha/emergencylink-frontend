import { Link, Outlet } from 'react-router-dom';
import UtilityStrip from './UtilityStrip';
import Footer from './Footer';
import Brand from './Brand';
import { Button } from '../ui/forms';
import { useAuth } from '../../context/AuthContext';

export function PublicNav() {
  const { user } = useAuth();
  return (
    <div className="land-nav">
      <div className="in">
        <Brand to="/" />
        <nav aria-label="Public navigation">
          <Link className="btn btn-ghost btn-sm" to="/#how-it-works">How it works</Link>
          <Link className="btn btn-ghost btn-sm" to="/help">Help</Link>
          <Link className="btn btn-ghost btn-sm" to="/status">Status</Link>
          {user ? <Link className="btn btn-primary btn-sm" to="/app">Open portal</Link> : <><Link className="btn btn-secondary btn-sm" to="/register">Register hospital</Link><Link className="btn btn-primary btn-sm" to="/login">Sign in</Link></>}
        </nav>
      </div>
    </div>
  );
}

export default function PublicLayout() {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to main content</a>
      <UtilityStrip />
      <PublicNav />
      <main id="main" tabIndex={-1} style={{ flex: 1 }}><Outlet /></main>
      <Footer />
    </div>
  );
}
