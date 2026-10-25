import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { hospital } from '../data/hospital.ts';
import { findRoute } from './route.ts';
import { buildSteps, heading, renderStep, turnBetween } from './steps.ts';
import { dictionaries, TEMPLATE_KEYS } from './strings.ts';
import type { Lang } from './types.ts';

function text(from: string, to: string, avoidStairs: boolean, lang: Lang, countDoors = true): string[] {
  const r = findRoute(hospital, from, to, { avoidStairs });
  assert.ok(r.ok);
  return buildSteps(hospital, r.route, { countDoors }).map((s) => renderStep(dictionaries[lang], s));
}

describe('geometry helpers', () => {
  it('headings: 0 is plan-up, 90 is right, y grows downwards', () => {
    const o = { id: 'o', kind: 'waypoint', floor: 0, x: 0, y: 0 } as const;
    assert.equal(heading(o, { ...o, x: 5 }), 90);
    assert.equal(heading(o, { ...o, y: 5 }), 180);
    assert.equal(heading(o, { ...o, y: -5 }), 0);
    assert.equal(heading(o, { ...o, x: -5 }), 270);
  });
  it('turns: east then south is a right turn, and angles wrap', () => {
    assert.equal(turnBetween(90, 180), 90);
    assert.equal(turnBetween(90, 0), -90);
    assert.equal(turnBetween(350, 10), 20);
    assert.equal(turnBetween(10, 350), -20);
    assert.equal(turnBetween(90, 270), 180);
  });
});

describe('English steps', () => {
  it('entrance -> Room 4, step-free, across floors, with door counting', () => {
    assert.deepEqual(text('entrance', 'room4', true, 'en'), [
      'You are at Main entrance, near the security desk.',
      'Take the ramp, about 35 metres.',
      'Turn right and walk about 15 metres. The turn is near the notice board.',
      'Take the lift to the first floor.',
      'Walk straight for about 10 metres.',
      'Turn left and walk about 20 metres. The turn is near the notice board.',
      'Room 4 is the second door on your left, next to the drinking water point.',
    ]);
  });

  it('entrance -> Room 3 with stairs allowed uses the entrance steps and the staircase', () => {
    const t = text('entrance', 'room3', false, 'en');
    assert.ok(t.includes('Take the stairs to the first floor.'));
    assert.ok(t.some((s) => s.startsWith('Take the few steps ahead')));
    assert.ok(!t.some((s) => s.includes('ramp') || s.includes('lift')));
  });

  it('Room 2 from Room 1 is the first door on the left', () => {
    assert.equal(text('room1', 'room2', false, 'en').at(-1), 'Room 2 is the first door on your left, opposite the blue chairs.');
  });

  it('counts doors on the right and on the left', () => {
    assert.equal(text('lift_1', 'room8', true, 'en').at(-1), 'Room 8 is the second door on your right, next to the red fire extinguisher box.');
    assert.equal(text('lift_1', 'room5', true, 'en').at(-1), 'Room 5 is the second door on your left, near the wooden bench.');
    assert.equal(text('lift_2', 'ward4', true, 'en').at(-1), 'Ward 4 (Medicine) is the second door on your right, opposite the blue chairs.');
  });

  it('straight-in destination is "straight ahead"', () => {
    assert.equal(text('room5', 'room1', false, 'en').at(-1), 'Room 1 is straight ahead, next to the painted tree on the wall.');
  });

  it('door counting off falls back to a plain arrival', () => {
    const t = text('lift_1', 'room8', true, 'en', false);
    assert.match(t.at(-1) ?? '', /^You have arrived at Room 8, /);
  });

  it('same place gives one "already here" step', () => {
    assert.deepEqual(text('room1', 'room1', false, 'en'), ['You are already at Room 1.']);
  });

  it('lift between ground and second floor says the second floor once', () => {
    const t = text('helpdesk', 'ward5', true, 'en');
    assert.equal(t.filter((s) => s.startsWith('Take the lift')).length, 1);
    assert.ok(t.includes('Take the lift to the second floor.'));
  });
});

describe('Hindi steps', () => {
  it('entrance -> Room 4, step-free', () => {
    assert.deepEqual(text('entrance', 'room4', true, 'hi'), [
      'आप मुख्य प्रवेश द्वार पर हैं, सिक्योरिटी डेस्क के पास।',
      'रैंप से जाएँ, लगभग 35 मीटर।',
      'दाएं मुड़ें और लगभग 15 मीटर चलें। यह मोड़ सूचना पट के पास है।',
      'लिफ्ट से पहली मंज़िल पर जाएँ।',
      'लगभग 10 मीटर सीधे चलें।',
      'बाएं मुड़ें और लगभग 20 मीटर चलें। यह मोड़ सूचना पट के पास है।',
      'कमरा 4 आपके बाएं हाथ पर दूसरा दरवाज़ा है, पीने के पानी की जगह के बगल में।',
    ]);
  });
});

describe('every route renders in both languages', () => {
  it('no leftover braces, no empty steps, Hindi is in Devanagari, step ranges cover the route', () => {
    const ids = hospital.places.filter((p) => p.kind !== 'waypoint').map((p) => p.id);
    let routes = 0;
    for (const avoid of [false, true]) {
      for (const a of ids) {
        for (const b of ids) {
          const r = findRoute(hospital, a, b, { avoidStairs: avoid });
          assert.ok(r.ok);
          const steps = buildSteps(hospital, r.route);
          assert.ok(steps.length > 0);
          for (const lang of ['en', 'hi'] as const) {
            for (const s of steps) {
              const t = renderStep(dictionaries[lang], s);
              assert.ok(t.length > 0 && !/[{}]/.test(t), `${a}->${b} ${lang}: ${t}`);
              if (lang === 'hi') assert.match(t, /[ऀ-ॿ]/, `${a}->${b} hi: ${t}`);
            }
          }
          // Legs covered once, in order.
          let next = 0;
          for (const s of steps) {
            if (s.legs[0] === s.legs[1]) continue;
            assert.equal(s.legs[0], next, `${a}->${b} gap`);
            next = s.legs[1];
          }
          assert.equal(next, r.route.legs.length, `${a}->${b} not all legs covered`);
          routes++;
        }
      }
    }
    assert.equal(routes, ids.length * ids.length * 2);
  });
});

describe('translation dictionaries', () => {
  const placeholders = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();

  it('Hindi has every template key English has, with the same placeholders', () => {
    assert.deepEqual(Object.keys(dictionaries.hi.templates).sort(), [...TEMPLATE_KEYS].sort());
    for (const k of TEMPLATE_KEYS) {
      assert.deepEqual(placeholders(dictionaries.hi.templates[k]), placeholders(dictionaries.en.templates[k]), k);
    }
  });

  it('Hindi has every place, object, floor and door key English has', () => {
    for (const table of ['places', 'objects', 'floors', 'doors'] as const) {
      assert.deepEqual(Object.keys(dictionaries.hi[table]).sort(), Object.keys(dictionaries.en[table]).sort(), table);
    }
  });

  it('Hindi values contain Devanagari, so an untranslated copy is caught', () => {
    for (const table of ['places', 'objects', 'floors', 'doors', 'templates'] as const) {
      for (const [k, v] of Object.entries(dictionaries.hi[table])) {
        assert.match(v, /[ऀ-ॿ]/, `${table}.${k}`);
      }
    }
  });
});
