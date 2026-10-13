import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import NetworkIllustration from '../components/domain/NetworkIllustration';

const STEPS = [
  ['FilePlus2', 'Create', 'The referring hospital records urgency, specialty, ICU, blood, oxygen and facility needs in a guided form.'],
  ['GitCompareArrows', 'Match', 'Rule-based matching compares those needs with each hospital\'s published availability and explains every score.'],
  ['Send', 'Send', 'Staff choose a receiving hospital and send the referral. The receiving team is notified in-app.'],
  ['CircleCheck', 'Decide', 'The receiving hospital accepts, declines with a reason, or asks for more information.'],
  ['Ambulance', 'Transfer', 'Messages, status changes and the audit timeline keep both hospitals aligned until the transfer completes.'],
];
const FEATURES = [
  ['ClipboardCheck', 'Referral tracking', 'Every referral follows one set of fields, from condition and urgency to specialty and resources. A completeness check flags anything missing before it is sent, and the status is visible to both hospitals at each step.'],
  ['MessageSquare', 'Hospital communication', 'Referring and receiving teams exchange messages on the referral itself, and in-app notifications tell them when a referral arrives, is decided, or needs more information.'],
  ['Gauge', 'Resource availability', 'Beds, ICU capacity, ventilators, oxygen and blood units are shown with the time they were last updated. Anything that has not been confirmed recently is marked so staff know to check.'],
  ['GitCompareArrows', 'Hospital matching', 'Matching compares what a patient needs with what each hospital reports, using fixed rules. Each result lists which requirements are met, unmet, unknown or out of date, so the reasons are always visible.'],
  ['History', 'Referral history', 'Status changes, decisions and the reasons given for them are recorded with who made them and when, and shown as a timeline on the referral.'],
  ['Network', 'District hospital network', 'See connected hospitals, their specialties, reported availability and current referral activity on one map, with a list view that offers the same information.'],
];

export default function Landing() {
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }, [hash]);
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-in">
          <div>
            <h1 id="hero-title">Connect. Coordinate. <span>Respond.</span></h1>
            <p className="lead">When a patient needs a specialist, ICU bed or blood that a hospital cannot provide, a vacant bed is not enough. EmergencyLink gives referring and receiving hospitals one shared, structured view of what a transfer needs and what is actually available.</p>
            <div className="row wrap" style={{ marginTop: 28, gap: 12 }}>
              <Link to="/login" className="btn btn-lg" style={{ background: '#fff', color: 'var(--teal-900)' }}>Access Portal<Icon name="ArrowRight" /></Link>
              <Link to="/#how-it-works" className="btn btn-lg btn-secondary">Explore how it works</Link>
            </div>
          </div>
          <div className="hero-art"><NetworkIllustration /></div>
        </div>
      </section>

      <section className="section" id="how-it-works" aria-labelledby="how-title">
        <h2 id="how-title">How a referral moves through EmergencyLink</h2>
        <p className="lede">Five clear stages. People make every clinical and acceptance decision; the platform keeps the information structured, visible and recorded.</p>
        <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {STEPS.map(([icon, t, d], i) => (
            <li key={t} className="card step-card"><div className="n">{i + 1}</div><h3 style={{ fontSize: 'var(--fs-md)', display: 'flex', gap: 8, alignItems: 'center' }}><Icon name={icon} size={16} />{t}</h3><p className="small muted" style={{ marginTop: 6 }}>{d}</p></li>
          ))}
        </ol>
      </section>

      <div className="band"><section className="section" aria-labelledby="feat-title">
        <h2 id="feat-title">What the platform provides</h2>
        <p className="lede">Specific capabilities, each backed by the same database and role permissions.</p>
        <div className="grid cols-3">
          {FEATURES.map(([icon, t, d]) => <div key={t} className="card feature"><div className="stat-icon"><Icon name={icon} size={20} /></div><h3 style={{ fontSize: 'var(--fs-md)' }}>{t}</h3><p className="small muted">{d}</p></div>)}
        </div>
      </section></div>

      <section className="section" aria-labelledby="people-title">
        <h2 id="people-title">Clinical decisions stay with clinical teams</h2>
        <p className="lede">EmergencyLink does not diagnose, prescribe or recommend treatment. Matching results are an explained comparison of stated requirements and reported availability. Acceptance and transfer decisions are always made by the hospitals involved.</p>
        <div className="row wrap" style={{ gap: 12, marginTop: 8 }}>
          <Link to="/register" className="btn btn-secondary">Register your hospital</Link>
          <Link to="/help" className="btn btn-secondary">Read the workflow guide</Link>
        </div>
      </section>
    </>
  );
}
