import { describe, expect, it } from 'vitest';
import { minuteOfDay, simNow } from '@shared/queue/clock.ts';
import { apply, initialState, type Command, type HospitalState } from './hospital';
import { resolveTicket, ticketView } from './selectors';

const REAL = Date.UTC(2026, 9, 25, 9, 0); // 14:30 IST: outside OPD hours on purpose
const MIN = 60_000;

function run(s: HospitalState, cmd: Command, at = REAL) {
  return apply(s, cmd, at);
}

const kamla = { firstName: 'Kamla', age: 62, gender: 'woman', dept: 'MED' } as const;

describe('initialState', () => {
  const s = initialState(REAL);

  it('starts the demo clock at 10:00 IST, inside OPD hours, whatever the real time', () => {
    expect(minuteOfDay(simNow(s.clock, REAL))).toBe(10 * 60);
  });

  it('seeds the sample patients and puts one token in every room', () => {
    expect(Object.keys(s.patients)).toHaveLength(8);
    const inRooms = Object.values(s.queue.tickets).filter((t) => t.status === 'in_consult');
    expect(inRooms.map((t) => t.room).sort()).toEqual(
      ['room1', 'room2', 'room3', 'room4', 'room5', 'room6', 'room7', 'room8'].sort(),
    );
  });
});

describe('apply', () => {
  it('registers a patient, keeping only what the slip needs', () => {
    const r = run(initialState(REAL), { type: 'register', reg: kamla });
    expect(r.outcome).toEqual({ ok: true, token: 'MED-003' });
    expect(r.state.patients['MED-003']).toEqual({ name: { en: 'Kamla', hi: 'Kamla' }, age: 62, gender: 'woman' });
  });

  it('gives a wait in minutes during OPD hours', () => {
    const r = run(initialState(REAL), { type: 'register', reg: kamla });
    const v = ticketView(r.state, 'MED-003', REAL);
    expect(v?.ahead).toBe(2); // two Medicine rooms busy, nobody waiting in front
    expect(v?.wait.kind).toBe('minutes');
  });

  it('raises an urgent flag without a token and marks it seen once', () => {
    let s = run(initialState(REAL), { type: 'raiseFlag' }).state;
    expect(s.flags).toEqual([{ id: 'flag-1', raisedAtMs: simNow(s.clock, REAL) }]);
    s = run(s, { type: 'flagSeen', id: 'flag-1' }, REAL + MIN).state;
    const seenAt = s.flags[0]?.seenAtMs;
    expect(seenAt).toBeGreaterThan(0);
    s = run(s, { type: 'flagSeen', id: 'flag-1' }, REAL + 5 * MIN).state;
    expect(s.flags[0]?.seenAtMs).toBe(seenAt);
  });

  it('keeps an old token working after a move', () => {
    let s = run(initialState(REAL), { type: 'register', reg: kamla }).state;
    const moved = run(s, { type: 'move', token: 'MED-003', dept: 'BON' });
    s = moved.state;
    expect(moved.outcome).toMatchObject({ ok: true, token: 'BON-002' });
    expect(resolveTicket(s, 'med-003')?.token).toBe('BON-002');
    expect(s.patients['BON-002']?.name.en).toBe('Kamla');
  });

  it('calls the next token into a free room and reports errors without changing state', () => {
    const s0 = run(initialState(REAL), { type: 'register', reg: kamla }).state;
    const busy = run(s0, { type: 'callNext', dept: 'MED', room: 'room1' });
    expect(busy.outcome).toEqual({ ok: false, error: 'room_busy' });
    expect(busy.state).toBe(s0);
    const done = run(s0, { type: 'complete', token: 'MED-001' }).state;
    expect(run(done, { type: 'callNext', dept: 'MED', room: 'room1' }).outcome).toEqual({ ok: true, token: 'MED-003' });
  });

  it('speeds up the clock without jumping', () => {
    const s = run(initialState(REAL), { type: 'setSpeed', speed: 10 }, REAL + MIN).state;
    expect(simNow(s.clock, REAL + MIN)).toBe(simNow(initialState(REAL).clock, REAL + MIN));
    expect(simNow(s.clock, REAL + 2 * MIN) - simNow(s.clock, REAL + MIN)).toBe(10 * MIN);
  });

  it('adds 20 demo patients and resets to the seed', () => {
    const s = run(initialState(REAL), { type: 'addDemoPatients' }).state;
    expect(Object.keys(s.patients)).toHaveLength(28);
    expect(Object.keys(run(s, { type: 'reset' }).state.patients)).toHaveLength(8);
  });

  it('marks and clears out of service places', () => {
    let s = run(initialState(REAL), { type: 'setOutOfService', place: 'lift_g', on: true }).state;
    expect(s.outOfService).toEqual(['lift_g']);
    s = run(s, { type: 'setOutOfService', place: 'lift_g', on: false }).state;
    expect(s.outOfService).toEqual([]);
  });
});
