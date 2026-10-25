/** Wait estimate from the brief: people ahead x average consultation, plus doctor delay, rounded to 5. */

export type DoctorStatus =
  | { kind: 'available' }
  | { kind: 'break'; untilMin: number }
  | { kind: 'late'; byMin: number }
  | { kind: 'off' };

export interface WaitContext {
  /** Minute of the day, 0..1439, on the simulated clock. */
  nowMin: number;
  openMin: number;
  closeMin: number;
  /** One entry per room that serves this department. */
  doctors: DoctorStatus[];
}

export type WaitEstimate =
  | { kind: 'minutes'; minutes: number; rawMinutes: number; pastClosing: boolean }
  | { kind: 'unknown'; reason: 'closed' | 'no_doctor' };

export const WINDOW = 10;
/** One forgotten "complete" button must not wreck the average. */
export const CAP_MULTIPLE = 3;
export const MIN_SAMPLE_MIN = 1;

/**
 * Mean of the last 10 consultations. Missing slots are filled with the seed average, so an
 * empty history gives the seed and every real sample moves the average a tenth of the way.
 */
export function averageConsultMinutes(seedMin: number, history: readonly number[]): number {
  const recent = history.slice(-WINDOW).map((m) => Math.min(Math.max(m, MIN_SAMPLE_MIN), seedMin * CAP_MULTIPLE));
  const filler = (WINDOW - recent.length) * seedMin;
  return (recent.reduce((s, m) => s + m, 0) + filler) / WINDOW;
}

export function roundToFive(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.max(5, Math.round(minutes / 5) * 5);
}

function delayOf(status: DoctorStatus, nowMin: number): number | undefined {
  switch (status.kind) {
    case 'available':
      return 0;
    case 'late':
      return Math.max(0, status.byMin);
    case 'break':
      return Math.max(0, status.untilMin - nowMin);
    case 'off':
      return undefined;
  }
}

/**
 * Each doctor frees a slot at delay, delay + avg, delay + 2 avg ... The person with `ahead`
 * people in front takes the slot at index `ahead`. With one doctor this is exactly
 * ahead * avg + delay. With two it is about half, which the plain formula would overstate.
 */
export function estimateWait(ahead: number, avgMin: number, ctx: WaitContext): WaitEstimate {
  if (ctx.nowMin >= ctx.closeMin) return { kind: 'unknown', reason: 'closed' };
  const untilOpen = Math.max(0, ctx.openMin - ctx.nowMin);
  const delays: number[] = [];
  for (const d of ctx.doctors) {
    const v = delayOf(d, ctx.nowMin);
    if (v !== undefined) delays.push(v + untilOpen);
  }
  if (delays.length === 0) return { kind: 'unknown', reason: 'no_doctor' };

  const slots: number[] = [];
  for (const d of delays) for (let k = 0; k <= ahead; k++) slots.push(d + k * avgMin);
  slots.sort((a, b) => a - b);
  const raw = slots[ahead] ?? 0;
  return {
    kind: 'minutes',
    minutes: roundToFive(raw),
    rawMinutes: raw,
    pastClosing: ctx.nowMin + raw > ctx.closeMin,
  };
}
