import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogApi, hospitalApi, referralApi } from '../api/services';
import { useDebounce, useFetch } from '../hooks';
import { PageHeader } from '../components/ui/data';
import { Alert, Badge, CapacityBar, Card, Freshness, SimNote } from '../components/ui/display';
import { Async, EmptyState } from '../components/ui/feedback';
import { Input, Segmented, Select } from '../components/ui/forms';
import Icon from '../components/ui/Icon';
import NetworkMap from '../components/domain/NetworkMap';
import HospitalCard from '../components/domain/HospitalCard';
import { typeLabel } from '../utils/format';

const RES = [['ICU_BED', 'ICU bed available'], ['EMERGENCY_BED', 'Emergency bed available'], ['VENTILATOR', 'Ventilator available'], ['BLOOD_UNITS', 'Blood available']];

export default function Network() {
  const [params] = useSearchParams();
  const [view, setView] = useState('network');
  const [q, setQ] = useState('');
  const [specialty, setSpecialty] = useState(params.get('specialty') || '');
  const [facility, setFacility] = useState(params.get('facility') || '');
  const [resource, setResource] = useState('');
  const [selected, setSelected] = useState(null);
  const dq = useDebounce(q, 250).trim().toLowerCase();
  const refId = params.get('referral');

  const net = useFetch(() => hospitalApi.network(), []);
  const refs = useFetch(() => referralApi.list({ size: 100, sort: 'updatedAt' }), []);
  const cat = useFetch(() => catalogApi.get(), []);
  const cand = useFetch(() => referralApi.preview(refId), [refId], { enabled: !!refId });
  const candidates = useMemo(() => Object.fromEntries((cand.data || []).map((m) => [m.hospitalId, m.score])), [cand.data]);

  const hospitals = net.data || [];
  const matches = (h) => (!dq || h.name.toLowerCase().includes(dq) || h.city.toLowerCase().includes(dq))
    && (!specialty || h.specialties.some((s) => s.toLowerCase() === specialty.toLowerCase()))
    && (!facility || h.facilities.some((s) => s.toLowerCase() === facility.toLowerCase()))
    && (!resource || h.resources.some((r) => r.type === resource && r.available > 0));
  const visible = hospitals.filter(matches);
  const dimmed = new Set(hospitals.filter((h) => !matches(h)).map((h) => h.id));
  const sel = hospitals.find((h) => h.id === selected);
  const active = (refs.data?.content || []).filter((r) => r.targetHospital && !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(r.status)).length;

  return (
    <>
      <PageHeader title="Emergency network" description="Connected hospitals, their reported availability and referral connections. Every node and every number comes from the database, with a list view that shows the same information."
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Emergency network' }]} actions={<Segmented label="View" value={view} onChange={setView} options={[['network', 'Network', 'Network'], ['list', 'List', 'List']]} />} />
      <div className="stack">
        <Card bodyClass="tight"><div className="filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          <Input label="Search" icon="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hospital or city" />
          <Select label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Any specialty" options={cat.data?.specialties || []} />
          <Select label="Facility" value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Any facility" options={cat.data?.facilities || []} />
          <Select label="Availability" value={resource} onChange={(e) => setResource(e.target.value)} placeholder="Any" options={RES} />
        </div></Card>
        {refId && (cand.data ? <Alert tone="info" title="Candidate hospitals highlighted">Amber rings and the number inside each node show the rule-based compatibility score for this referral.{' '}<Link to={`/app/referrals/${refId}`}>Back to referral</Link></Alert>
          : cand.error && <Alert tone="warning">Candidates could not be loaded: {cand.error.message}</Alert>)}
        <Async state={net} rows={6}>
          {() => (
            <div className="net-layout">
              <div className="stack">
                {view === 'network' ? (
                  <div className="net-wrap">
                    <NetworkMap hospitals={hospitals} referrals={refs.data?.content || []} selectedId={selected} onSelect={setSelected} candidates={candidates} dimmed={dimmed} />
                    <div className="net-legend" aria-hidden="true">
                      <span><i style={{ background: 'var(--teal-700)' }} />Receives referrals</span><span><i style={{ background: 'var(--navy-700)' }} />Refers patients</span><span><i style={{ background: '#7a8794' }} />Stale resource data</span>
                      <span><i style={{ background: '#c9820a' }} />Candidate (match)</span><span>Number = active referrals · dashed line = referral in progress ({active} active)</span>
                    </div>
                  </div>
                ) : (visible.length === 0 ? <Card><EmptyState icon="SearchX" title="No hospitals match these filters">Clear a filter to see more of the network.</EmptyState></Card>
                  : <div className="grid cols-2">{visible.map((h) => <HospitalCard key={h.id} h={h} score={candidates[h.id]} selected={selected === h.id} onSelect={setSelected} />)}</div>)}
                <div className="row between wrap"><span className="small muted">{visible.length} of {hospitals.length} hospitals shown</span><SimNote>Availability is as last reported by each hospital.</SimNote></div>
              </div>
              <div className="sticky">
                <Card title={sel ? sel.name : 'Hospital details'}>
                  {!sel ? <EmptyState icon="Network" title="Select a hospital">Choose a node (or a card in list view) to see its specialties, availability and freshness.</EmptyState> : (
                    <div className="stack">
                      <div className="small muted"><Icon name="MapPin" size={12} /> {sel.city}, {sel.state} · {typeLabel(sel.type)}</div>
                      <div className="row wrap" style={{ gap: 6 }}><Badge tone={sel.receivesReferrals ? 'success' : 'neutral'}>{sel.receivesReferrals ? 'Receives referrals' : 'Refers patients'}</Badge>{sel.emergencyServices && <Badge tone="outline" icon="Siren">Emergency services</Badge>}<Badge tone="info" icon="Activity">{sel.activeReferrals} active</Badge></div>
                      <Freshness updatedAt={sel.lastResourceUpdate} stale={sel.resourcesStale} />
                      <div className="tag-row">{sel.specialties.map((s) => <Badge key={s} tone="teal">{s}</Badge>)}</div>
                      {sel.resources.filter((r) => ['ICU_BED', 'EMERGENCY_BED', 'VENTILATOR', 'BLOOD_UNITS'].includes(r.type)).map((r) => <CapacityBar key={r.type} label={r.label} available={r.available} total={r.total} unit={r.unit} stale={r.stale} />)}
                      <Link className="btn btn-primary" to={`/app/hospitals/${sel.id}`}>Open hospital profile</Link>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </Async>
      </div>
    </>
  );
}
