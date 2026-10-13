import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import PublicLayout from './components/layout/PublicLayout';
import { LoadingState } from './components/ui/feedback';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Help from './pages/Help';
import Status from './pages/Status';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Referrals from './pages/Referrals';
import ReferralNew from './pages/ReferralNew';
import ReferralDetail from './pages/ReferralDetail';
import ReferralPrint from './pages/ReferralPrint';
import Network from './pages/Network';
import HospitalProfile from './pages/HospitalProfile';
import Resources from './pages/Resources';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Assistant from './pages/Assistant';
import Admin from './pages/Admin';
const Analytics = lazy(() => import('./pages/Analytics'));

/** Frontend route guard. This is a UX convenience only: the backend enforces every permission. */
function Protected({ roles, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div style={{ padding: 40 }}><LoadingState label="Restoring your session…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (ready && user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/help" element={<Help />} />
        <Route path="/status" element={<Status />} />
      </Route>
      <Route path="/app" element={<Protected><AppShell /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="referrals/new" element={<Protected roles={['REFERRING_HOSPITAL']}><ReferralNew /></Protected>} />
        <Route path="referrals/:id" element={<ReferralDetail />} />
        <Route path="referrals/:id/print" element={<ReferralPrint />} />
        <Route path="network" element={<Network />} />
        <Route path="hospitals/:id" element={<HospitalProfile />} />
        <Route path="resources" element={<Resources />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="analytics" element={<Suspense fallback={<LoadingState />}><Analytics /></Suspense>} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="admin" element={<Protected roles={['ADMIN']}><Admin /></Protected>} />
        <Route path="help" element={<Help inApp />} />
        <Route path="status" element={<Status inApp />} />
        <Route path="*" element={<NotFound inApp />} />
      </Route>
      <Route path="*" element={<PublicLayout />}><Route path="*" element={<NotFound />} /></Route>
    </Routes>
  );
}
