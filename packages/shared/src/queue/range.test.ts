import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { calibrate, waitRange } from './range.ts';

describe('waitRange', () => {
  it('matches the CONTEXT.md example: about 25, usually 15 to 40', () => {
    assert.deepEqual(waitRange(25), { aboutMin: 25, lowMin: 15, highMin: 40 });
  });

  it('is rounded to 5 and at least 10 minutes wide', () => {
    for (let about = 5; about <= 180; about += 5) {
      const r = waitRange(about);
      assert.ok(r, String(about));
      assert.equal(r.lowMin % 5, 0);
      assert.equal(r.highMin % 5, 0);
      assert.ok(r.highMin - r.lowMin >= 10, `${about}: ${r.lowMin}-${r.highMin}`);
      assert.ok(r.lowMin <= about && about <= r.highMin, `${about} inside its own range`);
      assert.ok(r.lowMin >= 0);
    }
  });

  it('gives no range when there is no wait to speak of', () => {
    assert.equal(waitRange(0), undefined);
  });
});

describe('calibrate', () => {
  it('counts how many actual waits fell inside the range shown', () => {
    assert.deepEqual(
      calibrate([
        { lowMin: 15, highMin: 40, actualMin: 20 },
        { lowMin: 15, highMin: 40, actualMin: 40 },
        { lowMin: 5, highMin: 15, actualMin: 22 },
      ]),
      { shown: 3, inside: 2 },
    );
  });

  it('is zero of zero with no samples', () => {
    assert.deepEqual(calibrate([]), { shown: 0, inside: 0 });
  });
});
