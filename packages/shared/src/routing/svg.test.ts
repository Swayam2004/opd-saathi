import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { hospital } from '../data/hospital.ts';
import { findRoute } from './route.ts';
import { esc, renderFloorSvg, routePolylines } from './svg.ts';
import { dictionaries } from './strings.ts';

function stepFree(from: string, to: string) {
  const r = findRoute(hospital, from, to, { avoidStairs: true });
  assert.ok(r.ok);
  return r.route;
}

describe('route polylines', () => {
  it('splits a route into one polyline per floor, joined at the lift', () => {
    const lines = routePolylines(hospital, stepFree('entrance', 'room3'));
    assert.deepEqual(lines, [
      { floor: 0, points: [[30, 34], [42, 32], [30, 26], [30, 20], [28, 12]] },
      { floor: 1, points: [[28, 12], [30, 20], [42, 20], [42, 12]] },
    ]);
  });

  it('a three-floor route gives three polylines', () => {
    const lines = routePolylines(hospital, stepFree('emergency', 'ward6'));
    assert.deepEqual(lines.map((l) => l.floor), [0, 2]);
    const via1 = routePolylines(hospital, { ...stepFree('emergency', 'ward6'), nodes: ['emergency', 'lift_g', 'lift_1', 'lift_2', 'ward6'] });
    assert.deepEqual(via1.map((l) => l.floor), [0, 1, 2]);
  });
});

describe('floor SVG', () => {
  const route = stepFree('entrance', 'room3');

  it('draws the route as a polyline in pixel coordinates on the floors it crosses', () => {
    const f0 = renderFloorSvg(hospital, 0, { route, dict: dictionaries.en });
    const f1 = renderFloorSvg(hospital, 1, { route, dict: dictionaries.en });
    assert.ok(f0.includes('<polyline class="route" points="300,340 420,320 300,260 300,200 280,120"'));
    assert.ok(f1.includes('<polyline class="route" points="280,120 300,200 420,200 420,120"'));
  });

  it('draws no route on a floor the route never touches', () => {
    const f2 = renderFloorSvg(hospital, 2, { route, dict: dictionaries.en });
    assert.ok(!f2.includes('class="route"'));
  });

  it('puts the start marker (circle) and the end marker (square) only on their own floors', () => {
    const f0 = renderFloorSvg(hospital, 0, { route, dict: dictionaries.en });
    const f1 = renderFloorSvg(hospital, 1, { route, dict: dictionaries.en });
    assert.ok(f0.includes('class="start"') && !f0.includes('class="end"'));
    assert.ok(f1.includes('class="end"') && !f1.includes('class="start"'));
  });

  it('has a viewBox, a title and an accessible role', () => {
    const svg = renderFloorSvg(hospital, 1, { dict: dictionaries.en });
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"'));
    assert.ok(svg.includes('role="img"') && svg.includes('<title id="plan-title">the first floor</title>'));
  });

  it('labels come from the dictionary, so Hindi switches the whole plan', () => {
    const svg = renderFloorSvg(hospital, 1, { dict: dictionaries.hi });
    assert.ok(svg.includes('कमरा 3') && svg.includes('<title id="plan-title">पहली मंज़िल</title>'));
    assert.ok(!svg.includes('Room 3'));
  });

  it('escapes names, so "Nurses\' station" cannot break the markup', () => {
    const svg = renderFloorSvg(hospital, 2, { dict: dictionaries.en });
    assert.ok(svg.includes('Nurses&#39; station'));
    assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('is balanced: every group and the svg itself close', () => {
    for (const f of [0, 1, 2] as const) {
      const svg = renderFloorSvg(hospital, f, { route, dict: dictionaries.en });
      assert.equal((svg.match(/<g /g) ?? []).length, (svg.match(/<\/g>/g) ?? []).length);
      assert.ok(svg.endsWith('</svg>'));
    }
  });
});
