import { averageConsultMinutes } from './wait.ts';

export type DeptId = string;
export type RoomId = string;

export interface DepartmentConfig {
  id: DeptId;
  /** Three letters, spoken aloud on the board. */
  prefix: string;
  rooms: RoomId[];
  seedAvgMinutes: number;
}

export type TicketStatus = 'waiting' | 'called' | 'in_consult' | 'done' | 'no_show' | 'moved';

export interface Ticket {
  token: string;
  dept: DeptId;
  /** Queue order. Lower goes first. Send to end and reinstate take a fresh, larger one. */
  order: number;
  status: TicketStatus;
  registeredAtMs: number;
  room?: RoomId;
  calledAtMs?: number;
  startedAtMs?: number;
  deferrals: number;
  reinstated: number;
  movedTo?: string;
  movedFrom?: string;
}

export interface DeptState {
  config: DepartmentConfig;
  counter: number;
  /** Last 10 consultation lengths in minutes, oldest first. */
  history: number[];
}

/** Plain JSON on purpose, so the server can own it and the local fallback can store it. */
export interface QueueState {
  day: string;
  departments: Record<DeptId, DeptState>;
  tickets: Record<string, Ticket>;
  nextOrder: number;
}

export type QueueError =
  | 'unknown_department'
  | 'unknown_token'
  | 'unknown_room'
  | 'empty_queue'
  | 'room_busy'
  | 'wrong_status'
  | 'deferral_limit'
  | 'reinstate_limit'
  | 'same_department';

export type Result<T> = ({ ok: true; state: QueueState } & T) | { ok: false; error: QueueError };

export const MAX_DEFERRALS = 2;
export const MAX_REINSTATES = 1;

export function createState(configs: DepartmentConfig[], day: string): QueueState {
  const departments: Record<DeptId, DeptState> = {};
  for (const config of configs) departments[config.id] = { config, counter: 0, history: [] };
  return { day, departments, tickets: {}, nextOrder: 1 };
}

/** New day: counters restart, tickets clear, consultation history stays so the averages carry over. */
export function newDay(state: QueueState, day: string): QueueState {
  const departments: Record<DeptId, DeptState> = {};
  for (const [id, d] of Object.entries(state.departments)) departments[id] = { ...d, counter: 0 };
  return { day, departments, tickets: {}, nextOrder: 1 };
}

export function formatToken(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

function put(state: QueueState, t: Ticket): QueueState {
  return { ...state, tickets: { ...state.tickets, [t.token]: t } };
}

function isInService(t: Ticket): boolean {
  return t.status === 'called' || t.status === 'in_consult';
}

export function issueToken(state: QueueState, deptId: DeptId, nowMs: number): Result<{ ticket: Ticket }> {
  const dept = state.departments[deptId];
  if (!dept) return { ok: false, error: 'unknown_department' };
  const counter = dept.counter + 1;
  const ticket: Ticket = {
    token: formatToken(dept.config.prefix, counter),
    dept: deptId,
    order: state.nextOrder,
    status: 'waiting',
    registeredAtMs: nowMs,
    deferrals: 0,
    reinstated: 0,
  };
  const next: QueueState = {
    ...state,
    departments: { ...state.departments, [deptId]: { ...dept, counter } },
    nextOrder: state.nextOrder + 1,
  };
  return { ok: true, state: put(next, ticket), ticket };
}

export function waitingQueue(state: QueueState, deptId: DeptId): Ticket[] {
  return Object.values(state.tickets)
    .filter((t) => t.dept === deptId && t.status === 'waiting')
    .sort((a, b) => a.order - b.order);
}

export function inService(state: QueueState, deptId: DeptId): Ticket[] {
  return Object.values(state.tickets).filter((t) => t.dept === deptId && isInService(t));
}

/** People waiting in front of this token, plus people already called or in the room. */
export function peopleAhead(state: QueueState, token: string): number {
  const t = state.tickets[token];
  if (!t || t.status !== 'waiting') return 0;
  const before = waitingQueue(state, t.dept).filter((w) => w.order < t.order).length;
  return before + inService(state, t.dept).length;
}

function callInternal(state: QueueState, t: Ticket, room: RoomId, nowMs: number): Result<{ ticket: Ticket }> {
  const dept = state.departments[t.dept];
  if (!dept) return { ok: false, error: 'unknown_department' };
  if (!dept.config.rooms.includes(room)) return { ok: false, error: 'unknown_room' };
  if (inService(state, t.dept).some((x) => x.room === room)) return { ok: false, error: 'room_busy' };
  const ticket: Ticket = { ...t, status: 'called', room, calledAtMs: nowMs };
  return { ok: true, state: put(state, ticket), ticket };
}

export function callNext(state: QueueState, deptId: DeptId, room: RoomId, nowMs: number): Result<{ ticket: Ticket }> {
  if (!state.departments[deptId]) return { ok: false, error: 'unknown_department' };
  const first = waitingQueue(state, deptId)[0];
  if (!first) return { ok: false, error: 'empty_queue' };
  return callInternal(state, first, room, nowMs);
}

/** Staff override: call a waiting token out of order. This is how staff act on an urgent case. */
export function callToken(state: QueueState, token: string, room: RoomId, nowMs: number): Result<{ ticket: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  if (t.status !== 'waiting') return { ok: false, error: 'wrong_status' };
  return callInternal(state, t, room, nowMs);
}

export function startConsult(state: QueueState, token: string, nowMs: number): Result<{ ticket: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  if (t.status !== 'called') return { ok: false, error: 'wrong_status' };
  const ticket: Ticket = { ...t, status: 'in_consult', startedAtMs: nowMs };
  return { ok: true, state: put(state, ticket), ticket };
}

export function completeConsult(state: QueueState, token: string, nowMs: number): Result<{ ticket: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  if (!isInService(t)) return { ok: false, error: 'wrong_status' };
  const dept = state.departments[t.dept];
  if (!dept) return { ok: false, error: 'unknown_department' };
  const ticket: Ticket = { ...t, status: 'done' };
  delete ticket.room;
  let next = put(state, ticket);
  if (t.startedAtMs !== undefined) {
    const minutes = (nowMs - t.startedAtMs) / 60000;
    const history = [...dept.history, minutes].slice(-10);
    next = { ...next, departments: { ...next.departments, [t.dept]: { ...dept, history } } };
  }
  return { ok: true, state: next, ticket };
}

/** Staff mark a called token whose patient did not arrive. The app never does this on a timer. */
export function markNoShow(state: QueueState, token: string): Result<{ ticket: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  if (t.status !== 'called') return { ok: false, error: 'wrong_status' };
  const ticket: Ticket = { ...t, status: 'no_show' };
  delete ticket.room;
  return { ok: true, state: put(state, ticket), ticket };
}

/** A patient who walks slowly and arrives after the no-show gets one place at the back. */
export function reinstate(state: QueueState, token: string): Result<{ ticket: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  if (t.status !== 'no_show') return { ok: false, error: 'wrong_status' };
  if (t.reinstated >= MAX_REINSTATES) return { ok: false, error: 'reinstate_limit' };
  const ticket: Ticket = { ...t, status: 'waiting', order: state.nextOrder, reinstated: t.reinstated + 1 };
  return { ok: true, state: put({ ...state, nextOrder: state.nextOrder + 1 }, ticket), ticket };
}

export function sendToEnd(state: QueueState, token: string): Result<{ ticket: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  if (t.status !== 'waiting' && t.status !== 'called') return { ok: false, error: 'wrong_status' };
  if (t.deferrals >= MAX_DEFERRALS) return { ok: false, error: 'deferral_limit' };
  const ticket: Ticket = { ...t, status: 'waiting', order: state.nextOrder, deferrals: t.deferrals + 1 };
  delete ticket.room;
  delete ticket.calledAtMs;
  return { ok: true, state: put({ ...state, nextOrder: state.nextOrder + 1 }, ticket), ticket };
}

/**
 * Move to another department. The patient gets a new token in the new department's series
 * but keeps their original queue order, so a counter mistake does not cost them their turn.
 */
export function moveDepartment(state: QueueState, token: string, toDept: DeptId): Result<{ ticket: Ticket; retired: Ticket }> {
  const t = state.tickets[token];
  if (!t) return { ok: false, error: 'unknown_token' };
  const dest = state.departments[toDept];
  if (!dest) return { ok: false, error: 'unknown_department' };
  if (t.dept === toDept) return { ok: false, error: 'same_department' };
  if (t.status !== 'waiting' && t.status !== 'called') return { ok: false, error: 'wrong_status' };

  const counter = dest.counter + 1;
  const newToken = formatToken(dest.config.prefix, counter);
  const retired: Ticket = { ...t, status: 'moved', movedTo: newToken };
  delete retired.room;
  const ticket: Ticket = {
    token: newToken,
    dept: toDept,
    order: t.order,
    status: 'waiting',
    registeredAtMs: t.registeredAtMs,
    deferrals: t.deferrals,
    reinstated: t.reinstated,
    movedFrom: t.token,
  };
  const next: QueueState = {
    ...state,
    departments: { ...state.departments, [toDept]: { ...dest, counter } },
    tickets: { ...state.tickets, [retired.token]: retired, [ticket.token]: ticket },
  };
  return { ok: true, state: next, ticket, retired };
}

/** Average consultation minutes for a department right now. */
export function deptAverage(state: QueueState, deptId: DeptId): number | undefined {
  const d = state.departments[deptId];
  return d ? averageConsultMinutes(d.config.seedAvgMinutes, d.history) : undefined;
}
