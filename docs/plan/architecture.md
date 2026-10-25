# Architecture

Decided in #11 on 24 Oct 2026. Reasons are in ADR 0002 and 0003, and in `docs/research/01` and `02`.

## Stack

- TypeScript strict everywhere (ADR 0001). No `any` without a comment that justifies it.
- Node 24. Pin it in `.node-version`.
- Server: Socket.IO 4.8.4 on bare `node:http`. No web framework. One route, `/healthz`, plus the socket.
- Web: React, Vite, Tailwind CSS, React Router. The prompt says plain JavaScript. ADR 0001 overrides that.
- pnpm workspaces. Tests with Vitest.
- No i18n library. A typed dictionary, one file per area per language.

## Layout

```
apps/web         patient, staff and board screens
apps/server      Socket.IO server, hosts the Authority, starts workflow runs
apps/workflow    Render Workflows tasks (thin wrappers over shared functions)
packages/shared  types, Authority, queue, wait, routing, hospital data, analytics
```

Everything pure lives in `packages/shared` with tests first (AGENTS.md rule 7). `apps/workflow` and `apps/server` import from it. `apps/web` imports types and routing from it.

## Topology

Render only, three services in Singapore.

| Service | Type | Job |
| --- | --- | --- |
| `opd-saathi-web` | static site | The app. This is the live URL we submit |
| `opd-saathi-api` | free web service | Socket.IO, in-memory state, starts workflow runs |
| `opd-saathi-workflow` | workflow | `generateDailyReport` and its per-department tasks |

The static site loads from a CDN even when the API is asleep. It shows "Waking the hospital server, about a minute" until the socket connects. A single web service would show Render's own loading page instead.

## Data flow

1. Clients send commands with a client-made `cmdId`. The server dedupes on it.
2. The `Authority` decides and reduces. The server sends every client a full role-projected snapshot (patient, staff, board) plus small public signals such as `ticket.called`.
3. A reconnect gets the current snapshot. There is no replay log.
4. `RaiseUrgentFlag` is open to every role and needs no token. While offline it queues locally and the screen says staff have not been alerted yet.

## Decisions

- State: server memory, seeded on boot with about 8 patients across departments so the board is never empty. A restart loses it.
- One queue per department. The room is set at call time and shown on the board.
- Moving a patient keeps the token code, so the printed slip and QR stay valid.
- The slip QR carries the token only, no secret key. Patient views show the first name only. The deck says a real deployment would sign slips.
- Keep-warm: an external pinger on `/healthz` every 10 minutes, from the release candidate until the video is recorded. Then stop it. A judge who opens the link later gets the cold start and the waking screen. The README says so.
- No merges to `main` after the Sun 15:00 freeze, except fixes for a broken demo path. A deploy drops live sockets.

## Not on Workflows

Emergency path, wait estimate, queue moves, routing. Say so in the pitch.

## Owner

Swayam owns infra, the Render account, `RENDER_API_KEY`, the freeze and the pre-judging wake-up. See `deploy.md`.
