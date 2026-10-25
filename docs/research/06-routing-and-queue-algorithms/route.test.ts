import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hospital } from './hospital.ts';
import { buildAdjacency, findRoute } from './route.ts';
import type { Graph } from './types.ts';

function route(from: string, to: string, avoidStairs: boolean, g: Graph = hospital) {
  const r = findRoute(g, from, to, { avoidStairs });
  assert.ok(r.ok, `${from} -> ${to} should have a route`);
  return r.route;
}

interface Case {
  from: string;
  to: string;
  /** Hand-added from the hospital.ts figures. */
  normal: { metres: number; via: string[] };
  stepFree: { metres: number; via: string[] };
}

// via lists only the interesting nodes; the rest follow from the corridor layout.
const CASES: Case[] = [
  { from: 'entrance', to: 'room3', normal: { metres: 64, via: ['stairs_g', 'stairs_1'] }, stepFree: { metres: 81, via: ['ramp_g', 'lift_g', 'lift_1'] } },
  { from: 'entrance', to: 'ward4', normal: { metres: 86, via: ['stairs_g', 'stairs_1', 'stairs_2'] }, stepFree: { metres: 95, via: ['ramp_g', 'lift_g', 'lift_2'] } },
  { from: 'helpdesk', to: 'room8', normal: { metres: 72, via: ['stairs_g', 'stairs_1'] }, stepFree: { metres: 64, via: ['lift_g', 'lift_1'] } },
  { from: 'room1', to: 'ward6', normal: { metres: 82, via: ['stairs_1', 'stairs_2'] }, stepFree: { metres: 74, via: ['lift_1', 'lift_2'] } },
  { from: 'room4', to: 'emergency', normal: { metres: 80, via: ['stairs_1', 'stairs_g'] }, stepFree: { metres: 72, via: ['lift_1', 'lift_g'] } },
  { from: 'xray', to: 'room2', normal: { metres: 84, via: ['stairs_g', 'stairs_1'] }, stepFree: { metres: 76, via: ['lift_g', 'lift_1'] } },
  { from: 'ward6', to: 'laboratory', normal: { metres: 92, via: ['stairs_2', 'stairs_g'] }, stepFree: { metres: 76, via: ['lift_2', 'lift_g'] } },
  { from: 'entrance', to: 'toilets_1', normal: { metres: 71, via: ['stairs_g', 'stairs_1'] }, stepFree: { metres: 88, via: ['ramp_g', 'lift_g', 'lift_1'] } },
  // Same floor, no stairs either way.
  { from: 'room5', to: 'room1', normal: { metres: 16, via: ['f1_a'] }, stepFree: { metres: 16, via: ['f1_a'] } },
  { from: 'registration', to: 'toilets_g', normal: { metres: 8 + 8 + 8, via: ['g_w1', 'g_w0'] }, stepFree: { metres: 24, via: ['g_w1', 'g_w0'] } },
  // Short trip that skips the ramp when stairs are allowed: 23 m by the steps, 48 m by the ramp.
  { from: 'entrance', to: 'lift_g', normal: { metres: 23, via: ['lobby'] }, stepFree: { metres: 48, via: ['ramp_g'] } },
  { from: 'nurses', to: 'room2', normal: { metres: 8 + 9 + 12 + 9 + 16 + 8, via: ['stairs_2', 'stairs_1'] }, stepFree: { metres: 8 + 9 + 4 + 9 + 16 + 8, via: ['lift_2', 'lift_1'] } },
];

describe('route table: 12 pairs, with and without avoid-stairs', () => {
  for (const c of CASES) {
    it(`${c.from} -> ${c.to}, stairs allowed`, () => {
      const r = route(c.from, c.to, false);
      assert.equal(r.metres, c.normal.metres);
      for (const n of c.normal.via) assert.ok(r.nodes.includes(n), `${n} in ${r.nodes.join(' ')}`);
    });
    it(`${c.from} -> ${c.to}, avoid stairs`, () => {
      const r = route(c.from, c.to, true);
      assert.equal(r.metres, c.stepFree.metres);
      for (const n of c.stepFree.via) assert.ok(r.nodes.includes(n), `${n} in ${r.nodes.join(' ')}`);
      assert.ok(r.legs.every((l) => !l.stairs), 'no stair leg');
      assert.ok(!r.nodes.some((n) => n.startsWith('stairs')), 'no staircase node');
    });
  }
});

describe('hand-checked totals', () => {
  it('entrance -> room3 with stairs is 64 m and 105 s', () => {
    // 8 m steps + 6 + 9 + 12 m stairs + 9 + 12 + 8 = 64 m.
    // Flat 44 m / 0.8 = 55 s. Steps 8 m and stairs 12 m at 0.4 m/s = 20 + 30 s.
    const r = route('entrance', 'room3', false);
    assert.equal(r.metres, 64);
    assert.equal(r.seconds, 105);
  });
  it('entrance -> room3 step-free is 81 m and 156.25 s', () => {
    // Ramp 13 + 20, 6 + 9, lift 4 m, 9 + 12 + 8 = 81 m. Flat 77 m / 0.8 = 96.25 s. Lift 5 s walk + 55 s wait.
    const r = route('entrance', 'room3', true);
    assert.equal(r.metres, 81);
    assert.equal(r.seconds, 156.25);
  });
});

describe('route properties', () => {
  it('matches Floyd-Warshall for every pair, in both modes', () => {
    for (const avoid of [false, true]) {
      const ids = hospital.places.map((p) => p.id);
      const idx = new Map(ids.map((id, i) => [id, i]));
      const adj = buildAdjacency(hospital, { avoidStairs: avoid });
      const d: number[][] = ids.map((_, i) => ids.map((__, j) => (i === j ? 0 : Infinity)));
      for (const [from, edges] of adj) {
        for (const e of edges) {
          const row = d[idx.get(from) as number] as number[];
          const j = idx.get(e.to) as number;
          row[j] = Math.min(row[j] as number, e.seconds);
        }
      }
      for (let k = 0; k < ids.length; k++)
        for (let i = 0; i < ids.length; i++)
          for (let j = 0; j < ids.length; j++) {
            const via = ((d[i] as number[])[k] as number) + ((d[k] as number[])[j] as number);
            if (via < ((d[i] as number[])[j] as number)) (d[i] as number[])[j] = via;
          }
      let pairs = 0;
      for (const a of ids) {
        for (const b of ids) {
          const r = findRoute(hospital, a, b, { avoidStairs: avoid });
          assert.ok(r.ok, `${a} -> ${b} (avoid=${avoid})`);
          const expected = (d[idx.get(a) as number] as number[])[idx.get(b) as number] as number;
          assert.ok(Math.abs(r.route.seconds - expected) < 1e-9, `${a} -> ${b}: ${r.route.seconds} vs ${expected}`);
          if (avoid) assert.ok(r.route.legs.every((l) => !l.stairs));
          pairs++;
        }
      }
      assert.equal(pairs, ids.length * ids.length);
    }
  });

  it('all-pairs run is fast enough to do on every tap', () => {
    const ids = hospital.places.map((p) => p.id);
    const t0 = performance.now();
    for (const a of ids) for (const b of ids) findRoute(hospital, a, b, { avoidStairs: true });
    const ms = performance.now() - t0;
    assert.ok(ms < 2000, `${ids.length ** 2} searches took ${ms.toFixed(0)} ms`);
  });

  it('stair-only shortcut is ignored when avoiding stairs, used otherwise', () => {
    const g = structuredClone(hospital);
    g.paths.push({ id: 'hub0>hub1', a: 'hub0', b: 'hub1', metres: 1, stairs: true, oneWay: false, extraSeconds: 0 });
    // hub0 and hub1 are on different floors; the shortcut is a test fixture, not a valid hospital.
    assert.ok(route('hub0', 'hub1', false, g).legs.some((l) => l.pathId === 'hub0>hub1'));
    assert.ok(route('hub0', 'hub1', true, g).legs.every((l) => l.pathId !== 'hub0>hub1'));
  });

  it('respects one-way paths: the pharmacy exit is used going out, never coming in', () => {
    assert.deepEqual(route('pharmacy', 'lift_g', false).nodes, ['pharmacy', 'lift_g']);
    assert.deepEqual(route('lift_g', 'pharmacy', false).nodes, ['lift_g', 'hub0', 'g_e1', 'pharmacy']);
  });

  it('lift wait penalty decides lift vs stairs', () => {
    const slow = route('lobby', 'hub1', false);
    assert.ok(slow.nodes.includes('stairs_g'), 'with a 55 s wait the stairs win for a walker with no restriction');
    const g = structuredClone(hospital);
    for (const p of g.paths) if (p.id.startsWith('lift_')) p.extraSeconds = 2;
    const fast = route('lobby', 'hub1', false, g);
    assert.ok(fast.nodes.includes('lift_g'), 'with a 2 s wait the lift wins');
    const busy = structuredClone(hospital);
    for (const p of busy.paths) if (p.id.startsWith('lift_')) p.extraSeconds = 600;
    const r = route('lobby', 'hub1', true, busy);
    assert.ok(r.nodes.includes('lift_g'), 'avoid-stairs still uses the lift however long the wait');
    assert.ok(r.seconds > 600);
  });

  it('a route from a place to itself is empty', () => {
    const r = route('room1', 'room1', false);
    assert.equal(r.legs.length, 0);
    assert.equal(r.metres, 0);
  });

  it('unknown place and no route are different answers', () => {
    assert.deepEqual(findRoute(hospital, 'room1', 'nowhere', { avoidStairs: false }), { ok: false, reason: 'unknown_place' });
    const g = structuredClone(hospital);
    g.places.push({ id: 'island', kind: 'room', floor: 1, x: 1, y: 1 });
    assert.deepEqual(findRoute(g, 'room1', 'island', { avoidStairs: false }), { ok: false, reason: 'no_route' });
  });
});
