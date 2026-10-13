import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UtilityStrip from './UtilityStrip';
import Brand from './Brand';
import Sidebar from './Sidebar';
import Footer from './Footer';
import NotificationCenter from './NotificationCenter';
import ProfileMenu from './ProfileMenu';
import CommandPalette from './CommandPalette';
import DemoTour from './DemoTour';
import Icon from '../ui/Icon';
import ErrorBoundary from '../ui/ErrorBoundary';
import { useApp } from '../../context/AppContext';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [cmd, setCmd] = useState(false);
  const loc = useLocation();
  const { tourDone, setTourOpen } = useApp();
  const started = useRef(false);

  useEffect(() => { setDrawer(false); document.getElementById('page-title')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { if (!tourDone && !started.current) { started.current = true; setTourOpen(true); } }, [tourDone, setTourOpen]);
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(true); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''} ${drawer ? 'drawer-open' : ''}`}>
      <a href="#main" className="skip-link">Skip to main content</a>
      <UtilityStrip />
      <header className="header">
        <div className="header-in">
          <button className="icon-btn drawer-btn" aria-label="Open navigation menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><Icon name="Menu" size={20} /></button>
          <button className="icon-btn collapse-btn" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}><Icon name={collapsed ? 'ChevronsRight' : 'ChevronsLeft'} size={20} /></button>
          <Brand to="/app" />
          <div className="header-tools">
            <button className="search-trigger" onClick={() => setCmd(true)} aria-label="Open quick search (Control K)"><Icon name="Search" size={16} /><span>Quick search…</span><kbd>Ctrl K</kbd></button>
            <NotificationCenter />
            <ProfileMenu />
          </div>
        </div>
      </header>
      <div className="body">
        {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
        <Sidebar onNavigate={() => setDrawer(false)} />
        <main id="main" className="main" tabIndex={-1}>
          <div className="main-in"><ErrorBoundary resetKey={loc.pathname}><Outlet /></ErrorBoundary></div>
        </main>
      </div>
      <Footer />
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
      <DemoTour />
    </div>
  );
}
