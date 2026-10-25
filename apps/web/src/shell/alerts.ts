import { useEffect } from 'react';

/** A short two-note chime. Browsers may block sound until the page has been tapped once. */
export function chime(): void {
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.45);
    });
    window.setTimeout(() => void ctx.close(), 1500);
  } catch {
    // No audio on this device; the banner still shows.
  }
}

export function vibrate(): void {
  try {
    navigator.vibrate?.([300, 150, 300]);
  } catch {
    // Not supported.
  }
}

const KEY = 'opd-saathi.alerted.v1';

function seen(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Runs `fire` the first time `when` is true for `id`, once per device, across reloads. */
export function useAlertOnce(id: string, when: boolean, fire: () => void): void {
  useEffect(() => {
    if (!when) return;
    const done = seen();
    if (done.includes(id)) return;
    try {
      localStorage.setItem(KEY, JSON.stringify([...done, id].slice(-200)));
    } catch {
      // Blocked storage: may alert again after a reload.
    }
    fire();
  }, [id, when, fire]);
}
