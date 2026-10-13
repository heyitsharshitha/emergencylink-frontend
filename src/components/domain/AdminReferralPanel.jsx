import { useState } from 'react';
import { adminApi, catalogApi, referralApi } from '../../api/services';
import { useAction, useFetch } from '../../hooks';
import { Alert, Badge, Card } from '../ui/display';
import { Async, ConfirmDialog, EmptyState, Modal, useToast } from '../ui/feedback';
import { Button, Select, Textarea } from '../ui/forms';
import { URGENCY, fmtDateTime } from '../../utils/format';

// Mirrors the backend rules. The backend enforces them; these only decide which buttons are offered.
export const ADMIN_EDITABLE = ['CREATED', 'MATCHING', 'SENT', 'VIEWED', 'MORE_INFORMATION_REQUIRED', 'DECLINED'];
export const ADMIN_REASSIGNABLE = ['SENT', 'VIEWED', 'MORE_INFORMATION_REQUIRED', 'ACCEPTED', 'DECLINED'];
export const ADMIN_CANCELLABLE = ['CREATED', 'MATCHING', 'SENT', 'VIEWED', 'MORE_INFORMATION_REQUIRED', 'ACCEPTED'];

function EditModal({ r, onClose, onDone }) {
  const catalog = useFetch(() => catalogApi.get(), []);
  const [urgency, setUrgency] = useState(r.urgency);
  const [specialty, setSpecialty] = useState(r.requiredSpecialty || '');
  const [extra, setExtra] = useState(r.additionalRequirements || '');
  const [reason, setReason] = useState('');
  const [busy, run] = useAction();
  const toast = useToast();
  const changes = [];
  if (urgency !== r.urgency) changes.push(`Urgency: ${URGENCY[r.urgency]?.label || r.urgency} → ${URGENCY[urgency]?.label || urgency}`);
  if (specialty && specialty !== (r.requiredSpecialty || '')) changes.push(`Specialty: ${r.requiredSpecialty || 'none'} → ${specialty}`);
  if (extra.trim() !== (r.additionalRequirements || '').trim()) changes.push('Additional notes will be updated');
  const ready = changes.length > 0 && reason.trim().length > 0;
  const apply = () => run(async () => {
    try {
      await adminApi.editReferral(r.id, { urgency, requiredSpecialty: specialty || null, additionalRequirements: extra, reason: reason.trim() });
      toast.success('Correction recorded.'); onDone();
    } catch (e) { toast.error(e.message); }
  });
  return (
    <Modal open onClose={busy ? () => {} : onClose} title="Correct referral details"
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button loading={busy} disabled={!ready} onClick={apply}>Apply correction</Button></>}>
      <div className="stack">
        <p className="muted small">Only administrative fields can be corrected. Clinical content, decisions and messages are never rewritten. The change, your reason and your name are recorded on the timeline and in the audit log.</p>
        <Select label="Urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)} options={Object.entries(URGENCY).map(([k, v]) => [k, v.label])} />
        <Async state={catalog} rows={1}>{(c) => <Select label="Required specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} options={c.specialties} />}</Async>
        <Textarea label="Additional requirements (non-clinical coordination notes)" value={extra} maxLength={1000} onChange={(e) => setExtra(e.target.value)} />
        <Textarea label="Reason for this correction" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div aria-live="polite">
          {changes.length ? <Alert tone="info" title="This will change"><ul style={{ margin: 0, paddingLeft: 18 }}>{changes.map((c) => <li key={c}>{c}</li>)}</ul></Alert>
            : <p className="small muted">Change at least one field to continue.</p>}
        </div>
      </div>
    </Modal>
  );
}

function ReassignModal({ r, onClose, onDone }) {
  const preview = useFetch(() => referralApi.preview(r.id), [r.id]);
  const [hospitalId, setHospitalId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, run] = useAction();
  const toast = useToast();
  const options = (preview.data || []).filter((m) => m.hospitalId !== r.targetHospital?.id && m.hospitalId !== r.referringHospital.id)
    .map((m) => [String(m.hospitalId), `${m.hospitalName} (${m.score}% compatibility)`]);
  const chosen = options.find(([v]) => v === hospitalId);
  const apply = () => run(async () => {
    try { await adminApi.reassignReferral(r.id, Number(hospitalId), reason.trim()); toast.success('Referral reassigned. Hospitals notified.'); onDone(); }
    catch (e) { toast.error(e.message); }
  });
  return (
    <Modal open onClose={busy ? () => {} : onClose} title="Reassign to another hospital"
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button loading={busy} disabled={!hospitalId || !reason.trim()} onClick={apply}>Reassign referral</Button></>}>
      <div className="stack">
        <p className="muted small">Candidates come from the same rule-based matching used by referring hospitals. Scores are estimates; the responsible teams make the final decision.</p>
        <Async state={preview} rows={2}>{() => (options.length
          ? <Select label="New receiving hospital" required value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} placeholder="Choose a hospital" options={options} />
          : <EmptyState icon="SearchX" title="No other eligible hospitals" />)}</Async>
        <Textarea label="Reason for reassigning" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        {chosen && (
          <Alert tone="warning" title="What happens next">
            {r.targetHospital ? `${r.targetHospital.name} is notified that the referral was moved. ` : ''}The new hospital receives it as a newly sent referral and any earlier decision is cleared. The referring hospital is notified and the move appears on the timeline.
          </Alert>
        )}
      </div>
    </Modal>
  );
}

function NotesCard({ r }) {
  const notes = useFetch(() => adminApi.notes(r.id), [r.id]);
  const [body, setBody] = useState('');
  const [busy, run] = useAction();
  const toast = useToast();
  const add = () => run(async () => {
    try { await adminApi.addNote(r.id, body.trim()); setBody(''); toast.success('Note added.'); notes.refresh(); }
    catch (e) { toast.error(e.message); }
  });
  return (
    <Card title="Internal notes">
      <div className="stack">
        <p className="xs muted">Visible to administrators only. Not shown to hospitals and separate from referral messages.</p>
        <Async state={notes} rows={2}>{(list) => (list.length
          ? <ul className="stack-sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>{list.map((n) => (
            <li key={n.id}><div className="small">{n.body}</div><div className="xs muted">{n.authorLabel} · {fmtDateTime(n.createdAt)}</div></li>))}</ul>
          : <p className="small muted">No internal notes yet.</p>)}</Async>
        <Textarea label="Add a note" value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} />
        <Button variant="secondary" loading={busy} disabled={!body.trim()} onClick={add}>Add note</Button>
      </div>
    </Card>
  );
}

export default function AdminReferralPanel({ r, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [busy, run] = useAction();
  const toast = useToast();
  const close = () => setDialog(null);
  const done = () => { close(); onChanged(); };
  const act = (fn, msg) => run(async () => { try { await fn(); toast.success(msg); done(); } catch (e) { toast.error(e.message); close(); onChanged(); } });
  const canEdit = ADMIN_EDITABLE.includes(r.status);
  const canReassign = ADMIN_REASSIGNABLE.includes(r.status);
  const canCancel = ADMIN_CANCELLABLE.includes(r.status);
  const locked = r.status === 'TRANSFER_IN_PROGRESS' || r.status === 'COMPLETED' || r.status === 'CANCELLED';
  return (
    <>
      <Card title="Administrator actions">
        <div className="stack-sm">
          {r.adminFlagged && <Alert tone="warning" title="Flagged for review">{r.flagReason || 'No reason recorded.'}</Alert>}
          <Button variant="secondary" icon="Edit3" block disabled={!canEdit} onClick={() => setDialog('edit')}>Correct details</Button>
          <Button variant="secondary" icon="Route" block disabled={!canReassign} onClick={() => setDialog('reassign')}>Reassign hospital</Button>
          <Button variant="danger-outline" icon="Ban" block disabled={!canCancel} onClick={() => setDialog('cancel')}>Cancel referral</Button>
          {r.adminFlagged
            ? <Button variant="secondary" icon="CheckCircle2" block onClick={() => setDialog('unflag')}>Resolve flag</Button>
            : <Button variant="secondary" icon="TriangleAlert" block onClick={() => setDialog('flag')}>Flag for review</Button>}
          {locked && <p className="xs muted">{r.status === 'TRANSFER_IN_PROGRESS' ? 'The patient is in transfer, so corrections are locked to protect the receiving hospital’s decision.' : 'This referral is closed. Its history is preserved.'}</p>}
          {!locked && !canEdit && <p className="xs muted">Details cannot be edited after acceptance. Reassign or cancel instead; both hospitals are notified.</p>}
          <Badge tone="outline" icon="Lock">All actions need a reason and are audited</Badge>
        </div>
      </Card>
      <NotesCard r={r} />
      {dialog === 'edit' && <EditModal r={r} onClose={close} onDone={done} />}
      {dialog === 'reassign' && <ReassignModal r={r} onClose={close} onDone={done} />}
      <ConfirmDialog open={dialog === 'cancel'} onClose={close} busy={busy} danger title="Cancel this referral?"
        message="This cannot be undone. The hospitals involved are notified and the cancellation is recorded with your reason."
        confirmLabel="Cancel referral" noteLabel="Reason for cancelling" noteRequired onConfirm={(n) => act(() => adminApi.cancelReferral(r.id, n), 'Referral cancelled.')} />
      <ConfirmDialog open={dialog === 'flag'} onClose={close} busy={busy} title="Flag for administrative review?"
        message="The flag is internal. Hospitals are not notified and the referral keeps moving."
        confirmLabel="Flag referral" noteLabel="Why does this need review?" noteRequired onConfirm={(n) => act(() => adminApi.flagReferral(r.id, n), 'Referral flagged.')} />
      <ConfirmDialog open={dialog === 'unflag'} onClose={close} busy={busy} title="Resolve the flag?"
        confirmLabel="Resolve flag" noteLabel="How was it resolved?" noteRequired onConfirm={(n) => act(() => adminApi.resolveFlag(r.id, n), 'Flag resolved.')} />
    </>
  );
}
