// Sketch for packages/shared: state, commands, events, views, Store.
// Pure types. No imports from DOM, Node or socket.io.

export const DEPT_IDS = ['MED', 'CHI', 'WOM', 'BON', 'ENT', 'EYE', 'SKI'] as const;
export type DeptId = (typeof DEPT_IDS)[number];

export type Role = 'patient' | 'staff' | 'board';
export type TicketStatus = 'waiting' | 'called' | 'done' | 'noshow';

/** All times are epoch-style milliseconds. "Sim" time is the accelerated demo clock. */
export interface Clock {
  anchorWall: number;
  anchorSim: number;
  /** 1 = real time, 10 = demo speed. */
  speed: number;
  /** When true the server plays the doctors: calls next, finishes consultations. */
  autoplay: boolean;
}

export type DoctorStatus =
  | { kind: 'available' }
  | { kind: 'break'; untilSim: number }
  | { kind: 'late'; minutes: number };

export interface Ticket {
  /** The token, e.g. "MED-042". Doubles as the ticket id. */
  id: string;
  dept: DeptId;
  seq: number;
  firstName: string;
  assisted: boolean;
  status: TicketStatus;
  issuedAtSim: number;
  calledAtSim: number | null;
  /** Capability secret printed in the slip QR. Never leaves the server except to its owner. */
  key: string;
}

export interface UrgentFlag {
  id: string;
  raisedAtSim: number;
  /** Optional context only. The app never judges urgency. */
  tokenId: string | null;
  note: string;
  seenAtSim: number | null;
}

export interface HospitalState {
  /** Random per server boot or demo reset. Versions only compare within one epoch. */
  epoch: string;
  /** Monotonic, +1 per applied command that changed something. */
  version: number;
  clock: Clock;
  tickets: Record<string, Ticket>;
  /** Waiting token ids in order, per department. */
  waiting: Record<DeptId, string[]>;
  nowServing: Record<DeptId, string | null>;
  doctors: Record<DeptId, DoctorStatus>;
  /** Last 10 consultation lengths in sim minutes, per department. */
  recentConsultMins: Record<DeptId, number[]>;
  nextSeq: Record<DeptId, number>;
  flags: UrgentFlag[];
}

// ---------------------------------------------------------------- commands

export interface CommandBase {
  /** Client-generated unique id. The server dedupes on it. */
  cmdId: string;
}

export type Command =
  | (CommandBase & { type: 'RegisterPatient'; dept: DeptId; firstName: string; assisted: boolean })
  | (CommandBase & { type: 'RaiseUrgentFlag'; tokenId: string | null; note: string })
  | (CommandBase & { type: 'AckUrgentFlag'; flagId: string })
  | (CommandBase & { type: 'CallNext'; dept: DeptId })
  | (CommandBase & { type: 'CompleteConsultation'; dept: DeptId })
  | (CommandBase & { type: 'MarkNoShow'; tokenId: string })
  | (CommandBase & { type: 'SendToEnd'; tokenId: string })
  | (CommandBase & { type: 'MoveDepartment'; tokenId: string; to: DeptId })
  | (CommandBase & { type: 'SetDoctorStatus'; dept: DeptId; status: DoctorStatus })
  | (CommandBase & { type: 'SeedDemoPatients'; count: number })
  | (CommandBase & { type: 'SetDemoClock'; speed: number; autoplay: boolean })
  | (CommandBase & { type: 'ResetDemo' });

export type CommandType = Command['type'];
/** What app code passes to `dispatch`; the store adds `cmdId`. */
export type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 'cmdId'> : never) : never;

// ------------------------------------------------------------------ events
// Internal, full-fidelity. Reducer input. Never sent to patients as-is.

export type DomainEvent =
  | { type: 'TicketIssued'; ticket: Ticket }
  | { type: 'UrgentFlagRaised'; flag: UrgentFlag }
  | { type: 'UrgentFlagSeen'; flagId: string; atSim: number }
  | { type: 'TicketCalled'; tokenId: string; dept: DeptId; atSim: number }
  | { type: 'ConsultationCompleted'; tokenId: string; dept: DeptId; minutes: number }
  | { type: 'TicketNoShow'; tokenId: string; dept: DeptId }
  | { type: 'TicketSentToEnd'; tokenId: string; dept: DeptId }
  | { type: 'TicketMoved'; tokenId: string; from: DeptId; to: DeptId }
  | { type: 'DoctorStatusChanged'; dept: DeptId; status: DoctorStatus }
  | { type: 'ClockChanged'; clock: Clock }
  | { type: 'DemoReset'; epoch: string; clock: Clock };

/** Public-safe hints for UI effects (sound, vibration, announcement). No names. */
export type Signal =
  | { type: 'ticket.called'; tokenId: string; dept: DeptId }
  | { type: 'queue.changed'; dept: DeptId }
  | { type: 'doctor.changed'; dept: DeptId }
  | { type: 'urgent.raised'; flagId: string }
  | { type: 'urgent.seen'; flagId: string }
  | { type: 'clock.changed' }
  | { type: 'demo.reset' };

// ------------------------------------------------------------------- views
// What each role is allowed to see. Always a full snapshot, never a patch.

export interface DeptPublic {
  nowServing: string | null;
  waiting: string[];
  doctor: DoctorStatus;
  recentConsultMins: number[];
}

export interface ViewBase {
  epoch: string;
  version: number;
  clock: Clock;
  depts: Record<DeptId, DeptPublic>;
}

export interface PublicView extends ViewBase {
  role: 'board' | 'patient';
  /** Present only for a patient who presented a valid ticket id + key. */
  mine: Omit<Ticket, 'key'> | null;
}

export interface StaffView extends ViewBase {
  role: 'staff';
  tickets: Record<string, Omit<Ticket, 'key'>>;
  flags: UrgentFlag[];
}

export type View = PublicView | StaffView;

// ----------------------------------------------------------- wire protocol

export interface Auth {
  role: Role;
  pin?: string;
  ticketId?: string;
  key?: string;
}

export interface UpdateMessage {
  view: View;
  signals: Signal[];
}

export type ErrorCode = 'forbidden' | 'invalid' | 'not_found' | 'wrong_state' | 'offline' | 'timeout';

export type Result =
  | { ok: true; version: number; ticketId?: string; ticketKey?: string; flagId?: string }
  | { ok: false; code: ErrorCode; message: string };

export type DispatchResult = Result | { ok: true; queued: true };

export interface ServerToClient {
  update: (msg: UpdateMessage) => void;
}
export interface ClientToServer {
  cmd: (cmd: Command, ack: (r: Result) => void) => void;
  time: (ack: (serverWall: number) => void) => void;
}

// -------------------------------------------------------------------- Store

export type ConnectionStatus = 'connecting' | 'live' | 'stale' | 'offline';

export interface Snapshot {
  /** Null until the first update arrives. */
  view: View | null;
  status: ConnectionStatus;
  /** Wall time (client clock) of the last accepted update, for "Last updated 2 minutes ago". */
  lastUpdatedAt: number | null;
  /** Commands accepted locally but not yet confirmed (offline registrations, urgent flags). */
  pending: number;
}

/**
 * The only thing React code talks to. Fits useSyncExternalStore:
 * `getSnapshot` returns the same object until something changes.
 */
export interface Store {
  readonly kind: 'remote' | 'local';
  getSnapshot(): Snapshot;
  subscribe(listener: (signals: Signal[]) => void): () => void;
  dispatch(cmd: CommandInput): Promise<DispatchResult>;
  /** Accelerated demo time, ms. Same value on every device within the sync error. */
  simNow(): number;
  close(): void;
}
