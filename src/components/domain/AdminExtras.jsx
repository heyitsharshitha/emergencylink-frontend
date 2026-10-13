import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useAction, useDebounce, useFetch } from '../../hooks';
import { Pagination, Table } from '../ui/data';
import { Alert, Badge, Card, StatCard } from '../ui/display';
import { Async, ConfirmDialog, EmptyState, Modal, useToast } from '../ui/feedback';
import { Button, Input, Select, Textarea } from '../ui/forms';
import { ACTION_LABEL, STATUS, URGENCY, downloadBlob, fmtDateTime } from '../../utils/format';

const SEVERITY = { HIGH: ['danger', 'TriangleAlert', 'High'], MEDIUM: ['warning', 'Clock3', 'Medium'], LOW: ['neutral', 'Info', 'Low'] };

// ---------------------------------------------------------------- Exceptions with ownership

export function ExceptionsTab() {
  const { user } = useAuth();
  const state = useFetch(() => adminApi.exceptions(), []);
  const [sev, setSev] = useState('');
  const [view, setView] = useState('open');
  const [review, setReview] = useState(null);
  const [busy, run] = useAction();
  const toast = useToast();
  const change = (id, status, note) => run(async () => {
    try { await adminApi.exceptionState(id, status, note); toast.success(status === 'OPEN' ? 'Exception reopened.' : status === 'IN_PROGRESS' ? 'You now own this exception.' : 'Marked as reviewed.'); setReview(null); state.refresh(); }
    catch (e) { toast.error(e.message); setReview(null); }
  });
  return (
    <Async state={state} rows={5}>{(x) => {
      const items = x.items.filter((i) => (!sev || i.severity === sev)
        && (view === 'all' || (view === 'reviewed' ? i.status === 'REVIEWED' : view === 'mine' ? i.ownerName === user.fullName && i.status !== 'REVIEWED' : i.status !== 'REVIEWED')));
      const cols = [
        { key: 's', header: 'Severity', render: (i) => { const [tone, icon, label] = SEVERITY[i.severity] || SEVERITY.LOW; return <Badge tone={tone} icon={icon}>{label}</Badge>; } },
        { key: 'i', header: 'Issue', render: (i) => <><b>{i.title}</b><div className="small muted">{i.explanation}</div>{i.note && <div className="small" style={{ marginTop: 4 }}>Note: {i.note}</div>}</> },
        { key: 'r', header: 'Record', render: (i) => <Link className="cell-link" to={i.route}>{i.entityLabel || `${i.entityType} ${i.entityId}`}</Link> },
        { key: 'o', header: 'Status', render: (i) => (i.status === 'OPEN' ? <Badge tone="outline">Open</Badge>
          : <><Badge tone={i.status === 'REVIEWED' ? 'success' : 'info'}>{i.status === 'REVIEWED' ? 'Reviewed' : 'In progress'}</Badge><div className="xs muted">{i.ownerName}</div></>) },
        { key: 'a', header: 'Actions', render: (i) => (
          <div className="row wrap" style={{ gap: 6 }}>
            <Link className="btn btn-secondary btn-sm" to={i.route}>Open record</Link>
            {i.status !== 'IN_PROGRESS' && i.status !== 'REVIEWED' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => change(i.id, 'IN_PROGRESS')}>Take ownership</Button>}
            {i.status !== 'REVIEWED' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => setReview(i)}>Mark reviewed</Button>}
            {i.status !== 'OPEN' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => change(i.id, 'OPEN')}>Reopen</Button>}
          </div>) },
      ];
      return (
        <div className="stack">
          <p className="small muted">Derived from current records using fixed rules: resources not updated in {x.staleAfterMinutes} minutes, incomplete hospital profiles, hospitals with no account, inconsistent or inactive hospital assignments, referrals waiting over {x.waitThresholdMinutes} minutes, and referrals flagged by an administrator. A reviewed exception stays listed until its underlying cause is fixed.</p>
          <div className="grid cols-3">
            <Select label="Show" value={view} onChange={(e) => setView(e.target.value)} options={[['open', 'Open and in progress'], ['mine', 'Owned by me'], ['reviewed', `Reviewed (${x.reviewed})`], ['all', 'Everything']]} />
            <Select label="Severity" value={sev} onChange={(e) => setSev(e.target.value)} placeholder="All severities" options={[['HIGH', `High (${x.high})`], ['MEDIUM', `Medium (${x.medium})`], ['LOW', `Low (${x.low})`]]} />
          </div>
          <Table caption="Exceptions" columns={cols} rows={items} rowKey="id" empty={<EmptyState icon="CheckCircle2" title="No exceptions in this view">Nothing currently matches the selected filters.</EmptyState>} />
          <ConfirmDialog open={!!review} onClose={() => setReview(null)} busy={busy} title="Mark this exception as reviewed?" message={review ? `${review.title}: ${review.entityLabel || ''}` : ''}
            confirmLabel="Mark reviewed" noteLabel="What did you check or decide?" noteRequired onConfirm={(note) => change(review.id, 'REVIEWED', note)} />
        </div>
      );
    }}</Async>
  );
}

// ---------------------------------------------------------------- Settings

export function SettingsTab() {
  const state = useFetch(() => adminApi.settings(), []);
  const [wait, setWait] = useState('');
  const [stale, setStale] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, run] = useAction();
  const toast = useToast();
  const s = state.data;
  useEffect(() => { if (s) { setWait(String(s.waitMinutes)); setStale(String(s.staleMinutes)); } }, [s]);
  const dirty = s && (Number(wait) !== s.waitMinutes || Number(stale) !== s.staleMinutes);
  const save = () => run(async () => {
    const e = {};
    const w = Number(wait); const st = Number(stale);
    if (!Number.isInteger(w) || w < 5 || w > 1440) e.wait = 'Enter whole minutes from 5 to 1440.';
    if (!Number.isInteger(st) || st < 15 || st > 10080) e.stale = 'Enter whole minutes from 15 to 10080.';
    if (!reason.trim()) e.reason = 'A reason is required.';
    setErrors(e); if (Object.keys(e).length) return;
    try { await adminApi.updateSettings({ waitMinutes: w, staleMinutes: st, reason: reason.trim() }); toast.success('Thresholds updated.'); setReason(''); state.refresh(); }
    catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); }
  });
  return (
    <Async state={state} rows={3}>{() => (
      <div className="stack" style={{ maxWidth: 640 }}>
        <Alert tone="info" title="Operational thresholds, not clinical rules">These control when a referral is shown as waiting too long and when resource figures are marked as needing confirmation. They never change a clinical decision. Every change is audited with your reason.</Alert>
        <Input label="Referral waiting threshold (minutes)" inputMode="numeric" value={wait} onChange={(e) => setWait(e.target.value)} error={errors.wait}
          help={`Default ${s.defaultWaitMinutes}. A sent, viewed or information-requested referral older than this appears under "Waiting too long".`} />
        <Input label="Resource freshness threshold (minutes)" inputMode="numeric" value={stale} onChange={(e) => setStale(e.target.value)} error={errors.stale}
          help={`Default ${s.defaultStaleMinutes}. Availability not updated within this time is shown as stale in matching, the network and exceptions.`} />
        <Textarea label="Reason for the change" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} />
        <div className="row" style={{ gap: 10 }}>
          <Button loading={busy} disabled={!dirty} icon="Save" onClick={save}>Save thresholds</Button>
          <Button variant="ghost" onClick={() => { setWait(String(s.defaultWaitMinutes)); setStale(String(s.defaultStaleMinutes)); }}>Use defaults</Button>
        </div>
        <p className="xs muted">{s.updatedAt ? `Last changed ${fmtDateTime(s.updatedAt)} by ${s.updatedBy}.` : 'Using configured defaults. Never changed from the interface.'}</p>
      </div>
    )}</Async>
  );
}

// ---------------------------------------------------------------- Reports

const iso = (d) => d.toISOString().slice(0, 10);
const EXPORTS = [['hospitals', 'Hospital directory'], ['hospital-activity', 'Hospital activity'], ['stale-resources', 'Stale resources'], ['completeness', 'Profile completeness'], ['volume', 'Daily referral volume'], ['audit', 'Audit log']];

export function ReportsTab() {
  const today = new Date();
  const [from, setFrom] = useState(iso(new Date(today.getTime() - 29 * 86400000)));
  const [to, setTo] = useState(iso(today));
  const valid = from && to && from <= to;
  const state = useFetch(() => adminApi.reportSummary({ from, to }), [from, to], { enabled: !!valid });
  const [busy, run] = useAction();
  const toast = useToast();
  const exportCsv = (type) => run(async () => {
    try { downloadBlob(await adminApi.reportExport(type, { from, to }), `emergencylink-${type}.csv`); toast.success('CSV exported.'); } catch (e) { toast.error(e.message); }
  });
  return (
    <div className="stack">
      <div className="grid cols-4 no-print" style={{ alignItems: 'end' }}>
        <Input label="From" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        <Button variant="secondary" icon="Printer" onClick={() => window.print()}>Print report</Button>
      </div>
      {!valid && <Alert tone="warning" title="Check the dates">The start date must be on or before the end date.</Alert>}
      {valid && <Async state={state} rows={5}>{(r) => (
        <div className="stack">
          <p className="small muted">Report for {r.from} to {r.to} (UTC), generated {fmtDateTime(r.generatedAt)}. Figures come from stored records; patient identifiers are never included. Demonstration data.</p>
          <div className="grid cols-4">
            <StatCard icon="FileText" label="Referrals created" value={r.totalReferrals} />
            <StatCard icon="CheckCircle2" label="Accepted decisions" value={r.acceptedDecisions} />
            <StatCard icon="Ban" label="Declined decisions" value={r.declinedDecisions} />
            <StatCard icon="Gauge" label="Acceptance rate" value={r.acceptanceRate == null ? 'No decisions yet' : `${r.acceptanceRate}%`} hint="Accepted out of all decisions" />
          </div>
          <div className="grid cols-2">
            <Card title="Referrals created per day">
              <div style={{ width: '100%', height: 220 }} role="img" aria-label="Bar chart of referrals created per day">
                <ResponsiveContainer><BarChart data={r.volumeByDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} /><YAxis allowDecimals={false} width={28} /><Tooltip /><Bar dataKey="count" name="Referrals" fill="#0f6b73" /></BarChart></ResponsiveContainer>
              </div>
            </Card>
            <Card title="Status, urgency and response time">
              <div className="stack-sm">
                {Object.entries(r.byStatus).filter(([, v]) => v > 0).map(([k, v]) => <div key={k} className="row between"><span>{STATUS[k]?.label || k}</span><b>{v}</b></div>)}
                {r.totalReferrals === 0 && <p className="small muted">No referrals were created in this period.</p>}
                <hr />
                {Object.entries(r.byUrgency).filter(([, v]) => v > 0).map(([k, v]) => <div key={k} className="row between"><span>{URGENCY[k]?.label || k}</span><b>{v}</b></div>)}
                <hr />
                <p className="small muted" style={{ margin: 0 }}>{r.responseTime.avgMinutes == null
                  ? `Response time: not enough data yet (${r.responseTime.sampleSize} decided, at least 3 needed).`
                  : `Creation to decision: median ${Math.round(r.responseTime.medianMinutes)} min, average ${Math.round(r.responseTime.avgMinutes)} min, range ${Math.round(r.responseTime.minMinutes)} to ${Math.round(r.responseTime.maxMinutes)} min (${r.responseTime.sampleSize} referrals).`}</p>
              </div>
            </Card>
          </div>
          <Card title="Hospital activity">
            <Table caption="Hospital activity" rowKey="hospitalId" columns={[
              { key: 'h', header: 'Hospital', render: (a) => <Link className="cell-link" to={`/app/hospitals/${a.hospitalId}`}>{a.hospitalName}</Link> },
              { key: 's', header: 'Sent', render: (a) => a.sent }, { key: 'r', header: 'Received', render: (a) => a.received },
              { key: 'a', header: 'Accepted or beyond', render: (a) => a.accepted }, { key: 'd', header: 'Declined', render: (a) => a.declined }, { key: 'c', header: 'Completed', render: (a) => a.completed }]}
              rows={r.hospitalActivity} empty={<EmptyState icon="Building2" title="No hospital activity in this period" />} />
            <p className="xs muted" style={{ marginTop: 8 }}>Accepted, declined and completed show each received referral's current status.</p>
          </Card>
          <div className="grid cols-2">
            <Card title={`Stale resources (older than ${r.staleAfterMinutes} min)`}>
              <Table caption="Stale resources" rowKey="hospitalId" columns={[
                { key: 'h', header: 'Hospital', render: (s) => s.hospitalName }, { key: 't', header: 'Resource', render: (s) => s.type },
                { key: 'u', header: 'Last update', render: (s) => (s.updatedAt ? fmtDateTime(s.updatedAt) : 'Never') }]}
                rows={r.staleResources.map((s, i) => ({ ...s, hospitalId: `${s.hospitalId}-${i}` }))} empty={<EmptyState icon="CheckCircle2" title="All reported figures are fresh" />} />
            </Card>
            <Card title="Hospital profile completeness">
              <Table caption="Profile completeness" rowKey="hospitalId" columns={[
                { key: 'h', header: 'Hospital', render: (c) => <Link className="cell-link" to={`/app/hospitals/${c.hospitalId}`}>{c.hospitalName}</Link> },
                { key: 'p', header: 'Complete', render: (c) => `${c.percent}%` }, { key: 'm', header: 'Missing', render: (c) => <span className="small muted">{c.missing.join(', ') || '—'}</span> }]}
                rows={r.profileCompleteness} empty={<EmptyState icon="Building2" title="No active hospitals" />} />
            </Card>
          </div>
          <Card title="Administrative activity by action">
            {Object.keys(r.auditByAction).length === 0 ? <p className="small muted">No audit events in this period.</p>
              : <ul className="stack-sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>{Object.entries(r.auditByAction).map(([k, v]) => <li key={k} className="row between"><span>{ACTION_LABEL[k] || k}</span><b>{v}</b></li>)}</ul>}
          </Card>
          <Card title="Export CSV" className="no-print">
            <div className="row wrap" style={{ gap: 8 }}>{EXPORTS.map(([t, l]) => <Button key={t} variant="secondary" icon="Download" disabled={busy} onClick={() => exportCsv(t)}>{l}</Button>)}
              <Link className="btn btn-secondary" to="/app/analytics">Referral analytics CSV</Link></div>
            <p className="xs muted" style={{ marginTop: 8 }}>Exports are limited to administrators, never include patient identifiers or clinical summaries, and are recorded in the audit log.</p>
          </Card>
        </div>
      )}</Async>}
    </div>
  );
}

// ---------------------------------------------------------------- Audit log with before/after

function DetailRow({ label, children }) { return children ? <><dt>{label}</dt><dd>{children}</dd></> : null; }

export function AuditTab() {
  const [q, setQ] = useState(''); const [action, setAction] = useState(''); const [actor, setActor] = useState(''); const [entityType, setEntityType] = useState('');
  const [outcome, setOutcome] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);
  const [busy, run] = useAction(); const toast = useToast();
  const dq = useDebounce(q, 350); const da = useDebounce(actor, 350);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };
  const state = useFetch(() => adminApi.audit({ q: dq, action, actor: da, entityType, outcome, from, to, page, size: 15 }), [dq, action, da, entityType, outcome, from, to, page]);
  const cols = [
    { key: 't', header: 'When', render: (e) => <span style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(e.createdAt)}</span> },
    { key: 'a', header: 'Actor', render: (e) => <><div>{e.actorEmail}</div><div className="xs muted">{e.actorRole}</div></> },
    { key: 'ac', header: 'Action', render: (e) => <><Badge tone="outline">{ACTION_LABEL[e.action] || e.action}</Badge>{e.outcome === 'REJECTED' && <Badge tone="danger">Rejected</Badge>}</> },
    { key: 'r', header: 'Record', render: (e) => (e.entityType === 'Referral' && e.entityId ? <Link className="cell-link" to={`/app/referrals/${e.entityId}`}>{e.entityLabel}</Link> : `${e.entityType || ''} ${e.entityLabel || ''}`) },
    { key: 'd', header: 'Detail', render: (e) => <span className="small muted">{e.reason ? `Reason: ${e.reason}` : e.detail || '—'}</span> },
    { key: 'v', header: '', render: (e) => <Button size="sm" variant="secondary" onClick={() => setOpen(e)}>Details</Button> },
  ];
  return (
    <div className="stack">
      <p className="small muted">The audit log is append-only: events cannot be edited or deleted from the application. Passwords, tokens and secrets are never recorded.</p>
      <div className="grid cols-4">
        <Input label="Search events" icon="Search" value={q} onChange={reset(setQ)} placeholder="Actor, record or detail" />
        <Select label="Action" value={action} onChange={reset(setAction)} placeholder="All actions" options={Object.entries(ACTION_LABEL)} />
        <Input label="Actor e-mail" value={actor} onChange={reset(setActor)} />
        <Select label="Record type" value={entityType} onChange={reset(setEntityType)} placeholder="All records" options={['Referral', 'Hospital', 'User', 'Settings', 'Exception', 'Report'].map((x) => [x, x])} />
        <Select label="Outcome" value={outcome} onChange={reset(setOutcome)} placeholder="All outcomes" options={[['SUCCESS', 'Succeeded'], ['REJECTED', 'Rejected']]} />
        <Input label="From" type="date" value={from} onChange={reset(setFrom)} />
        <Input label="To" type="date" value={to} onChange={reset(setTo)} />
        <div style={{ alignSelf: 'end' }}><Button variant="secondary" icon="Download" loading={busy} onClick={() => run(async () => { try { downloadBlob(await adminApi.reportExport('audit', { from, to }), 'emergencylink-audit.csv'); } catch (e) { toast.error(e.message); } })}>Export CSV</Button></div>
      </div>
      <Async state={state} rows={6}>{(p) => <><Table caption="Audit events" columns={cols} rows={p.content} empty={<EmptyState icon="ScrollText" title="No events match" />} /><Pagination page={p.page} totalPages={p.totalPages} totalElements={p.totalElements} size={p.size} onPage={setPage} /></>}</Async>
      <Modal open={!!open} onClose={() => setOpen(null)} wide title="Audit event" footer={<Button onClick={() => setOpen(null)}>Close</Button>}>
        {open && (
          <dl className="kv">
            <DetailRow label="When">{fmtDateTime(open.createdAt)}</DetailRow>
            <DetailRow label="Actor">{`${open.actorEmail} (${open.actorRole})`}</DetailRow>
            <DetailRow label="Action">{ACTION_LABEL[open.action] || open.action}</DetailRow>
            <DetailRow label="Outcome">{open.outcome === 'REJECTED' ? 'Rejected (no change was made)' : 'Succeeded'}</DetailRow>
            <DetailRow label="Record">{`${open.entityType || ''} ${open.entityLabel || ''}`.trim()}</DetailRow>
            <DetailRow label="Reason">{open.reason}</DetailRow>
            <DetailRow label="Detail">{open.detail}</DetailRow>
            <DetailRow label="Before"><span style={{ whiteSpace: 'pre-wrap' }}>{open.before}</span></DetailRow>
            <DetailRow label="After"><span style={{ whiteSpace: 'pre-wrap' }}>{open.after}</span></DetailRow>
          </dl>
        )}
      </Modal>
    </div>
  );
}
