// Sketch for apps/web: the two Store adapters. Browser APIs are injected so both
// run unchanged under Node tests. App code imports only `Store` from types.ts.

import type { Socket } from 'socket.io-client';
import { Authority, initialState, project, simNow } from './engine.ts';
import type {
  Auth, ClientToServer, Command, CommandInput, DispatchResult, ServerToClient, Signal, Snapshot, Store, UpdateMessage, View,
} from './types.ts';

/** Commands that must survive a dead connection. Everything else fails fast with 'offline'. */
const QUEUEABLE = new Set<Command['type']>(['RegisterPatient', 'RaiseUrgentFlag']);

export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }

/** MDN: some private-mode browsers expose localStorage with a zero quota, so probe by writing. */
export function safeStorage(candidate: KV | undefined): { kv: KV; persistent: boolean } {
  try {
    candidate?.setItem('opd:probe', '1');
    if (candidate) return { kv: candidate, persistent: true };
  } catch { /* fall through */ }
  const m = new Map<string, string>();
  return { kv: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) }, persistent: false };
}

interface Listeners { set: Set<(s: Signal[]) => void> }
const emit = (l: Listeners, s: Signal[]): void => { for (const f of l.set) f(s); };

// ------------------------------------------------------------------ remote

export interface RemoteDeps {
  socket: Socket<ServerToClient, ClientToServer>;
  kv: KV;
  now: () => number;
  newId: () => string;
  ackTimeoutMs?: number;
}

export function createRemoteStore(d: RemoteDeps): Store {
  const ackMs = d.ackTimeoutMs ?? 5000;
  const OUTBOX = 'opd:outbox:v1';
  const listeners: Listeners = { set: new Set() };
  let snap: Snapshot = { view: null, status: 'connecting', lastUpdatedAt: null, pending: 0 };
  let offset = 0; // serverWall - clientWall, estimated
  let flushing = false;
  const waiters = new Map<string, (r: DispatchResult) => void>();

  const outbox = (): Command[] => JSON.parse(d.kv.getItem(OUTBOX) ?? '[]') as Command[];
  const saveOutbox = (o: Command[]): void => { d.kv.setItem(OUTBOX, JSON.stringify(o)); set({ pending: o.length }); emit(listeners, []); };
  const set = (p: Partial<Snapshot>): void => { snap = { ...snap, ...p }; };

  const apply = (msg: UpdateMessage): void => {
    const cur = snap.view;
    if (cur && cur.epoch === msg.view.epoch && msg.view.version <= cur.version) return; // dup or reordered
    const signals = cur && cur.epoch !== msg.view.epoch ? [...msg.signals, { type: 'demo.reset' } as const] : msg.signals;
    set({ view: msg.view, status: 'live', lastUpdatedAt: d.now() });
    emit(listeners, signals);
  };

  const send = (cmd: Command): Promise<DispatchResult> =>
    new Promise((resolve) => {
      d.socket.timeout(ackMs).emit('cmd', cmd, (err, res) => {
        if (err) resolve({ ok: false, code: 'timeout', message: 'no ack' });
        else resolve(res);
      });
    });

  async function flush(): Promise<void> {
    if (flushing || !d.socket.connected) return;
    flushing = true;
    try {
      for (const cmd of outbox()) { // same cmdId on every retry: the server dedupes
        const res = await send(cmd);
        if (!res.ok && res.code === 'timeout') break; // keep it, retry on next connect or dispatch
        saveOutbox(outbox().filter((c) => c.cmdId !== cmd.cmdId)); // acked or definitively rejected
        waiters.get(cmd.cmdId)?.(res); waiters.delete(cmd.cmdId);
      }
    } finally { flushing = false; }
  }

  async function syncClock(): Promise<void> {
    let best: { rtt: number; off: number } | null = null;
    for (let i = 0; i < 3; i++) { // keep the lowest-RTT sample (Cristian-style estimate; see report)
      const t0 = d.now();
      const serverWall = await new Promise<number>((r) => d.socket.emit('time', r));
      const rtt = d.now() - t0;
      if (!best || rtt < best.rtt) best = { rtt, off: serverWall + rtt / 2 - d.now() };
    }
    if (best) offset = best.off;
  }

  d.socket.on('update', apply);
  d.socket.on('connect', () => { void syncClock(); void flush(); });
  const down = (): void => { set({ status: snap.view ? 'stale' : 'offline' }); emit(listeners, []); }; // empty signals = "re-read the snapshot"
  d.socket.on('disconnect', down);
  d.socket.on('connect_error', down);
  set({ pending: outbox().length });

  return {
    kind: 'remote',
    getSnapshot: () => snap,
    subscribe(l) { listeners.set.add(l); return () => void listeners.set.delete(l); },
    async dispatch(input: CommandInput): Promise<DispatchResult> {
      const cmd = { ...input, cmdId: d.newId() } as Command;
      if (!QUEUEABLE.has(cmd.type)) {
        if (!d.socket.connected) return { ok: false, code: 'offline', message: 'staff actions need a connection' };
        return send(cmd);
      }
      saveOutbox([...outbox(), cmd]);
      if (!d.socket.connected) return { ok: true, queued: true };
      const done = new Promise<DispatchResult>((r) => waiters.set(cmd.cmdId, r));
      void flush();
      return Promise.race([done, new Promise<DispatchResult>((r) => setTimeout(() => r({ ok: true, queued: true }), ackMs + 500))]);
    },
    simNow: () => (snap.view ? simNow(snap.view.clock, d.now() + offset) : d.now()),
    close() { d.socket.close(); },
  };
}

// ------------------------------------------------------------------- local

export interface Channel {
  postMessage(m: unknown): void;
  addEventListener(t: 'message', l: (e: { data: unknown }) => void): void;
  close(): void;
}
export interface LockManagerLike { request<T>(name: string, cb: () => Promise<T>): Promise<T> }

export interface LocalDeps {
  kv: KV;
  channel: Channel;
  locks?: LockManagerLike; // navigator.locks (Web Locks): serialises read-modify-write across tabs
  now: () => number;
  newId: () => string;
  auth: Auth;
}

const KEY = 'opd:state:v1';

export function createLocalStore(d: LocalDeps): Store {
  const deps = { newKey: d.newId, newEpoch: d.newId };
  const listeners: Listeners = { set: new Set() };
  const load = (): Authority => {
    const raw = d.kv.getItem(KEY);
    return new Authority(raw ? (JSON.parse(raw) as Authority['state']) : initialState(d.newId(), d.now()), deps);
  };
  const viewOf = (a: Authority): View => project(a.state, d.auth, d.auth.role === 'staff'); // no real gate offline
  let snap: Snapshot = { view: viewOf(load()), status: 'live', lastUpdatedAt: d.now(), pending: 0 };
  const refresh = (): void => { snap = { ...snap, view: viewOf(load()), lastUpdatedAt: d.now() }; };
  const serial = <T>(fn: () => Promise<T>): Promise<T> => (d.locks ? d.locks.request('opd-state', fn) : fn());

  d.channel.addEventListener('message', (e) => {
    const m = e.data as { signals?: Signal[] };
    refresh(); emit(listeners, m.signals ?? []);
  });

  return {
    kind: 'local',
    getSnapshot: () => snap,
    subscribe(l) { listeners.set.add(l); return () => void listeners.set.delete(l); },
    dispatch: (input) => serial(async () => {
      const a = load();
      const cmd = { ...input, cmdId: d.newId() } as Command;
      const applied = a.handle(d.auth.role, cmd, d.now());
      if (applied.changed) {
        d.kv.setItem(KEY, JSON.stringify(a.state));
        d.channel.postMessage({ signals: applied.signals });
        refresh(); emit(listeners, applied.signals); // postMessage never reaches the sender
      }
      return applied.result;
    }),
    simNow: () => (snap.view ? simNow(snap.view.clock, d.now()) : d.now()),
    close() { d.channel.close(); },
  };
}
