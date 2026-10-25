---
status: accepted
---

# Cut the server, the Workflows report and the monorepo scaffold

Decided on 25 Oct 2026, the day of submission. The app is complete as a local-store demo. A real server with Socket.IO would take longer than the hours left, and every hour spent on it is an hour not spent on the demo path, the video and the deck.

Three pieces of the plan were not built.

- The Node server with Socket.IO (S4). The queue lives in the browser and syncs across tabs through the local store. The UI shows a "Demo mode" label.
- The daily report on Render Workflows (S6). It ran on top of the server, so it goes with it. We do not claim the Render Workflows track.
- The pnpm monorepo scaffold (S1). `apps/web` has its own lockfile and reaches `packages/shared` through a Vite alias. Render builds from the repo root.

The deployed site is a Render static site, built from `apps/web`, with a rewrite of `/*` to `/index.html` so deep links work.

The build command is `cd apps/web && npx --yes pnpm@10 install --frozen-lockfile && npx --yes pnpm@10 build`. `npm i -g pnpm@10` fails on Render with EROFS because the global module directory is read-only. `npx` installs into the writable npm cache.

## Consequences

- ADR 0002 and ADR 0003 are superseded. Neither design was built.
- `docs/plan/deploy.md`, `lanes.md` and `contracts.md` still describe the original plan. They are not rewritten.
- The queue does not sync across devices. A real deployment needs the server first.
- The deck and the video say what was cut.

## Considered options

- Build the server in the remaining hours. Rejected. High risk for a feature the judges can see only as sync across two devices.
- Keep the Workflows report with the in-process fallback only. Rejected. The UI would label it "Ran in-process" and the track claim would be empty.
