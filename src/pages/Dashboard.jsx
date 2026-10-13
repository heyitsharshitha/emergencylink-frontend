import { Link } from 'react-router-dom';
import { dashboardApi, referralApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Alert, Card, CapacityBar, Freshness, SimNote, StatCard } from '../components/ui/display';
import { Async, EmptyState, LoadingState } from '../components/ui/feedback';
import { Button } from '../components/ui/forms';
import Icon from '../components/ui/Icon';
import ReferralCard from '../components/domain/ReferralCard';
import { HospitalChart, StatusChart, TimeChart } from '../components/domain/Charts';
import { EVENT_META, timeAgo } from '../utils/format';
import { useApp } from '../context/AppContext';

function Activity({ items }) {
  if (!items?.length) return <EmptyState icon="Activity" title="No activity yet">Referral events and decisions will appear here as they happen.</EmptyState>;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((a, i) => {
        const m = EVENT_META[a.eventType] || { icon: 'Info', tone: 'neutral', label: a.eventType };
        return (
          <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--grey-100)', display: 'flex', gap: 12 }}>
            <span className={`tl-dot ${m.tone}`} style={{ position: 'static', flex: 'none' }}><Icon name={m.icon} size={14} /></span>
            <div className="grow">
              <div className="small"><Link to={`/app/referrals/${a.referralId}`} style={{ fontWeight: 650 }}>{a.referralCode}</Link> · {m.label}</div>
              {a.description && a.description !== a.eventType && <div className="xs muted truncate">{a.description}</div>}
              <div className="xs muted">{timeAgo(a.createdAt)}{a.actorLabel ? ` · ${a.actorLabel}` : ''}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isReferring, isReceiving } = useAuth();
  const { status } = useApp();
  const dash = useFetch(() => dashboardApi.get(), []);
  const urgent = useFetch(() => referralApi.list({ view: 'urgent', sort: 'priority', size: 4 }), []);

  const title = isAdmin ? 'System overview' : isReceiving ? 'Incoming referral desk' : 'Referral operations';
  const desc = isAdmin ? 'Network-wide referral activity, resource availability and system health .'
    : isReceiving ? 'Referrals sent to your hospital, decisions waiting on you, and your current resource availability.'
      : 'Track referrals you have raised, see which need attention, and keep your availability up to date.';

  return (
    <>
      <PageHeader title={title} description={desc} updatedAt={dash.data?.generatedAt}
        actions={<>
          <Button variant="secondary" icon="RefreshCw" onClick={() => { dash.reload(); urgent.reload(); }}>Refresh</Button>
          {isReferring && <Link className="btn btn-primary" to="/app/referrals/new"><Icon name="Plus" />New referral</Link>}
        </>} />
      <Async state={dash} rows={6}>
        {(d) => {
          const k = d.kpis;
          const staleOwn = d.ownResources?.filter((r) => r.stale && r.total > 0);
          return (
            <div className="stack">
              {!isAdmin && staleOwn?.length > 0 && (
                <Alert tone="warning" title="Some of your availability data is stale" actions={<Link className="btn btn-secondary btn-sm" to="/app/resources">Update resources</Link>}>
                  {staleOwn.length} resource{staleOwn.length > 1 ? 's have' : ' has'} not been updated recently. Other hospitals will see them as needing confirmation.
                </Alert>
              )}
              {isAdmin ? (
                <div className="grid cols-4">
                  <StatCard icon="Building2" label="Hospitals" value={k.hospitals} hint={`${k.activeHospitals} active`} />
                  <StatCard icon="FileText" label="Total referrals" value={k.total} to="/app/referrals" as={Link} />
                  <StatCard icon="Clock3" tone="warning" label="Pending" value={k.pending} hint="Not yet decided" />
                  <StatCard icon="Users" label="Users" value={k.users} />
                  <StatCard icon="CircleCheck" tone="success" label="Accepted" value={k.accepted} hint="Incl. in transfer" />
                  <StatCard icon="CircleX" tone="danger" label="Declined" value={k.declined} />
                  <StatCard icon="BadgeCheck" tone="success" label="Completed" value={k.completed} />
                  <StatCard icon="Timer" label="Avg. creation → decision" value={d.avgDecisionMinutes != null ? `${d.avgDecisionMinutes} min` : '—'} hint="From recorded decisions" />
                </div>
              ) : (
                <div className="grid cols-4">
                  {isReceiving ? (<>
                    <StatCard icon="Inbox" label="Incoming (unseen)" value={k.incoming} to="/app/referrals?status=SENT" as={Link} />
                    <StatCard icon="Siren" tone="danger" label="Urgent requests" value={k.urgent} to="/app/referrals?view=urgent" as={Link} hint="Critical or urgent, still open" />
                    <StatCard icon="Clock3" tone="warning" label="Pending decisions" value={k.awaitingDecision} to="/app/referrals?view=awaiting" as={Link} />
                    <StatCard icon="CircleCheck" tone="success" label="Accepted" value={k.accepted} to="/app/referrals?status=ACCEPTED" as={Link} />
                  </>) : (<>
                    <StatCard icon="Activity" label="Active referrals" value={k.active} to="/app/referrals" as={Link} />
                    <StatCard icon="Clock3" tone="warning" label="Pending" value={k.pending} to="/app/referrals?view=awaiting" as={Link} hint="Waiting on a decision or action" />
                    <StatCard icon="Siren" tone="danger" label="Urgent" value={k.urgent} to="/app/referrals?view=urgent" as={Link} hint="Critical or urgent, still open" />
                    <StatCard icon="CircleCheck" tone="success" label="Accepted" value={k.accepted} to="/app/referrals?status=ACCEPTED" as={Link} />
                  </>)}
                  <StatCard icon="CircleX" tone="danger" label="Declined" value={k.declined} to="/app/referrals?status=DECLINED" as={Link} />
                  <StatCard icon="BadgeCheck" tone="success" label="Completed" value={k.completed} to="/app/referrals?status=COMPLETED" as={Link} />
                  <StatCard icon="FileText" label="All referrals" value={k.total} to="/app/referrals" as={Link} />
                  <StatCard icon="Timer" label="Avg. creation → decision" value={d.avgDecisionMinutes != null ? `${d.avgDecisionMinutes} min` : '—'} hint="From recorded decisions" />
                </div>
              )}

              {k.total === 0 && (
                <Card><EmptyState icon="FilePlus2" title={isReferring ? 'Create your first referral' : 'No referrals yet'}
                  action={isReferring ? <Link className="btn btn-primary" to="/app/referrals/new">Create a referral</Link> : undefined}>
                  {isReferring ? 'Start with a guided form, run rule-based matching, then send it to a receiving hospital.' : isReceiving ? 'Referrals sent to your hospital will appear here. Keep your resources up to date so referring hospitals see accurate availability.' : 'Referral activity will appear here once hospitals start using the platform.'}</EmptyState></Card>
              )}

              <div className="detail-grid">
                <div className="stack">
                  <Card title="Needs attention" actions={<Link to="/app/referrals?view=urgent" className="small">View all</Link>}>
                    <Async state={urgent} rows={3}>
                      {(p) => p.content.length === 0
                        ? <EmptyState icon="CircleCheck" title="Nothing urgent right now">Critical and urgent open referrals will be prioritised here.</EmptyState>
                        : <div className="grid cols-2">{p.content.map((r) => <ReferralCard key={r.id} r={r} />)}</div>}
                    </Async>
                  </Card>
                  <div className="grid cols-2">
                    <Card title="Status distribution"><StatusChart distribution={d.statusDistribution} /></Card>
                    <Card title="Referrals, last 14 days"><TimeChart points={d.referralsOverTime} /></Card>
                  </div>
                  {isAdmin && <Card title="Hospital activity"><HospitalChart rows={d.hospitalActivity} /></Card>}
                </div>
                <div className="stack">
                  {!isAdmin && (
                    <Card title="Your resource availability" actions={<Link className="small" to="/app/resources">Manage</Link>}>
                      <div className="stack">
                        {d.ownResources.filter((r) => ['ICU_BED', 'EMERGENCY_BED', 'VENTILATOR', 'BLOOD_UNITS'].includes(r.type)).map((r) => (
                          <CapacityBar key={r.type} label={r.label} available={r.available} total={r.total} unit={r.unit} stale={r.stale} updatedAt={r.updatedAt} />
                        ))}
                        <SimNote />
                      </div>
                    </Card>
                  )}
                  <Card title="Recent activity"><Activity items={d.recentActivity} /></Card>
                  <Card title="Network status" className="tint">
                    <div className="stack-sm small">
                      <div className="row between"><span>Backend</span>{status.data ? <span className="badge success"><Icon name="Check" size={12} />Reachable</span> : <span className="badge danger">Unavailable</span>}</div>
                      <div className="row between"><span>Latest resource update</span>{status.data && <Freshness updatedAt={status.data.lastResourceUpdate} stale={false} compact />}</div>
                      <Link to="/app/network" className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}><Icon name="Network" />Open emergency network</Link>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          );
        }}
      </Async>
    </>
  );
}
