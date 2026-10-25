import type { Graph, Path, PlaceId, Route, RouteLeg, RouteResult } from './types.ts';

export interface RouteOptions {
  /** Drop every path with stairs === true before searching. */
  avoidStairs: boolean;
  /** Metres per second on the flat. 0.8 suits a slow walker. */
  walkSpeedMps?: number;
  /** Stairs are slower than flat walking. 0.5 means half speed. */
  stairsSpeedFactor?: number;
}

export const DEFAULT_WALK_SPEED_MPS = 0.8;
export const DEFAULT_STAIRS_FACTOR = 0.5;

interface Edge {
  to: PlaceId;
  path: Path;
  seconds: number;
}

export function legSeconds(path: Path, walkSpeedMps: number, stairsFactor: number): number {
  const speed = path.stairs ? walkSpeedMps * stairsFactor : walkSpeedMps;
  return path.metres / speed + path.extraSeconds;
}

/** The avoid-stairs filter runs here, so the search can never see a stair path. */
export function buildAdjacency(graph: Graph, opts: RouteOptions): Map<PlaceId, Edge[]> {
  const speed = opts.walkSpeedMps ?? DEFAULT_WALK_SPEED_MPS;
  const factor = opts.stairsSpeedFactor ?? DEFAULT_STAIRS_FACTOR;
  const adj = new Map<PlaceId, Edge[]>();
  for (const p of graph.places) adj.set(p.id, []);
  for (const path of graph.paths) {
    if (opts.avoidStairs && path.stairs) continue;
    const seconds = legSeconds(path, speed, factor);
    adj.get(path.a)?.push({ to: path.b, path, seconds });
    if (!path.oneWay) adj.get(path.b)?.push({ to: path.a, path, seconds });
  }
  return adj;
}

/** Minimal binary min-heap keyed on cost, ties broken by id so results are deterministic. */
class MinHeap {
  private items: { id: PlaceId; cost: number }[] = [];
  get size(): number {
    return this.items.length;
  }
  private less(i: number, j: number): boolean {
    const a = this.items[i];
    const b = this.items[j];
    if (!a || !b) return false;
    return a.cost < b.cost || (a.cost === b.cost && a.id < b.id);
  }
  private swap(i: number, j: number): void {
    const a = this.items[i];
    const b = this.items[j];
    if (!a || !b) return;
    this.items[i] = b;
    this.items[j] = a;
  }
  push(id: PlaceId, cost: number): void {
    this.items.push({ id, cost });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop(): { id: PlaceId; cost: number } | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (!top || !last) return undefined;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.less(l, m)) m = l;
        if (r < this.items.length && this.less(r, m)) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
}

export function findRoute(graph: Graph, from: PlaceId, to: PlaceId, opts: RouteOptions): RouteResult {
  const adj = buildAdjacency(graph, opts);
  if (!adj.has(from) || !adj.has(to)) return { ok: false, reason: 'unknown_place' };

  const dist = new Map<PlaceId, number>([[from, 0]]);
  const prev = new Map<PlaceId, { from: PlaceId; edge: Edge }>();
  const heap = new MinHeap();
  heap.push(from, 0);

  for (let cur = heap.pop(); cur; cur = heap.pop()) {
    if (cur.cost > (dist.get(cur.id) ?? Infinity)) continue; // stale entry
    if (cur.id === to) break;
    for (const e of adj.get(cur.id) ?? []) {
      const next = cur.cost + e.seconds;
      if (next < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, next);
        prev.set(e.to, { from: cur.id, edge: e });
        heap.push(e.to, next);
      }
    }
  }

  if (!dist.has(to)) return { ok: false, reason: 'no_route' };

  const legs: RouteLeg[] = [];
  for (let at = to; at !== from; ) {
    const step = prev.get(at);
    if (!step) return { ok: false, reason: 'no_route' };
    legs.push({
      pathId: step.edge.path.id,
      from: step.from,
      to: at,
      metres: step.edge.path.metres,
      seconds: step.edge.seconds,
      stairs: step.edge.path.stairs,
    });
    at = step.from;
  }
  legs.reverse();

  const route: Route = {
    from,
    to,
    nodes: [from, ...legs.map((l) => l.to)],
    legs,
    metres: legs.reduce((s, l) => s + l.metres, 0),
    seconds: legs.reduce((s, l) => s + l.seconds, 0),
    avoidStairs: opts.avoidStairs,
  };
  return { ok: true, route };
}
