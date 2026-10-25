/** "About 25 minutes, usually 15 to 40." Never tells anyone they can leave or wait (CONTEXT.md). */
export interface WaitRange {
  aboutMin: number;
  lowMin: number;
  highMin: number;
}

/** Staff-side: of the patients shown a range and since called, how many waited within it. */
export interface CalibrationReadout {
  shown: number;
  inside: number;
}

const LOW = 0.6;
const HIGH = 1.6;
const MIN_WIDTH = 10;

const down5 = (m: number): number => Math.floor(m / 5) * 5;
const up5 = (m: number): number => Math.ceil(m / 5) * 5;

/**
 * A fixed spread around the estimate, rounded outwards to 5. The factors are a starting
 * guess; the calibration readout is how staff see whether they hold.
 */
export function waitRange(aboutMin: number): WaitRange | undefined {
  if (aboutMin <= 0) return undefined;
  const lowMin = Math.max(0, down5(aboutMin * LOW));
  const highMin = Math.max(up5(aboutMin * HIGH), lowMin + MIN_WIDTH);
  return { aboutMin, lowMin, highMin };
}

export function calibrate(samples: readonly { lowMin: number; highMin: number; actualMin: number }[]): CalibrationReadout {
  return {
    shown: samples.length,
    inside: samples.filter((s) => s.actualMin >= s.lowMin && s.actualMin <= s.highMin).length,
  };
}
