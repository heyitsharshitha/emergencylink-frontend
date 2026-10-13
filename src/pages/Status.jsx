import { PageHeader } from '../components/ui/data';
import { Alert, Badge, Card, Freshness, SimNote } from '../components/ui/display';
import { Button } from '../components/ui/forms';
import { LoadingState } from '../components/ui/feedback';
import Icon from '../components/ui/Icon';
import { useApp } from '../context/AppContext';
import { fmtDateTime } from '../utils/format';
import { API_BASE_URL } from '../api/client';

function Row({ label, children }) { return <div className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--grey-100)' }}><span className="muted">{label}</span><span>{children}</span></div>; }

export default function Status({ inApp }) {
  const { status, refreshStatus } = useApp();
  const s = status.data;
  const inner = (
    <>
      <PageHeader title="System status & data health" description="A live check of the backend connection and the freshness of reported resource data."
        crumbs={inApp ? [{ label: 'Dashboard', to: '/app' }, { label: 'System status' }] : [{ label: 'Home', to: '/' }, { label: 'System status' }]}
        actions={<Button variant="secondary" icon="RefreshCw" loading={status.loading} onClick={refreshStatus}>Check again</Button>} />
      <div className="stack">
        {status.loading && !s && <LoadingState rows={4} />}
        {status.error && !s && (
          <Alert tone="danger" title="The backend cannot be reached" actions={<Button size="sm" variant="secondary" onClick={refreshStatus}>Retry</Button>}>
            {status.error.message} Expected API at <code>{API_BASE_URL}</code>. Sign-in and data screens will not work until it is running.
          </Alert>
        )}
        {s && (
          <div className="grid cols-2">
            <Card title="Connectivity">
              <Row label="Backend API"><Badge tone="success" icon="Check">Reachable</Badge></Row>
              <Row label="Database"><Badge tone={s.database === 'UP' ? 'success' : 'danger'} icon={s.database === 'UP' ? 'Check' : 'X'}>{s.database === 'UP' ? 'Responding' : 'Unavailable'}</Badge></Row>
              <Row label="Version">{s.version}</Row>
              <Row label="Environment"><Badge tone="info" icon="Info">{s.demoEnvironment === false ? 'Production' : 'Demonstration'}</Badge></Row>
              <Row label="Server time">{fmtDateTime(s.serverTime)}</Row>
              <Row label="AI assistant mode"><Badge tone={s.assistantMode === 'LIVE' ? 'success' : 'warning'} icon="Sparkles">{s.assistantMode === 'LIVE' ? 'Live model' : 'Not configured'}</Badge></Row>
            </Card>
            <Card title="Data health">
              <Row label="Hospitals on the network">{s.hospitals}</Row>
              <Row label="Referrals recorded">{s.referrals}</Row>
              <Row label="Last resource update"><Freshness updatedAt={s.lastResourceUpdate} stale={false} /></Row>
              <Row label="Stale resource records"><Badge tone={s.staleResourceRecords ? 'warning' : 'success'}>{s.staleResourceRecords}</Badge></Row>
              <Row label="Freshness threshold">{s.staleThresholdMinutes} minutes</Row>
              <p className="xs muted" style={{ marginTop: 12 }}>The threshold is set with <code>RESOURCE_STALE_MINUTES</code> in the backend configuration.</p>
            </Card>
          </div>
        )}
        <p className="small muted"><Icon name="Info" size={13} /> This panel reports only what the backend returns on request. It is not an uptime-monitoring service.</p>
      </div>
    </>
  );
  return inApp ? inner : <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 56px' }}>{inner}</div>;
}
