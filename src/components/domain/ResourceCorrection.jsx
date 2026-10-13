import { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import { useAction, useFetch } from '../../hooks';
import { Alert, Card } from '../ui/display';
import { Table } from '../ui/data';
import { Async, EmptyState, Modal, useToast } from '../ui/feedback';
import { Button, Input, Textarea } from '../ui/forms';
import { fmtDateTime } from '../../utils/format';

/** Administrator correction of a hospital's resource counts. Saves only the rows that changed and shows matching warnings. */
export function ResourceCorrectionModal({ hospital, open, onClose, onSaved }) {
  const state = useFetch(() => adminApi.hospitalResources(hospital.id), [hospital.id, open], { enabled: open });
  const [vals, setVals] = useState({});
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  const [busy, run] = useAction();
  const toast = useToast();
  useEffect(() => {
    if (open && state.data) { setVals(Object.fromEntries(state.data.map((r) => [r.type, { total: String(r.total), available: String(r.available) }]))); setReason(''); setResult(null); }
  }, [open, state.data]);
  const rows = state.data || [];
  const changed = rows.filter((r) => vals[r.type] && (vals[r.type].total !== String(r.total) || vals[r.type].available !== String(r.available)));
  const problems = {};
  changed.forEach((r) => {
    const t = Number(vals[r.type].total); const a = Number(vals[r.type].available);
    if (!Number.isInteger(t) || !Number.isInteger(a) || t < 0 || a < 0) problems[r.type] = 'Use whole numbers of 0 or more.';
    else if (a > t) problems[r.type] = 'Available cannot exceed total.';
  });
  const ready = changed.length > 0 && reason.trim() && Object.keys(problems).length === 0;
  const set = (type, k) => (e) => setVals((v) => ({ ...v, [type]: { ...v[type], [k]: e.target.value } }));
  const save = () => run(async () => {
    try {
      const res = await adminApi.correctResources(hospital.id, changed.map((r) => ({ type: r.type, total: Number(vals[r.type].total), available: Number(vals[r.type].available) })), reason.trim());
      setResult(res); toast.success('Resources corrected.'); onSaved();
    } catch (e) { toast.error(e.message); }
  });
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} wide title={`Correct resources: ${hospital.name}`}
      footer={result ? <Button onClick={onClose}>Close</Button> : <><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button loading={busy} disabled={!ready} onClick={save}>Save corrections</Button></>}>
      {result ? (
        <div className="stack">
          <Alert tone="success" title="Corrections saved">The hospital was notified. The change is in the resource history and the audit log.</Alert>
          {result.warnings.length > 0 && <Alert tone="warning" title="Effect on matching"><ul style={{ margin: 0, paddingLeft: 18 }}>{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul></Alert>}
        </div>
      ) : (
        <div className="stack">
          <p className="muted small">Only change figures you have verified with the hospital. Saved rows are marked as an administrator correction, and hospitals can still update their own figures.</p>
          <Async state={state} rows={3}>{() => (
            <div className="stack-sm">
              {rows.map((r) => (
                <div key={r.type} className="grid cols-3" style={{ alignItems: 'end' }}>
                  <div><b>{r.label}</b><div className="xs muted">{r.updatedAt ? `Updated ${fmtDateTime(r.updatedAt)}` : 'Never reported (unknown)'}</div></div>
                  <Input label="Available" inputMode="numeric" value={vals[r.type]?.available ?? ''} onChange={set(r.type, 'available')} error={problems[r.type]} />
                  <Input label={`Total (${r.unit})`} inputMode="numeric" value={vals[r.type]?.total ?? ''} onChange={set(r.type, 'total')} />
                </div>
              ))}
            </div>
          )}</Async>
          <Textarea label="Reason for this correction" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          <p className="small" aria-live="polite">{changed.length ? `${changed.length} resource${changed.length > 1 ? 's' : ''} will change.` : 'Change at least one value to continue.'}</p>
        </div>
      )}
    </Modal>
  );
}

/** Newest-first history of every resource change, whether made by the hospital or by an administrator. */
export function ResourceHistory({ hospitalId, refreshKey }) {
  const state = useFetch(() => adminApi.resourceHistory(hospitalId), [hospitalId, refreshKey]);
  const cols = [
    { key: 'w', header: 'When', render: (c) => <span style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(c.createdAt)}</span> },
    { key: 'r', header: 'Resource', render: (c) => c.label },
    { key: 'c', header: 'Change', render: (c) => `${c.oldAvailable == null ? 'unknown' : `${c.oldAvailable}/${c.oldTotal}`} → ${c.newAvailable}/${c.newTotal}` },
    { key: 'b', header: 'By', render: (c) => c.changedBy },
    { key: 'n', header: 'Reason', render: (c) => <span className="small muted">{c.reason || '—'}</span> },
  ];
  return (
    <Card title="Resource history">
      <Async state={state} rows={3}>{(list) => <Table caption="Resource history" columns={cols} rows={list} empty={<EmptyState icon="History" title="No changes recorded yet" />} />}</Async>
    </Card>
  );
}
