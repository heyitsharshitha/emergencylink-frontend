import { useMemo } from 'react';

const W = 860, H = 500, PAD = 80;

/** Projects hospital coordinates onto an SVG canvas and gently separates overlapping nodes (deterministic). */
export function layoutNodes(hospitals) {
  const pts = hospitals.filter((h) => h.latitude != null && h.longitude != null);
  if (!pts.length) return {};
  const lats = pts.map((h) => h.latitude), lngs = pts.map((h) => h.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const sx = (maxLng - minLng) || 1, sy = (maxLat - minLat) || 1;
  const pos = pts.map((h) => ({ id: h.id, x: PAD + ((h.longitude - minLng) / sx) * (W - PAD * 2), y: PAD + (1 - (h.latitude - minLat) / sy) * (H - PAD * 2) }));
  for (let it = 0; it < 60; it++) {
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y; const d = Math.hypot(dx, dy) || 0.01; const min = 74;
      if (d < min) { const push = (min - d) / 2; const ux = dx / d, uy = dy / d; pos[i].x -= ux * push; pos[i].y -= uy * push; pos[j].x += ux * push; pos[j].y += uy * push; }
    }
    pos.forEach((p) => { p.x = Math.min(W - 40, Math.max(40, p.x)); p.y = Math.min(H - 40, Math.max(40, p.y)); });
  }
  return Object.fromEntries(pos.map((p) => [p.id, p]));
}

const LIVE = new Set(['SENT', 'VIEWED', 'MORE_INFORMATION_REQUIRED', 'ACCEPTED', 'TRANSFER_IN_PROGRESS']);

/**
 * Emergency network visualisation. Nodes are hospitals from the database; connections are real referrals.
 * Every node is a keyboard-focusable button. A list view with the same data exists on the page.
 */
export default function NetworkMap({ hospitals, referrals = [], selectedId, onSelect, candidates = {}, dimmed = new Set() }) {
  const pos = useMemo(() => layoutNodes(hospitals), [hospitals]);
  const edges = useMemo(() => {
    const m = new Map();
    referrals.forEach((r) => {
      if (!r.targetHospital) return;
      const a = r.referringHospital.id, b = r.targetHospital.id; if (!pos[a] || !pos[b]) return;
      const key = `${a}-${b}`; const e = m.get(key) || { a, b, live: false, count: 0 };
      e.count++; e.live = e.live || LIVE.has(r.status); m.set(key, e);
    });
    return [...m.values()];
  }, [referrals, pos]);

  return (
    <svg className="net" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Emergency network of connected hospitals. A list view with the same information is available.">
      <g className="net-grid" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => <line key={`v${i}`} x1={(W / 11) * i} y1="0" x2={(W / 11) * i} y2={H} />)}
        {Array.from({ length: 8 }).map((_, i) => <line key={`h${i}`} x1="0" y1={(H / 7) * i} x2={W} y2={(H / 7) * i} />)}
      </g>
      {edges.map((e) => {
        const p = pos[e.a], q = pos[e.b]; const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 - 28;
        return <path key={`${e.a}-${e.b}`} className={`net-edge ${e.live ? 'live' : ''}`} d={`M${p.x},${p.y} Q${mx},${my} ${q.x},${q.y}`} />;
      })}
      {hospitals.filter((h) => pos[h.id]).map((h) => {
        const p = pos[h.id]; const sel = h.id === selectedId; const cand = candidates[h.id] != null;
        const r = 12 + Math.min(h.activeReferrals || 0, 4) * 2.5;
        const cls = ['net-node', h.receivesReferrals ? '' : 'refer', h.resourcesStale ? 'stale' : '', sel ? 'sel' : '', cand ? 'cand' : '', dimmed.has(h.id) ? 'dim' : ''].join(' ');
        const label = `${h.name}. ${h.receivesReferrals ? 'Receives referrals' : 'Refers patients'}. ${h.activeReferrals} active referrals. Resources ${h.resourcesStale ? 'stale' : 'fresh'}.${cand ? ` Compatibility ${candidates[h.id]} percent.` : ''}`;
        return (
          <g key={h.id} className={cls} transform={`translate(${p.x},${p.y})`} role="button" tabIndex={0} aria-label={label} aria-pressed={sel}
            onClick={() => onSelect(h.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(h.id); } }}>
            {h.activeReferrals > 0 && <circle className="node-pulse" r={r} />}
            <circle className="node-ring" r={r + 5} /><circle className="node-core" r={r} />
            <text className="net-label" y={r + 20} textAnchor="middle">{h.name.split(' ').slice(0, 2).join(' ')}</text>
            {cand && <text className="net-label" y={4} textAnchor="middle" style={{ fill: '#fff', stroke: 'none', fontSize: 10 }}>{candidates[h.id]}</text>}
            {!cand && h.activeReferrals > 0 && <text y={4} textAnchor="middle" style={{ fill: '#fff', fontSize: 11, fontWeight: 700 }}>{h.activeReferrals}</text>}
          </g>
        );
      })}
    </svg>
  );
}
