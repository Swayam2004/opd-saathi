import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { averageConsultMinutes, estimateWait, roundToFive } from './wait.ts';
import type { WaitContext } from './wait.ts';
import { minuteOfDay, setSpeed, simNow } from './clock.ts';

const OPEN = 9 * 60;
const CLOSE = 14 * 60;
const at = (h: number, m = 0): number => h * 60 + m;
function ctx(over: Partial<WaitContext> = {}): WaitContext {
  return { nowMin: at(10), openMin: OPEN, closeMin: CLOSE, doctors: [{ kind: 'available' }], ...over };
}
function minutes(e: ReturnType<typeof estimateWait>): number {
  assert.equal(e.kind, 'minutes');
  return e.kind === 'minutes' ? e.minutes : -1;
}

describe('average consultation time', () => {
  it('empty history gives the seed', () => {
    assert.equal(averageConsultMinutes(5, []), 5);
  });
  it('ten samples give their mean', () => {
    assert.equal(averageConsultMinutes(5, [4, 4, 4, 4, 4, 8, 8, 8, 8, 8]), 6);
  });
  it('three samples are blended with seven seeds', () => {
    // (3 + 3 + 3 + 7 * 5) / 10 = 4.4
    assert.ok(Math.abs(averageConsultMinutes(5, [3, 3, 3]) - 4.4) < 1e-9);
  });
  it('only the last ten count', () => {
    assert.equal(averageConsultMinutes(5, [1000, 1000, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]), 6);
  });
  it('a forgotten complete button (90 minutes) is capped at 3x the seed', () => {
    // 15 min cap: (15 + 9 * 5) / 10 = 6
    assert.equal(averageConsultMinutes(5, [90]), 5.0 + (15 - 5) / 10);
  });
  it('a zero-second tap is floored at one minute', () => {
    assert.ok(Math.abs(averageConsultMinutes(5, [0]) - 4.6) < 1e-9);
  });
});

describe('rounding', () => {
  it('rounds to the nearest 5 with a floor of 5 when anything is left', () => {
    assert.deepEqual([0, 0.5, 2, 2.4, 2.5, 7, 7.5, 24, 26].map(roundToFive), [0, 5, 5, 5, 5, 5, 10, 25, 25]);
  });
});

describe('estimated wait', () => {
  it('brief example: 6 ahead x 4 min is about 25', () => {
    assert.equal(minutes(estimateWait(6, 4, ctx())), 25);
  });
  it('nobody ahead and doctor available is 0', () => {
    assert.equal(minutes(estimateWait(0, 5, ctx())), 0);
  });
  it('one ahead x 2 min still shows 5, never "about 0"', () => {
    assert.equal(minutes(estimateWait(1, 2, ctx())), 5);
  });
  it('doctor running late by 15 adds 15', () => {
    assert.equal(minutes(estimateWait(4, 5, ctx({ doctors: [{ kind: 'late', byMin: 15 }] }))), 35);
  });
  it('doctor on a break until 11:30 at 10:50 adds 40', () => {
    const e = estimateWait(2, 5, ctx({ nowMin: at(10, 50), doctors: [{ kind: 'break', untilMin: at(11, 30) }] }));
    assert.equal(minutes(e), 50);
  });
  it('a break that already ended adds nothing', () => {
    assert.equal(minutes(estimateWait(2, 5, ctx({ doctors: [{ kind: 'break', untilMin: at(9, 30) }] }))), 10);
  });
  it('before opening, the wait starts at opening time', () => {
    assert.equal(minutes(estimateWait(2, 5, ctx({ nowMin: at(8, 30) }))), 40);
  });
  it('after closing it is unknown, not a number', () => {
    assert.deepEqual(estimateWait(2, 5, ctx({ nowMin: at(14) })), { kind: 'unknown', reason: 'closed' });
  });
  it('no doctor on duty is unknown', () => {
    assert.deepEqual(estimateWait(2, 5, ctx({ doctors: [{ kind: 'off' }] })), { kind: 'unknown', reason: 'no_doctor' });
  });
  it('two rooms halve the wait: 4 ahead x 6 min is 12, not 24', () => {
    assert.equal(minutes(estimateWait(4, 6, ctx({ doctors: [{ kind: 'available' }, { kind: 'available' }] }))), 10);
  });
  it('two rooms, one doctor on a long break: the other carries the queue', () => {
    const e = estimateWait(4, 5, ctx({ doctors: [{ kind: 'available' }, { kind: 'break', untilMin: at(12) }] }));
    assert.equal(minutes(e), 20);
  });
  it('an off doctor is not counted as a server', () => {
    const e = estimateWait(4, 5, ctx({ doctors: [{ kind: 'available' }, { kind: 'off' }] }));
    assert.equal(minutes(e), 20);
  });
  it('flags when the estimate runs past closing, so staff can see it', () => {
    const e = estimateWait(10, 10, ctx({ nowMin: at(13) }));
    assert.equal(e.kind === 'minutes' && e.pastClosing, true);
  });
});

describe('demo clock at 10x', () => {
  it('10x makes one real second a simulated ten', () => {
    const c = { realAnchorMs: 1_000, simAnchorMs: 0, speed: 10 };
    assert.equal(simNow(c, 2_000), 10_000);
  });
  it('changing speed does not make time jump', () => {
    const c1 = { realAnchorMs: 0, simAnchorMs: 0, speed: 1 };
    const before = simNow(c1, 5_000);
    const c10 = setSpeed(c1, 5_000, 10);
    assert.equal(simNow(c10, 5_000), before);
    assert.equal(simNow(c10, 6_000), before + 10_000);
  });
  it('a 3-minute consultation at 10x takes 18 real seconds and records 3 minutes', () => {
    const c = { realAnchorMs: 0, simAnchorMs: 0, speed: 10 };
    assert.equal((simNow(c, 18_000) - simNow(c, 0)) / 60000, 3);
  });
  it('minute of day in IST', () => {
    // 2026-10-24T04:30:00Z is 10:00 IST
    assert.equal(minuteOfDay(Date.UTC(2026, 9, 24, 4, 30)), 600);
    // midnight rollover
    assert.equal(minuteOfDay(Date.UTC(2026, 9, 24, 18, 30)), 0);
  });
});
