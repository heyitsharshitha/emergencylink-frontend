import { useEffect, useState } from 'react';
import { adminApi, catalogApi, hospitalApi } from '../../api/services';
import { useAction, useFetch } from '../../hooks';
import { Modal, useToast } from '../ui/feedback';
import { Button, Check, Input, Select, Textarea } from '../ui/forms';
import { HOSPITAL_TYPES } from '../../utils/format';

const BLANK = { name: '', type: 'MULTI_SPECIALTY', address: '', city: '', state: 'Telangana', phone: '', email: '', emergencyContact: '', latitude: '', longitude: '', emergencyServices: true, specialties: [], facilities: [] };

/**
 * One hospital form for three jobs:
 *  mode "own"   - a hospital user edits its own profile
 *  mode "admin" - an administrator edits any hospital and must give a reason (audited before/after)
 *  mode "create"- an administrator adds a hospital record
 */
export default function HospitalFormModal({ mode, h, open, onClose, onSaved }) {
  const cat = useFetch(() => catalogApi.get(), [], { enabled: open });
  const [f, setF] = useState(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, run] = useAction();
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    setErrors({}); setReason('');
    setF(h && mode !== 'create' ? { name: h.name, type: h.type, address: h.address || '', city: h.city, state: h.state, phone: h.phone || '', email: h.email || '', emergencyContact: h.emergencyContact || '',
      latitude: h.latitude ?? '', longitude: h.longitude ?? '', emergencyServices: h.emergencyServices, specialties: [...h.specialties], facilities: [...h.facilities] } : { ...BLANK });
  }, [open, h, mode]);
  if (!f) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const tog = (k, v) => setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const needsReason = mode === 'admin';
  const title = mode === 'create' ? 'Add a hospital' : mode === 'admin' ? 'Edit hospital record' : 'Edit hospital profile';
  const save = () => run(async () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Name is required.';
    if (!f.city.trim()) e.city = 'City is required.';
    if (!f.state.trim()) e.state = 'State is required.';
    if (f.email && !/^\S+@\S+$/.test(f.email)) e.email = 'Enter a valid e-mail.';
    if (f.latitude !== '' && (isNaN(Number(f.latitude)) || Math.abs(Number(f.latitude)) > 90)) e.latitude = 'Latitude must be between -90 and 90.';
    if (f.longitude !== '' && (isNaN(Number(f.longitude)) || Math.abs(Number(f.longitude)) > 180)) e.longitude = 'Longitude must be between -180 and 180.';
    if (needsReason && !reason.trim()) e.reason = 'A reason is required.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { ...f, latitude: f.latitude === '' ? null : Number(f.latitude), longitude: f.longitude === '' ? null : Number(f.longitude) };
    try {
      const saved = mode === 'create' ? await adminApi.createHospital(body, reason.trim() || null)
        : mode === 'admin' ? await adminApi.editHospital(h.id, body, reason.trim())
        : await hospitalApi.update(h.id, body);
      toast.success(mode === 'create' ? 'Hospital added. Link a receiving-hospital user account so it can receive referrals.' : 'Hospital saved.');
      onSaved(saved); onClose();
    } catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); }
  });
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} wide title={title}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button loading={busy} icon="Save" onClick={save}>{mode === 'create' ? 'Add hospital' : 'Save changes'}</Button></>}>
      <div className="stack">
        <div className="grid cols-2">
          <Input label="Hospital name" required value={f.name} onChange={set('name')} error={errors.name} />
          <Select label="Type" value={f.type} onChange={set('type')} options={HOSPITAL_TYPES} />
          <Input label="Address" value={f.address} onChange={set('address')} />
          <Input label="City" required value={f.city} onChange={set('city')} error={errors.city} />
          <Input label="State" required value={f.state} onChange={set('state')} error={errors.state} />
          <Input label="Contact number" value={f.phone} onChange={set('phone')} />
          <Input label="E-mail" value={f.email} onChange={set('email')} error={errors.email} />
          <Input label="Emergency contact" value={f.emergencyContact} onChange={set('emergencyContact')} />
          <Input label="Latitude" value={f.latitude} onChange={set('latitude')} error={errors.latitude} />
          <Input label="Longitude" value={f.longitude} onChange={set('longitude')} error={errors.longitude} />
        </div>
        <Check title="Emergency services available" checked={f.emergencyServices} onChange={(v) => setF((s) => ({ ...s, emergencyServices: v }))} />
        <fieldset className="fieldset"><legend>Specialties</legend><div className="grid cols-2">{(cat.data?.specialties || []).map((s) => <Check key={s} title={s} checked={f.specialties.includes(s)} onChange={() => tog('specialties', s)} />)}</div></fieldset>
        <fieldset className="fieldset"><legend>Facilities</legend><div className="grid cols-2">{(cat.data?.facilities || []).map((s) => <Check key={s} title={s} checked={f.facilities.includes(s)} onChange={() => tog('facilities', s)} />)}</div></fieldset>
        {mode !== 'own' && <Textarea label={mode === 'create' ? 'Reason or source (optional)' : 'Reason for this change'} required={needsReason} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason}
          help="Recorded in the audit log together with a before and after summary." />}
      </div>
    </Modal>
  );
}
