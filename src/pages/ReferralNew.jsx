import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, hospitalApi, referralApi } from '../api/services';
import { useAction, useFetch, useSessionState } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Alert, Badge, Card } from '../components/ui/display';
import { Button, Check, Input, Select, Textarea } from '../components/ui/forms';
import { ConfirmDialog, useToast } from '../components/ui/feedback';
import Icon from '../components/ui/Icon';
import { URGENCY } from '../utils/format';

const STEPS = ['Patient', 'Emergency', 'Specialty', 'Resources', 'Facilities', 'Receiving hospital', 'Additional', 'Review'];
const INIT = { patientName: '', age: '', gender: '', emergencyCondition: '', clinicalSummary: '', urgency: '', requiredSpecialty: '', icuRequired: false, ventilatorRequired: false,
  oxygenRequired: false, bloodRequired: false, bloodGroup: '', needTheatre: false, needSpecialist: false, facilities: [], targetHospitalId: '', additionalRequirements: '' };

/** Data-completeness aid only. It checks coordination fields, never medical content. */
export function completeness(f) {
  const rows = [
    { key: 'patientName', label: 'Patient identifier', ok: !!f.patientName.trim(), required: true, step: 0 },
    { key: 'emergencyCondition', label: 'Emergency condition', ok: !!f.emergencyCondition.trim(), required: true, step: 1 },
    { key: 'urgency', label: 'Urgency level', ok: !!f.urgency, required: true, step: 1 },
    { key: 'requiredSpecialty', label: 'Required specialty', ok: !!f.requiredSpecialty, required: true, step: 2 },
    { key: 'age', label: 'Age', ok: f.age !== '', required: false, step: 0 },
    { key: 'clinicalSummary', label: 'Summary for the receiving team', ok: !!f.clinicalSummary.trim(), required: false, step: 1 },
    { key: 'bloodGroup', label: 'Blood group (blood requested)', ok: !f.bloodRequired || !!f.bloodGroup, required: false, step: 3 },
    { key: 'needs', label: 'At least one resource or facility stated', ok: f.icuRequired || f.ventilatorRequired || f.oxygenRequired || f.bloodRequired || f.needTheatre || f.needSpecialist || f.facilities.length > 0, required: false, step: 3 },
  ];
  const req = rows.filter((r) => r.required);
  return { rows, requiredDone: req.filter((r) => r.ok).length, requiredTotal: req.length, missingRequired: req.filter((r) => !r.ok), missingOptional: rows.filter((r) => !r.required && !r.ok),
    percent: Math.round((rows.filter((r) => r.ok).length / rows.length) * 100) };
}

export function CompletenessPanel({ c, onGo }) {
  return (
    <Card title="Completeness check" className="tint">
      <div className="stack-sm">
        <div className="cap-track" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Referral completeness"><div className="cap-fill" style={{ width: `${c.percent}%` }} /></div>
        <div className="small"><b>{c.percent}%</b> complete · {c.requiredDone}/{c.requiredTotal} required fields</div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {c.rows.map((r) => (
            <li key={r.key} className="small row" style={{ gap: 8, alignItems: 'flex-start' }}>
              <Icon name={r.ok ? 'CheckCircle2' : r.required ? 'XCircle' : 'TriangleAlert'} size={15} style={{ color: r.ok ? 'var(--success)' : r.required ? 'var(--danger)' : 'var(--warning)', marginTop: 2, flex: 'none' }} />
              <span>{onGo && !r.ok ? <button className="btn-link" style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline', color: 'var(--teal-800)' }} onClick={() => onGo(r.step)}>{r.label}</button> : r.label}{!r.ok && <span className="muted"> — {r.required ? 'required' : 'recommended'}</span>}</span>
            </li>
          ))}
        </ul>
        <p className="xs muted">This checks that coordination information is complete. It is not clinical advice or a diagnosis aid.</p>
      </div>
    </Card>
  );
}

export default function ReferralNew() {
  const nav = useNavigate();
  const toast = useToast();
  const cat = useFetch(() => catalogApi.get(), []);
  const hosp = useFetch(() => hospitalApi.network(), []);
  const [f, setF] = useSessionState('el_referral_draft', INIT);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, run] = useAction();
  const c = useMemo(() => completeness(f), [f]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const flag = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const receivers = (hosp.data || []).filter((h) => h.receivesReferrals);

  const validateStep = (i) => {
    const e = {};
    if (i === 0) {
      if (!f.patientName.trim()) e.patientName = 'Enter a patient identifier.';
      if (f.age !== '' && (isNaN(f.age) || f.age < 0 || f.age > 120)) e.age = 'Enter an age between 0 and 120.';
    }
    if (i === 1) {
      if (!f.emergencyCondition.trim()) e.emergencyCondition = 'Describe the emergency condition in a few words.';
      if (!f.urgency) e.urgency = 'Choose an urgency level.';
    }
    if (i === 2 && !f.requiredSpecialty) e.requiredSpecialty = 'Choose the specialty the receiving hospital needs to provide.';
    if (i === 3 && f.bloodRequired && !f.bloodGroup) e.bloodGroup = 'Select the blood group needed.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const go = (i) => { setStep(i); setMaxStep((m) => Math.max(m, i)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => { if (validateStep(step)) go(step + 1); };

  const body = () => ({
    patientName: f.patientName.trim(), age: f.age === '' ? null : Number(f.age), gender: f.gender || null, emergencyCondition: f.emergencyCondition.trim(),
    clinicalSummary: f.clinicalSummary.trim() || null, urgency: f.urgency, requiredSpecialty: f.requiredSpecialty, facilities: f.facilities,
    resources: [...(f.needTheatre ? [{ type: 'OPERATING_THEATRE', quantity: 1 }] : []), ...(f.needSpecialist ? [{ type: 'SPECIALIST_ON_CALL', quantity: 1 }] : [])],
    icuRequired: f.icuRequired, ventilatorRequired: f.ventilatorRequired, oxygenRequired: f.oxygenRequired, bloodRequired: f.bloodRequired,
    bloodGroup: f.bloodRequired ? f.bloodGroup || null : null, additionalRequirements: f.additionalRequirements.trim() || null,
    targetHospitalId: f.targetHospitalId ? Number(f.targetHospitalId) : null,
  });

  const submit = () => run(async () => {
    setApiError('');
    for (let i = 0; i < 4; i++) if (!validateStep(i)) { setConfirm(false); go(i); return; }
    try {
      const r = await referralApi.create(body());
      setF(INIT); setConfirm(false);
      toast.success(`Referral ${r.referralCode} created. Next: run hospital matching.`);
      nav(`/app/referrals/${r.id}`, { replace: true, state: { justCreated: true } });
    } catch (err) {
      setConfirm(false); setApiError(err.message); setErrors(err.fieldErrors || {}); // the draft is preserved
      toast.error(err.message);
    }
  });

  const urgencyCard = (k, hint) => (
    <label key={k} className={`check ${f.urgency === k ? 'on' : ''}`}>
      <input type="radio" name="urgency" checked={f.urgency === k} onChange={() => setF((s) => ({ ...s, urgency: k }))} />
      <span><span className="check-title"><Icon name={URGENCY[k].icon} size={13} /> {URGENCY[k].label}</span><span className="check-sub" style={{ display: 'block' }}>{hint}</span></span>
    </label>
  );

  return (
    <>
      <PageHeader title="New emergency referral" description="Record what the transfer needs. You will compare hospitals and choose where to send it in the next stage."
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Referrals', to: '/app/referrals' }, { label: 'New referral' }]} />
      <Alert tone="info" title="Share the minimum necessary">Use an identifier your hospital can trace, such as a case number, rather than a full name or contact details. EmergencyLink does not diagnose or recommend treatment.</Alert>
      <nav aria-label="Referral form progress" style={{ margin: '18px 0' }}>
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
              {i <= maxStep ? <button onClick={() => go(i)}><span className="step-n">{i < step ? <Icon name="Check" size={13} /> : i + 1}</span><span className="step-text">{s}</span></button>
                : <><span className="step-n">{i + 1}</span><span className="step-text">{s}</span></>}
            </li>
          ))}
        </ol>
      </nav>
      {apiError && <div style={{ marginBottom: 16 }}><Alert tone="danger" title="The referral could not be created">{apiError} Your entries have been kept.</Alert></div>}
      <div className="detail-grid">
        <div>
          <Card title={`${step + 1} · ${STEPS[step]}`}>
            <div className="stack">
              {step === 0 && (<div className="grid cols-2">
                <Input label="Patient identifier" required value={f.patientName} onChange={set('patientName')} error={errors.patientName} help="A case number or initials your hospital can trace. Avoid full names and contact details." maxLength={120} />
                <Input label="Age (years)" type="number" min="0" max="120" value={f.age} onChange={set('age')} error={errors.age} />
                <Select label="Gender" value={f.gender} onChange={set('gender')} placeholder="Not specified" options={['Female', 'Male', 'Other']} help="Optional, where relevant to the receiving team." />
              </div>)}
              {step === 1 && (<>
                <Input label="Emergency condition" required value={f.emergencyCondition} onChange={set('emergencyCondition')} error={errors.emergencyCondition} help="A short label for the situation, e.g. “Road traffic injury”. Max 200 characters." maxLength={200} />
                <Textarea label="Summary for the receiving team" value={f.clinicalSummary} onChange={set('clinicalSummary')} error={errors.clinicalSummary} maxLength={2000} help={`Factual coordination details. ${f.clinicalSummary.length}/2000`} />
                <fieldset className="fieldset"><legend>Urgency level <span className="req" aria-hidden="true">*</span></legend>
                  <div className="grid cols-3">{urgencyCard('CRITICAL', 'Immediate attention needed')}{urgencyCard('URGENT', 'Needs prompt attention')}{urgencyCard('STANDARD', 'Time-sensitive but stable')}</div>
                  {errors.urgency && <span className="field-error" role="alert" style={{ marginTop: 6 }}>{errors.urgency}</span>}</fieldset>
              </>)}
              {step === 2 && (<>
                <Select label="Required specialty" required value={f.requiredSpecialty} onChange={set('requiredSpecialty')} placeholder="Select a specialty" options={cat.data?.specialties || []} error={errors.requiredSpecialty} help="Hospitals are compared on whether they list this specialty." />
                {cat.error && <Alert tone="danger">Could not load specialties: {cat.error.message}</Alert>}
              </>)}
              {step === 3 && (<>
                <fieldset className="fieldset"><legend>Critical care and supplies</legend>
                  <div className="grid cols-2">
                    <Check title="ICU bed" sub="Intensive care capacity at the receiving hospital" checked={f.icuRequired} onChange={flag('icuRequired')} />
                    <Check title="Ventilator" sub="Ventilator support available" checked={f.ventilatorRequired} onChange={flag('ventilatorRequired')} />
                    <Check title="Oxygen" sub="Oxygen supply point" checked={f.oxygenRequired} onChange={flag('oxygenRequired')} />
                    <Check title="Blood" sub="Blood units available" checked={f.bloodRequired} onChange={flag('bloodRequired')} />
                    <Check title="Operating theatre" sub="A theatre free for surgery" checked={f.needTheatre} onChange={flag('needTheatre')} />
                    <Check title="Specialist on call" sub="A specialist reachable now" checked={f.needSpecialist} onChange={flag('needSpecialist')} />
                  </div></fieldset>
                {f.bloodRequired && <Select label="Blood group needed" required value={f.bloodGroup} onChange={set('bloodGroup')} placeholder="Select" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} error={errors.bloodGroup} />}
              </>)}
              {step === 4 && (
                <fieldset className="fieldset"><legend>Required facilities</legend>
                  <div className="grid cols-3">{(cat.data?.facilities || []).map((x) => <Check key={x} title={x} checked={f.facilities.includes(x)} onChange={(v) => setF((s) => ({ ...s, facilities: v ? [...s.facilities, x] : s.facilities.filter((y) => y !== x) }))} />)}</div>
                  <p className="field-help" style={{ marginTop: 8 }}>Optional. Leave empty if no specific facility is required.</p></fieldset>
              )}
              {step === 5 && (<>
                <Select label="Preferred receiving hospital (optional)" value={f.targetHospitalId} onChange={set('targetHospitalId')} placeholder="No preference. I will compare hospitals after creating" options={receivers.map((h) => [h.id, `${h.name} — ${h.city}`])} help="You can still run matching and choose a different hospital before sending." />
                {hosp.error && <Alert tone="warning">Could not load hospitals: {hosp.error.message}. You can skip this step.</Alert>}
                <p className="small muted">Reported availability is shown with its last update time once you create the referral.</p>
              </>)}
              {step === 6 && <Textarea label="Additional requirements or notes" value={f.additionalRequirements} onChange={set('additionalRequirements')} maxLength={1000} help={`Anything else the receiving team should know. ${f.additionalRequirements.length}/1000`} />}
              {step === 7 && (
                <div className="stack">
                  <dl className="kv">
                    <dt>Patient ID</dt><dd>{f.patientName || '—'}{f.age !== '' ? `, ${f.age} y` : ''}{f.gender ? `, ${f.gender}` : ''}</dd>
                    <dt>Condition</dt><dd>{f.emergencyCondition || '—'}</dd>
                    <dt>Urgency</dt><dd>{f.urgency ? URGENCY[f.urgency].label : '—'}</dd>
                    <dt>Specialty</dt><dd>{f.requiredSpecialty || '—'}</dd>
                    <dt>Resources</dt><dd className="req-pills">{[f.icuRequired && 'ICU bed', f.ventilatorRequired && 'Ventilator', f.oxygenRequired && 'Oxygen', f.bloodRequired && `Blood ${f.bloodGroup}`, f.needTheatre && 'Operating theatre', f.needSpecialist && 'Specialist on call'].filter(Boolean).map((x) => <Badge key={x} tone="outline">{x}</Badge>)}{!(f.icuRequired || f.ventilatorRequired || f.oxygenRequired || f.bloodRequired || f.needTheatre || f.needSpecialist) && '—'}</dd>
                    <dt>Facilities</dt><dd>{f.facilities.join(', ') || '—'}</dd>
                    <dt>Preferred hospital</dt><dd>{receivers.find((h) => String(h.id) === String(f.targetHospitalId))?.name || 'None, compare after creating'}</dd>
                    <dt>Summary</dt><dd>{f.clinicalSummary || '—'}</dd>
                    <dt>Notes</dt><dd>{f.additionalRequirements || '—'}</dd>
                  </dl>
                  {c.missingRequired.length > 0 && <Alert tone="danger" title="Required information is missing">{c.missingRequired.map((m) => m.label).join(', ')}. Use the completeness panel to jump to each field.</Alert>}
                  {c.missingRequired.length === 0 && c.missingOptional.length > 0 && <Alert tone="warning" title="Recommended information is missing">{c.missingOptional.map((m) => m.label).join(', ')}. You can still submit.</Alert>}
                </div>
              )}
            </div>
            <div className="row between wrap" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" icon="ChevronLeft" disabled={step === 0} onClick={() => go(step - 1)}>Back</Button>
              <div className="row" style={{ gap: 8 }}>
                <Button variant="ghost" onClick={() => { setF(INIT); setStep(0); setMaxStep(0); setErrors({}); toast.info('Draft cleared.'); }}>Clear draft</Button>
                {step < STEPS.length - 1 ? <Button onClick={next}>Continue<Icon name="ChevronRight" /></Button>
                  : <Button icon="Send" disabled={c.missingRequired.length > 0} onClick={() => setConfirm(true)}>Submit referral</Button>}
              </div>
            </div>
          </Card>
        </div>
        <div className="sticky"><CompletenessPanel c={c} onGo={(s) => go(s)} /></div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} busy={busy} title="Create this referral?" confirmLabel="Create referral"
        message="The referral will be saved as CREATED. Nothing is sent to a hospital until you run matching and choose a receiving hospital." />
    </>
  );
}
