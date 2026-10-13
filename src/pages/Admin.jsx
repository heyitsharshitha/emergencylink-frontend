import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi, hospitalApi } from '../api/services';
import { useAction, useDebounce, useFetch } from '../hooks';
import { PageHeader, Pagination, Table } from '../components/ui/data';
import { Alert, Badge, Card, StatCard, Tabs } from '../components/ui/display';
import { Async, ConfirmDialog, EmptyState, useToast } from '../components/ui/feedback';
import { Button, Input, Select } from '../components/ui/forms';
import { ACTION_LABEL, ROLE_LABEL, STATUS, URGENCY, fmtDateTime, typeLabel } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { AuditTab, ExceptionsTab, ReportsTab, SettingsTab } from '../components/domain/AdminExtras';
import HospitalFormModal from '../components/domain/HospitalFormModal';
import { ResourceCorrectionModal } from '../components/domain/ResourceCorrection';

function UsersTab() {
  const { user: me } = useAuth();
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [page, setPage] = useState(0); const [target, setTarget] = useState(null);
  const dq = useDebounce(q, 350); const [busy, run] = useAction(); const toast = useToast();
  const state = useFetch(() => adminApi.users({ q: dq, role, page, size: 10 }), [dq, role, page]);
  const cols = [
    { key: 'n', header: 'User', render: (u) => <><b>{u.fullName.replace(/\s*\(Demo\)/, '')}</b><div className="xs muted">{u.email}</div></> },
    { key: 'r', header: 'Role', render: (u) => <Badge tone={u.role === 'ADMIN' ? 'info' : 'teal'}>{ROLE_LABEL[u.role]}</Badge> },
    { key: 'h', header: 'Hospital', render: (u) => u.hospitalName || '—' },
    { key: 's', header: 'Status', render: (u) => <Badge tone={u.active ? 'success' : 'neutral'} icon={u.active ? 'Check' : 'Ban'}>{u.active ? 'Active' : 'Deactivated'}</Badge> },
    { key: 'a', header: '', render: (u) => u.id === me.id ? <span className="xs muted">You</span> : <Button size="sm" variant={u.active ? 'danger-outline' : 'secondary'} onClick={() => setTarget(u)}>{u.active ? 'Deactivate' : 'Activate'}</Button> },
  ];
  return (
    <div className="stack">
      <div className="grid cols-3"><Input label="Search users" icon="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name or e-mail" />
        <Select label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(0); }} placeholder="All roles" options={Object.entries(ROLE_LABEL)} /></div>
      <Async state={state} rows={5}>{(p) => <><Table caption="Users" columns={cols} rows={p.content} empty={<EmptyState icon="SearchX" title="No users match" />} /><Pagination page={p.page} totalPages={p.totalPages} totalElements={p.totalElements} size={p.size} onPage={setPage} /></>}</Async>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} busy={busy} danger={target?.active} title={target?.active ? 'Deactivate this user?' : 'Activate this user?'}
        message={target ? `${target.email} ${target.active ? 'will no longer be able to sign in.' : 'will be able to sign in again.'}` : ''} confirmLabel={target?.active ? 'Deactivate' : 'Activate'}
        noteLabel="Reason (recorded in the audit log)" noteRequired={!!target?.active}
        onConfirm={(reason) => run(async () => { try { await adminApi.setUserActive(target.id, !target.active, reason); toast.success('User updated.'); setTarget(null); state.refresh(); } catch (e) { toast.error(e.message); setTarget(null); } })} />
    </div>
  );
}

function HospitalsTab() {
  const [q, setQ] = useState(''); const [page, setPage] = useState(0); const [target, setTarget] = useState(null);
  const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(null); const [correcting, setCorrecting] = useState(null);
  const dq = useDebounce(q, 350); const [busy, run] = useAction(); const toast = useToast();
  const state = useFetch(() => hospitalApi.search({ q: dq, page, size: 10 }), [dq, page]);
  const cols = [
    { key: 'n', header: 'Hospital', render: (h) => <Link className="cell-link" to={`/app/hospitals/${h.id}`}>{h.name}</Link> },
    { key: 'c', header: 'Location', render: (h) => `${h.city}, ${h.state}` },
    { key: 't', header: 'Type', render: (h) => typeLabel(h.type) },
    { key: 'r', header: 'Role', render: (h) => <Badge tone={h.receivesReferrals ? 'success' : 'neutral'}>{h.receivesReferrals ? 'Receives' : 'Refers'}</Badge> },
    { key: 's', header: 'Status', render: (h) => <Badge tone={h.active ? 'success' : 'neutral'} icon={h.active ? 'Check' : 'Ban'}>{h.active ? 'Active' : 'Deactivated'}</Badge> },
    { key: 'a', header: '', render: (h) => <div className="row wrap" style={{ gap: 6 }}><Button size="sm" variant="secondary" onClick={() => setEditing(h)}>Edit</Button><Button size="sm" variant="secondary" onClick={() => setCorrecting(h)}>Resources</Button><Button size="sm" variant={h.active ? 'danger-outline' : 'secondary'} onClick={() => setTarget(h)}>{h.active ? 'Deactivate' : 'Activate'}</Button></div> },
  ];
  return (
    <div className="stack">
      <div className="grid cols-3" style={{ alignItems: 'end' }}><Input label="Search hospitals" icon="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name, city or address" /><div><Button icon="Plus" onClick={() => setCreating(true)}>Add hospital</Button></div></div>
      <HospitalFormModal mode="create" open={creating} onClose={() => setCreating(false)} onSaved={() => state.refresh()} />
      {editing && <HospitalFormModal mode="admin" h={editing} open onClose={() => setEditing(null)} onSaved={() => state.refresh()} />}
      {correcting && <ResourceCorrectionModal hospital={correcting} open onClose={() => setCorrecting(null)} onSaved={() => state.refresh()} />}
      <Async state={state} rows={5}>{(p) => <><Table caption="Hospitals" columns={cols} rows={p.content} /><Pagination page={p.page} totalPages={p.totalPages} totalElements={p.totalElements} size={p.size} onPage={setPage} /></>}</Async>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} busy={busy} danger={target?.active} title={target?.active ? 'Deactivate this hospital?' : 'Activate this hospital?'}
        message={target?.active ? 'It will be hidden from matching and the network. Existing referrals are kept and still visible to the hospitals involved.' : 'It will be visible in matching and the network again.'} confirmLabel={target?.active ? 'Deactivate' : 'Activate'}
        noteLabel="Reason (recorded in the audit log)" noteRequired={!!target?.active}
        onConfirm={(reason) => run(async () => { try { await adminApi.setHospitalActive(target.id, !target.active, reason); toast.success('Hospital updated.'); setTarget(null); state.refresh(); } catch (e) { toast.error(e.message); setTarget(null); } })} />
    </div>
  );
}

function OverviewTab() {
  const state = useFetch(() => adminApi.overview(), []);
  const link = (to) => ({ to, as: Link });
  return (
    <Async state={state} rows={5}>{(o) => (
      <div className="stack">
        <div className="grid cols-4">
          <StatCard icon="Building2" label="Hospitals" value={`${o.hospitalsActive} / ${o.hospitalsTotal}`} hint="Active / registered" {...link('/app/admin?tab=hospitals')} />
          <StatCard icon="Users" label="Users" value={`${o.usersActive} / ${o.usersTotal}`} hint="Active / registered" {...link('/app/admin?tab=users')} />
          <StatCard icon="FileText" label="Active referrals" value={o.activeReferrals} hint="Not completed or cancelled" {...link('/app/referrals')} />
          <StatCard icon="Clock3" tone="warning" label="Awaiting action" value={o.awaitingAction} hint="Sent, viewed or info requested" {...link('/app/referrals?view=awaiting')} />
          <StatCard icon="Siren" tone="danger" label="Critical / urgent" value={o.criticalOrUrgentActive} hint="Open, not declined" {...link('/app/referrals?view=urgent')} />
          <StatCard icon="Timer" tone="warning" label={`Waiting over ${o.waitThresholdMinutes} min`} value={o.overdueReferrals} hint="Operational threshold" {...link('/app/referrals?view=overdue')} />
          <StatCard icon="ShieldCheck" label="Flagged for review" value={o.flaggedReferrals} {...link('/app/referrals?view=flagged')} />
          <StatCard icon="TriangleAlert" tone="warning" label="Open exceptions" value={o.openExceptions} hint={`${o.staleResourceRecords} stale resource records`} {...link('/app/admin?tab=exceptions')} />
        </div>
        <div className="grid cols-2">
          <Card title="Referrals by status">
            <ul className="stack-sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {Object.entries(o.byStatus).map(([k, v]) => <li key={k} className="row between"><Link className="cell-link" to={`/app/referrals?status=${k}`}>{STATUS[k]?.label || k}</Link><b>{v}</b></li>)}
            </ul>
          </Card>
          <Card title="Referrals by urgency">
            <ul className="stack-sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {Object.entries(o.byUrgency).map(([k, v]) => <li key={k} className="row between"><span>{URGENCY[k]?.label || k}</span><b>{v}</b></li>)}
            </ul>
            <p className="small muted" style={{ marginTop: 12 }}>
              {o.avgCreationToDecisionMinutes == null
                ? `Response time: Not enough data yet (${o.decisionSampleSize} decided referrals; at least 3 are needed).`
                : `Average time from creation to a recorded decision: ${Math.round(o.avgCreationToDecisionMinutes)} min across ${o.decisionSampleSize} referrals.`}
            </p>
          </Card>
        </div>
        <p className="xs muted">Generated {fmtDateTime(o.generatedAt)} from current records.</p>
      </div>
    )}</Async>
  );
}

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = ['overview', 'exceptions', 'hospitals', 'users', 'reports', 'settings', 'audit'].includes(params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (t) => setParams({ tab: t });
  return (
    <>
      <PageHeader title="Administration" description="Operational overview, exceptions, hospitals, users, reports, thresholds and the audit log. Corrections to a referral are made from its detail page and are always recorded with a reason."
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Administration' }]} actions={<><Link className="btn btn-secondary" to="/app/referrals">Referral operations</Link><Link className="btn btn-secondary" to="/app/analytics">Analytics &amp; CSV export</Link></>} />
      <Card className="flat" bodyClass="">
        <Tabs label="Administration sections" value={tab} onChange={setTab} tabs={[['overview', 'Overview', 'Gauge'], ['exceptions', 'Exceptions', 'TriangleAlert'], ['hospitals', 'Hospitals', 'Building2'], ['users', 'Users', 'Users'], ['reports', 'Reports', 'BarChart3'], ['settings', 'Settings', 'Gauge'], ['audit', 'Audit log', 'ScrollText']]} />
        <div style={{ paddingTop: 20 }}>{tab === 'overview' ? <OverviewTab /> : tab === 'exceptions' ? <ExceptionsTab /> : tab === 'hospitals' ? <HospitalsTab /> : tab === 'users' ? <UsersTab /> : tab === 'reports' ? <ReportsTab /> : tab === 'settings' ? <SettingsTab /> : <AuditTab />}</div>
      </Card>
    </>
  );
}
