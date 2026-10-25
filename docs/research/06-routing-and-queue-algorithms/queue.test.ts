import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  callNext,
  callToken,
  completeConsult,
  createState,
  deptAverage,
  formatToken,
  inService,
  issueToken,
  markNoShow,
  MAX_DEFERRALS,
  moveDepartment,
  newDay,
  peopleAhead,
  reinstate,
  sendToEnd,
  startConsult,
  waitingQueue,
} from './queue.ts';
import type { QueueState } from './queue.ts';
import { departments } from './departments.ts';
import { estimateWait } from './wait.ts';

const T0 = Date.UTC(2026, 9, 24, 4, 30);
const MIN = 60_000;

function fresh(): QueueState {
  return createState(departments, '2026-10-24');
}

/** Issue n tokens in a department and return the final state and tokens in order. */
function issue(state: QueueState, dept: string, n: number): { state: QueueState; tokens: string[] } {
  const tokens: string[] = [];
  let s = state;
  for (let i = 0; i < n; i++) {
    const r = issueToken(s, dept, T0 + i * MIN);
    assert.ok(r.ok);
    s = r.state;
    tokens.push(r.ticket.token);
  }
  return { state: s, tokens };
}

function ok<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  assert.equal(r.ok, true, JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
}

describe('token numbering', () => {
  it('uses prefix and a zero-padded number, per department', () => {
    const a = issue(fresh(), 'medicine', 3);
    assert.deepEqual(a.tokens, ['MED-001', 'MED-002', 'MED-003']);
    const b = issue(a.state, 'eyes', 1);
    assert.deepEqual(b.tokens, ['EYE-001']);
  });
  it('pads to three digits and grows past 999', () => {
    assert.equal(formatToken('MED', 42), 'MED-042');
    assert.equal(formatToken('MED', 1000), 'MED-1000');
  });
  it('unknown department is an error, not a crash', () => {
    assert.deepEqual(issueToken(fresh(), 'dentist', T0), { ok: false, error: 'unknown_department' });
  });
  it('a new day restarts numbering and clears tickets but keeps consultation history', () => {
    let s = issue(fresh(), 'medicine', 1).state;
    s = ok(callNext(s, 'medicine', 'room1', T0)).state;
    s = ok(startConsult(s, 'MED-001', T0)).state;
    s = ok(completeConsult(s, 'MED-001', T0 + 8 * MIN)).state;
    const d2 = newDay(s, '2026-10-25');
    assert.equal(Object.keys(d2.tickets).length, 0);
    assert.deepEqual(d2.departments['medicine']?.history, [8]);
    assert.equal(ok(issueToken(d2, 'medicine', T0)).ticket.token, 'MED-001');
  });
  it('state survives a JSON round trip, which the server store and localStorage both need', () => {
    const { state } = issue(fresh(), 'medicine', 4);
    assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  });
});

describe('call next', () => {
  it('calls in token order', () => {
    const { state } = issue(fresh(), 'medicine', 3);
    const r = ok(callNext(state, 'medicine', 'room1', T0));
    assert.equal(r.ticket.token, 'MED-001');
    assert.equal(r.ticket.status, 'called');
    assert.equal(r.ticket.room, 'room1');
  });
  it('empty queue is an error', () => {
    assert.deepEqual(callNext(fresh(), 'medicine', 'room1', T0), { ok: false, error: 'empty_queue' });
  });
  it('a room cannot be called into twice', () => {
    const { state } = issue(fresh(), 'medicine', 2);
    const s = ok(callNext(state, 'medicine', 'room1', T0)).state;
    assert.deepEqual(callNext(s, 'medicine', 'room1', T0), { ok: false, error: 'room_busy' });
  });
  it('two rooms of one department share one queue', () => {
    const { state } = issue(fresh(), 'medicine', 3);
    const a = ok(callNext(state, 'medicine', 'room1', T0));
    const b = ok(callNext(a.state, 'medicine', 'room2', T0));
    assert.equal(b.ticket.token, 'MED-002');
    assert.equal(inService(b.state, 'medicine').length, 2);
  });
  it('a room from another department is rejected', () => {
    const { state } = issue(fresh(), 'medicine', 1);
    assert.deepEqual(callNext(state, 'medicine', 'room3', T0), { ok: false, error: 'unknown_room' });
  });
  it('staff can call a token out of order, which is how they act on an urgent case', () => {
    const { state } = issue(fresh(), 'medicine', 5);
    const r = ok(callToken(state, 'MED-005', 'room1', T0));
    assert.equal(r.ticket.token, 'MED-005');
    assert.deepEqual(waitingQueue(r.state, 'medicine').map((t) => t.token), ['MED-001', 'MED-002', 'MED-003', 'MED-004']);
  });
});

describe('no-show, send to end, reinstate', () => {
  it('no-show removes the token from the queue and frees the room', () => {
    let s = issue(fresh(), 'medicine', 2).state;
    s = ok(callNext(s, 'medicine', 'room1', T0)).state;
    s = ok(markNoShow(s, 'MED-001')).state;
    assert.equal(s.tickets['MED-001']?.status, 'no_show');
    assert.equal(inService(s, 'medicine').length, 0);
    assert.equal(peopleAhead(s, 'MED-002'), 0);
    assert.equal(ok(callNext(s, 'medicine', 'room1', T0)).ticket.token, 'MED-002');
  });
  it('only a called token can be marked no-show', () => {
    const { state } = issue(fresh(), 'medicine', 1);
    assert.deepEqual(markNoShow(state, 'MED-001'), { ok: false, error: 'wrong_status' });
  });
  it('send to end puts the token last and keeps its number', () => {
    const { state } = issue(fresh(), 'medicine', 4);
    const s = ok(sendToEnd(state, 'MED-001')).state;
    assert.deepEqual(waitingQueue(s, 'medicine').map((t) => t.token), ['MED-002', 'MED-003', 'MED-004', 'MED-001']);
  });
  it('send to end works on a called token and returns it to waiting', () => {
    let s = issue(fresh(), 'medicine', 2).state;
    s = ok(callNext(s, 'medicine', 'room1', T0)).state;
    s = ok(sendToEnd(s, 'MED-001')).state;
    assert.equal(s.tickets['MED-001']?.status, 'waiting');
    assert.equal(s.tickets['MED-001']?.room, undefined);
    assert.equal(inService(s, 'medicine').length, 0);
  });
  it('the same token can be deferred only twice', () => {
    let s = issue(fresh(), 'medicine', 3).state;
    for (let i = 0; i < MAX_DEFERRALS; i++) s = ok(sendToEnd(s, 'MED-001')).state;
    assert.deepEqual(sendToEnd(s, 'MED-001'), { ok: false, error: 'deferral_limit' });
  });
  it('a no-show can be reinstated once, at the back', () => {
    let s = issue(fresh(), 'medicine', 3).state;
    s = ok(callNext(s, 'medicine', 'room1', T0)).state;
    s = ok(markNoShow(s, 'MED-001')).state;
    s = ok(reinstate(s, 'MED-001')).state;
    assert.deepEqual(waitingQueue(s, 'medicine').map((t) => t.token), ['MED-002', 'MED-003', 'MED-001']);
    s = ok(callNext(s, 'medicine', 'room1', T0)).state;
    s = ok(markNoShow(s, 'MED-002')).state;
    s = ok(callNext(s, 'medicine', 'room1', T0)).state; // MED-003
    s = ok(markNoShow(s, 'MED-003')).state;
    s = ok(callToken(s, 'MED-001', 'room1', T0)).state;
    s = ok(markNoShow(s, 'MED-001')).state;
    assert.deepEqual(reinstate(s, 'MED-001'), { ok: false, error: 'reinstate_limit' });
  });
});

describe('move department', () => {
  it('gives a new token in the new series and keeps the original place in line', () => {
    let s = issue(fresh(), 'medicine', 3).state; // MED-001..003 at orders 1..3
    s = issue(s, 'skin', 1).state; // SKN-001 at order 4
    s = issue(s, 'skin', 1).state; // SKN-002 at order 5
    const r = ok(moveDepartment(s, 'MED-002', 'skin'));
    assert.equal(r.ticket.token, 'SKN-003');
    assert.equal(r.ticket.movedFrom, 'MED-002');
    assert.equal(r.state.tickets['MED-002']?.status, 'moved');
    assert.equal(r.state.tickets['MED-002']?.movedTo, 'SKN-003');
    // Registered before both skin patients, so first in the skin queue.
    assert.deepEqual(waitingQueue(r.state, 'skin').map((t) => t.token), ['SKN-003', 'SKN-001', 'SKN-002']);
    assert.deepEqual(waitingQueue(r.state, 'medicine').map((t) => t.token), ['MED-001', 'MED-003']);
  });
  it('rejects the same department and unknown ones', () => {
    const { state } = issue(fresh(), 'medicine', 1);
    assert.deepEqual(moveDepartment(state, 'MED-001', 'medicine'), { ok: false, error: 'same_department' });
    assert.deepEqual(moveDepartment(state, 'MED-001', 'nope'), { ok: false, error: 'unknown_department' });
  });
});

describe('people ahead and estimated wait together', () => {
  it('counts waiting tokens in front plus people already called or in the room', () => {
    let s = issue(fresh(), 'medicine', 6).state;
    assert.equal(peopleAhead(s, 'MED-006'), 5);
    s = ok(callNext(s, 'medicine', 'room1', T0)).state;
    assert.equal(peopleAhead(s, 'MED-006'), 5); // 4 waiting in front + 1 in the room
    s = ok(startConsult(s, 'MED-001', T0)).state;
    s = ok(completeConsult(s, 'MED-001', T0 + 4 * MIN)).state;
    assert.equal(peopleAhead(s, 'MED-006'), 4);
  });
  it('the slip example: 6 ahead and a 4-minute average is about 25', () => {
    let s = issue(fresh(), 'skin', 7).state; // skin seed is 4 min
    assert.equal(peopleAhead(s, 'SKN-007'), 6);
    const avg = deptAverage(s, 'skin') ?? 0;
    const e = estimateWait(peopleAhead(s, 'SKN-007'), avg, { nowMin: 600, openMin: 540, closeMin: 840, doctors: [{ kind: 'available' }] });
    assert.deepEqual(e, { kind: 'minutes', minutes: 25, rawMinutes: 24, pastClosing: false });
    s = ok(callNext(s, 'skin', 'room8', T0)).state;
    assert.equal(peopleAhead(s, 'SKN-007'), 6);
  });
  it('recorded consultations move the department average', () => {
    let s = issue(fresh(), 'skin', 1).state;
    assert.equal(deptAverage(s, 'skin'), 4);
    s = ok(callNext(s, 'skin', 'room8', T0)).state;
    s = ok(startConsult(s, 'SKN-001', T0)).state;
    s = ok(completeConsult(s, 'SKN-001', T0 + 8 * MIN)).state;
    assert.ok(Math.abs((deptAverage(s, 'skin') ?? 0) - 4.4) < 1e-9); // (8 + 9 * 4) / 10
  });
  it('completing a token that was never started records nothing', () => {
    let s = issue(fresh(), 'skin', 1).state;
    s = ok(callNext(s, 'skin', 'room8', T0)).state;
    s = ok(completeConsult(s, 'SKN-001', T0 + 60 * MIN)).state;
    assert.deepEqual(s.departments['skin']?.history, []);
  });
  it('a token that is not waiting has nobody ahead', () => {
    const { state } = issue(fresh(), 'skin', 2);
    const s = ok(callNext(state, 'skin', 'room8', T0)).state;
    assert.equal(peopleAhead(s, 'SKN-001'), 0);
    assert.equal(peopleAhead(s, 'NOPE-1'), 0);
  });
});

describe('fairness', () => {
  it('order never depends on name, age or department, only on the issue counter', () => {
    const { state } = issue(fresh(), 'medicine', 20);
    const queue = waitingQueue(state, 'medicine');
    assert.deepEqual(queue.map((t) => t.order), [...queue.map((t) => t.order)].sort((a, b) => a - b));
  });
  it('a patient bumped by send-to-end waits behind everyone who arrives before the move, not behind later arrivals', () => {
    let s = issue(fresh(), 'medicine', 3).state;
    s = ok(sendToEnd(s, 'MED-001')).state;
    s = issue(s, 'medicine', 1).state; // MED-004 arrives after the deferral
    assert.deepEqual(waitingQueue(s, 'medicine').map((t) => t.token), ['MED-002', 'MED-003', 'MED-001', 'MED-004']);
  });
});
