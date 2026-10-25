import { departments, OPD_HOURS, type DeptCode } from '@shared/data/departments.ts';
import { DEMO_PATIENTS, SEED_PATIENTS, type SamplePatient } from '@shared/data/patients.ts';
import { setSpeed, simNow, type SimClock } from '@shared/queue/clock.ts';
import {
  callNext,
  completeConsult,
  createState,
  issueToken,
  markNoShow,
  moveDepartment,
  reinstate,
  sendToEnd,
  startConsult,
  type DepartmentConfig,
  type QueueState,
  type Result,
  type Ticket,
} from '@shared/queue/queue.ts';
import type { DoctorStatus } from '@shared/queue/wait.ts';
import type { Lang, PlaceId } from '@shared/routing/types.ts';
import type { Registration } from '../patient/registrar';

// The whole hospital as plain JSON, so it can sit in localStorage now and on the
// server later (ADR 0002). Every change goes through `apply`, a pure function.

export interface PatientInfo {
  name: Record<Lang, string>;
  age: number;
  gender: SamplePatient['gender'];
  /** Kept for the simulated SMS only. Never shown on a slip or a board. */
  mobile?: string;
}

export interface UrgentFlag {
  id: string;
  raisedAtMs: number;
  token?: string;
  seenAtMs?: number;
}

/** A wait range shown to a patient, kept so staff can see how often the real wait fell inside (D11). */
export interface ShownRange {
  token: string;
  lowMin: number;
  highMin: number;
  shownAtMs: number;
}

export interface HospitalState {
  version: 1;
  clock: SimClock;
  queue: QueueState;
  patients: Record<string, PatientInfo>;
  /** By room id. Missing means available. */
  doctors: Record<string, DoctorStatus>;
  flags: UrgentFlag[];
  outOfService: PlaceId[];
  shown: ShownRange[];
  seq: number;
}

export type Command =
  | { type: 'register'; reg: Registration }
  | { type: 'callNext'; dept: DeptCode; room: string }
  | { type: 'start' | 'complete' | 'noShow' | 'sendToEnd' | 'reinstate'; token: string }
  | { type: 'move'; token: string; dept: DeptCode }
  | { type: 'setDoctor'; room: string; status: DoctorStatus }
  | { type: 'raiseFlag'; token?: string }
  | { type: 'flagSeen'; id: string }
  | { type: 'setOutOfService'; place: PlaceId; on: boolean }
  | { type: 'recordShown'; range: Omit<ShownRange, 'shownAtMs'> }
  | { type: 'addDemoPatients' }
  | { type: 'setSpeed'; speed: number }
  | { type: 'reset' };

export type Outcome = { ok: true; token?: string } | { ok: false; error: string };

export const QUEUE_CONFIGS: DepartmentConfig[] = departments.map((d) => ({
  id: d.code,
  prefix: d.code,
  rooms: d.rooms,
  seedAvgMinutes: d.seedAvgMinutes,
}));

const MIN = 60_000;
const IST_OFFSET_MIN = 330;

export function hhmmToMin(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Simulated ms for `hhmm` IST on the real day of `realMs`, so a demo always runs inside OPD hours. */
function istClockAt(realMs: number, hhmm: string): number {
  const istDayStart = Math.floor((realMs + IST_OFFSET_MIN * MIN) / (1440 * MIN)) * 1440 * MIN - IST_OFFSET_MIN * MIN;
  return istDayStart + hhmmToMin(hhmm) * MIN;
}

function dayOf(simMs: number): string {
  return new Date(simMs + IST_OFFSET_MIN * MIN).toISOString().slice(0, 10);
}

const DEMO_START = '10:00';

function sample(p: SamplePatient): Registration & { names: Record<Lang, string> } {
  return { firstName: p.firstName.en, names: p.firstName, age: p.age, gender: p.gender, dept: p.dept };
}

function registerOne(
  s: HospitalState,
  reg: Registration,
  nowMs: number,
  names?: Record<Lang, string>,
): { state: HospitalState; token?: string; error?: string } {
  const r = issueToken(s.queue, reg.dept, nowMs);
  if (!r.ok) return { state: s, error: r.error };
  const info: PatientInfo = {
    name: names ?? { en: reg.firstName, hi: reg.firstName },
    age: reg.age,
    gender: reg.gender,
    ...(reg.mobile ? { mobile: reg.mobile } : {}),
  };
  return {
    state: { ...s, queue: r.state, patients: { ...s.patients, [r.ticket.token]: info } },
    token: r.ticket.token,
  };
}

/** Fresh hospital at 10:00 on the demo clock: seed patients waiting, one called per room. */
export function initialState(realMs: number): HospitalState {
  const simStart = istClockAt(realMs, DEMO_START);
  let s: HospitalState = {
    version: 1,
    clock: { realAnchorMs: realMs, simAnchorMs: simStart, speed: 1 },
    queue: createState(QUEUE_CONFIGS, dayOf(simStart)),
    patients: {},
    doctors: {},
    flags: [],
    outOfService: [],
    shown: [],
    seq: 0,
  };
  SEED_PATIENTS.forEach((p, i) => {
    const one = sample(p);
    s = registerOne(s, one, simStart - (30 - i) * MIN, one.names).state;
  });
  // A token in each room, so "now serving" and the board are never blank.
  for (const d of departments) {
    for (const room of d.rooms) {
      const r = callNext(s.queue, d.code, room, simStart - 2 * MIN);
      if (r.ok) {
        const started = startConsult(r.state, r.ticket.token, simStart - MIN);
        s = { ...s, queue: started.ok ? started.state : r.state };
      }
    }
  }
  return s;
}

function fromQueue(s: HospitalState, r: Result<{ ticket: Ticket }>): { state: HospitalState; outcome: Outcome } {
  return r.ok
    ? { state: { ...s, queue: r.state }, outcome: { ok: true, token: r.ticket.token } }
    : { state: s, outcome: { ok: false, error: r.error } };
}

export function apply(s: HospitalState, cmd: Command, realMs: number): { state: HospitalState; outcome: Outcome } {
  const now = simNow(s.clock, realMs);
  switch (cmd.type) {
    case 'register': {
      const r = registerOne(s, cmd.reg, now);
      return r.token ? { state: r.state, outcome: { ok: true, token: r.token } } : { state: s, outcome: { ok: false, error: r.error ?? 'failed' } };
    }
    case 'callNext':
      return fromQueue(s, callNext(s.queue, cmd.dept, cmd.room, now));
    case 'start':
      return fromQueue(s, startConsult(s.queue, cmd.token, now));
    case 'complete':
      return fromQueue(s, completeConsult(s.queue, cmd.token, now));
    case 'noShow':
      return fromQueue(s, markNoShow(s.queue, cmd.token));
    case 'sendToEnd':
      return fromQueue(s, sendToEnd(s.queue, cmd.token));
    case 'reinstate':
      return fromQueue(s, reinstate(s.queue, cmd.token));
    case 'move': {
      const r = moveDepartment(s.queue, cmd.token, cmd.dept);
      if (!r.ok) return { state: s, outcome: { ok: false, error: r.error } };
      const info = s.patients[cmd.token];
      const patients = info ? { ...s.patients, [r.ticket.token]: info } : s.patients;
      return { state: { ...s, queue: r.state, patients }, outcome: { ok: true, token: r.ticket.token } };
    }
    case 'setDoctor':
      return { state: { ...s, doctors: { ...s.doctors, [cmd.room]: cmd.status } }, outcome: { ok: true } };
    case 'raiseFlag': {
      const flag: UrgentFlag = { id: `flag-${s.seq + 1}`, raisedAtMs: now, ...(cmd.token ? { token: cmd.token } : {}) };
      return { state: { ...s, seq: s.seq + 1, flags: [...s.flags, flag] }, outcome: { ok: true } };
    }
    case 'flagSeen':
      return {
        state: { ...s, flags: s.flags.map((f) => (f.id === cmd.id && !f.seenAtMs ? { ...f, seenAtMs: now } : f)) },
        outcome: { ok: true },
      };
    case 'setOutOfService': {
      const rest = s.outOfService.filter((p) => p !== cmd.place);
      return { state: { ...s, outOfService: cmd.on ? [...rest, cmd.place] : rest }, outcome: { ok: true } };
    }
    case 'recordShown': {
      if (s.shown.some((x) => x.token === cmd.range.token)) return { state: s, outcome: { ok: true } };
      return { state: { ...s, shown: [...s.shown, { ...cmd.range, shownAtMs: now }] }, outcome: { ok: true } };
    }
    case 'addDemoPatients': {
      let next = s;
      DEMO_PATIENTS.forEach((p, i) => {
        const one = sample(p);
        next = registerOne(next, one, now + i, one.names).state;
      });
      return { state: next, outcome: { ok: true } };
    }
    case 'setSpeed':
      return { state: { ...s, clock: setSpeed(s.clock, realMs, cmd.speed) }, outcome: { ok: true } };
    case 'reset':
      return { state: initialState(realMs), outcome: { ok: true } };
  }
}

export function isHospitalState(v: unknown): v is HospitalState {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Partial<HospitalState>;
  return r.version === 1 && typeof r.clock === 'object' && typeof r.queue === 'object' && Array.isArray(r.flags);
}

export const OPEN_MIN = hhmmToMin(OPD_HOURS.opens);
export const CLOSE_MIN = hhmmToMin(OPD_HOURS.closes);
