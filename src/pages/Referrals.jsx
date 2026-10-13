import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogApi, referralApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useDebounce, useFetch, useSessionState } from '../hooks';
import { PageHeader, Pagination, Table } from '../components/ui/data';
import { Card, StatusBadge, UrgencyBadge } from '../components/ui/display';
import { Async, EmptyState } from '../components/ui/feedback';
import { Button, Input, Segmented, Select } from '../components/ui/forms';
import Icon from '../components/ui/Icon';
import ReferralCard from '../components/domain/ReferralCard';
import SavedFilters from '../components/domain/SavedFilters';
import { STATUS, URGENCY, fmtDateTime, timeAgo } from '../utils/format';

const VIEWS = [['', 'All'], ['urgent', 'Urgent'], ['awaiting', 'Awaiting decision'], ['overdue', 'Waiting too long'], ['recent', 'Recently updated']];
const ADMIN_VIEWS = [['flagged', 'Flagged for review']];
const BASE = { q: '', status: '', urgency: '', specialty: '', hospital: '', from: '', to: '', view: '', sort: 'updatedAt', dir: 'desc', layout: 'table', page: 0 };

export default function Referrals() {
  const { isReferring, isReceiving, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  // Filters are retained for the browser session so users return to the same view.
  const [f, setF] = useSessionState('el_referral_filters', BASE);
  const dq = useDebounce(f.q, 350);
  const dh = useDebounce(f.hospital, 350);
  const cat = useFetch(() => catalogApi.get(), []);

  // Deep links from the dashboard (?view=urgent, ?status=SENT) override saved filters once.
  useEffect(() => {
    const view = params.get('view'), status = params.get('status');
    if (view !== null || status !== null) { setF((s) => ({ ...BASE, layout: s.layout, view: view || '', status: status || '', sort: view === 'urgent' ? 'priority' : 'updatedAt' })); setParams({}, { replace: true }); }
  }, []); // eslint-disable-line

  const query = { q: dq, status: f.status, urgency: f.urgency, specialty: f.specialty, hospital: dh, from: f.from, to: f.to, view: f.view, sort: f.sort, dir: f.dir, page: f.page, size: f.layout === 'cards' ? 9 : 10 };
  const list = useFetch(() => referralApi.list(query), [JSON.stringify(query)]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v, page: k === 'page' ? v : 0 }));
  const hasFilters = ['q', 'status', 'urgency', 'specialty', 'hospital', 'from', 'to', 'view'].some((k) => f[k]);
  const onSort = (key) => setF((s) => ({ ...s, sort: key, dir: s.sort === key && s.dir === 'desc' ? 'asc' : 'desc', page: 0 }));

  const cols = [
    { key: 'referralCode', header: 'Referral', sortKey: 'referralCode', render: (r) => <Link className="cell-link" to={`/app/referrals/${r.id}`}>{r.referralCode}</Link> },
    { key: 'urgency', header: 'Urgency', render: (r) => <UrgencyBadge urgency={r.urgency} /> },
    { key: 'patient', header: 'Patient ID', render: (r) => <><div>{r.patientName}</div><div className="xs muted truncate" style={{ maxWidth: 220 }}>{r.emergencyCondition}</div></> },
    { key: 'spec', header: 'Specialty', render: (r) => r.requiredSpecialty },
    { key: 'hospitals', header: isReceiving ? 'From' : 'Receiving hospital', render: (r) => (isReceiving ? r.referringHospital.name : r.targetHospital?.name || <span className="muted">Not assigned</span>) },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', header: 'Updated', sortKey: 'updatedAt', render: (r) => <span title={fmtDateTime(r.updatedAt)}>{timeAgo(r.updatedAt)}</span> },
  ];

  return (
    <>
      <PageHeader title={isReceiving ? 'Incoming referrals' : 'Referrals'}
        description={isReceiving ? 'Referrals sent to your hospital. Open one to review requirements and accept, decline or request more information.' : 'All referrals raised by your hospital. Search, filter and open one to match hospitals or follow its progress.'}
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Referrals' }]}
        actions={isReferring && <Link className="btn btn-primary" to="/app/referrals/new"><Icon name="Plus" />New referral</Link>} />
      <div className="stack">
        <div className="row between wrap">
          <div className="view-chips" role="group" aria-label="Saved views">
            {[...VIEWS, ...(isAdmin ? ADMIN_VIEWS : [])].map(([v, l]) => <button key={v || 'all'} className="chip" aria-pressed={f.view === v} onClick={() => setF((s) => ({ ...s, view: v, page: 0, sort: v === 'urgent' ? 'priority' : s.sort === 'priority' ? 'updatedAt' : s.sort }))}>{l}</button>)}
          </div>
          <Segmented label="Layout" value={f.layout} onChange={(v) => set('layout', v)} options={[['table', 'Table', 'List'], ['cards', 'Cards', 'LayoutGrid']]} />
        </div>
        <SavedFilters scope="referrals" current={f} canSave={hasFilters} onApply={(flt) => setF((s) => ({ ...BASE, layout: s.layout, ...flt, page: 0 }))} />
        <Card bodyClass="tight">
          <div className="filters">
            <Input label="Search" icon="Search" placeholder="Referral ID, patient ID, condition" value={f.q} onChange={(e) => set('q', e.target.value)} />
            <Select label="Status" value={f.status} onChange={(e) => set('status', e.target.value)} placeholder="Any status" options={Object.entries(STATUS).map(([k, v]) => [k, v.label])} />
            <Select label="Urgency" value={f.urgency} onChange={(e) => set('urgency', e.target.value)} placeholder="Any urgency" options={Object.entries(URGENCY).map(([k, v]) => [k, v.label])} />
            <Select label="Specialty" value={f.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="Any specialty" options={cat.data?.specialties || []} />
            <Input label="Hospital" value={f.hospital} onChange={(e) => set('hospital', e.target.value)} placeholder="Name contains…" />
            <Input label="Created from" type="date" value={f.from} onChange={(e) => set('from', e.target.value)} />
            <Input label="Created to" type="date" value={f.to} onChange={(e) => set('to', e.target.value)} />
            <div><Button variant="ghost" icon="X" disabled={!hasFilters} onClick={() => setF({ ...BASE, layout: f.layout })}>Clear filters</Button></div>
          </div>
        </Card>
        <Async state={list} rows={5}>
          {(p) => {
            if (p.content.length === 0) {
              return (
                <Card><EmptyState icon={hasFilters ? 'SearchX' : 'FileText'} title={hasFilters ? 'No referrals match these filters' : isReceiving ? 'No incoming referrals yet' : 'No referrals yet'}
                  action={hasFilters ? <Button variant="secondary" onClick={() => setF({ ...BASE, layout: f.layout })}>Clear filters</Button> : isReferring ? <Link className="btn btn-primary" to="/app/referrals/new">Create a referral</Link> : undefined}>
                  {hasFilters ? 'Try removing a filter or widening the date range.' : isReceiving ? 'When a referring hospital sends you a referral it will appear here and you will be notified.' : 'Create a referral to start coordinating a patient transfer.'}</EmptyState></Card>
              );
            }
            return (
              <>
                {f.layout === 'cards'
                  ? <div className="grid cols-3">{p.content.map((r) => <ReferralCard key={r.id} r={r} />)}</div>
                  : <Table caption="Referrals" columns={cols} rows={p.content} sort={{ key: f.sort, dir: f.dir }} onSort={onSort} />}
                <Pagination page={p.page} totalPages={p.totalPages} totalElements={p.totalElements} size={p.size} onPage={(n) => set('page', n)} />
              </>
            );
          }}
        </Async>
      </div>
    </>
  );
}
