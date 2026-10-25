// End-to-end check of the sketch: real Socket.IO server + clients on localhost.
// Run from a folder that has socket.io, socket.io-client and @types/node installed:
//   node smoke.ts
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { io as connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { startServer } from './server.ts';
import { createLocalStore, createRemoteStore, safeStorage } from './stores.ts';
import type { Auth, ClientToServer, ServerToClient, Signal, Snapshot, Store } from './types.ts';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const until = async (f: () => boolean, ms = 3000): Promise<void> => {
  const t = Date.now();
  while (!f()) { if (Date.now() - t > ms) throw new Error(`timeout: ${f.toString()}`); await sleep(10); }
};
const memKv = () => safeStorage(undefined).kv;

const srv = await startServer({ port: 0, staffPin: '4242', tickMs: 100, seedPatients: 0 });
const url = `http://127.0.0.1:${srv.port}`;
type Sock = Socket<ServerToClient, ClientToServer>;
const mkSock = (auth: Auth): Sock => connect(url, { auth, reconnectionDelay: 50, reconnectionDelayMax: 200 });
const mkRemote = (auth: Auth, kv = memKv()): { store: Store; socket: Sock; signals: Signal[] } => {
  const socket = mkSock(auth);
  const store = createRemoteStore({ socket, kv, now: Date.now, newId: randomUUID, ackTimeoutMs: 800 });
  const signals: Signal[] = [];
  store.subscribe((s) => signals.push(...s));
  return { store, socket, signals };
};
const live = (s: Store): Promise<void> => until(() => s.getSnapshot().status === 'live');

// 1. wrong PIN is refused
const bad = mkSock({ role: 'staff', pin: '0000' });
await new Promise<void>((res) => bad.on('connect_error', (e) => { assert.equal(e.message, 'bad_pin'); res(); }));
bad.close();

// 2. staff + board + patient connect
const staff = mkRemote({ role: 'staff', pin: '4242' });
const board = mkRemote({ role: 'board' });
const anon = mkRemote({ role: 'patient' });
await Promise.all([live(staff.store), live(board.store), live(anon.store)]);

// 3. patient registers and learns their key; reconnects with it and sees own ticket
const reg = await anon.store.dispatch({ type: 'RegisterPatient', dept: 'MED', firstName: 'Kamla', assisted: true });
assert.ok(reg.ok && 'ticketId' in reg && reg.ticketId === 'MED-001' && reg.ticketKey);
const me = mkRemote({ role: 'patient', ticketId: reg.ticketId, key: reg.ticketKey });
await live(me.store);
assert.equal((me.store.getSnapshot().view as { mine: { firstName: string } | null }).mine?.firstName, 'Kamla');

// 4. privacy: another patient and the board never receive the name; wrong key sees no 'mine'
const other = mkRemote({ role: 'patient', ticketId: 'MED-001', key: 'wrong' });
await live(other.store);
for (const s of [board.store, other.store]) assert.ok(!JSON.stringify(s.getSnapshot().view).includes('Kamla'));
assert.ok(JSON.stringify(staff.store.getSnapshot().view).includes('Kamla'));
assert.ok(!JSON.stringify(staff.store.getSnapshot().view).includes(reg.ticketKey), 'keys never reach staff view');

// 5. role gate: patient cannot call; staff can; everyone converges, patient gets the signal
const denied = await me.store.dispatch({ type: 'CallNext', dept: 'MED' });
assert.ok(!denied.ok && denied.code === 'forbidden');
const called = await staff.store.dispatch({ type: 'CallNext', dept: 'MED' });
assert.ok(called.ok);
await until(() => board.store.getSnapshot().view?.depts.MED.nowServing === 'MED-001');
await until(() => me.signals.some((s) => s.type === 'ticket.called' && s.tokenId === 'MED-001'));

// 6. idempotency: same cmdId twice issues one ticket and returns the same result
const raw = mkSock({ role: 'patient' });
await new Promise<void>((r) => raw.on('connect', () => r()));
const cmd = { type: 'RegisterPatient', cmdId: 'dup-1', dept: 'EYE', firstName: 'Ravi', assisted: false } as const;
const ack = (): Promise<unknown> => new Promise((r) => raw.emit('cmd', cmd, r));
const r1 = await ack(); const r2 = await ack();
assert.deepEqual(r1, r2);
assert.equal(Object.keys(srv.authority.state.tickets).length, 2);
raw.close();

// 7. offline registration: queued while the socket is down, delivered once after reconnect
const off = mkRemote({ role: 'patient' });
await live(off.store);
off.socket.disconnect();
await until(() => off.store.getSnapshot().status === 'stale');
const queued = await off.store.dispatch({ type: 'RaiseUrgentFlag', tokenId: null, note: 'help at gate' });
assert.deepEqual(queued, { ok: true, queued: true });
assert.equal(off.store.getSnapshot().pending, 1);
const failFast = await off.store.dispatch({ type: 'CallNext', dept: 'MED' });
assert.ok(!failFast.ok && failFast.code === 'offline');
off.socket.connect();
await until(() => srv.authority.state.flags.length === 1);
await until(() => off.store.getSnapshot().pending === 0);
await until(() => staff.signals.some((s) => s.type === 'urgent.raised'));
assert.equal(srv.authority.state.flags.length, 1, 'flag delivered exactly once');

// 8. staff sees the flag; ack clears it
assert.equal((staff.store.getSnapshot().view as { flags: unknown[] }).flags.length, 1);
await staff.store.dispatch({ type: 'AckUrgentFlag', flagId: 'F-1' });

// 9. demo: seed 20, 10x autoplay; clients agree on sim time, queues drain on their own
await staff.store.dispatch({ type: 'SeedDemoPatients', count: 20 });
await staff.store.dispatch({ type: 'SetDemoClock', speed: 10, autoplay: true });
await until(() => board.store.getSnapshot().view?.clock.speed === 10);
await sleep(1500);
const sv = srv.authority;
const drift = Math.abs(board.store.simNow() - (sv.state.clock.anchorSim + (Date.now() - sv.state.clock.anchorWall) * 10));
assert.ok(drift < 500, `sim clock drift ${drift}ms`);
assert.ok(Object.values(sv.state.nowServing).filter(Boolean).length >= 6, 'autoplay called a token in every department');
// 6 sim-minutes is 36 s of wall time at 10x, so jump the wall clock instead of sleeping.
for (const a of sv.tick(Date.now() + 40_000)) assert.ok(a.changed);
assert.ok(Object.values(sv.state.recentConsultMins).some((m) => m.length > 0), 'autoplay finished consultations');
const sizes = { public: JSON.stringify(board.store.getSnapshot().view).length, staff: JSON.stringify(staff.store.getSnapshot().view).length };
console.info('view bytes with 22 tickets', sizes);

// 10. reset: new epoch; stale clients get demo.reset, tickets gone
const epochBefore = board.store.getSnapshot().view?.epoch;
await staff.store.dispatch({ type: 'ResetDemo' });
await until(() => board.store.getSnapshot().view?.epoch !== epochBefore);
assert.ok(board.signals.some((s) => s.type === 'demo.reset'));
assert.equal(Object.keys(sv.state.tickets).length, 0);

// 11. LocalStore: two "tabs" share one storage and one channel bus; same app-facing API
const shared = new Map<string, string>();
const kv = { getItem: (k: string) => shared.get(k) ?? null, setItem: (k: string, v: string) => void shared.set(k, v) };
const tabs: Array<(e: { data: unknown }) => void> = [];
const mkTab = (auth: Auth) => {
  const mine: Array<(e: { data: unknown }) => void> = [];
  const store = createLocalStore({
    kv, now: Date.now, newId: randomUUID, auth,
    channel: {
      postMessage: (m) => { for (const t of tabs) if (!mine.includes(t)) t({ data: m }); }, // sender excluded, as in the HTML spec
      addEventListener: (_t, l) => { mine.push(l); tabs.push(l); },
      close: () => undefined,
    },
  });
  return store;
};
const tabStaff = mkTab({ role: 'staff' });
const tabBoard = mkTab({ role: 'board' });
const localSeen: Signal[] = []; tabBoard.subscribe((s) => localSeen.push(...s));
const lr = await tabStaff.dispatch({ type: 'RegisterPatient', dept: 'ENT', firstName: 'Geeta', assisted: false });
assert.ok(lr.ok);
await tabStaff.dispatch({ type: 'CallNext', dept: 'ENT' });
assert.equal(tabBoard.getSnapshot().view?.depts.ENT.nowServing, 'ENT-001');
assert.ok(localSeen.some((s) => s.type === 'ticket.called'));
assert.equal(tabStaff.getSnapshot().view?.depts.ENT.nowServing, 'ENT-001');

for (const c of [staff, board, anon, me, other, off]) c.store.close();
await srv.close();
console.info('ok');
