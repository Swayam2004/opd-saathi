import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { hospital } from './hospital.ts';
import { departments } from './departments.ts';
import { DEMO_PATIENTS, SEED_PATIENTS } from './patients.ts';

describe('departments', () => {
  it('are the seven from the contract, once each', () => {
    assert.deepEqual(
      departments.map((d) => d.code),
      ['MED', 'CHI', 'WOM', 'BON', 'ENT', 'EYE', 'SKI'],
    );
  });

  it('use OPD rooms that exist in the hospital, and no room twice', () => {
    const rooms = departments.flatMap((d) => d.rooms);
    assert.equal(new Set(rooms).size, rooms.length);
    for (const id of rooms) {
      const place = hospital.places.find((p) => p.id === id);
      assert.ok(place, `${id} is not a place`);
      assert.equal(place.kind, 'room', `${id} is not a room`);
      assert.equal(place.floor, 1, `${id} is not on the first floor`);
    }
  });

  it('give every OPD room in the hospital to a department', () => {
    const rooms = new Set(departments.flatMap((d) => d.rooms));
    for (const p of hospital.places.filter((q) => q.kind === 'room')) {
      assert.ok(rooms.has(p.id), `${p.id} has no department`);
    }
  });

  it('have positive consultation times and seats', () => {
    for (const d of departments) {
      assert.ok(d.seedAvgMinutes > 0, d.code);
      assert.ok(d.seats > 0, d.code);
    }
  });
});

describe('sample patients', () => {
  it('seed about 8 and add 20 in the demo', () => {
    assert.equal(SEED_PATIENTS.length, 8);
    assert.equal(DEMO_PATIENTS.length, 20);
  });

  it('cover every department in the seed, so the board is never empty', () => {
    const seeded = new Set(SEED_PATIENTS.map((p) => p.dept));
    for (const d of departments) assert.ok(seeded.has(d.code), d.code);
  });

  it('have a name in both scripts and a plausible age', () => {
    for (const p of [...SEED_PATIENTS, ...DEMO_PATIENTS]) {
      assert.ok(p.firstName.en.trim() && p.firstName.hi.trim(), p.firstName.en);
      assert.ok(p.age >= 0 && p.age <= 120, p.firstName.en);
    }
  });
});
