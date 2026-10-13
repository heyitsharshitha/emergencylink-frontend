/** Conceptual illustration for the landing page . */
const N = [
  { x: 90, y: 250, l: 'Community', t: 'refer' }, { x: 160, y: 90, l: 'District', t: 'refer' }, { x: 330, y: 190, l: 'EmergencyLink', t: 'hub' },
  { x: 520, y: 80, l: 'Cardiac centre', t: 'recv' }, { x: 560, y: 270, l: 'Trauma & neuro', t: 'recv' }, { x: 430, y: 340, l: 'Paediatric', t: 'recv' },
];
const E = [[0, 2], [1, 2], [2, 3], [2, 4], [2, 5]];

export default function NetworkIllustration() {
  return (
    <svg viewBox="0 0 680 400" role="img" aria-label="Illustration: referring hospitals connect through EmergencyLink to receiving hospitals">
      <defs><pattern id="g" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="rgba(255,255,255,0.08)" /></pattern></defs>
      <rect width="680" height="400" fill="url(#g)" rx="10" />
      {E.map(([a, b], i) => <path key={i} d={`M${N[a].x},${N[a].y} L${N[b].x},${N[b].y}`} stroke="#8fe0d0" strokeOpacity={0.7} strokeWidth="2" strokeDasharray="6 6" fill="none" className="net-edge live" style={{ stroke: '#8fe0d0' }} />)}
      {N.map((n, i) => (
        <g key={i} transform={`translate(${n.x},${n.y})`}>
          {n.t === 'hub' && <circle r="34" fill="#8fe0d0" opacity="0.2" className="node-pulse" style={{ fill: '#8fe0d0' }} />}
          <circle r={n.t === 'hub' ? 24 : 16} fill={n.t === 'hub' ? '#fff' : n.t === 'recv' ? '#8fe0d0' : '#c9d9e6'} />
          <circle r={n.t === 'hub' ? 9 : 6} fill="#0f5c63" />
          <text y={n.t === 'hub' ? 46 : 34} textAnchor="middle" fill="#e4f3f4" fontSize="13" fontWeight="600">{n.l}</text>
        </g>
      ))}
      <text x="16" y="386" fill="#9fc3c8" fontSize="11">Illustration of a connected district network</text>
    </svg>
  );
}
