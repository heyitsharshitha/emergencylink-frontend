import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hospitalApi, resourceApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAction, useFetch } from '../hooks';
import { PageHeader, Table } from '../components/ui/data';
import { Alert, CapacityBar, Card, Freshness, SimNote } from '../components/ui/display';
import { Async, ConfirmDialog, Modal, useToast } from '../components/ui/feedback';
import { Button } from '../components/ui/forms';
import { Input } from '../components/ui/forms';

function UpdateModal({ open, onClose, rows, onSaved }) {
  const [vals, setVals] = useState({});
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const [busy, run] = useAction();
  const toast = useToast();
  useEffect(() => { if (open) { setVals(Object.fromEntries(rows.map((r) => [r.type, { total: String(r.total), available: String(r.available) }]))); setErrors({}); setReview(false); } }, [open, rows]);
  const changed = rows.filter((r) => vals[r.type] && (Number(vals[r.type].total) !== r.total || Number(vals[r.type].available) !== r.available));
  const validate = () => {
    const e = {};
    rows.forEach((r) => { const v = vals[r.type]; const t = Number(v.total), a = Number(v.available);
      if (v.total === '' || !Number.isInteger(t) || t < 0) e[r.type] = 'Total must be a whole number, 0 or more.';
      else if (v.available === '' || !Number.isInteger(a) || a < 0) e[r.type] = 'Available must be a whole number, 0 or more.';
      else if (a > t) e[r.type] = `Available (${a}) cannot exceed total (${t}).`; });
    setErrors(e); return Object.keys(e).length === 0;
  };
  const save = () => run(async () => {
    try { await resourceApi.update(rows.map((r) => ({ type: r.type, total: Number(vals[r.type].total), available: Number(vals[r.type].available) }))); toast.success('Resource availability updated.'); setReview(false); onSaved(); onClose(); }
    catch (err) { setReview(false); toast.error(err.message); }
  });
  return (
    <>
      <Modal open={open && !review} onClose={onClose} wide title="Update resource availability"
        footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { if (validate()) { if (!changed.length) toast.info('Nothing has changed. Saving will still refresh the update time.'); setReview(true); } }}>Review changes</Button></>}>
        <p className="small muted" style={{ marginBottom: 12 }}>Enter current totals and how many are available right now. Saving stamps every row with the current time. Other hospitals rely on these figures when choosing where to send a patient.</p>
        <div className="stack">
          {rows.map((r) => vals[r.type] && (
            <div key={r.type} className="grid cols-3" style={{ alignItems: 'start' }}>
              <div style={{ paddingTop: 30 }}><strong>{r.label}</strong><div className="xs muted">{r.unit}</div></div>
              <Input label="Total" type="number" min="0" value={vals[r.type].total} onChange={(e) => setVals((s) => ({ ...s, [r.type]: { ...s[r.type], total: e.target.value } }))} error={errors[r.type]} />
              <Input label="Available now" type="number" min="0" value={vals[r.type].available} onChange={(e) => setVals((s) => ({ ...s, [r.type]: { ...s[r.type], available: e.target.value } }))} />
            </div>
          ))}
        </div>
      </Modal>
      <ConfirmDialog open={open && review} onClose={() => setReview(false)} onConfirm={save} busy={busy} title="Confirm availability update" confirmLabel="Save update"
        message="Other hospitals will see these numbers immediately and the change is recorded in the audit log.">
        {changed.length ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{changed.map((r) => <li key={r.type}><b>{r.label}:</b> {r.available}/{r.total} → {vals[r.type].available}/{vals[r.type].total}</li>)}</ul> : <p className="small muted">No values changed.</p>}
      </ConfirmDialog>
    </>
  );
}

export default function Resources() {
  const { isAdmin } = useAuth();
  const { status } = useApp();
  const mine = useFetch(() => resourceApi.mine(), [], { enabled: !isAdmin });
  const net = useFetch(() => hospitalApi.network(), []);
  const [open, setOpen] = useState(false);
  const val = (h, t) => h.resources.find((r) => r.type === t);
  const cell = (h, t) => { const r = val(h, t); return r ? <span title={`Updated ${r.updatedAt}`}><b>{r.available}</b>/{r.total}{r.stale && <span className="badge warning" style={{ marginLeft: 6 }}>stale</span>}</span> : <span className="muted">—</span>; };
  const cols = [
    { key: 'name', header: 'Hospital', render: (h) => <Link className="cell-link" to={`/app/hospitals/${h.id}`}>{h.name}</Link> },
    { key: 'icu', header: 'ICU', className: 'num', render: (h) => cell(h, 'ICU_BED') },
    { key: 'eb', header: 'Emergency beds', className: 'num', render: (h) => cell(h, 'EMERGENCY_BED') },
    { key: 'gb', header: 'General beds', className: 'num', render: (h) => cell(h, 'GENERAL_BED') },
    { key: 'v', header: 'Ventilators', className: 'num', render: (h) => cell(h, 'VENTILATOR') },
    { key: 'b', header: 'Blood units', className: 'num', render: (h) => cell(h, 'BLOOD_UNITS') },
    { key: 'f', header: 'Last update', render: (h) => <Freshness updatedAt={h.lastResourceUpdate} stale={h.resourcesStale} /> },
  ];
  const threshold = status.data?.staleThresholdMinutes;
  const staleMine = mine.data?.filter((r) => r.stale && r.total > 0).length;

  return (
    <>
      <PageHeader title="Resource availability" description={isAdmin ? 'Availability reported by every hospital on the network, with data freshness.' : 'Keep your hospital’s availability current so referring hospitals see accurate, time-stamped information.'}
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Resource availability' }]} actions={!isAdmin && mine.data && <Button icon="Edit3" onClick={() => setOpen(true)}>Update availability</Button>} />
      <div className="stack">
        <Alert tone="info" title="Reported availability">Figures are as last reported by each hospital and should be confirmed by phone before a transfer. {threshold ? `Information not updated within ${threshold} minutes is flagged as stale and needs confirmation.` : ''}</Alert>
        {!isAdmin && (
          <Card title="Your hospital">
            <Async state={mine} rows={4}>
              {(rows) => (
                <>
                  {staleMine > 0 && <div style={{ marginBottom: 16 }}><Alert tone="warning" title="Some data is stale">{staleMine} resource(s) need an update to be shown as current.</Alert></div>}
                  <div className="res-grid">{rows.map((r) => <div key={r.type} className="card card-body tight"><CapacityBar label={r.label} available={r.available} total={r.total} unit={r.unit} stale={r.stale} updatedAt={r.updatedAt} /></div>)}</div>
                  <UpdateModal open={open} onClose={() => setOpen(false)} rows={rows} onSaved={() => mine.refresh()} />
                </>
              )}
            </Async>
          </Card>
        )}
        <Card title="Network availability" actions={<SimNote />}>
          <Async state={net} rows={5}>{(l) => <Table caption="Network resource availability" columns={cols} rows={l} />}</Async>
        </Card>
      </div>
    </>
  );
}
