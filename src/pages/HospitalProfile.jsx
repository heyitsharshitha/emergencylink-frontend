import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminApi, hospitalApi } from '../api/services';
import HospitalFormModal from '../components/domain/HospitalFormModal';
import { ResourceCorrectionModal, ResourceHistory } from '../components/domain/ResourceCorrection';
import { useAuth } from '../context/AuthContext';
import { useAction, useFetch } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Alert, Badge, CapacityBar, Card, Freshness, SimNote } from '../components/ui/display';
import { Async, ConfirmDialog, Modal, useToast } from '../components/ui/feedback';
import { Button, Check, Input, Select } from '../components/ui/forms';
import Icon from '../components/ui/Icon';
import { HOSPITAL_TYPES, typeLabel } from '../utils/format';

export default function HospitalProfile() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const state = useFetch(() => hospitalApi.get(id), [id]);
  const [edit, setEdit] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [busy, run] = useAction();
  const h = state.data;
  const own = user.hospitalId === Number(id);

  return (
    <>
      <PageHeader title={h?.name || 'Hospital profile'} description={h ? `${h.city}, ${h.state} · ${typeLabel(h.type)}` : undefined}
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Emergency network', to: '/app/network' }, { label: h?.name || 'Hospital' }]}
        actions={h && <>{(own || isAdmin) && <Button icon="Edit3" variant="secondary" onClick={() => setEdit(true)}>Edit profile</Button>}
          {isAdmin && <Button variant="secondary" icon="Gauge" onClick={() => setCorrect(true)}>Correct resources</Button>}
          {isAdmin && <Button variant={h.active ? 'danger-outline' : 'primary'} onClick={() => setToggle(true)}>{h.active ? 'Deactivate hospital' : 'Activate hospital'}</Button>}</>} />
      <Async state={state} rows={6}>
        {() => (
          <div className="detail-grid">
            <div className="stack">
              {!h.active && <Alert tone="warning" title="This hospital is deactivated">It is hidden from other hospitals and cannot receive new referrals.</Alert>}
              <Card title="Profile">
                <dl className="kv">
                  <dt>Address</dt><dd>{h.address || '—'}, {h.city}, {h.state}</dd>
                  <dt>Contact</dt><dd><Icon name="Phone" size={13} /> {h.phone || '—'}</dd>
                  <dt>Emergency contact</dt><dd>{h.emergencyContact || '—'}</dd>
                  <dt>E-mail</dt><dd>{h.email || '—'}</dd>
                  <dt>Role in network</dt><dd><Badge tone={h.receivesReferrals ? 'success' : 'neutral'}>{h.receivesReferrals ? 'Receives referrals' : 'Refers patients'}</Badge> {h.emergencyServices && <Badge tone="outline" icon="Siren">Emergency services</Badge>}</dd>
                  <dt>Location</dt><dd>{h.latitude != null ? `${h.latitude}, ${h.longitude}` : 'Not set'}</dd>
                </dl>
              </Card>
              <Card title="Specialties and facilities">
                <div className="stack"><div><div className="xs muted" style={{ marginBottom: 6 }}>Specialties</div><div className="tag-row">{h.specialties.length ? h.specialties.map((s) => <Badge key={s} tone="teal">{s}</Badge>) : <span className="muted small">None listed</span>}</div></div>
                  <div><div className="xs muted" style={{ marginBottom: 6 }}>Facilities</div><div className="tag-row">{h.facilities.length ? h.facilities.map((s) => <Badge key={s} tone="outline">{s}</Badge>) : <span className="muted small">None listed</span>}</div></div></div>
              </Card>
            </div>
            <Card title="Resource availability" actions={<Freshness updatedAt={h.lastResourceUpdate} stale={h.resourcesStale} compact />}>
              <div className="stack">
                {h.resources.length === 0 && <p className="muted small">This hospital has not published any availability yet. Treat all resources as unknown.</p>}
                {h.resources.map((r) => <CapacityBar key={r.type} label={r.label} available={r.available} total={r.total} unit={r.unit} stale={r.stale} updatedAt={r.updatedAt} />)}
                <SimNote />
              </div>
            </Card>
          </div>
        )}
      </Async>
      {isAdmin && h && <div style={{ marginTop: 20 }}><ResourceHistory hospitalId={h.id} refreshKey={historyKey} /></div>}
      <HospitalFormModal mode={isAdmin ? 'admin' : 'own'} h={h} open={edit} onClose={() => setEdit(false)} onSaved={() => state.refresh()} />
      {isAdmin && h && <ResourceCorrectionModal hospital={h} open={correct} onClose={() => setCorrect(false)} onSaved={() => { state.refresh(); setHistoryKey((k) => k + 1); }} />}
      <ConfirmDialog open={toggle} onClose={() => setToggle(false)} busy={busy} danger={h?.active} title={h?.active ? 'Deactivate this hospital?' : 'Activate this hospital?'}
        message={h?.active ? 'It will disappear from matching and the network for other users. Existing referrals are kept.' : 'It will appear in the network and matching again.'} confirmLabel={h?.active ? 'Deactivate' : 'Activate'}
        noteLabel="Reason (recorded in the audit log)" noteRequired={!!h?.active}
        onConfirm={(reason) => run(async () => { try { await adminApi.setHospitalActive(h.id, !h.active, reason); toast.success('Hospital updated.'); setToggle(false); state.refresh(); } catch (e) { toast.error(e.message); } })} />
    </>
  );
}
