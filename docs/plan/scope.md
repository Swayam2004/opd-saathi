# Scope

Decided in #10 on Sat 24 Oct 2026. Rationale lives in the ticket and in `docs/research/04`, `05` and `08`. This file is the checklist.

## Budget

- Two developers (Swayam, Soumyajit), about 20 build hours each: **40 dev-hours**. Ashutosh writes no code (evidence, Hindi review, video, voiceover).
- The time limit is Claude usage, not the clock. Bulk generation goes to Soumyajit's Max seat; Swayam's Pro seat takes fewer, higher-leverage tickets.
- Hours below are my estimates for AI-assisted work, tests and bilingual strings included. Confidence is low. **They sum to 50, ten over budget.** The cut ladder below closes the gap. Do not hide the gap by dropping tests or Hindi.

## Core

Build in this order. Items 1 to 11 are the Sat 20:00 safety gate (minimal end to end, deployed).

| # | Item | Hours |
| --- | --- | --- |
| 1 | Monorepo scaffold, scripts, CI, shared contracts | 1.5 |
| 2 | Server: `Authority`, Socket.IO, role-projected snapshots, Render deploy, keep-warm | 4 |
| 3 | Queue engine and base estimated wait (pure, tests first) | 2.5 |
| 4 | Sample hospital, departments, patients data; routing moved in from `docs/research/06` | 1.5 |
| 5 | Typed English and Hindi dictionaries, all strings | 3 |
| 6 | Shell: home, first-visit language, settings, Emergency button on every screen, emergency signs, "I need urgent help" | 3 |
| 7 | Register: one question per screen, picture cards, assisted mode | 3 |
| 8 | OPD slip: token, QR, print, large type, read aloud | 2 |
| 9 | My turn: place in queue, doctor status, alert at 3 ahead (banner, sound, simulated SMS), called view | 2.5 |
| 10 | I have my slip: typed token | 0.5 |
| 11 | Find a place: SVG floor plans, route, steps with landmarks, Avoid stairs, Listen, I'm lost | 4.5 |
| 12 | Staff dashboard: queues, call next, no-show, send to end, move department, doctor status, overcrowding, urgent flags with sound | 3.5 |
| 13 | Registration counter | 1 |
| 14 | Waiting-room board with spoken call-outs, "Enable sound" tap | 1.5 |
| 15 | Demo controls: add 20 patients, 10x time, reset | 1 |
| 16 | **A.** Wait range and calibration readout | 5 |
| 17 | **B.** Out of service reroute (lift or ramp) | 4 |
| 18 | **C.** Route printed on the slip | 2 |
| 19 | Daily report on Render Workflows (one task, fan-out per department) | 4 |

## Stretch

In this order, only when core is green. The first is the best use of spare hours.

1. **D.** Urgent flag "seen" reply and time-to-seen on the dashboard (2.5 h)
2. "Called but not arrived" Workflows timer
3. QR scan with the camera (`qr-scanner`)
4. Save slip as image
5. Vibration and browser notification at 3 ahead
6. Local fallback `Store` adapter (ADR 0002)

## Cut

Mic input on text questions. Offline and PWA. Third language, Odia included (`07`). Staff PIN (a "real hospital needs a staff login" note on screen instead). Real SMS, indoor positioning, AI triage, voice-first input.

## Cut ladder

If a checkpoint slips, cut in this order and say so in the deck's "built and simulated" slide:

1. Stretch items.
2. Workflows (item 19), at the **Sat 18:00 gate** if it does not run end to end on the live Render URL. Run the hour-one check in `docs/research/01` before anyone writes Workflows code.
3. Calibration readout from item 16. Keep the wait range.
4. Registration counter shrinks to a short form on the dashboard.

Checkpoints: contracts frozen Sat early afternoon, items 1 to 11 live Sat 20:00, feature freeze Sun 12:00 (`docs/hackathon.md`).

## Rules these choices keep

- Emergency first: the button, signs and urgent flag never wait on a token or the server being warm.
- Staff decide urgency. Copy for A and D is reviewed so neither reads as "you can wait".
- Cross-device sync through the server is core. The local fallback is stretch. A fallback never switches on silently.
