import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { StatusBadge, UrgencyBadge, Badge } from '../ui/display';
import { timeAgo } from '../../utils/format';

export function RequirementPills({ r }) {
  return (
    <div className="req-pills">
      {r.icuRequired && <Badge tone="outline" icon="BedDouble">ICU</Badge>}
      {r.ventilatorRequired && <Badge tone="outline" icon="Wind">Ventilator</Badge>}
      {r.oxygenRequired && <Badge tone="outline" icon="Wind">Oxygen</Badge>}
      {r.bloodRequired && <Badge tone="outline" icon="Droplets">Blood{r.bloodGroup ? ` ${r.bloodGroup}` : ''}</Badge>}
      {r.facilities?.map((f) => <Badge key={f} tone="outline" icon="Wrench">{f}</Badge>)}
    </div>
  );
}

export default function ReferralCard({ r }) {
  return (
    <Link to={`/app/referrals/${r.id}`} className={`card ref-card ${r.urgency.toLowerCase()}`}>
      <div className="row between wrap">
        <div className="row wrap" style={{ gap: 8 }}><span className="ref-code">{r.referralCode}</span><UrgencyBadge urgency={r.urgency} /></div>
        <StatusBadge status={r.status} />
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{r.emergencyCondition}</div>
        <div className="small muted">Patient ID: {r.patientName}{r.age != null ? ` · ${r.age} y` : ''}</div>
      </div>
      <div className="ref-meta">
        <span><Icon name="Stethoscope" size={14} />{r.requiredSpecialty}</span>
        <span><Icon name="Building2" size={14} />{r.referringHospital.name}</span>
        <span><Icon name="ArrowRight" size={14} />{r.targetHospital ? r.targetHospital.name : 'No receiving hospital yet'}</span>
      </div>
      <RequirementPills r={r} />
      <div className="xs muted"><Icon name="Clock" size={11} /> Updated {timeAgo(r.updatedAt)}</div>
    </Link>
  );
}
