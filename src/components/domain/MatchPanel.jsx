import { useState } from 'react';
import Icon from '../ui/Icon';
import { Badge, Freshness, Alert } from '../ui/display';
import { Button } from '../ui/forms';
import { Table } from '../ui/data';

const TONE = { MATCHED: ['ok', 'CheckCircle2', 'Available'], UNAVAILABLE: ['bad', 'XCircle', 'Unavailable'], UNKNOWN: ['unk', 'TriangleAlert', 'Unknown / stale'], NOT_REQUIRED: ['na', 'Minus', 'Not required'] };

function Ring({ score }) {
  const r = 24; const c = 2 * Math.PI * r; const color = score >= 80 ? 'var(--success)' : score >= 50 ? '#c9820a' : 'var(--danger)';
  return (
    <div className="score" role="img" aria-label={`Compatibility ${score} percent`}>
      <svg width="58" height="58" viewBox="0 0 58 58"><circle cx="29" cy="29" r={r} fill="none" stroke="var(--grey-100)" strokeWidth="6" />
        <circle cx="29" cy="29" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(c * score) / 100} ${c}`} /></svg>
      <b>{score}%</b>
    </div>
  );
}

function CheckBlock({ m }) {
  const groups = [['MATCHED', 'Available'], ['UNAVAILABLE', 'Unavailable'], ['UNKNOWN', 'Unknown or stale — confirm with hospital']];
  return (
    <div>
      {groups.map(([k, title]) => {
        const items = m.checks.filter((c) => c.status === k);
        if (!items.length) return null;
        const [cls, icon] = TONE[k];
        return (
          <div key={k} style={{ marginBottom: 8 }}>
            <div className="xs muted" style={{ padding: '6px 16px 2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
            <ul className="check-list">{items.map((c) => (
              <li key={c.key}><Icon name={icon} size={16} className={`ci ${cls}`} /><span><b>{c.label}</b> <span className="muted">— {c.detail} ({c.earned}/{c.weight} pts)</span></span></li>
            ))}</ul>
          </div>
        );
      })}
    </div>
  );
}

/** Rule-based matching results with side-by-side comparison and a transparent score breakdown. */
export default function MatchPanel({ results, canSend, onSend, selectedId, onSelect }) {
  const [open, setOpen] = useState(results?.[0]?.hospitalId);
  if (!results?.length) return <Alert tone="warning" title="No candidate hospitals">No active hospital with a receiving account is available.</Alert>;
  const top = results.slice(0, 3);
  const keys = [['specialty', 'Specialty'], ['facilities', 'Facilities'], ['icu', 'ICU bed'], ['bed', 'Emergency / general bed'], ['resources', 'Other resources'], ['emergency', 'Emergency service']];
  return (
    <div className="stack">
      <Alert tone="info" title="How to read this">
        Scores are a deterministic count of how many stated requirements each hospital's reported availability covers. They are <b>not</b> clinical risk scores or treatment recommendations, and distances are estimates from stored coordinates. Staff decide where to send a patient.
      </Alert>
      {top.length > 1 && (
        <div className="table-wrap" role="region" aria-label="Side-by-side comparison" tabIndex={0}>
          <table className="table cmp">
            <caption className="sr-only">Side-by-side comparison of the top {top.length} hospitals</caption>
            <thead><tr><th scope="col">Requirement</th>{top.map((m) => <th key={m.hospitalId} scope="col">{m.hospitalName}</th>)}</tr></thead>
            <tbody>
              <tr><td><b>Compatibility</b></td>{top.map((m) => <td key={m.hospitalId}><b>{m.score}%</b></td>)}</tr>
              <tr><td>Est. distance</td>{top.map((m) => <td key={m.hospitalId}>{m.distanceKm != null ? `${m.distanceKm} km (est.)` : '—'}</td>)}</tr>
              {keys.map(([k, label]) => (
                <tr key={k}><td>{label}</td>{top.map((m) => {
                  const c = m.checks.find((x) => x.key === k); const [cls, icon, txt] = TONE[c?.status || 'NOT_REQUIRED'];
                  return <td key={m.hospitalId}><span className={`cmp-cell ${cls}`}><Icon name={icon} size={14} />{txt}</span></td>;
                })}</tr>
              ))}
              <tr><td>Data freshness</td>{top.map((m) => <td key={m.hospitalId}><Freshness updatedAt={m.resourcesUpdatedAt} stale={m.resourcesStale} compact /></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      <div className="stack-sm">
        {results.map((m, i) => (
          <article key={m.hospitalId} className={`match ${i === 0 ? 'best' : ''}`}>
            <div className="match-head">
              <Ring score={m.score} />
              <div className="grow">
                <div className="row wrap" style={{ gap: 8 }}><strong>{m.hospitalName}</strong>{i === 0 && <Badge tone="teal" icon="Check">Highest compatibility</Badge>}</div>
                <div className="small muted">{m.city}{m.distanceKm != null ? ` · ≈ ${m.distanceKm} km (estimated)` : ''}</div>
                <div style={{ marginTop: 4 }}><Freshness updatedAt={m.resourcesUpdatedAt} stale={m.resourcesStale} /></div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Button size="sm" variant="secondary" aria-expanded={open === m.hospitalId} onClick={() => setOpen(open === m.hospitalId ? null : m.hospitalId)}>{open === m.hospitalId ? 'Hide' : 'Why this score'}</Button>
                {canSend && <Button size="sm" icon="Send" onClick={() => onSend(m)}>Send referral</Button>}
              </div>
            </div>
            {open === m.hospitalId && <CheckBlock m={m} />}
          </article>
        ))}
      </div>
    </div>
  );
}
