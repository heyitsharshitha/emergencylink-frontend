import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { hospitalApi, referralApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAction, useFetch } from '../hooks';
import { PageHeader, Timeline } from '../components/ui/data';
import { Alert, Badge, CapacityBar, Card, Freshness, SimNote, StatusBadge, UrgencyBadge } from '../components/ui/display';
import { Async, ConfirmDialog, ErrorState, LoadingState, useToast } from '../components/ui/feedback';
import { Button } from '../components/ui/forms';
import Icon from '../components/ui/Icon';
import MatchPanel from '../components/domain/MatchPanel';
import MessagePanel from '../components/domain/MessagePanel';
import AdminReferralPanel from '../components/domain/AdminReferralPanel';
import { RequirementPills } from '../components/domain/ReferralCard';
import { fmtDateTime, RESOURCE_LABEL } from '../utils/format';

const NEXT = {
  REFERRING: {
    CREATED: ['Run hospital matching', 'Compare hospitals against this referral’s stated requirements, then choose where to send it.', 'info'],
    MATCHING: ['Choose a receiving hospital', 'Review the compatibility breakdown below and send the referral to the hospital you select.', 'info'],
    SENT: ['Waiting for the receiving hospital', 'They have been notified. You will be notified when they open and decide on it.', 'neutral'],
    VIEWED: ['Waiting for a decision', 'The receiving hospital has opened the referral and is reviewing it.', 'neutral'],
    MORE_INFORMATION_REQUIRED: ['Action needed: provide information', 'The receiving hospital has asked for more information. Reply to move the referral forward.', 'warning'],
    ACCEPTED: ['Accepted: start the transfer when ready', 'Either hospital can mark the transfer as in progress.', 'info'],
    DECLINED: ['Declined: choose another hospital', 'Run matching again to pick a different receiving hospital.', 'warning'],
    TRANSFER_IN_PROGRESS: ['Transfer in progress', 'Mark the referral completed once the transfer is done.', 'info'],
    COMPLETED: ['Completed', 'This referral is closed. The full timeline is preserved.', 'neutral'],
    CANCELLED: ['Cancelled', 'This referral was cancelled.', 'neutral'],
  },
  RECEIVING: {
    SENT: ['New referral', 'Opening it records that you have viewed it.', 'info'],
    VIEWED: ['Decision needed', 'Review requirements and your resources, then accept, decline, or request more information.', 'warning'],
    MORE_INFORMATION_REQUIRED: ['Waiting for the referring hospital', 'You requested more information. You can still accept or decline.', 'neutral'],
    ACCEPTED: ['Accepted', 'Start the transfer when the patient is on the way.', 'info'],
    DECLINED: ['Declined', 'The referring hospital has been notified and can choose another hospital.', 'neutral'],
    TRANSFER_IN_PROGRESS: ['Transfer in progress', 'Mark it completed when the patient has arrived.', 'info'],
    COMPLETED: ['Completed', 'This referral is closed.', 'neutral'],
    CANCELLED: ['Cancelled', 'The referring hospital cancelled this referral.', 'neutral'],
  },
};

export default function ReferralDetail() {
  const { id } = useParams();
  const { user, isAdmin, isReferring, isReceiving } = useAuth();
  const { refreshUnread } = useApp();
  const loc = useLocation();
  const toast = useToast();
  const [busy, run] = useAction();
  const [dialog, setDialog] = useState(null); // { type, hospital? }
  const [matches, setMatches] = useState(null);
  const ref = useFetch(() => referralApi.get(id), [id]);
  const timeline = useFetch(() => referralApi.timeline(id), [id]);
  const r = ref.data;
  const actions = r?.allowedActions || [];
  const showMatch = r && (isAdmin || isReferring) && ['CREATED', 'MATCHING', 'DECLINED'].includes(r.status);
  const preview = useFetch(() => referralApi.preview(id), [id, r?.status], { enabled: !!showMatch });
  const target = useFetch(() => hospitalApi.get(r.targetHospital.id), [r?.targetHospital?.id], { enabled: !!r?.targetHospital });
  const viewed = useRef(false);

  const reloadAll = () => { ref.refresh(); timeline.refresh(); refreshUnread(); };

  // Receiving hospital opening a SENT referral records "viewed".
  useEffect(() => {
    if (r && actions.includes('VIEW') && !viewed.current) {
      viewed.current = true;
      referralApi.view(id).then(reloadAll).catch((e) => toast.error(e.message));
    }
  }, [r?.status]); // eslint-disable-line

  const act = (fn, msg) => run(async () => {
    try { await fn(); toast.success(msg); setDialog(null); setMatches(null); reloadAll(); preview.refresh(); }
    catch (e) { toast.error(e.message); setDialog(null); reloadAll(); }
  });

  const runMatch = () => run(async () => {
    try { const res = await referralApi.match(id); setMatches(res); toast.success(`Matching complete: ${res.length} hospitals compared.`); reloadAll(); }
    catch (e) { toast.error(e.message); }
  });

  if (ref.loading && !r) return <><PageHeader title="Referral" /><LoadingState rows={6} /></>;
  if (ref.error && !r) return <><PageHeader title="Referral" crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Referrals', to: '/app/referrals' }, { label: 'Not available' }]} /><ErrorState error={ref.error} onRetry={ref.reload} title="This referral is not available" /></>;

  const role = isReceiving ? 'RECEIVING' : 'REFERRING';
  const [nTitle, nText, nTone] = NEXT[role][r.status] || ['', '', 'neutral'];
  const matchResults = matches || preview.data;
  const canSend = actions.includes('SEND');
  const T = target.data;

  const dialogs = {
    accept: { title: 'Accept this referral?', msg: 'Your hospital confirms it can receive this patient. The referring hospital is notified and the decision is recorded with a timestamp.', label: 'Accept referral', note: 'Note for the referring hospital (optional)', required: false, go: (n) => act(() => referralApi.accept(id, n), 'Referral accepted.') },
    decline: { title: 'Decline this referral?', msg: 'The referring hospital will be notified and can choose another hospital.', label: 'Decline referral', danger: true, note: 'Reason for declining', required: true, go: (n) => act(() => referralApi.decline(id, n), 'Referral declined.') },
    info: { title: 'Request more information', msg: 'Your message is added to the conversation and the referring hospital is notified.', label: 'Send request', note: 'What do you need to know?', required: true, go: (n) => act(() => referralApi.requestInfo(id, n), 'Information requested.') },
    provide: { title: 'Provide the requested information', msg: 'Your reply is sent to the receiving hospital and the referral returns to “Viewed”.', label: 'Send information', note: 'Information for the receiving hospital', required: true, go: (n) => act(() => referralApi.provideInfo(id, n), 'Information sent.') },
    cancel: { title: 'Cancel this referral?', msg: 'This cannot be undone. If it was already sent, the receiving hospital is notified.', label: 'Cancel referral', danger: true, note: 'Reason (optional)', required: false, go: (n) => act(() => referralApi.cancel(id, n), 'Referral cancelled.') },
    transfer: { title: 'Start the transfer?', msg: 'Marks the referral as “In transfer” for both hospitals.', label: 'Start transfer', go: () => act(() => referralApi.startTransfer(id), 'Transfer started.') },
    complete: { title: 'Mark as completed?', msg: 'Confirms the transfer is finished and closes the referral.', label: 'Mark completed', go: () => act(() => referralApi.complete(id), 'Referral completed.') },
    send: { title: `Send to ${dialog?.hospital?.name || ''}?`, msg: 'The receiving hospital is notified immediately. Scores and distances are estimates; staff remain responsible for the choice.', label: 'Send referral', note: 'Message to the receiving hospital (optional)', required: false,
      go: (n) => act(() => referralApi.send(id, dialog.hospital.id, n), 'Referral sent.') },
  };
  const d = dialog ? dialogs[dialog.type] : null;

  return (
    <>
      <PageHeader title={r.referralCode} crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Referrals', to: '/app/referrals' }, { label: r.referralCode }]}
        description={`${r.emergencyCondition} · patient ID ${r.patientName}`}
        actions={<><Link className="btn btn-secondary" to={`/app/referrals/${id}/print`}><Icon name="Printer" />Print summary</Link><Button variant="secondary" icon="RefreshCw" onClick={reloadAll}>Refresh</Button></>} />
      <div className="row wrap" style={{ marginBottom: 16, gap: 8 }}><StatusBadge status={r.status} /><UrgencyBadge urgency={r.urgency} /><Badge tone="outline" icon="Stethoscope">{r.requiredSpecialty}</Badge><span className="small muted">Created {fmtDateTime(r.createdAt)} · updated {fmtDateTime(r.updatedAt)}</span></div>

      {loc.state?.justCreated && r.status === 'CREATED' && isReferring && <div style={{ marginBottom: 16 }}><Alert tone="success" title="Referral created">Next step: run hospital matching to compare receiving hospitals.</Alert></div>}
      {nTitle && (
        <div className={`next-action ${nTone === 'warning' ? 'warning' : nTone === 'neutral' ? 'neutral' : ''}`} role="status">
          <Icon name={nTone === 'warning' ? 'TriangleAlert' : 'ArrowRight'} size={22} />
          <div className="grow"><h3>Next: {nTitle}</h3><p>{nText}</p></div>
        </div>
      )}

      <div className="detail-grid">
        <div className="stack">
          <Card title="Referral information">
            <dl className="kv">
              <dt>Patient ID</dt><dd>{r.patientName}{r.age != null ? `, ${r.age} y` : ''}{r.gender ? `, ${r.gender}` : ''}</dd>
              <dt>Emergency condition</dt><dd>{r.emergencyCondition}</dd>
              <dt>Summary</dt><dd>{r.clinicalSummary || <span className="muted">None provided</span>}</dd>
              <dt>Additional notes</dt><dd>{r.additionalRequirements || <span className="muted">None</span>}</dd>
              <dt>Created by</dt><dd>{r.createdByName?.replace(/\s*\(Demo\)/, '') || '—'}</dd>
              {r.decidedAt && <><dt>Decision recorded</dt><dd>{fmtDateTime(r.decidedAt)}{r.decisionReason ? ` — ${r.decisionReason}` : ''}</dd></>}
            </dl>
          </Card>
          <Card title="Requirements"><div className="stack-sm"><RequirementPills r={r} />{r.resources?.map((x) => <Badge key={x.type} tone="outline" icon="Wrench">{RESOURCE_LABEL[x.type] || x.type} × {x.quantity}</Badge>)}
            {!r.icuRequired && !r.ventilatorRequired && !r.oxygenRequired && !r.bloodRequired && !r.facilities.length && !r.resources?.length && <span className="muted small">No special resources or facilities were requested.</span>}</div></Card>

          {showMatch && (
            <Card title="Hospital matching" actions={isReferring ? <Button icon="GitCompareArrows" loading={busy} onClick={runMatch}>{r.status === 'CREATED' ? 'Run matching' : 'Re-run matching'}</Button> : isAdmin ? <Button variant="secondary" icon="RefreshCw" loading={preview.loading} onClick={() => preview.reload()}>Refresh matches</Button> : null}>
              {r.status === 'CREATED' && !matchResults && !preview.loading && <Alert tone="info">Run matching to compare hospitals. This moves the referral to “Matching” and records it in the timeline.</Alert>}
              {preview.loading && !matchResults && <LoadingState rows={4} card={false} />}
              {preview.error && !matchResults && <ErrorState error={preview.error} onRetry={preview.reload} />}
              {matchResults && <MatchPanel results={matchResults} canSend={canSend} onSend={(m) => setDialog({ type: 'send', hospital: { id: m.hospitalId, name: m.hospitalName } })} />}
            </Card>
          )}

          {r.targetHospital && (
            <Card title="Communication"><MessagePanel referralId={r.id} code={r.referralCode} myId={user.id} canSend={actions.includes('MESSAGE')} /></Card>
          )}
        </div>

        <div className="stack">
          <Card title="Actions" className="sticky-card">
            <div className="stack-sm">
              {actions.includes('ACCEPT') && <Button icon="CircleCheck" block onClick={() => setDialog({ type: 'accept' })}>Accept referral</Button>}
              {actions.includes('REQUEST_INFO') && <Button variant="secondary" icon="MessageCircleQuestion" block onClick={() => setDialog({ type: 'info' })}>Request more information</Button>}
              {actions.includes('DECLINE') && <Button variant="danger-outline" icon="CircleX" block onClick={() => setDialog({ type: 'decline' })}>Decline referral</Button>}
              {actions.includes('PROVIDE_INFO') && <Button icon="MessageCircleReply" block onClick={() => setDialog({ type: 'provide' })}>Provide information</Button>}
              {actions.includes('MATCH') && !showMatch && <Button icon="GitCompareArrows" block loading={busy} onClick={runMatch}>Run matching</Button>}
              {actions.includes('MATCH') && showMatch && <p className="small muted">Run matching and send from the “Hospital matching” section.</p>}
              {actions.includes('SEND') && r.targetHospital && <Button variant="secondary" icon="Send" block onClick={() => setDialog({ type: 'send', hospital: { id: r.targetHospital.id, name: r.targetHospital.name } })}>Send to preferred: {r.targetHospital.name}</Button>}
              {actions.includes('START_TRANSFER') && <Button icon="Ambulance" block onClick={() => setDialog({ type: 'transfer' })}>Start transfer</Button>}
              {actions.includes('COMPLETE') && <Button icon="BadgeCheck" block onClick={() => setDialog({ type: 'complete' })}>Mark completed</Button>}
              {actions.includes('CANCEL') && <Button variant="danger-outline" icon="Ban" block onClick={() => setDialog({ type: 'cancel' })}>Cancel referral</Button>}
              {actions.filter((a) => a !== 'MESSAGE' && a !== 'VIEW').length === 0 && <p className="small muted">{isAdmin ? 'Use the administrator actions below to correct, reassign or cancel this referral.' : 'No actions are available in the current status.'}</p>}
            </div>
          </Card>

          {isAdmin && <AdminReferralPanel r={r} onChanged={() => { reloadAll(); if (showMatch) preview.refresh(); }} />}

          <Card title="Hospitals">
            <div className="stack">
              <div><div className="xs muted">Referring hospital</div><strong>{r.referringHospital.name}</strong><div className="small muted">{r.referringHospital.city}{r.referringHospital.emergencyContact ? ` · ${r.referringHospital.emergencyContact}` : ''}</div></div>
              <div><div className="xs muted">Receiving hospital</div>{r.targetHospital ? (<><strong><Link to={`/app/hospitals/${r.targetHospital.id}`}>{r.targetHospital.name}</Link></strong><div className="small muted">{r.targetHospital.city}{r.targetHospital.emergencyContact ? ` · ${r.targetHospital.emergencyContact}` : ''}</div></>) : <span className="muted small">Not assigned yet</span>}</div>
            </div>
          </Card>

          {r.targetHospital && (
            <Card title={isReceiving ? 'Your resources' : 'Receiving hospital availability'}>
              <Async state={target} rows={3}>
                {() => (
                  <div className="stack">
                    <Freshness updatedAt={T.lastResourceUpdate} stale={T.resourcesStale} />
                    {T.resources.filter((x) => (x.type === 'ICU_BED' && r.icuRequired) || (x.type === 'VENTILATOR' && r.ventilatorRequired) || (x.type === 'BLOOD_UNITS' && r.bloodRequired) || (x.type === 'OXYGEN_POINTS' && r.oxygenRequired) || ['EMERGENCY_BED', 'GENERAL_BED'].includes(x.type)).map((x) => (
                      <CapacityBar key={x.type} label={x.label} available={x.available} total={x.total} unit={x.unit} stale={x.stale} updatedAt={x.updatedAt} />
                    ))}
                    <SimNote />
                  </div>
                )}
              </Async>
            </Card>
          )}

          <Card title="Timeline & audit trail">
            <Async state={timeline} rows={4}>{(t) => <Timeline events={t} />}</Async>
          </Card>
        </div>
      </div>

      {d && <ConfirmDialog open onClose={() => setDialog(null)} title={d.title} message={d.msg} confirmLabel={d.label} danger={d.danger} busy={busy}
        noteLabel={d.note} noteRequired={d.required} onConfirm={d.go} />}
    </>
  );
}
