import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STATUS, URGENCY, fmtDate } from '../../utils/format';

const TONE_COLOR = { neutral: '#7b8793', info: '#2b6cb0', warning: '#c9820a', danger: '#c0392b', success: '#1f8a5a' };
const axis = { fontSize: 12, fill: '#5a6c7e' };

function Box({ children, tall, label }) {
  return <div className={`chart-box ${tall ? 'tall' : ''}`} role="img" aria-label={label}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

export function StatusChart({ distribution }) {
  const data = Object.entries(distribution || {}).filter(([, v]) => v > 0).map(([k, v]) => ({ key: k, name: STATUS[k].label, value: v, color: TONE_COLOR[STATUS[k].tone] }));
  if (!data.length) return <p className="muted small">No referrals to chart yet.</p>;
  return (
    <Box label={`Referral status distribution: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="#e8ecef" /><XAxis type="number" allowDecimals={false} tick={axis} /><YAxis type="category" dataKey="name" width={96} tick={axis} />
        <Tooltip cursor={{ fill: '#eef7f7' }} /><Bar dataKey="value" name="Referrals" radius={[0, 6, 6, 0]}>{data.map((d) => <Cell key={d.key} fill={d.color} />)}</Bar>
      </BarChart>
    </Box>
  );
}

export function UrgencyChart({ distribution }) {
  const data = Object.entries(distribution || {}).map(([k, v]) => ({ name: URGENCY[k].label, value: v, color: TONE_COLOR[URGENCY[k].tone] }));
  return (
    <Box label={`Referrals by urgency: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
      <BarChart data={data} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8ecef" /><XAxis dataKey="name" tick={axis} /><YAxis allowDecimals={false} tick={axis} />
        <Tooltip cursor={{ fill: '#eef7f7' }} /><Bar dataKey="value" name="Referrals" radius={[6, 6, 0, 0]}>{data.map((d) => <Cell key={d.name} fill={d.color} />)}</Bar>
      </BarChart>
    </Box>
  );
}

export function TimeChart({ points }) {
  const data = (points || []).map((p) => ({ ...p, label: fmtDate(p.date).slice(0, 6) }));
  return (
    <Box label="Referrals created per day over the last 14 days">
      <AreaChart data={data} margin={{ left: -16, right: 8 }}>
        <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f5c63" stopOpacity={0.35} /><stop offset="100%" stopColor="#0f5c63" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="#e8ecef" /><XAxis dataKey="label" tick={axis} interval={1} /><YAxis allowDecimals={false} tick={axis} />
        <Tooltip /><Area type="monotone" dataKey="count" name="Referrals" stroke="#0f5c63" strokeWidth={2} fill="url(#tg)" />
      </AreaChart>
    </Box>
  );
}

export function HospitalChart({ rows }) {
  const data = (rows || []).map((r) => ({ name: r.hospitalName.split(' ').slice(0, 2).join(' '), value: r.referrals }));
  if (!data.length) return <p className="muted small">No hospital activity yet.</p>;
  return (
    <Box label="Referral activity by hospital">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="#e8ecef" /><XAxis type="number" allowDecimals={false} tick={axis} /><YAxis type="category" dataKey="name" width={120} tick={axis} />
        <Tooltip cursor={{ fill: '#eef7f7' }} /><Bar dataKey="value" name="Referrals" fill="#0f5c63" radius={[0, 6, 6, 0]} />
      </BarChart>
    </Box>
  );
}

export function SpecialtyChart({ rows }) {
  const data = (rows || []).map((r) => ({ name: r.specialty, value: r.count }));
  if (!data.length) return <p className="muted small">No specialty data yet.</p>;
  return (
    <Box label="Most requested specialties">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="#e8ecef" /><XAxis type="number" allowDecimals={false} tick={axis} /><YAxis type="category" dataKey="name" width={140} tick={axis} />
        <Tooltip cursor={{ fill: '#eef7f7' }} /><Bar dataKey="value" name="Referrals" fill="#2b6cb0" radius={[0, 6, 6, 0]} />
      </BarChart>
    </Box>
  );
}

export function ResourceOverviewChart({ rows }) {
  const data = (rows || []).filter((r) => r.total > 0).map((r) => ({ name: r.label.replace(' supply points', ''), Available: r.available, Occupied: Math.max(r.total - r.available, 0) }));
  return (
    <Box tall label="Network resource overview: available versus total by resource type">
      <BarChart data={data} margin={{ left: -8, right: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8ecef" /><XAxis dataKey="name" tick={{ ...axis, fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis tick={axis} />
        <Tooltip /><Bar dataKey="Available" stackId="a" fill="#1f8a5a" /><Bar dataKey="Occupied" stackId="a" fill="#c8d0d7" radius={[6, 6, 0, 0]} />
      </BarChart>
    </Box>
  );
}
