import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui/forms';
import { Alert } from '../components/ui/display';
import Icon from '../components/ui/Icon';
import { useAction } from '../hooks';

const SHOW_SAMPLE_ACCOUNTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_SAMPLE_ACCOUNTS === 'true';
const SAMPLE = [
  ['Referring hospital', 'medchal.referrer@emergencylink.demo', 'Medchal Community Hospital', 'Send and track referrals'],
  ['Receiving hospital', 'hitech.receiver@emergencylink.demo', 'Hitech Heart Institute', 'Review, accept or decline'],
  ['Administrator', 'admin@emergencylink.demo', 'System-wide oversight', 'Audit, analytics, exports'],
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, run] = useAction();

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!email.trim()) er.email = 'Enter your e-mail address.'; else if (!/^\S+@\S+$/.test(email)) er.email = 'Enter a valid e-mail address.';
    if (!password) er.password = 'Enter your password.';
    setErrors(er); setApiError('');
    if (Object.keys(er).length) return;
    run(async () => {
      try { await login(email.trim(), password); nav(loc.state?.from || '/app', { replace: true }); }
      catch (err) { setApiError(err.message); }
    });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <h2>Coordinate emergency referrals with one shared view.</h2>
        <p>Sign in to create referrals, compare hospitals using transparent rules, and follow every decision on a timeline.</p>
        <p className="small"><Icon name="Info" size={14} /> Enter only the minimum patient information a transfer needs.</p>
      </div>
      <div className="auth-main">
        <div className="card auth-card"><div className="card-body stack">
          <div><h1 style={{ fontSize: 'var(--fs-xl)' }}>Sign in</h1><p className="muted small">Use your registered hospital account.</p></div>
          {apiError && <Alert tone="danger" title="Could not sign in">{apiError}</Alert>}
          <form onSubmit={submit} className="stack" noValidate>
            <Input label="E-mail" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            <Button type="submit" size="lg" block loading={busy}>Sign in</Button>
          </form>
          {SHOW_SAMPLE_ACCOUNTS && <div>
            <div className="field-label" style={{ marginBottom: 8 }}>Sample accounts <span className="muted xs">(development data · password: Demo@1234)</span></div>
            <div className="demo-accounts">
              {SAMPLE.map(([role, mail, name, hint]) => (
                <button key={mail} type="button" className="demo-acct" onClick={() => { setEmail(mail); setPassword('Demo@1234'); setErrors({}); }}>
                  <span><b>{role}</b><br /><span className="xs muted">{name} · {hint}</span></span><Icon name="ArrowRight" size={14} />
                </button>
              ))}
            </div>
          </div>}
          <p className="small muted">New hospital? <Link to="/register">Register a hospital account</Link></p>
        </div></div>
      </div>
    </div>
  );
}
