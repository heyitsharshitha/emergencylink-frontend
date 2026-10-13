import { useState } from 'react';
import { Button } from '../ui/forms';
import { useApp } from '../../context/AppContext';

const STEPS = [
  { t: 'Dashboard', d: 'Your overview shows referrals needing attention, resource freshness and recent activity taken from real records.' },
  { t: 'Referral workflow', d: 'Create a referral, run rule-based matching, send it, and follow every decision in the audit timeline.' },
  { t: 'Hospital matching', d: 'Each hospital gets a transparent compatibility score. Matched, unavailable and unknown/stale requirements are listed separately.' },
  { t: 'Resources', d: 'Hospitals update beds, ICU, ventilators and blood. Anything not updated recently is flagged as needing confirmation.' },
  { t: 'Coordination assistant', d: 'Ask about the workflow or current application data. Answers come from authorised records, the assistant says plainly when no language model is connected, and it never gives clinical advice.' },
];

export default function DemoTour() {
  const { tourOpen, setTourOpen, setTourDone } = useApp();
  const [i, setI] = useState(0);
  if (!tourOpen) return null;
  const close = () => { setTourOpen(false); setTourDone(true); setI(0); };
  const s = STEPS[i];
  return (
    <aside className="tour" role="dialog" aria-label="Optional product tour">
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="xs muted">Optional tour · {i + 1} of {STEPS.length}</span>
        <Button variant="ghost" size="sm" icon="X" aria-label="Dismiss tour" onClick={close} />
      </div>
      <h3 style={{ marginBottom: 6 }}>{s.t}</h3>
      <p className="small muted" style={{ marginBottom: 14 }}>{s.d}</p>
      <div className="row between">
        <div className="tour-dots" aria-hidden="true">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="row" style={{ gap: 6 }}>
          {i > 0 && <Button size="sm" variant="secondary" onClick={() => setI(i - 1)}>Back</Button>}
          {i < STEPS.length - 1 ? <Button size="sm" onClick={() => setI(i + 1)}>Next</Button> : <Button size="sm" onClick={close}>Finish</Button>}
        </div>
      </div>
    </aside>
  );
}
