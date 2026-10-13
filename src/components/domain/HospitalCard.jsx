import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Badge, Freshness } from '../ui/display';
import { typeLabel } from '../../utils/format';

const resVal = (h, t) => h.resources.find((r) => r.type === t);

export default function HospitalCard({ h, score, selected, onSelect }) {
  const icu = resVal(h, 'ICU_BED'); const bed = resVal(h, 'EMERGENCY_BED') || resVal(h, 'GENERAL_BED');
  return (
    <article className="card hosp-card" style={selected ? { borderColor: 'var(--teal-600)', boxShadow: '0 0 0 1px var(--teal-600)' } : undefined}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3><Link to={`/app/hospitals/${h.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{h.name}</Link></h3>
          <div className="small muted"><Icon name="MapPin" size={12} /> {h.city}, {h.state} · {typeLabel(h.type)}</div>
        </div>
        {score != null && <Badge tone="teal">{score}% match</Badge>}
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <Badge tone={h.receivesReferrals ? 'success' : 'neutral'} icon={h.receivesReferrals ? 'Check' : 'Send'}>{h.receivesReferrals ? 'Receives referrals' : 'Refers patients'}</Badge>
        {h.emergencyServices && <Badge tone="outline" icon="Siren">Emergency services</Badge>}
        {h.activeReferrals > 0 && <Badge tone="info" icon="Activity">{h.activeReferrals} active referral{h.activeReferrals > 1 ? 's' : ''}</Badge>}
      </div>
      <div className="tag-row">{h.specialties.slice(0, 4).map((s) => <Badge key={s} tone="teal">{s}</Badge>)}{h.specialties.length > 4 && <Badge tone="outline">+{h.specialties.length - 4}</Badge>}</div>
      <div className="small" style={{ display: 'grid', gap: 3 }}>
        {icu && <span><b>ICU:</b> {icu.available}/{icu.total} available</span>}
        {bed && <span><b>Beds:</b> {bed.available}/{bed.total} available</span>}
      </div>
      <div className="row between"><Freshness updatedAt={h.lastResourceUpdate} stale={h.resourcesStale} compact />
        <div className="row" style={{ gap: 6 }}>{onSelect && <button className="btn btn-secondary btn-sm" onClick={() => onSelect(h.id)}>Details</button>}<Link className="btn btn-secondary btn-sm" to={`/app/hospitals/${h.id}`}>Profile</Link></div></div>
    </article>
  );
}
