import { departments, type Department, type DeptCode } from '@shared/data/departments.ts';
import { minuteOfDay, simNow } from '@shared/queue/clock.ts';
import { deptAverage, inService, peopleAhead, waitingQueue, type Ticket } from '@shared/queue/queue.ts';
import { calibrate, type CalibrationReadout } from '@shared/queue/range.ts';
import { estimateWait, type DoctorStatus, type WaitEstimate } from '@shared/queue/wait.ts';
import { CLOSE_MIN, OPEN_MIN, type HospitalState, type PatientInfo } from './hospital';

export function deptByCode(code: string): Department | undefined {
  return departments.find((d) => d.code === code);
}

export function simNowMs(s: HospitalState, realMs: number): number {
  return simNow(s.clock, realMs);
}

export function doctorStatus(s: HospitalState, room: string): DoctorStatus {
  return s.doctors[room] ?? { kind: 'available' };
}

/** Follows moves, so an old slip or QR still finds the patient (CONTEXT.md: Token). */
export function resolveTicket(s: HospitalState, token: string): Ticket | undefined {
  let t = s.queue.tickets[token.trim().toUpperCase()];
  for (let hops = 0; t?.status === 'moved' && t.movedTo && hops < 5; hops++) t = s.queue.tickets[t.movedTo];
  return t;
}

export function waitFor(s: HospitalState, dept: DeptCode, ahead: number, realMs: number): WaitEstimate {
  const d = deptByCode(dept);
  const avg = deptAverage(s.queue, dept) ?? d?.seedAvgMinutes ?? 5;
  return estimateWait(ahead, avg, {
    nowMin: minuteOfDay(simNowMs(s, realMs)),
    openMin: OPEN_MIN,
    closeMin: CLOSE_MIN,
    doctors: (d?.rooms ?? []).map((room) => doctorStatus(s, room)),
  });
}

export interface TicketView {
  ticket: Ticket;
  patient: PatientInfo | undefined;
  dept: Department;
  ahead: number;
  wait: WaitEstimate;
  /** Tokens in the rooms right now. */
  nowServing: Ticket[];
}

export function ticketView(s: HospitalState, token: string, realMs: number): TicketView | undefined {
  const ticket = resolveTicket(s, token);
  if (!ticket) return undefined;
  const dept = deptByCode(ticket.dept);
  if (!dept) return undefined;
  const ahead = peopleAhead(s.queue, ticket.token);
  return {
    ticket,
    patient: s.patients[ticket.token],
    dept,
    ahead,
    wait: waitFor(s, dept.code, ahead, realMs),
    nowServing: inService(s.queue, dept.code),
  };
}

export interface DeptView {
  dept: Department;
  waiting: Ticket[];
  nowServing: Ticket[];
}

export function deptViews(s: HospitalState): DeptView[] {
  return departments.map((dept) => ({
    dept,
    waiting: waitingQueue(s.queue, dept.code),
    nowServing: inService(s.queue, dept.code),
  }));
}

/** Ranges shown to patients who have since been called: how many waited within them. */
export function calibration(s: HospitalState): CalibrationReadout {
  const samples = s.shown.flatMap((r) => {
    const calledAt = resolveTicket(s, r.token)?.calledAtMs;
    return calledAt === undefined ? [] : [{ lowMin: r.lowMin, highMin: r.highMin, actualMin: (calledAt - r.shownAtMs) / 60_000 }];
  });
  return calibrate(samples);
}
