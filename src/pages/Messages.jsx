import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { referralApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Card, StatusBadge, UrgencyBadge } from '../components/ui/display';
import { Async, EmptyState } from '../components/ui/feedback';
import MessagePanel from '../components/domain/MessagePanel';
import { timeAgo } from '../utils/format';

export default function Messages() {
  const { user, isAdmin } = useAuth();
  const [params] = useSearchParams();
  const list = useFetch(() => referralApi.list({ sort: 'updatedAt', dir: 'desc', size: 50 }), []);
  const [sel, setSel] = useState(params.get('referral') ? Number(params.get('referral')) : null);
  const convos = (list.data?.content || []).filter((r) => r.targetHospital && !['CREATED', 'MATCHING'].includes(r.status));
  useEffect(() => { if (!sel && convos.length) setSel(convos[0].id); }, [convos.length]); // eslint-disable-line
  const cur = convos.find((r) => r.id === sel);

  return (
    <>
      <PageHeader title="Messages" description="Every conversation belongs to a referral, so the whole coordination history stays in one place."
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Messages' }]} />
      <Async state={list} rows={5}>
        {() => convos.length === 0 ? (
          <Card><EmptyState icon="MessageSquare" title="No conversations yet" action={!isAdmin && <Link className="btn btn-secondary" to="/app/referrals">Go to referrals</Link>}>
            Messaging opens once a referral has been sent to a hospital. Conversations will be listed here.</EmptyState></Card>
        ) : (
          <div className="inbox">
            <Card className="flat" bodyClass="" title="Conversations">
              <div style={{ margin: '-20px', maxHeight: 520, overflowY: 'auto' }}>
                {convos.map((r) => (
                  <button key={r.id} className="inbox-item" aria-current={r.id === sel} onClick={() => setSel(r.id)}>
                    <div className="row between"><strong>{r.referralCode}</strong><span className="xs muted">{timeAgo(r.updatedAt)}</span></div>
                    <div className="small truncate">{r.emergencyCondition}</div>
                    <div className="row wrap" style={{ gap: 6, marginTop: 6 }}><StatusBadge status={r.status} /><UrgencyBadge urgency={r.urgency} /></div>
                    <div className="xs muted truncate" style={{ marginTop: 4 }}>{r.referringHospital.name} → {r.targetHospital.name}</div>
                  </button>
                ))}
              </div>
            </Card>
            <Card title={cur ? `${cur.referralCode} · ${cur.emergencyCondition}` : 'Conversation'} actions={cur && <Link className="small" to={`/app/referrals/${cur.id}`}>Open referral</Link>}>
              {cur ? <MessagePanel key={cur.id} referralId={cur.id} code={cur.referralCode} myId={user.id} canSend={cur.allowedActions.includes('MESSAGE')} />
                : <EmptyState icon="MessageSquare" title="Select a conversation" />}
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
