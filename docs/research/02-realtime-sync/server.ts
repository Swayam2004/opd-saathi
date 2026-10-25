// Sketch for apps/server: Socket.IO 4.8 server around one in-memory Authority.
// Runs on Render Free as a single instance, so no sticky sessions and no adapter.

import { createServer as createHttp } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Server } from 'socket.io';
import { Authority, initialState, project } from './engine.ts';
import type { Auth, ClientToServer, Command, Role, ServerToClient, Signal } from './types.ts';

interface SocketData { auth: Auth; staffOk: boolean }

export interface ServerOptions {
  port: number;
  staffPin: string;
  corsOrigin?: string;
  tickMs?: number;
  /** Seed so a cold or rebooted server shows a live-looking queue. */
  seedPatients?: number;
}

const hex = (n: number): string => randomBytes(n).toString('hex');
const pinOk = (given: string | undefined, want: string): boolean => {
  const a = Buffer.from(given ?? ''); const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
};
const isRole = (r: unknown): r is Role => r === 'patient' || r === 'staff' || r === 'board';
const isCommand = (c: unknown): c is Command =>
  typeof c === 'object' && c !== null && typeof (c as { cmdId?: unknown }).cmdId === 'string' && typeof (c as { type?: unknown }).type === 'string';

export function startServer(opts: ServerOptions): Promise<{ http: HttpServer; port: number; authority: Authority; close: () => Promise<void> }> {
  const deps = { newKey: () => hex(4), newEpoch: () => hex(4) };
  const authority = new Authority(initialState(deps.newEpoch(), Date.now()), deps);
  if (opts.seedPatients) authority.handle('staff', { type: 'SeedDemoPatients', count: opts.seedPatients, cmdId: 'boot-seed' }, Date.now());

  const http = createHttp((req, res) => {
    // Hit this before judging to wake a spun-down Free instance.
    if (req.url === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }
    res.writeHead(404); res.end();
  });
  const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(http, {
    cors: opts.corsOrigin ? { origin: opts.corsOrigin } : undefined,
    pingInterval: 25_000, pingTimeout: 20_000, // library defaults, stated so nobody has to look them up
  });

  io.use((socket, next) => {
    const a = socket.handshake.auth as Partial<Auth>;
    if (!isRole(a.role)) return next(new Error('bad_role'));
    if (a.role === 'staff' && !pinOk(a.pin, opts.staffPin)) return next(new Error('bad_pin'));
    socket.data.auth = { role: a.role, ...(a.ticketId ? { ticketId: String(a.ticketId) } : {}), ...(a.key ? { key: String(a.key) } : {}) };
    socket.data.staffOk = a.role === 'staff';
    next();
  });

  const sendTo = (socket: { data: SocketData; emit: (ev: 'update', m: { view: ReturnType<typeof project>; signals: Signal[] }) => boolean }, signals: Signal[]): void => {
    socket.emit('update', { view: project(authority.state, socket.data.auth, socket.data.staffOk), signals });
  };
  const broadcast = (signals: Signal[]): void => { for (const s of io.sockets.sockets.values()) sendTo(s, signals); };

  io.on('connection', (socket) => {
    sendTo(socket, []); // catch-up is just "here is the current snapshot"
    socket.on('time', (ack) => ack(Date.now()));
    socket.on('cmd', (cmd, ack) => {
      if (!isCommand(cmd)) return ack({ ok: false, code: 'invalid', message: 'malformed command' });
      const applied = authority.handle(socket.data.auth.role, cmd, Date.now());
      ack(applied.result);
      if (applied.changed) broadcast(applied.signals);
    });
  });

  const timer = setInterval(() => { for (const a of authority.tick(Date.now())) broadcast(a.signals); }, opts.tickMs ?? 1000);

  return new Promise((resolve) => {
    http.listen(opts.port, '0.0.0.0', () => {
      const addr = http.address();
      const port = typeof addr === 'object' && addr ? addr.port : opts.port;
      resolve({
        http, port, authority,
        close: () => new Promise<void>((done) => { clearInterval(timer); void io.close(() => done()); }),
      });
    });
  });
}
