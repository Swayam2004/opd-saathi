import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { hospital } from '../data/hospital.ts';
import { validateGraph } from './validate.ts';
import type { Graph, Path, Place } from './types.ts';
import { dictionaries } from './strings.ts';

function clone(g: Graph): Graph {
  return structuredClone(g);
}
function codes(g: Graph): string[] {
  return validateGraph(g).map((i) => i.code);
}
function path(g: Graph, id: string): Path {
  const p = g.paths.find((x) => x.id === id);
  if (!p) throw new Error(`no path ${id}`);
  return p;
}

describe('sample hospital', () => {
  it('has no validation issues', () => {
    assert.deepEqual(validateGraph(hospital), []);
  });

  it('has the places the brief lists', () => {
    const searchable = hospital.places.filter((p) => p.kind !== 'waypoint');
    assert.equal(searchable.filter((p) => p.floor === 0).length, 13);
    assert.equal(searchable.filter((p) => p.floor === 1).length, 12);
    assert.equal(searchable.filter((p) => p.floor === 2).length, 6);
  });

  it('has an English and a Hindi name for every searchable place and landmark', () => {
    for (const lang of ['en', 'hi'] as const) {
      const d = dictionaries[lang];
      for (const p of hospital.places.filter((q) => q.kind !== 'waypoint')) {
        assert.ok(d.places[p.id], `${lang} name for ${p.id}`);
      }
      for (const p of hospital.places) {
        if (p.landmark) assert.ok(d.objects[p.landmark.obj], `${lang} landmark object ${p.landmark.obj}`);
      }
    }
  });
});

describe('validator catches mistakes', () => {
  it('orphan place', () => {
    const g = clone(hospital);
    g.places.push({ id: 'ghost', kind: 'room', floor: 1, x: 1, y: 1, landmark: { rel: 'near', obj: 'bench' } });
    assert.ok(codes(g).includes('orphan_place'));
  });

  it('dangling path endpoint', () => {
    const g = clone(hospital);
    path(g, 'lobby>emergency').b = 'emergancy';
    assert.ok(codes(g).includes('dangling_endpoint'));
  });

  it('duplicate place id', () => {
    const g = clone(hospital);
    const dup: Place = { ...(g.places[0] as Place) };
    g.places.push(dup);
    assert.ok(codes(g).includes('duplicate_place'));
  });

  it('one-way path pointing the wrong way strands a place', () => {
    const g = clone(hospital);
    const p = path(g, 'lobby>emergency');
    p.oneWay = true;
    [p.a, p.b] = [p.b, p.a]; // now emergency -> lobby only: you can leave but never arrive
    const found = validateGraph(g).filter((i) => i.subject === 'emergency').map((i) => i.code);
    assert.ok(found.includes('unreachable_from_entrance'), found.join());
  });

  it('one-way path that traps people inside', () => {
    const g = clone(hospital);
    g.paths = g.paths.filter((p) => p.id !== 'pharmacy>lift_g'); // drop the exit door
    const p = path(g, 'pharmacy>g_e1');
    [p.a, p.b] = [p.b, p.a];
    p.oneWay = true; // g_e1 -> pharmacy only: people can walk in and never out
    const found = validateGraph(g).filter((i) => i.subject === 'pharmacy').map((i) => i.code);
    assert.ok(found.includes('cannot_reach_exit'), found.join());
  });

  it('one-way path that locks people out', () => {
    const g = clone(hospital);
    path(g, 'pharmacy>g_e1').oneWay = true; // pharmacy -> g_e1 only: nobody can walk in
    const found = validateGraph(g).filter((i) => i.subject === 'pharmacy').map((i) => i.code);
    assert.ok(found.includes('unreachable_from_entrance'), found.join());
  });

  it('place only reachable by stairs', () => {
    const g = clone(hospital);
    // Remove both lift links to floor 2. Wards still reachable by stairs, not step-free.
    g.paths = g.paths.filter((p) => p.id !== 'lift_1>lift_2' && p.id !== 'lift_g>lift_2');
    const found = validateGraph(g).map((i) => `${i.code}:${i.subject}`);
    assert.ok(found.includes('unreachable_without_stairs:ward4'), found.join());
    assert.ok(!found.some((f) => f.startsWith('unreachable_from_entrance')));
  });

  it('distance shorter than the straight line', () => {
    const g = clone(hospital);
    path(g, 'hub0>g_e1').metres = 3;
    assert.ok(codes(g).includes('shorter_than_straight_line'));
  });

  it('floor change between non-connectors', () => {
    const g = clone(hospital);
    g.paths.push({ id: 'room1>ward4', a: 'room1', b: 'ward4', metres: 10, stairs: false, oneWay: false, extraSeconds: 0 });
    assert.ok(codes(g).includes('bad_connector'));
  });

  it('stairs flag missing on a staircase', () => {
    const g = clone(hospital);
    path(g, 'stairs_g>stairs_1').stairs = false;
    assert.ok(codes(g).includes('stairs_flag_mismatch'));
  });

  it('same pair declared twice', () => {
    const g = clone(hospital);
    g.paths.push({ ...path(g, 'lobby>emergency'), id: 'emergency>lobby' });
    assert.ok(codes(g).includes('parallel_path'));
  });

  it('searchable place without a landmark', () => {
    const g = clone(hospital);
    delete (g.places.find((p) => p.id === 'room2') as Place).landmark;
    assert.ok(codes(g).includes('missing_landmark'));
  });
});
