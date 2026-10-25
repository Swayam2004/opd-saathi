import type { FloorId, Graph, Place, Route } from './types.ts';
import type { Dictionary } from './strings.ts';

export interface FloorPolyline {
  floor: FloorId;
  points: [number, number][];
}

/**
 * Split a route into one polyline per stay on a floor. A route that leaves a floor and
 * comes back gives two polylines for it. Connector places are the end points, so the
 * line on floor 0 ends at the lift and the line on floor 1 starts at the lift.
 */
export function routePolylines(graph: Graph, route: Route): FloorPolyline[] {
  const byId = new Map(graph.places.map((p) => [p.id, p]));
  const out: FloorPolyline[] = [];
  for (const id of route.nodes) {
    const p = byId.get(id);
    if (!p) throw new Error(`routePolylines: unknown place ${id}`);
    const last = out[out.length - 1];
    if (last && last.floor === p.floor) last.points.push([p.x, p.y]);
    else out.push({ floor: p.floor, points: [[p.x, p.y]] });
  }
  return out;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

function num(v: number): string {
  return String(Math.round(v * 100) / 100);
}

export interface SvgOptions {
  route?: Route;
  dict: Dictionary;
  /** Pixels per metre. */
  scale?: number;
  labels?: boolean;
}

/** Floor plan as a plain string. No DOM, so it renders on the server, in tests and in React. */
export function renderFloorSvg(graph: Graph, floorId: FloorId, opts: SvgOptions): string {
  const floor = graph.floors.find((f) => f.id === floorId);
  if (!floor) throw new Error(`renderFloorSvg: unknown floor ${floorId}`);
  const k = opts.scale ?? 10;
  const px = (v: number): string => num(v * k);
  const W = floor.widthM * k;
  const H = floor.heightM * k;
  const floorName = opts.dict.floors[String(floorId)] ?? String(floorId);
  const onFloor = graph.places.filter((p) => p.floor === floorId);
  const byId = new Map(graph.places.map((p) => [p.id, p]));
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(W)} ${num(H)}" width="${num(W)}" height="${num(H)}" role="img" aria-labelledby="plan-title">`,
    `<title id="plan-title">${esc(floorName)}</title>`,
    `<rect x="0" y="0" width="${num(W)}" height="${num(H)}" fill="#fff" stroke="#444" stroke-width="2"/>`,
  );

  // Corridors: every path that stays on this floor.
  for (const path of graph.paths) {
    const a = byId.get(path.a);
    const b = byId.get(path.b);
    if (!a || !b || a.floor !== floorId || b.floor !== floorId) continue;
    const dash = path.stairs ? ' stroke-dasharray="4 4"' : '';
    parts.push(`<line x1="${px(a.x)}" y1="${px(a.y)}" x2="${px(b.x)}" y2="${px(b.y)}" stroke="#cfd4da" stroke-width="${num(k * 0.8)}"${dash}/>`);
  }

  // Places. Shape carries the kind, so it works without colour.
  for (const p of onFloor) {
    if (p.kind === 'waypoint') continue;
    const label = opts.dict.places[p.id] ?? p.id;
    parts.push(`<g data-place="${esc(p.id)}">${marker(p, k)}${opts.labels === false ? '' : `<text x="${px(p.x)}" y="${num(p.y * k + k * 2.2)}" font-size="${num(k * 1.3)}" text-anchor="middle" fill="#111">${esc(label)}</text>`}</g>`);
  }

  if (opts.route) {
    for (const line of routePolylines(graph, opts.route).filter((l) => l.floor === floorId)) {
      const pts = line.points.map(([x, y]) => `${px(x)},${px(y)}`).join(' ');
      parts.push(`<polyline class="route" points="${pts}" fill="none" stroke="#0b57d0" stroke-width="${num(k * 0.6)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${num(k * 1.2)} ${num(k * 0.6)}"/>`);
    }
    const from = byId.get(opts.route.from);
    const to = byId.get(opts.route.to);
    if (from && from.floor === floorId) parts.push(`<circle class="start" cx="${px(from.x)}" cy="${px(from.y)}" r="${num(k * 1.1)}" fill="#0b57d0" stroke="#fff" stroke-width="2"/>`);
    if (to && to.floor === floorId) parts.push(`<rect class="end" x="${num(to.x * k - k * 1.1)}" y="${num(to.y * k - k * 1.1)}" width="${num(k * 2.2)}" height="${num(k * 2.2)}" fill="#b3261e" stroke="#fff" stroke-width="2"/>`);
  }

  parts.push('</svg>');
  return parts.join('');
}

function marker(p: Place, k: number): string {
  const cx = num(p.x * k);
  const cy = num(p.y * k);
  const r = num(k * 0.9);
  switch (p.kind) {
    case 'lift':
      return `<rect x="${num(p.x * k - k * 0.9)}" y="${num(p.y * k - k * 0.9)}" width="${num(k * 1.8)}" height="${num(k * 1.8)}" fill="#e8eaed" stroke="#111" stroke-width="2"/>`;
    case 'stairs':
      return `<polygon points="${num(p.x * k - k)},${num(p.y * k + k)} ${num(p.x * k + k)},${num(p.y * k + k)} ${num(p.x * k + k)},${num(p.y * k - k)}" fill="#e8eaed" stroke="#111" stroke-width="2"/>`;
    case 'ramp':
      return `<polygon points="${num(p.x * k - k)},${num(p.y * k + k)} ${num(p.x * k + k)},${num(p.y * k + k)} ${num(p.x * k + k)},${num(p.y * k - k * 0.2)}" fill="#fff" stroke="#111" stroke-width="2"/>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#111" stroke-width="2"/>`;
  }
}
