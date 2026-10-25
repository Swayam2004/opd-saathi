/** Demo clock. Speed 10 makes ten simulated seconds pass per real second. */
export interface SimClock {
  realAnchorMs: number;
  simAnchorMs: number;
  speed: number;
}

export function simNow(clock: SimClock, realMs: number): number {
  return clock.simAnchorMs + (realMs - clock.realAnchorMs) * clock.speed;
}

/** Change speed without the simulated time jumping. */
export function setSpeed(clock: SimClock, realMs: number, speed: number): SimClock {
  return { realAnchorMs: realMs, simAnchorMs: simNow(clock, realMs), speed };
}

/** Minute of the day in a fixed UTC offset. IST is +330. */
export function minuteOfDay(simMs: number, utcOffsetMin = 330): number {
  const m = Math.floor(simMs / 60000) + utcOffsetMin;
  return ((m % 1440) + 1440) % 1440;
}
