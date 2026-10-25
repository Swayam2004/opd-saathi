# OPD Saathi

A queue and wayfinding app for the outpatient department (OPD) of a government hospital. A patient registers in Hindi or English, gets a token, sees about how long the wait is, and follows written steps and a floor plan to the right room, avoiding stairs if they need to. Staff run the queues from a dashboard. A waiting-room board shows and announces called tokens.

Entry for [HackCache '26](https://cachedinfo.in/hackcache), problem statement 2. It is a prototype on made-up data and is not connected to any hospital system.

**Live demo:** https://hackcache26-opd-saathi.onrender.com

It runs as a Render static site. Open it on a phone or at 360px width to see the small-screen layout.

## Screens

| Screen | Path | Who uses it |
| --- | --- | --- |
| Home, Settings | `/`, `/settings` | Patient or helper. Language, text size, assisted mode |
| Register | `/register` | Patient or helper. Name, age, gender, mobile, department, check |
| OPD slip | `/slip/:token` | Patient. Token, department, room, floor, people ahead, estimated wait, route, QR code |
| My turn | `/turn/:token` | Patient. Live place in the queue, alert when 3 are ahead |
| Find a place | `/find` | Anyone. Floor plans, route and written steps from the entrance |
| Emergency | `/emergency` | Anyone, before or without registration |
| Waiting-room board | `/board` | Large screen. Now serving per room, next three tokens, delays, spoken calls |
| Staff dashboard | `/staff` | Staff. Every queue, doctor status, overcrowding, urgent flags, calibration readout, demo controls |
| Registration counter | `/staff/counter` | Staff. Register a patient who has no phone and print the slip |
| Out of service | `/staff/places` | Staff. Mark a lift or ramp out of service, routes change at once |

## Emergencies

The Emergency button is on every screen and works before registration. No token, queue or form stands between a person and Casualty.

The Emergency screen shows the way to Casualty and the numbers 112 and 108, and raises an urgent flag. The flag sits at the top of the staff dashboard, with a sound, until a staff member marks it seen.

The app never labels a case urgent or non-urgent and never tells anyone they can wait. The Emergency signs at the start of registration are information only. Qualified staff judge urgency.

## How the wait time works

The estimated wait is the people ahead multiplied by the department's recent consultation time, plus the doctor's delay, rounded to 5 minutes. Recent means the average of the last 10 consultations in that department. The screen always says "about".

Beside it the wait range shows where waits usually land, such as "about 25 minutes, usually 15 to 40". The range is rounded to 5 minutes and at least 10 minutes wide. It never suggests a patient can leave or wait.

The staff dashboard shows the calibration readout, the share of finished patients whose actual wait fell inside the range they were shown.

## Run it locally

Needs Node 24 and pnpm 10.

```sh
cd apps/web
pnpm install --frozen-lockfile
pnpm dev          # http://localhost:5173
pnpm typecheck
pnpm test         # app tests
pnpm build        # type check, then bundle to dist/
```

The queue engine, wait estimate and routing live in `packages/shared`. Their tests run from `apps/web`:

```sh
pnpm exec vitest run --root ../.. packages/shared
```

To see the whole flow on one laptop, open three windows. A patient window at `/`, the staff dashboard at `/staff` and the board at `/board`. The demo controls on the dashboard add 20 sample patients, speed time up 10 times and reset everything, so a full flow runs in two minutes.

## What is simulated

- There is no server. The queue lives in the browser and syncs across tabs and windows of the same browser. The app shows a "Demo mode" label for this reason.
- No real SMS is sent. The mobile number step is there to show the flow.
- There is no staff login. Anyone who opens `/staff` is staff.
- All data is made up. The slip shows a token, a first name and a department, nothing else.
- The floor plan is an invented plan, not a real hospital.

## What we cut

The plan called for a Node server with Socket.IO so queues would sync across devices, a daily report job on Render Workflows, and a pnpm monorepo scaffold. We cut all three to finish a complete patient and staff flow before the deadline. The app is a working local-store demo, not a multi-device system. A real deployment needs the server first. The daily report depends on it, so it was cut too.

`docs/plan/` still describes the original plan. Where it mentions the server, the Workflows report or the monorepo, it was not built.

## Docs

- [`CONTEXT.md`](CONTEXT.md) for the domain words used in code and UI
- [`docs/research/`](docs/research/) for the sourced findings behind the design
- [`docs/adr/`](docs/adr/) for decisions and reasons
- [`docs/plan/`](docs/plan/) for scope, lanes and contracts
- [`AGENTS.md`](AGENTS.md) for the fixed rules

## Team 3Piece

Swayam Sahoo, Soumyajit Sarkar, Ashutosh Mohapatra. OUTR Bhubaneswar.
