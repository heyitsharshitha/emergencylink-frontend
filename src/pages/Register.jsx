import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { catalogApi } from '../api/services';
import { useFetch, useAction } from '../hooks';
import { Button, Input, Select, Check } from '../components/ui/forms';
import { Alert, Card } from '../components/ui/display';
import { useToast } from '../components/ui/feedback';
import { HOSPITAL_TYPES } from '../utils/format';
import { PageHeader } from '../components/ui/data';

const init = { fullName: '', email: '', password: '', role: 'REFERRING_HOSPITAL', hospitalName: '', hospitalType: 'COMMUNITY', address: '', city: '', state: 'Telangana', phone: '', emergencyContact: '', latitude: '', longitude: '', specialties: [], facilities: [] };

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const cat = useFetch(() => catalogApi.get(), []);
  const [f, setF] = useState(init);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, run] = useAction();
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (k, v) => setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));

  const validate = () => {
    const e = {};
    if (!f.fullName.trim()) e.fullName = 'Your name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid e-mail address.';
    if (f.password.length < 8) e.password = 'Use at least 8 characters.';
    if (!f.hospitalName.trim()) e.hospitalName = 'Hospital name is required.';
    if (!f.city.trim()) e.city = 'City is required.';
    if (!f.state.trim()) e.state = 'State is required.';
    if (f.latitude !== '' && (isNaN(f.latitude) || f.latitude < -90 || f.latitude > 90)) e.latitude = 'Latitude must be between -90 and 90.';
    if (f.longitude !== '' && (isNaN(f.longitude) || f.longitude < -180 || f.longitude > 180)) e.longitude = 'Longitude must be between -180 and 180.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate(); setErrors(e); setApiError('');
    if (Object.keys(e).length) { toast.error('Please fix the highlighted fields.'); return; }
    run(async () => {
      try {
        await register({ ...f, latitude: f.latitude === '' ? null : Number(f.latitude), longitude: f.longitude === '' ? null : Number(f.longitude) });
        toast.success('Hospital registered. Welcome to EmergencyLink.');
        nav('/app', { replace: true });
      } catch (err) { setErrors((s) => ({ ...s, ...err.fieldErrors })); setApiError(err.message); }
    });
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 56px' }}>
      <PageHeader title="Register a hospital" description="Creates your hospital profile and its first user account. An administrator reviews new registrations." />
      {apiError && <div style={{ marginBottom: 16 }}><Alert tone="danger" title="Registration failed">{apiError}</Alert></div>}
      <form onSubmit={submit} noValidate className="stack">
        <Card title="1 · Your account">
          <div className="grid cols-2">
            <Input label="Full name" required value={f.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
            <Input label="E-mail" type="email" required value={f.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            <Input label="Password" type="password" required value={f.password} onChange={set('password')} error={errors.password} help="At least 8 characters. Stored as a BCrypt hash." autoComplete="new-password" />
            <Select label="How will this hospital use EmergencyLink?" required value={f.role} onChange={set('role')} options={[['REFERRING_HOSPITAL', 'Referring hospital — sends referrals'], ['RECEIVING_HOSPITAL', 'Receiving hospital — reviews and decides']]} error={errors.role} />
          </div>
        </Card>
        <Card title="2 · Hospital profile">
          <div className="grid cols-2">
            <Input label="Hospital name" required value={f.hospitalName} onChange={set('hospitalName')} error={errors.hospitalName} />
            <Select label="Hospital type" required value={f.hospitalType} onChange={set('hospitalType')} options={HOSPITAL_TYPES} />
            <Input label="Address" value={f.address} onChange={set('address')} className="" />
            <Input label="City" required value={f.city} onChange={set('city')} error={errors.city} />
            <Input label="State" required value={f.state} onChange={set('state')} error={errors.state} />
            <Input label="Contact number" value={f.phone} onChange={set('phone')} inputMode="tel" />
            <Input label="Emergency contact" value={f.emergencyContact} onChange={set('emergencyContact')} inputMode="tel" />
            <div className="grid cols-2" style={{ gap: 12 }}>
              <Input label="Latitude" value={f.latitude} onChange={set('latitude')} error={errors.latitude} help="Optional, used for distance estimates" inputMode="decimal" />
              <Input label="Longitude" value={f.longitude} onChange={set('longitude')} error={errors.longitude} inputMode="decimal" />
            </div>
          </div>
        </Card>
        <Card title="3 · Specialties and facilities (optional, editable later)">
          {cat.data ? (
            <div className="stack">
              <fieldset className="fieldset"><legend>Specialties</legend><div className="grid cols-3">{cat.data.specialties.map((s) => <Check key={s} title={s} checked={f.specialties.includes(s)} onChange={() => toggle('specialties', s)} />)}</div></fieldset>
              <fieldset className="fieldset"><legend>Facilities</legend><div className="grid cols-3">{cat.data.facilities.map((s) => <Check key={s} title={s} checked={f.facilities.includes(s)} onChange={() => toggle('facilities', s)} />)}</div></fieldset>
            </div>
          ) : cat.error ? <Alert tone="warning">Could not load the specialty list ({cat.error.message}). You can add them later from your profile.</Alert> : <p className="muted small">Loading options…</p>}
        </Card>
        <div className="row between wrap">
          <span className="small muted">Already registered? <Link to="/login">Sign in</Link></span>
          <Button type="submit" size="lg" loading={busy}>Create hospital account</Button>
        </div>
      </form>
    </div>
  );
}
