import { Link, useParams } from 'react-router-dom';
import { hospitalApi, referralApi } from '../api/services';
import { useFetch } from '../hooks';
import { PageHeader, Timeline } from '../components/ui/data';
import { Async } from '../components/ui/feedback';
import { Button } from '../components/ui/forms';
import { Card, StatusBadge, UrgencyBadge } from '../components/ui/display';
import { fmtDateTime, RESOURCE_LABEL } from '../utils/format';

export default function ReferralPrint() {
  const { id } = useParams();
  const ref = useFetch(() => referralApi.get(id), [id]);
  const tl = useFetch(() => referralApi.timeline(id), [id]);
  const r = ref.data;
  const target = useFetch(() => hospitalApi.get(r.targetHospital.id), [r?.targetHospital?.id], { enabled: !!r?.targetHospital });

  return (
    <>
      <div className="no-print">
        <PageHeader title="Print-friendly referral summary" description="Navigation and decorative elements are removed when printing."
          crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Referrals', to: '/app/referrals' }, { label: r?.referralCode || 'Referral', to: `/app/referrals/${id}` }, { label: 'Print' }]}
          actions={<><Link className="btn btn-secondary" to={`/app/referrals/${id}`}>Back to referral</Link><Button icon="Printer" onClick={() => window.print()}>Print</Button></>} />
      </div>
      <Async state={ref} rows={6}>
        {(d) => (
          <div className="stack">
            <div className="print-watermark">COORDINATION SUMMARY — NOT A MEDICAL RECORD</div>
            <h1 className="print-only" style={{ fontSize: '18pt' }}>EmergencyLink referral summary</h1>
            <Card title={`${d.referralCode} · ${d.emergencyCondition}`}>
              <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}><StatusBadge status={d.status} /><UrgencyBadge urgency={d.urgency} /></div>
              <dl className="kv">
                <dt>Patient ID</dt><dd>{d.patientName}{d.age != null ? `, ${d.age} y` : ''}{d.gender ? `, ${d.gender}` : ''}</dd>
                <dt>Specialty required</dt><dd>{d.requiredSpecialty}</dd>
                <dt>Summary</dt><dd>{d.clinicalSummary || '—'}</dd>
                <dt>Requirements</dt><dd>{[d.icuRequired && 'ICU bed', d.ventilatorRequired && 'Ventilator', d.oxygenRequired && 'Oxygen', d.bloodRequired && `Blood ${d.bloodGroup || ''}`, ...(d.resources || []).map((x) => RESOURCE_LABEL[x.type]), ...d.facilities].filter(Boolean).join(', ') || '—'}</dd>
                <dt>Additional notes</dt><dd>{d.additionalRequirements || '—'}</dd>
                <dt>Referring hospital</dt><dd>{d.referringHospital.name}, {d.referringHospital.city}</dd>
                <dt>Receiving hospital</dt><dd>{d.targetHospital ? `${d.targetHospital.name}, ${d.targetHospital.city}${target.data?.phone ? ` · ${target.data.phone}` : ''}` : 'Not assigned'}</dd>
                <dt>Created</dt><dd>{fmtDateTime(d.createdAt)}</dd>
                <dt>Last updated</dt><dd>{fmtDateTime(d.updatedAt)}</dd>
                {d.decidedAt && <><dt>Decision</dt><dd>{fmtDateTime(d.decidedAt)}{d.decisionReason ? ` — ${d.decisionReason}` : ''}</dd></>}
              </dl>
            </Card>
            <Card title="Timeline"><Async state={tl} rows={3}>{(t) => <Timeline events={t} />}</Async></Card>
            <p className="small muted">Generated {fmtDateTime(new Date().toISOString())}. Source: EmergencyLink referral record (demonstration data, fictional patient and hospitals). Availability is as last reported by the hospital at the time shown, distances are estimates and scores are rule-based comparisons, not clinical assessments. Confirm critical details directly with the other hospital.</p>
          </div>
        )}
      </Async>
    </>
  );
}
