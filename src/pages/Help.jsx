import { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/services';
import { useDebounce, useFetch } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Alert, Badge, Card } from '../components/ui/display';
import { Async, EmptyState } from '../components/ui/feedback';
import { Button, Input } from '../components/ui/forms';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Help({ inApp }) {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 300);
  const docs = useFetch(() => publicApi.help(dq), [dq]);
  const { setTourOpen } = useApp();
  const { user } = useAuth();
  const inner = (
    <>
      <PageHeader title="Help & workflow guide" description="How referrals work in EmergencyLink, what the matching score means, and what the platform does not do."
        crumbs={inApp ? [{ label: 'Dashboard', to: '/app' }, { label: 'Help' }] : [{ label: 'Home', to: '/' }, { label: 'Help' }]}
        actions={user && <Button variant="secondary" icon="Play" onClick={() => setTourOpen(true)}>Take the product tour</Button>} />
      <div className="stack">
        <Alert tone="info" title="Human-led decisions">EmergencyLink does not diagnose, prescribe or make clinical decisions. Matching compares stated requirements with reported availability; the responsible clinical teams decide.</Alert>
        <div style={{ maxWidth: 520 }}><Input label="Search help" icon="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. stale data, decline, scoring" /></div>
        <Async state={docs} rows={4}>
          {(list) => list.length === 0 ? <Card><EmptyState icon="SearchX" title="No help topics match">Try a simpler word such as “referral”, “resources” or “matching”.</EmptyState></Card>
            : <div className="stack-sm">{list.map((d) => (
              <Card key={d.slug} className="help-doc" as="article">
                <div className="row between wrap"><h3>{d.title}</h3><Badge tone="outline">{d.category}</Badge></div>
                <p className="muted" style={{ marginTop: 6, maxWidth: 860 }}>{d.body}</p>
              </Card>))}</div>}
        </Async>
        {user && <p className="small muted">Prefer to ask? Try the <Link to="/app/assistant">coordination assistant</Link>, which retrieves from this same documentation.</p>}
      </div>
    </>
  );
  return inApp ? inner : <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 56px' }}>{inner}</div>;
}
