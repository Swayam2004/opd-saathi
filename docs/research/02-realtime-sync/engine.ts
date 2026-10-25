// Sketch for packages/shared: the pure queue engine plus the Authority that both
// adapters wrap. No Date.now(), Math.random() or I/O in here: time and ids come in.

import { DEPT_IDS } from './types.ts';
import type {
  Auth, Clock, Command, DeptId, DeptPublic, DomainEvent, HospitalState, Result, Role, Signal,
  Ticket, View,
} from './types.ts';

export const SAMPLE_AVG_MINUTES = 6;
const MIN = 60_000;
const SEEN_LIMIT = 500;

const perDept = <T>(make: () => T): Record<DeptId, T> =>
  Object.fromEntries(DEPT_IDS.map((d) => [d, make()])) as Record<DeptId, T>;

export function initialState(epoch: string, wall: number): HospitalState {
  return {
    epoch,
    version: 0,
    clock: { anchorWall: wall, anchorSim: wall, speed: 1, autoplay: false },
    tickets: {},
    waiting: perDept<string[]>(() => []),
    nowServing: perDept<string | null>(() => null),
    doctors: perDept<HospitalState['doctors'][DeptId]>(() => ({ kind: 'available' })),
    recentConsultMins: perDept<number[]>(() => []),
    nextSeq: perDept(() => 1),
    flags: [],
  };
}

export const simNow = (c: Clock, wall: number): number => c.anchorSim + (wall - c.anchorWall) * c.speed;

// ------------------------------------------------------------------ decide

type Decision = { ok: true; events: DomainEvent[]; ticketId?: string; ticketKey?: string; flagId?: string } | Extract<Result, { ok: false }>;
const fail = (code: Extract<Result, { ok: false }>['code'], message: string): Decision => ({ ok: false, code, message });

export interface Deps {
  newKey: () => string;
  newEpoch: () => string;
}

const STAFF_ONLY = new Set<Command['type']>([
  'AckUrgentFlag', 'CallNext', 'CompleteConsultation', 'MarkNoShow', 'SendToEnd',
  'MoveDepartment', 'SetDoctorStatus', 'SeedDemoPatients', 'SetDemoClock', 'ResetDemo',
]);

const SAMPLE_NAMES = ['Kamla', 'Ravi', 'Sunita', 'Imran', 'Geeta', 'Mohan', 'Anita', 'Deepak', 'Salma', 'Raju'];

function makeTicket(s: HospitalState, dept: DeptId, firstName: string, assisted: boolean, wall: number, deps: Deps, offset = 0): Ticket {
  const seq = s.nextSeq[dept] + offset;
  return {
    id: `${dept}-${String(seq).padStart(3, '0')}`, dept, seq, firstName: firstName.trim().slice(0, 30),
    assisted, status: 'waiting', issuedAtSim: simNow(s.clock, wall), calledAtSim: null, key: deps.newKey(),
  };
}

export function decide(s: HospitalState, role: Role, cmd: Command, wall: number, deps: Deps): Decision {
  if (STAFF_ONLY.has(cmd.type) && role !== 'staff') return fail('forbidden', `${cmd.type} needs staff`);
  if (cmd.type === 'RegisterPatient' && role === 'board') return fail('forbidden', 'board is read-only');
  const now = simNow(s.clock, wall);
  const ticketOf = (id: string): Ticket | undefined => s.tickets[id];

  switch (cmd.type) {
    case 'RegisterPatient': {
      if (!DEPT_IDS.includes(cmd.dept) || cmd.firstName.trim() === '') return fail('invalid', 'dept or name');
      const ticket = makeTicket(s, cmd.dept, cmd.firstName, cmd.assisted, wall, deps);
      return { ok: true, events: [{ type: 'TicketIssued', ticket }], ticketId: ticket.id, ticketKey: ticket.key };
    }
    case 'RaiseUrgentFlag': {
      // Deliberately open to every role and independent of any ticket: Emergency is never gated.
      const flag = { id: `F-${s.flags.length + 1}`, raisedAtSim: now, tokenId: cmd.tokenId, note: cmd.note.slice(0, 120), seenAtSim: null };
      return { ok: true, events: [{ type: 'UrgentFlagRaised', flag }], flagId: flag.id };
    }
    case 'AckUrgentFlag': {
      const f = s.flags.find((x) => x.id === cmd.flagId);
      if (!f) return fail('not_found', 'flag');
      if (f.seenAtSim !== null) return { ok: true, events: [] };
      return { ok: true, events: [{ type: 'UrgentFlagSeen', flagId: f.id, atSim: now }] };
    }
    case 'CallNext': {
      const events: DomainEvent[] = [];
      const cur = s.nowServing[cmd.dept];
      const curT = cur ? ticketOf(cur) : undefined;
      if (curT && curT.calledAtSim !== null) {
        events.push({ type: 'ConsultationCompleted', tokenId: curT.id, dept: cmd.dept, minutes: Math.max(1, Math.round((now - curT.calledAtSim) / MIN)) });
      }
      const next = s.waiting[cmd.dept][0];
      if (!next) return events.length ? { ok: true, events } : fail('wrong_state', 'queue empty');
      events.push({ type: 'TicketCalled', tokenId: next, dept: cmd.dept, atSim: now });
      return { ok: true, events };
    }
    case 'CompleteConsultation': {
      const cur = s.nowServing[cmd.dept];
      const t = cur ? ticketOf(cur) : undefined;
      if (!t || t.calledAtSim === null) return fail('wrong_state', 'nobody is being served');
      return { ok: true, events: [{ type: 'ConsultationCompleted', tokenId: t.id, dept: cmd.dept, minutes: Math.max(1, Math.round((now - t.calledAtSim) / MIN)) }] };
    }
    case 'MarkNoShow': {
      const t = ticketOf(cmd.tokenId);
      if (!t) return fail('not_found', 'token');
      if (t.status !== 'called') return fail('wrong_state', 'only a called token can be a no-show');
      return { ok: true, events: [{ type: 'TicketNoShow', tokenId: t.id, dept: t.dept }] };
    }
    case 'SendToEnd': {
      const t = ticketOf(cmd.tokenId);
      if (!t) return fail('not_found', 'token');
      if (t.status !== 'waiting' && t.status !== 'called') return fail('wrong_state', 'token is finished');
      return { ok: true, events: [{ type: 'TicketSentToEnd', tokenId: t.id, dept: t.dept }] };
    }
    case 'MoveDepartment': {
      const t = ticketOf(cmd.tokenId);
      if (!t) return fail('not_found', 'token');
      if (!DEPT_IDS.includes(cmd.to) || t.dept === cmd.to) return fail('invalid', 'target department');
      if (t.status !== 'waiting' && t.status !== 'called') return fail('wrong_state', 'token is finished');
      return { ok: true, events: [{ type: 'TicketMoved', tokenId: t.id, from: t.dept, to: cmd.to }] };
    }
    case 'SetDoctorStatus':
      return DEPT_IDS.includes(cmd.dept) ? { ok: true, events: [{ type: 'DoctorStatusChanged', dept: cmd.dept, status: cmd.status }] } : fail('invalid', 'dept');
    case 'SeedDemoPatients': {
      const n = Math.min(Math.max(Math.floor(cmd.count), 0), 50);
      const used: Record<string, number> = {};
      const events: DomainEvent[] = [];
      for (let i = 0; i < n; i++) {
        const dept = DEPT_IDS[i % DEPT_IDS.length] as DeptId;
        const offset = used[dept] ?? 0;
        used[dept] = offset + 1;
        const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length] as string;
        events.push({ type: 'TicketIssued', ticket: makeTicket(s, dept, name, false, wall, deps, offset) });
      }
      return { ok: true, events };
    }
    case 'SetDemoClock': {
      if (!(cmd.speed >= 1 && cmd.speed <= 60)) return fail('invalid', 'speed 1..60');
      return { ok: true, events: [{ type: 'ClockChanged', clock: { anchorWall: wall, anchorSim: now, speed: cmd.speed, autoplay: cmd.autoplay } }] };
    }
    case 'ResetDemo':
      return { ok: true, events: [{ type: 'DemoReset', epoch: deps.newEpoch(), clock: { anchorWall: wall, anchorSim: wall, speed: 1, autoplay: false } }] };
  }
}

// ------------------------------------------------------------------ reduce

export function reduce(prev: HospitalState, ev: DomainEvent): HospitalState {
  if (ev.type === 'DemoReset') return { ...initialState(ev.epoch, ev.clock.anchorWall), clock: ev.clock };
  const s = structuredClone(prev); // 5 KB of JSON: clarity beats structural sharing here
  const drop = (dept: DeptId, id: string): void => { s.waiting[dept] = s.waiting[dept].filter((x) => x !== id); };
  switch (ev.type) {
    case 'TicketIssued':
      s.tickets[ev.ticket.id] = ev.ticket;
      s.waiting[ev.ticket.dept].push(ev.ticket.id);
      s.nextSeq[ev.ticket.dept] = Math.max(s.nextSeq[ev.ticket.dept], ev.ticket.seq + 1);
      break;
    case 'UrgentFlagRaised': s.flags.push(ev.flag); break;
    case 'UrgentFlagSeen': { const f = s.flags.find((x) => x.id === ev.flagId); if (f) f.seenAtSim = ev.atSim; break; }
    case 'TicketCalled': {
      const t = s.tickets[ev.tokenId]; if (!t) break;
      drop(ev.dept, t.id); t.status = 'called'; t.calledAtSim = ev.atSim; s.nowServing[ev.dept] = t.id; break;
    }
    case 'ConsultationCompleted': {
      const t = s.tickets[ev.tokenId]; if (!t) break;
      t.status = 'done';
      if (s.nowServing[ev.dept] === t.id) s.nowServing[ev.dept] = null;
      s.recentConsultMins[ev.dept] = [...s.recentConsultMins[ev.dept], ev.minutes].slice(-10);
      break;
    }
    case 'TicketNoShow': {
      const t = s.tickets[ev.tokenId]; if (!t) break;
      t.status = 'noshow'; if (s.nowServing[ev.dept] === t.id) s.nowServing[ev.dept] = null; break;
    }
    case 'TicketSentToEnd': {
      const t = s.tickets[ev.tokenId]; if (!t) break;
      if (s.nowServing[ev.dept] === t.id) s.nowServing[ev.dept] = null;
      drop(ev.dept, t.id); t.status = 'waiting'; t.calledAtSim = null; s.waiting[ev.dept].push(t.id); break;
    }
    case 'TicketMoved': {
      const t = s.tickets[ev.tokenId]; if (!t) break;
      if (s.nowServing[ev.from] === t.id) s.nowServing[ev.from] = null;
      drop(ev.from, t.id); t.dept = ev.to; t.status = 'waiting'; t.calledAtSim = null; s.waiting[ev.to].push(t.id); break;
    }
    case 'DoctorStatusChanged': s.doctors[ev.dept] = ev.status; break;
    case 'ClockChanged': s.clock = ev.clock; break;
  }
  return s;
}

export function signalsOf(ev: DomainEvent): Signal[] {
  switch (ev.type) {
    case 'TicketIssued': return [{ type: 'queue.changed', dept: ev.ticket.dept }];
    case 'TicketCalled': return [{ type: 'ticket.called', tokenId: ev.tokenId, dept: ev.dept }, { type: 'queue.changed', dept: ev.dept }];
    case 'ConsultationCompleted': case 'TicketNoShow': case 'TicketSentToEnd': return [{ type: 'queue.changed', dept: ev.dept }];
    case 'TicketMoved': return [{ type: 'queue.changed', dept: ev.from }, { type: 'queue.changed', dept: ev.to }];
    case 'DoctorStatusChanged': return [{ type: 'doctor.changed', dept: ev.dept }];
    case 'UrgentFlagRaised': return [{ type: 'urgent.raised', flagId: ev.flag.id }];
    case 'UrgentFlagSeen': return [{ type: 'urgent.seen', flagId: ev.flagId }];
    case 'ClockChanged': return [{ type: 'clock.changed' }];
    case 'DemoReset': return [{ type: 'demo.reset' }];
  }
}

// ----------------------------------------------------------------- project

const stripKey = (t: Ticket): Omit<Ticket, 'key'> => { const { key: _key, ...rest } = t; return rest; };

/** One function decides what a role may see. Everything user-visible goes through it. */
export function project(s: HospitalState, auth: Auth, staffOk: boolean): View {
  const depts = Object.fromEntries(DEPT_IDS.map((d): [DeptId, DeptPublic] => [d, {
    nowServing: s.nowServing[d], waiting: s.waiting[d], doctor: s.doctors[d], recentConsultMins: s.recentConsultMins[d],
  }])) as Record<DeptId, DeptPublic>;
  const base = { epoch: s.epoch, version: s.version, clock: s.clock, depts };
  if (auth.role === 'staff' && staffOk) {
    return { ...base, role: 'staff', tickets: Object.fromEntries(Object.values(s.tickets).map((t) => [t.id, stripKey(t)])), flags: s.flags };
  }
  const t = auth.ticketId ? s.tickets[auth.ticketId] : undefined;
  const mine = auth.role === 'patient' && t && auth.key !== undefined && t.key === auth.key ? stripKey(t) : null;
  return { ...base, role: auth.role === 'board' ? 'board' : 'patient', mine };
}

// --------------------------------------------------------------- Authority

export interface Applied {
  result: Result;
  signals: Signal[];
  changed: boolean;
}

/**
 * The single owner of state. The Socket.IO server holds one in memory; LocalStore
 * rebuilds one from localStorage on each command. App code never sees which.
 */
export class Authority {
  state: HospitalState;
  private readonly seen = new Map<string, Result>();
  private sys = 0;

  private readonly deps: Deps;

  constructor(state: HospitalState, deps: Deps) {
    this.state = state;
    this.deps = deps;
  }

  handle(role: Role, cmd: Command, wall: number): Applied {
    const dup = this.seen.get(cmd.cmdId);
    if (dup) return { result: dup, signals: [], changed: false }; // idempotent replay
    const d = decide(this.state, role, cmd, wall, this.deps);
    if (!d.ok) return { result: d, signals: [], changed: false }; // failures are not cached: a retry may succeed
    let next = this.state;
    const signals: Signal[] = [];
    for (const ev of d.events) { next = reduce(next, ev); signals.push(...signalsOf(ev)); }
    const changed = d.events.length > 0;
    if (changed) next = { ...next, version: next.version + 1 };
    this.state = next;
    const result: Result = { ok: true, version: next.version, ...(d.ticketId ? { ticketId: d.ticketId } : {}), ...(d.ticketKey ? { ticketKey: d.ticketKey } : {}), ...(d.flagId ? { flagId: d.flagId } : {}) };
    this.seen.set(cmd.cmdId, result);
    if (this.seen.size > SEEN_LIMIT) this.seen.delete(this.seen.keys().next().value as string);
    return { result, signals, changed };
  }

  /** Demo doctors. Runs ordinary commands as staff, so clients cannot tell the difference. */
  tick(wall: number): Applied[] {
    const out: Applied[] = [];
    if (!this.state.clock.autoplay) return out;
    for (const dept of DEPT_IDS) {
      const cur = this.state.nowServing[dept];
      const t = cur ? this.state.tickets[cur] : undefined;
      const mins = this.state.recentConsultMins[dept];
      const avg = mins.length ? mins.reduce((a, b) => a + b, 0) / mins.length : SAMPLE_AVG_MINUTES;
      const due = !t || (t.calledAtSim !== null && simNow(this.state.clock, wall) - t.calledAtSim >= avg * MIN);
      if (due && this.state.doctors[dept].kind === 'available' && (t || this.state.waiting[dept].length)) {
        out.push(this.handle('staff', { type: 'CallNext', dept, cmdId: `sys-${this.sys++}` }, wall));
      }
    }
    return out.filter((a) => a.changed);
  }
}
