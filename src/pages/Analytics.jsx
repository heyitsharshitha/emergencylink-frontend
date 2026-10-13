import { useState } from 'react';
import { adminApi, dashboardApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useAction, useFetch } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Alert, Card, StatCard } from '../components/ui/display';
import { Async, useToast } from '../components/ui/feedback';
import { Button, Input, Select } from '../components/ui/forms';
import { HospitalChart, ResourceOverviewChart, SpecialtyChart, StatusChart, TimeChart, UrgencyChart } from '../components/domain/Charts';
import { STATUS, URGENCY, downloadBlob } from '../utils/format';

function ExportCard() {
  const [f, setF] = useState({ status: '', urgency: '', from: '', to: '' });
  const [busy, run] = useAction();
  const toast = useToast();
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Card title="Export referral analytics (CSV)">
      <div className="stack">
        <p className="small muted">Exports filtered referral metadata with a generated-at timestamp. Patient identifiers and clinical summaries are never included. The export is recorded in the audit log.</p>
        <div className="grid cols-4">
          <Select label="Status" value={f.status} onChange={set('status')} placeholder="Any" options={Object.entries(STATUS).map(([k, v]) => [k, v.label])} />
          <Select label="Urgency" value={f.urgency} onChange={set('urgency')} placeholder="Any" options={Object.entries(URGENCY).map(([k, v]) => [k, v.label])} />
          <Input label="From" type="date" value={f.from} onChange={set('from')} /><Input label="To" type="date" value={f.to} onChange={set('to')} />
        </div>
        <div><Button icon="Download" loading={busy} onClick={() => run(async () => { try { downloadBlob(await adminApi.csv(f), 'emergencylink-referrals.csv'); toast.success('CSV exported.'); } catch (e) { toast.error(e.message); } })}>Download CSV</Button></div>
      </div>
    </Card>
  );
}

export default function Analytics() {
  const { isAdmin } = useAuth();
  const dash = useFetch(() => dashboardApi.get(), []);
  return (
    <>
      <PageHeader title="Analytics" description="Charts are limited to what helps coordination: where referrals stand, how urgent they are, and how quickly decisions are made." updatedAt={dash.data?.generatedAt}
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Analytics' }]} actions={<Button variant="secondary" icon="RefreshCw" onClick={dash.reload}>Refresh</Button>} />
      <Async state={dash} rows={6}>
        {(d) => (
          <div className="stack">
            <Alert tone="info">All figures are computed from records in the database.</Alert>
            <div className="grid cols-3">
              <StatCard icon="FileText" label="Referrals in scope" value={d.kpis.total} />
              <StatCard icon="Timer" label="Avg. creation → decision" value={d.avgDecisionMinutes != null ? `${d.avgDecisionMinutes} min` : '—'} hint="Referrals with a recorded decision" />
              <StatCard icon="Siren" tone="danger" label="Open urgent referrals" value={d.kpis.urgent} />
            </div>
            <div className="grid cols-2">
              <Card title="Referral status distribution"><StatusChart distribution={d.statusDistribution} /></Card>
              <Card title="Referrals by urgency"><UrgencyChart distribution={d.urgencyDistribution} /></Card>
              <Card title="Referrals over time (14 days)"><TimeChart points={d.referralsOverTime} /></Card>
              <Card title="Most requested specialties"><SpecialtyChart rows={d.topSpecialties} /></Card>
            </div>
            {isAdmin && (<>
              <div className="grid cols-2">
                <Card title="Hospital activity"><HospitalChart rows={d.hospitalActivity} /></Card>
                <Card title="Network resource overview"><ResourceOverviewChart rows={d.resourceOverview} /></Card>
              </div>
              <ExportCard />
            </>)}
          </div>
        )}
      </Async>
    </>
  );
}
