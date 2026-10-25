import { DOOR_KINDS } from './types.ts';
import type { FloorId, Graph, Landmark, Place, PlaceId, Route } from './types.ts';
import type { Dictionary, TemplateKey } from './strings.ts';

/** Params carry ids and numbers only. The renderer turns them into words. */
export type MsgParam =
  | { t: 'n'; v: number }
  | { t: 'place'; id: PlaceId }
  | { t: 'landmark'; v: Landmark }
  | { t: 'floor'; id: FloorId }
  | { t: 'door'; n: number };

export interface Msg {
  key: TemplateKey;
  params: Record<string, MsgParam>;
}

export interface Step {
  main: Msg;
  hint?: Msg;
  /** Floor the step happens on (the arrival floor for lift and stairs). */
  floor: FloorId;
  /** Indices into route.legs, inclusive start, exclusive end. Lets the UI highlight the step. */
  legs: [number, number];
}

export interface StepOptions {
  /** Say "second door on your left". Only valid when every door on the corridor is in the data. */
  countDoors?: boolean;
  /** Degrees. Headings closer than this to straight are merged into one run. */
  straightTolerance?: number;
}

const DOOR_MAX = 5;

/** Compass-style heading: 0 = plan up, 90 = right. y grows downwards. */
export function heading(a: Place, b: Place): number {
  const deg = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** Signed turn in (-180, 180]. Positive is a right turn. */
export function turnBetween(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

function roundMetres(m: number): number {
  return Math.max(5, Math.round(m / 5) * 5);
}

const n = (v: number): MsgParam => ({ t: 'n', v });

type LegKind = 'walk' | 'ramp' | 'steps' | 'lift' | 'stairs' | 'vertical_ramp';

export function buildSteps(graph: Graph, route: Route, opts: StepOptions = {}): Step[] {
  const tol = opts.straightTolerance ?? 30;
  const countDoors = opts.countDoors ?? true;
  const byId = new Map(graph.places.map((p) => [p.id, p]));
  const get = (id: PlaceId): Place => {
    const p = byId.get(id);
    if (!p) throw new Error(`buildSteps: unknown place ${id}`);
    return p;
  };
  const origin = get(route.from);
  const dest = get(route.to);
  const placeP = (id: PlaceId): MsgParam => ({ t: 'place', id });

  if (route.legs.length === 0) {
    return [{ main: { key: 'here', params: { place: placeP(origin.id) } }, floor: origin.floor, legs: [0, 0] }];
  }

  const kindOf = (i: number): LegKind => {
    const leg = route.legs[i];
    if (!leg) throw new Error('buildSteps: leg index out of range');
    const a = get(leg.from);
    const b = get(leg.to);
    if (a.floor !== b.floor) return a.kind === 'lift' ? 'lift' : a.kind === 'stairs' ? 'stairs' : 'vertical_ramp';
    if (a.kind === 'ramp' || b.kind === 'ramp') return 'ramp';
    return leg.stairs ? 'steps' : 'walk';
  };
  const legHeading = (i: number): number => {
    const leg = route.legs[i];
    if (!leg) throw new Error('buildSteps: leg index out of range');
    return heading(get(leg.from), get(leg.to));
  };
  const legTo = (i: number): Place => {
    const leg = route.legs[i];
    if (!leg) throw new Error('buildSteps: leg index out of range');
    return get(leg.to);
  };

  const steps: Step[] = [];
  if (origin.landmark) {
    steps.push({
      main: { key: 'start', params: { place: placeP(origin.id), landmark: { t: 'landmark', v: origin.landmark } } },
      floor: origin.floor,
      legs: [0, 0],
    });
  }

  let prevHeading: number | undefined = origin.facing;
  /** Last straight corridor run, kept for door counting. */
  let lastRun: { start: Place; end: Place } | undefined;
  let arrivalDone = false;
  let i = 0;

  while (i < route.legs.length) {
    const kind = kindOf(i);

    if (kind === 'lift' || kind === 'stairs' || kind === 'vertical_ramp') {
      let j = i;
      while (j + 1 < route.legs.length && kindOf(j + 1) === kind) j++;
      const end = legTo(j);
      const key: TemplateKey = kind === 'lift' ? 'lift' : kind === 'stairs' ? 'stairs' : 'ramp';
      const params: Record<string, MsgParam> =
        key === 'ramp' ? { metres: n(roundMetres(sumMetres(route, i, j + 1))) } : { floor: { t: 'floor', id: end.floor } };
      steps.push({ main: { key, params }, floor: end.floor, legs: [i, j + 1] });
      prevHeading = end.facing;
      lastRun = undefined;
      i = j + 1;
      continue;
    }

    if (kind === 'ramp' || kind === 'steps') {
      let j = i;
      while (j + 1 < route.legs.length && kindOf(j + 1) === kind) j++;
      const metres = n(roundMetres(sumMetres(route, i, j + 1)));
      steps.push({ main: { key: kind, params: { metres } }, floor: legTo(j).floor, legs: [i, j + 1] });
      prevHeading = legHeading(j);
      lastRun = undefined;
      i = j + 1;
      continue;
    }

    // Walk run: extend while the next leg is a walk that keeps going the same way.
    const h0 = legHeading(i);
    const turn = prevHeading === undefined ? 0 : turnBetween(prevHeading, h0);
    let j = i;
    while (j + 1 < route.legs.length && kindOf(j + 1) === 'walk' && Math.abs(turnBetween(legHeading(j), legHeading(j + 1))) < tol) j++;
    const runStart = get(route.legs[i]?.from ?? route.from);
    const runEnd = legTo(j);
    const isLast = j === route.legs.length - 1;

    // A single short leg that turns into a door is the arrival, not a walking step.
    if (isLast && i === j && Math.abs(turn) >= 45 && DOOR_KINDS.has(dest.kind) && lastRun && dest.landmark) {
      const side = turn > 0 ? 'right' : 'left';
      const door = countDoors ? doorOrdinal(graph, lastRun.start, lastRun.end, dest, side) : undefined;
      if (door !== undefined && door <= DOOR_MAX) {
        steps.push({
          main: {
            key: side === 'left' ? 'arrive.left' : 'arrive.right',
            params: { place: placeP(dest.id), door: { t: 'door', n: door }, landmark: { t: 'landmark', v: dest.landmark } },
          },
          floor: dest.floor,
          legs: [i, j + 1],
        });
        arrivalDone = true;
        break;
      }
    }

    const dir = Math.abs(turn) < tol ? 'straight' : Math.abs(turn) > 150 ? 'around' : turn > 0 ? 'right' : 'left';
    const step: Step = {
      main: { key: `go.${dir}`, params: { metres: n(roundMetres(sumMetres(route, i, j + 1))) } },
      floor: runEnd.floor,
      legs: [i, j + 1],
    };
    if (dir !== 'straight' && runStart.kind === 'waypoint' && runStart.landmark) {
      step.hint = { key: 'hint.turn_at', params: { landmark: { t: 'landmark', v: runStart.landmark } } };
    }
    steps.push(step);
    lastRun = { start: runStart, end: runEnd };
    prevHeading = legHeading(j);
    i = j + 1;
  }

  if (!arrivalDone) {
    const finalDir = route.legs.length > 0 ? steps[steps.length - 1] : undefined;
    const straightIn = DOOR_KINDS.has(dest.kind) && finalDir?.main.key === 'go.straight';
    if (dest.landmark) {
      steps.push({
        main: {
          key: straightIn ? 'arrive.ahead' : 'arrive',
          params: { place: placeP(dest.id), landmark: { t: 'landmark', v: dest.landmark } },
        },
        floor: dest.floor,
        legs: [route.legs.length, route.legs.length],
      });
    }
  }
  return steps;
}

function sumMetres(route: Route, from: number, to: number): number {
  return route.legs.slice(from, to).reduce((s, l) => s + l.metres, 0);
}

/**
 * Rank of `dest` among the doors on its side of the corridor run start -> end,
 * counting from the start. Returns undefined if dest is not beside the run.
 */
export function doorOrdinal(graph: Graph, start: Place, end: Place, dest: Place, side: 'left' | 'right'): number | undefined {
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  if (len === 0) return undefined;
  const dx = (end.x - start.x) / len;
  const dy = (end.y - start.y) / len;
  const project = (q: Place): { t: number; side: 'left' | 'right'; off: number } => {
    const vx = q.x - start.x;
    const vy = q.y - start.y;
    const cross = dx * vy - dy * vx; // positive: right of travel (y down)
    return { t: vx * dx + vy * dy, side: cross > 0 ? 'right' : 'left', off: Math.abs(cross) };
  };
  const d = project(dest);
  if (d.side !== side || d.off > 10) return undefined;
  let rank = 0;
  for (const q of graph.places) {
    if (q.floor !== start.floor || !DOOR_KINDS.has(q.kind)) continue;
    const p = project(q);
    if (p.side !== side || p.off > 10 || p.t <= 1) continue;
    if (p.t <= d.t + 0.5) rank++;
  }
  return rank > 0 ? rank : undefined;
}

// ---- Rendering ----

function landmarkText(dict: Dictionary, lm: Landmark): string {
  const tpl = dict.templates[`landmark.${lm.rel}`];
  const obj = dict.objects[lm.obj];
  if (tpl === undefined || obj === undefined) throw new Error(`missing landmark text for ${lm.rel}/${lm.obj}`);
  return tpl.replace('{obj}', obj);
}

function paramText(dict: Dictionary, p: MsgParam): string {
  switch (p.t) {
    case 'n':
      return String(p.v);
    case 'place':
      return lookup(dict.places, p.id, 'place');
    case 'floor':
      return lookup(dict.floors, String(p.id), 'floor');
    case 'door':
      return lookup(dict.doors, String(p.n), 'door');
    case 'landmark':
      return landmarkText(dict, p.v);
  }
}

function lookup(table: Record<string, string>, key: string, what: string): string {
  const v = table[key];
  if (v === undefined) throw new Error(`missing ${what} text for ${key}`);
  return v;
}

export function renderMsg(dict: Dictionary, msg: Msg): string {
  const tpl = dict.templates[msg.key];
  return tpl.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const p = msg.params[name];
    if (!p) throw new Error(`template ${msg.key} needs {${name}}`);
    return paramText(dict, p);
  });
}

export function renderStep(dict: Dictionary, step: Step): string {
  return step.hint ? `${renderMsg(dict, step.main)} ${renderMsg(dict, step.hint)}` : renderMsg(dict, step.main);
}
