# Research 02: realtime sync design for queues across phones, laptop and TV board

Ticket: #3 (part of #1). Written 24 Oct 2026. All URLs accessed 24 Oct 2026 unless noted. Code sketches live in `docs/research/02-realtime-sync/` and were type-checked and run (see "What was verified").

## Decision-ready summary

1. **Use Socket.IO 4.8.4 (server and client) on one Render Free web service, in-memory state, no database.** Plain `ws` would mean hand-writing reconnect, heartbeat and acks; SSE needs a second channel for commands.
2. **Server owns one `HospitalState`.** Clients send **commands** (with a client `cmdId`) and receive **`update` messages that are full role-projected snapshots** plus small public-safe **signals** (`ticket.called`, `urgent.raised`...). Snapshots are about 1 KB (public) and 4.5 KB (staff) at 22 tickets.
3. **Catch-up is free.** Every (re)connect gets the current snapshot. No replay log, no gap detection. Clients drop any update whose `version` is not newer within the same `epoch`.
4. **Skip Socket.IO connection state recovery.** The docs say it "will not always be successful", so a resync path is needed anyway, and ours is the default path.
5. **Idempotency:** the server remembers the last 500 `cmdId` results. Clients keep an outbox in localStorage for the two commands that must survive a dead network (`RegisterPatient`, `RaiseUrgentFlag`) and retry with the same `cmdId`.
6. **Both adapters wrap the same pure `Authority`** (decide, reduce, project). `LocalStore` = Authority + localStorage + BroadcastChannel + Web Locks. App code sees only `Store`.
7. **Clock:** sim time = `anchorSim + (wall - anchorWall) * speed`, anchored in state. Changing speed re-anchors, so time never jumps. Clients add a measured server offset. Doctors in the demo are a server tick loop that issues normal commands.
8. **Free tier risks:** 15 min idle spin-down, about 1 min cold start; a redeploy briefly runs two instances and the new one starts empty. Freeze deploys after the release candidate; ping `/healthz` before judging.
9. **Never switch to the local adapter silently.** A phone showing a one-browser queue as if it were the hospital queue is wrong information. Offer "continue on this device only" instead.
10. **Emergency never touches the Store.** `RaiseUrgentFlag` is open to every role and needs no ticket, but while offline it only queues, so the UI must say staff have not been alerted yet.

## Facts (sourced)

### Render

| # | Fact | Source |
|---|------|--------|
| F1 | Web services accept inbound WebSockets; Render "does not enforce a maximum duration" for them. Clients and server should send keepalives; no interval is given. | https://render.com/docs/websocket |
| F2 | WebSockets start as HTTP and are upgraded; all public traffic goes to a single port (default 10000). Use `wss`, because `ws` gets a 301 to TLS. | same |
| F3 | The load balancer sends each new connection to a random instance; a reconnect may land elsewhere. Connections close when the instance is replaced (deploy, maintenance). SIGTERM then 30 s shutdown by default, max 300 s. | same |
| F4 | Free web service spins down after 15 min without inbound traffic. HTTP requests and WebSocket messages on existing connections count as traffic. Spin-up takes about a minute; a new WebSocket to a spun-down service triggers it. | https://render.com/docs/free |
| F5 | Free filesystem is ephemeral (lost on redeploy, restart, spin-down); no persistent disks on Free. Free Postgres expires after 30 days (14-day grace). 750 Free instance hours per workspace per month. | same |
| F6 | Deploys start the new instance first, keep sending traffic to the old one until the new one is up, then SIGTERM the original after 60 s (SIGKILL after the shutdown delay). Health checks are optional. | https://render.com/docs/deploys |
| F7 | Service must bind `0.0.0.0`; TLS terminates at Render's load balancer and traffic reaches the app over HTTP. | https://render.com/docs/web-services |

### Socket.IO

| # | Fact | Source |
|---|------|--------|
| F8 | Latest on npm today: `socket.io` 4.8.4, `socket.io-client` 4.8.4 (checked with `npm view`, 24 Oct 2026). `engine.io` ~6.6.0. | npm registry |
| F9 | Client defaults: `reconnection: true`, `reconnectionDelay: 1000`, `reconnectionDelayMax: 5000`, `randomizationFactor: 0.5`, `timeout: 20000`, `transports: ["polling","websocket","webtransport"]`, `upgrade: true`. | https://socket.io/docs/v4/client-options/ |
| F10 | Server defaults: `pingInterval 25000`, `pingTimeout 20000`, `maxHttpBufferSize 1e6`, `transports ["polling","websocket"]`, connection state recovery off. Disconnect reason for a missed heartbeat is "ping timeout". | https://socket.io/docs/v4/server-options/ |
| F11 | Delivery is at-most-once by default. Client-to-server can be made at-least-once with `retries` + `ackTimeout`, but a pending event is lost if the tab is refreshed. Server-to-client needs app-level ids and offsets. A disconnected client buffers its emits; the server does not buffer for absent clients. | https://socket.io/docs/v4/delivery-guarantees/ |
| F12 | Sticky sessions are needed only when several processes/machines share polling sessions. With WebSocket-only transport they are not required; the cost is clients on restrictive networks failing without long-polling. | https://socket.io/docs/v4/using-multiple-nodes/ |
| F13 | Connection state recovery: opt-in, in-memory adapter supported, restores id/rooms/data and replays missed packets within `maxDisconnectionDuration`; "will not always be successful", so the app still needs its own resync. | https://socket.io/docs/v4/connection-state-recovery |

### SSE and browser primitives

| # | Fact | Source |
|---|------|--------|
| F14 | `EventSource` reconnects by itself and sends `Last-Event-ID`; a `retry` field sets the delay (default is "implementation-defined", "a few seconds"). After a fatal failure it does not retry. Spec advises a comment line about every 15 s against proxies that drop idle connections. | https://html.spec.whatwg.org/multipage/server-sent-events.html |
| F15 | Over HTTP/1.1 the browser limit is 6 SSE connections per browser and domain, shared across all tabs ("Won't fix" in Chrome and Firefox). Over HTTP/2 streams default to 100. The constructor takes only a URL and `withCredentials`, so no custom headers. | https://developer.mozilla.org/en-US/docs/Web/API/EventSource (header point is the page's own inference from the constructor; I did not open the constructor page) |
| F16 | `BroadcastChannel`: same origin and same storage partition only; Baseline since March 2022. | https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API |
| F17 | The sender's own `BroadcastChannel` object does not receive its message (spec step "Remove source from destinations"); delivery order across objects is not fully defined. | https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts |
| F18 | `storage` events fire in other same-origin documents, not in the one that wrote. Some private-mode browsers expose `localStorage` with zero quota, so test by writing. Values are strings. | https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event and https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API |
| F19 | Web Locks: Baseline since March 2022, secure contexts only (HTTPS), works across tabs and workers of one origin; requests queue until the lock is released. | https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API |
| F20 | `performance.now()` is monotonic and immune to clock adjustments but may not tick during OS sleep outside Windows; `Date.now()` follows the system clock. | https://developer.mozilla.org/en-US/docs/Web/API/Performance/now |

## Transport comparison (Inference, medium-high confidence)

| | Socket.IO 4.8 | plain WebSocket (`ws` 8.22) | SSE + POST |
|---|---|---|---|
| Reconnect with backoff, heartbeat | built in (F9, F10) | hand-write | browser reconnect built in (F14), no backoff control beyond `retry` |
| Commands with acks and timeouts | built in (F11) | hand-write | separate `fetch` POSTs; ack is the HTTP response, which is simple |
| Resume after drop | snapshot-on-connect (our choice) | same | `Last-Event-ID` is native but needs an event log |
| Auth | handshake `auth` object | query string or first message | cookie or query string only (F15) |
| Proxy/Render | WebSocket upgrade works (F1, F2); polling fallback if upgrade is blocked | upgrade only | plain HTTP stream; Render docs say nothing on SSE |
| Extra risk | starts on long-polling, then upgrades (F9) | none | 6-connection cap per browser over HTTP/1.1 (F15): a judge with board, staff and patient tabs open uses 3 of 6 |
| Code we write | least | most | middle |

Pick Socket.IO. Keep the default transports (polling first, then upgrade): on one instance sticky sessions do not matter (F12), and polling rescues phones on networks that block upgrades. If you see upgrade trouble on Render, set `transports: ['websocket']` on the client and stop there.

## Recommendation for OPD Saathi

### 1. Model

One `HospitalState` (sketch: `types.ts`) with `epoch` (random per boot or reset) and `version` (+1 per command that changed something). Pure functions in `packages/shared`:

- `decide(state, role, command, wallNow, deps) -> events | error`
- `reduce(state, event) -> state`
- `project(state, auth) -> View` (the only place that decides what a role sees)
- `simNow(clock, wall) -> ms`

`Authority` composes them and adds the `cmdId` dedupe table. No `Date.now()` or `Math.random()` inside: wall time and key/epoch generators are passed in, which is what makes the engine testable first (AGENTS.md rule 7).

### 2. Commands (client to server)

| Command | Who | Effect |
|---|---|---|
| `RegisterPatient {dept, firstName, assisted}` | patient, staff | issues token `MED-042`; result carries `ticketId` and a private `ticketKey` |
| `RaiseUrgentFlag {tokenId \| null, note}` | any role, no ticket needed | pins a flag for staff |
| `AckUrgentFlag {flagId}` | staff | marks seen |
| `CallNext {dept}` | staff | completes the current consultation if any, calls the next waiting token |
| `CompleteConsultation {dept}` | staff | records minutes for the average of the last 10 |
| `MarkNoShow {tokenId}` | staff | only for a called token |
| `SendToEnd {tokenId}` | staff | back of the queue |
| `MoveDepartment {tokenId, to}` | staff | token keeps its code and goes to the back of the new queue |
| `SetDoctorStatus {dept, status}` | staff | available, break until, late by minutes |
| `SeedDemoPatients {count}` | staff | demo controls (max 50) |
| `SetDemoClock {speed, autoplay}` | staff | demo controls (speed 1 to 60) |
| `ResetDemo` | staff | new epoch, empty state |

Every command carries a client-generated `cmdId`. Errors: `forbidden | invalid | not_found | wrong_state | offline | timeout`.

### 3. Events (internal) and what goes on the wire

Domain events (reducer input, full fidelity): `TicketIssued`, `UrgentFlagRaised`, `UrgentFlagSeen`, `TicketCalled`, `ConsultationCompleted`, `TicketNoShow`, `TicketSentToEnd`, `TicketMoved`, `DoctorStatusChanged`, `ClockChanged`, `DemoReset`.

Wire, server to client, one message type: `update { view, signals }`.

- `view` is the full snapshot for that socket's role. Never a patch. This is a deliberate trade: at 20 to 50 tickets it costs a few KB per change (measured below) and removes gap handling, event ordering and per-role event projection.
- `signals` are public-safe hints with no names: `ticket.called`, `queue.changed`, `doctor.changed`, `urgent.raised`, `urgent.seen`, `clock.changed`, `demo.reset`. They exist so the UI can play the "3 ahead" alert, the board announcement and the urgent-flag sound on the exact event, instead of diffing snapshots. Signals are lost on a drop; the snapshot is not. Anything that must survive (a patient's `called` screen) must be derivable from the snapshot.

Client rule: accept an update if its `epoch` differs from the current one (and add a synthetic `demo.reset` signal), or its `version` is greater. Otherwise ignore. That handles duplicates and reordering.

### 4. Roles and visibility

| Role | Gets | Auth |
|---|---|---|
| board | per-department now serving, waiting token codes, doctor status, recent consult minutes. No names. | none |
| patient | the same public view, plus `mine` (own ticket incl. first name) only if the handshake carries a valid `ticketId` and `key` | the slip QR URL carries `ticketId` + `key` |
| staff | all tickets (names, no keys), flags | handshake `pin` checked server-side with `timingSafeEqual`; PIN from an env var, never in git (AGENTS.md rule 8) |

A guessable token like `MED-043` therefore does not expose a stranger's first name. With made-up data this is hardening, not a requirement. In local mode the staff gate is UI-only; say so on screen, as the brief already asks for staff login.

### 5. Idempotency and catch-up

- Server: `Map<cmdId, Result>` capped at 500. A repeated `cmdId` returns the stored result and applies nothing. Failures are not cached, so a retry after fixing the cause can succeed.
- Client: `RegisterPatient` and `RaiseUrgentFlag` are written to an outbox in localStorage first, then sent. Retries reuse the `cmdId`. `socket.timeout(5000).emit` gives a `timeout` error that leaves the item in the outbox. This is needed beyond Socket.IO's `retries`, because that is lost on refresh (F11). The brief's "registrations made offline are kept and sent on reconnect" is exactly this.
- Staff commands fail fast with `offline`; queueing a "call next" for later would call someone who has left.
- After a reconnect the server sends the current snapshot in the connection handler. There is no replay. A phone offline for an hour and one offline for a second take the same path.

### 6. `Store` interface and the "app code does not care" contract

`Store` (in `types.ts`): `getSnapshot()`, `subscribe(listener(signals))`, `dispatch(command) -> Promise<DispatchResult>`, `simNow()`, `close()`. `Snapshot = { view, status, lastUpdatedAt, pending }` with `status` in `connecting | live | stale | offline`.

What must hold for both adapters:

1. **Same engine.** `LocalStore` runs `Authority.handle` in the tab (load from localStorage, handle, save, broadcast); the server runs it in memory. Behaviour cannot drift because there is one implementation.
2. **Snapshots, not patches.** After another tab writes, `LocalStore` just re-reads storage. The `BroadcastChannel` message carries only signals (it never reaches the sender, F17, so the writer emits to itself).
3. **Time only via `store.simNow()`.** UI code never calls `Date.now()` for queue logic.
4. **Same result type.** `offline` and `queued` can only come from the remote adapter, and the UI must already handle them.
5. **Effects from signals.** Sound, vibration and announcements key off signals, not off which adapter is live.
6. **Identity is data.** `ticketId` + `key` live in the app's own storage; both adapters accept them.
7. **Honest differences:** local mode has no cross-device sync and no real PIN. The UI shows a persistent "this device only" badge.
8. **Cross-tab races.** Two tabs can interleave read-modify-write on localStorage. `LocalStore` serialises through `navigator.locks` (F19, HTTPS only; Render serves HTTPS). Without locks it is last-write-wins; acceptable for a demo, still worth the 3 lines. Storage must be probed by writing (F18); on failure fall back to memory (`safeStorage`).

In local mode the demo doctors (autoplay) should run in one tab only. Use a Web Lock named `opd-sim` held forever as a leader election (F19 documents this pattern). The sketch has the server-side tick; the local-side leader tick is not written.

### 7. Choosing which adapter is live

Decide at app start, never mid-session.

1. Try remote. UI state `connecting` shows "Waking the server, this can take about a minute" after 3 s (F4).
2. After a failed or slow connect, show a button: "Continue on this device only". It sets `mode=local` in localStorage and reloads.
3. A remote session that drops after a view exists goes to `stale`: keep the last view, show "Last updated 2 minutes ago", block staff actions, let patients keep their slip. This matches the brief's add-on text.

Reason for no auto-fallback: a patient would see a queue that other devices cannot see, with no sign that it is wrong. `kind` is also on `Store` for the badge.

### 8. Persistence for a 48-hour demo

Recommendation: **in-memory only, seeded on boot** (`seedPatients` option).

- Free filesystem is ephemeral (F5), so snapshot-to-disk does nothing on Render Free.
- Free Postgres works for 30 days (F5) but adds an account resource, a connection string and a write path, for a demo whose state is reset by design.
- Every restart is a cold start (F4): empty queues look broken. Seeding 10 to 20 tickets on boot and a new `epoch` make a restart look like a demo reset, and clients show "The queue was reset".
- Reset behaviour: `ResetDemo` makes a new `epoch`, clears state and the dedupe table (a restart loses the table too; harmless because the epoch changes).
- If time remains after the feature freeze, the cheapest upgrade is a write-through of the staff snapshot to Postgres once a second and a read on boot. Not needed for scoring; I would not start it before everything else is done.

### 9. Time acceleration

State holds `clock = { anchorWall, anchorSim, speed, autoplay }`. `simNow(wall) = anchorSim + (wall - anchorWall) * speed`. `SetDemoClock` re-anchors at the current wall time, so changing from 1x to 10x continues from the same sim instant.

- All timestamps in tickets and events are sim time stamped **by the server** from its own wall clock. A client's wrong clock cannot corrupt state.
- Clients show time via `store.simNow()` = `simNow(view.clock, Date.now() + offset)`. `offset` comes from three `time` round trips on connect, keeping the lowest-RTT sample, `offset = serverWall + rtt/2 - clientWall`. Standard Cristian-style estimate; see "could not verify".
- In the smoke test a client's sim time was within 500 ms of the server's at 10x. Because display needs only a minute-level clock and the board a few seconds, this is enough.
- `autoplay` is the demo doctor: a 1 s server tick issues `CallNext` as staff when the current consultation has run for the department's average (sample 6 min until real data exists). At 10x a 6 min consultation takes 36 s of wall time; at the maximum 60x it takes 6 s. For a 2-minute demo use `SeedDemoPatients(20)` with 10x and the staff presses `CallNext` by hand for the beats you want on camera.
- Do not use `performance.now()` for the shared clock: it is local to a page load and may stall in sleep (F20).
- The estimated wait (people ahead x average of last 10) is a pure function of the snapshot and needs no clock.

### 10. Render deployment settings

- Bind `0.0.0.0` and `process.env.PORT` (F7). Serve the built web app from the same service, so there is no CORS and the client connects with `io()` to its own origin. If the static site is separate, set `corsOrigin`.
- Keep `numInstances = 1`. State is in one process; F3 says reconnects can land on a different instance, which would show a different, empty queue.
- `GET /healthz` is in the sketch for the pre-judging wake-up and Render's optional health check (F6).
- Freeze deploys after the release candidate (Sun 15:00). During a deploy the old instance serves for up to about 60 s while the new one boots empty (F6); clients then reconnect to the new one and see an epoch change.
- Add `staff PIN` as an env var in the dashboard; `.env.example` lists the name only.

## What was verified

All in `docs/research/02-realtime-sync/` (types 203 lines, engine 277, server 83, stores 174, smoke 145).

- Type-check (TypeScript 5.9.3, `strict`, plus `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) passes, with `socket.io@4.8.4`, `socket.io-client@4.8.4`, `@types/node@22` installed in a scratch folder.
- `smoke.ts` runs on Node 22.18 (native type stripping) with a real server and real clients on localhost. It asserts: wrong PIN refused; patient cannot `CallNext`; board and other patients never receive "Kamla"; staff view has no ticket keys; a wrong key gives no `mine`; `ticket.called` signal arrives at the patient; the same `cmdId` twice makes one ticket; an urgent flag raised while disconnected is delivered exactly once after reconnect and `pending` returns to 0; staff commands return `offline` while down; autoplay calls a token in every department; consult minutes are recorded; sim-clock drift under 500 ms at 10x; `ResetDemo` changes epoch and clients emit `demo.reset`; two `LocalStore` "tabs" sharing storage and a channel stay in sync through the same API.
- Measured payload at 22 tickets: public view 982 bytes, staff view 4,472 bytes.

To rerun: copy the folder next to a `package.json` with `"type": "module"` and the three dependencies, then `npx tsc --noEmit --strict ...` and `node smoke.ts`.

## Could not verify (flagged)

1. **Behaviour on Render itself.** Everything ran on localhost. WebSocket upgrade through Render's proxy, cold-start reconnect timing and the deploy overlap are from the docs, not from a test deploy. Do one test deploy early (Medium risk if skipped).
2. **Whether Socket.IO's heartbeat keeps a Free service awake.** Render says WebSocket messages count as traffic (F4). Engine.IO sends heartbeat pings as ordinary packets, so I expect it counts, but no source says so. Do not rely on a board tab to keep the instance alive; ping `/healthz` instead.
3. **Whether keep-warm pings are allowed on Free.** Not looked up; check Render's terms before scheduling one.
4. **Render's HTTP version and SSE support.** Render's docs I opened say nothing on SSE or HTTP/2 to clients, so the SSE row in the comparison is unverified for Render.
5. **Cristian-style offset estimation.** Standard technique, applied from memory; I did not fetch the 1989 paper. The smoke test covers the same machine only (offset near 0), so real cross-device accuracy is untested. Phones with a wrong clock are covered because only server time is stored.
6. **Quote fidelity.** Docs were fetched through a summarising fetch tool, not raw HTML. Numbers match what the tool returned; open the page before relying on a quoted limit in a PR. The first Socket.IO fetches failed with ECONNRESET and were retried.
7. **localStorage quota (about 5 MB).** Not stated on the MDN page I opened; state is under 10 KB so it does not matter here.
8. **`docs/plan/` does not exist on `main` yet**, so lane ownership of `packages/shared`, `apps/server`, `apps/web` is my assumption from AGENTS.md. The sketch assumes: `types.ts` and `engine.ts` in `packages/shared`, `server.ts` in the server lane, `stores.ts` in the web lane.

## Open questions for the team

1. Is one `Medicine` queue for rooms 1 and 2 acceptable? The sketch has one queue per department, not per room. The board "per room" display would need `room` on the ticket at call time.
2. `MoveDepartment` keeps the token code (`MED-042` now waits in ENT) so the slip and QR stay valid. Or should it issue a new token and reprint? The glossary says the prefix is the department.
3. Is the slip QR allowed to carry a secret `key` (needed for the per-patient view)? If not, drop `key` and accept that anyone who knows a token code sees that patient's first name.
4. One service serving both web app and Socket.IO, or a separate static site? One service avoids CORS but ties web deploys to the server deploy.
5. Who owns the Sunday "no deploys" freeze and the pre-judging `/healthz` wake-up?
6. Do we want the cold-start screen to offer local mode after 3 s, or only after a failure? (I suggest the button after 3 s, never automatic.)
7. Is the 2-minute demo script driven by autoplay at 10x, or by staff pressing `CallNext` by hand? It changes what `SetDemoClock` has to expose.
