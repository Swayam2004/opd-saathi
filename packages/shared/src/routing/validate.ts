import type { Graph, PlaceId } from './types.ts';

export type IssueCode =
  | 'duplicate_place'
  | 'duplicate_path'
  | 'dangling_endpoint'
  | 'self_loop'
  | 'bad_metres'
  | 'shorter_than_straight_line'
  | 'bad_connector'
  | 'stairs_flag_mismatch'
  | 'parallel_path'
  | 'orphan_place'
  | 'missing_landmark'
  | 'unknown_floor'
  | 'unreachable_from_entrance'
  | 'cannot_reach_exit'
  | 'unreachable_without_stairs'
  | 'cannot_exit_without_stairs'
  | 'connector_not_aligned';

export interface Issue {
  code: IssueCode;
  subject: string;
  message: string;
}

const VERTICAL = new Set(['lift', 'stairs', 'ramp']);

/** Everything reachable from `start` along the given directed edges. */
function reach(start: PlaceId, edges: Map<PlaceId, PlaceId[]>): Set<PlaceId> {
  const seen = new Set<PlaceId>([start]);
  const stack = [start];
  for (let n = stack.pop(); n !== undefined; n = stack.pop()) {
    for (const m of edges.get(n) ?? []) {
      if (!seen.has(m)) {
        seen.add(m);
        stack.push(m);
      }
    }
  }
  return seen;
}

function directed(graph: Graph, skipStairs: boolean, reverse: boolean): Map<PlaceId, PlaceId[]> {
  const m = new Map<PlaceId, PlaceId[]>();
  const add = (a: PlaceId, b: PlaceId): void => {
    const [from, to] = reverse ? [b, a] : [a, b];
    const list = m.get(from);
    if (list) list.push(to);
    else m.set(from, [to]);
  };
  for (const p of graph.paths) {
    if (skipStairs && p.stairs) continue;
    add(p.a, p.b);
    if (!p.oneWay) add(p.b, p.a);
  }
  return m;
}

export function validateGraph(graph: Graph, entranceId = 'entrance'): Issue[] {
  const issues: Issue[] = [];
  const push = (code: IssueCode, subject: string, message: string): void => {
    issues.push({ code, subject, message });
  };

  const byId = new Map<PlaceId, (typeof graph.places)[number]>();
  for (const p of graph.places) {
    if (byId.has(p.id)) push('duplicate_place', p.id, `place id ${p.id} appears twice`);
    byId.set(p.id, p);
    if (!graph.floors.some((f) => f.id === p.floor)) push('unknown_floor', p.id, `floor ${p.floor} not declared`);
    if (p.kind !== 'waypoint' && !p.landmark) push('missing_landmark', p.id, `${p.id} has no landmark`);
  }

  const pathIds = new Set<string>();
  const seenPairs = new Set<string>();
  const touched = new Set<PlaceId>();
  for (const path of graph.paths) {
    if (pathIds.has(path.id)) push('duplicate_path', path.id, `path id ${path.id} appears twice`);
    pathIds.add(path.id);
    const a = byId.get(path.a);
    const b = byId.get(path.b);
    if (!a || !b) {
      push('dangling_endpoint', path.id, `path ${path.id} points at an unknown place`);
      continue;
    }
    touched.add(a.id);
    touched.add(b.id);
    if (a.id === b.id) push('self_loop', path.id, `path ${path.id} starts and ends at ${a.id}`);
    if (!(path.metres > 0)) push('bad_metres', path.id, `path ${path.id} has metres ${path.metres}`);

    // Two paths between the same pair, in a way that makes one redundant or contradictory.
    const key = [a.id, b.id].sort().join('|');
    if (seenPairs.has(key)) push('parallel_path', path.id, `${a.id} and ${b.id} are already joined. Merge the paths or use one two-way path`);
    seenPairs.add(key);

    if (a.floor === b.floor) {
      const straight = Math.hypot(a.x - b.x, a.y - b.y);
      if (path.metres + 1e-9 < straight) {
        push('shorter_than_straight_line', path.id, `path ${path.id} is ${path.metres} m but the places are ${straight.toFixed(1)} m apart`);
      }
    } else {
      const bothVertical = VERTICAL.has(a.kind) && a.kind === b.kind;
      if (!bothVertical) {
        push('bad_connector', path.id, `path ${path.id} changes floor but ${a.id} and ${b.id} are not the same kind of lift, stairs or ramp`);
      } else if ((a.kind === 'stairs') !== path.stairs) {
        push('stairs_flag_mismatch', path.id, `path ${path.id} joins ${a.kind} places but stairs is ${String(path.stairs)}`);
      }
      if (Math.hypot(a.x - b.x, a.y - b.y) > 3) {
        push('connector_not_aligned', path.id, `${a.id} and ${b.id} sit more than 3 m apart on their plans`);
      }
    }
  }

  for (const p of graph.places) {
    if (!touched.has(p.id)) push('orphan_place', p.id, `${p.id} has no paths`);
  }

  // Connectivity needs a valid entrance and clean ids, so stop early if those failed.
  if (!byId.has(entranceId) || issues.some((i) => i.code === 'dangling_endpoint' || i.code === 'duplicate_place')) {
    return issues;
  }

  for (const skipStairs of [false, true]) {
    const out = reach(entranceId, directed(graph, skipStairs, false));
    const back = reach(entranceId, directed(graph, skipStairs, true));
    for (const p of graph.places) {
      if (!out.has(p.id)) {
        push(
          skipStairs ? 'unreachable_without_stairs' : 'unreachable_from_entrance',
          p.id,
          skipStairs
            ? `${p.id} cannot be reached from the entrance without stairs`
            : `${p.id} cannot be reached from the entrance (check one-way paths)`,
        );
      }
      if (!back.has(p.id)) {
        push(
          skipStairs ? 'cannot_exit_without_stairs' : 'cannot_reach_exit',
          p.id,
          skipStairs
            ? `from ${p.id} there is no way back to the entrance without stairs`
            : `from ${p.id} there is no way back to the entrance (a one-way path points the wrong way?)`,
        );
      }
    }
  }
  return issues;
}
