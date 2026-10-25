# Lanes and ticket order

Drafted 24 Oct 2026 for #14. Swayam asked for the split to be decided for them, so Soumyajit has not signed off yet. Change it by comment on #14. Hours are my estimates, by item number from `scope.md`.

## Why the split looks like this

- Swayam has Claude Pro, so fewer tickets that carry more weight: contracts, the pure engine, the server, deploy, the Workflows task, and review. About 20 h.
- Soumyajit has Claude Max x5, so the long run of screens, floor plans and strings. About 30 h. That is above the 20 h target, and it is the one place the 50 h core is lopsided on purpose. The cut ladder in `scope.md` is the release valve.
- Ashutosh writes no code (`docs/team.md`).
- Every PR gets reviewed by the other developer. Review is cheap on tokens.

## Folder ownership

| Folder | Owner |
| --- | --- |
| Root config, CI, `render.yaml`, `apps/server`, `apps/workflow` | Swayam |
| `packages/shared/src/{contract,authority,queue,wait,analytics,jobs}` | Swayam |
| `apps/web/src/staff/**` | Swayam |
| `packages/shared/src/{data,routing}` | Soumyajit |
| `apps/web/src/{shell,patient,board,components,i18n}/**` | Soumyajit |
| `docs/evidence`, `docs/demo` | Ashutosh |

Anything under `contract/` needs the `contract` label and its own small PR (`contracts.md`). If a ticket needs files in another lane, comment on the ticket first.

## Swayam

| Ticket | Scope item | Hours | Blocked by |
| --- | --- | --- | --- |
| S0 Render hour-one check: workflow service, task from dashboard, then from a web service, timed. Also test socket sleep, wake and reconnect | 2, 19 | 0.5 | none |
| S1 Scaffold: pnpm workspace, strict tsconfig, lint, Vitest, CI, logger | 1 | 1 | none |
| S2 Contract PR: shared types, `Store`, `JobRunner`, `MessageKey` | 1 | 1 | S1 |
| S3 Port `Authority`, queue and base wait from `docs/research/02` and `06`, tests first | 3 | 2.5 | S2 |
| S4 Server: Socket.IO, role-projected snapshots, `RemoteStore`, seed on boot, first Render deploy | 2 | 4 | S3, S0 |
| S5 Staff dashboard: queues, call next, no-show, send to end, move, doctor status, overcrowding, urgent flags with sound | 12 | 3.5 | S4 |
| S6 Workflows: `generateDailyReport`, `summariseDepartment`, `JobRunner` adapters, report card | 19 | 4 | S4, S0 |
| S7 Wait range and calibration functions, pure, tests first | 16 | 2.5 | S3 |
| S8 Registration counter and demo controls (add 20, 10x, reset) | 13, 15 | 2 | S5 |

Total 21 h with S0. Add review time.

## Soumyajit

| Ticket | Scope item | Hours | Blocked by |
| --- | --- | --- | --- |
| D1 Move hospital, departments and patients data and the routing, steps and SVG code from `docs/research/06` into `packages/shared`, tests green | 4 | 1.5 | S1 |
| D2 Typed English and Hindi dictionaries from `glossary-hi.json`, one file per area | 5 | 3 | S2 |
| D3 Shell: home, first-visit language, settings, Emergency button on every screen, emergency signs, "I need urgent help" | 6 | 3 | S2, D2 |
| D4 Register flow, picture cards, assisted mode | 7 | 3 | D3 |
| D5 OPD slip: token, QR, print, large type, read aloud | 8 | 2 | D4 |
| D6 My turn, alert at 3 ahead, simulated SMS, called view, typed token entry | 9, 10 | 3 | D5, S3 |
| D7 Find a place: floor plans, route, steps, Avoid stairs, Listen, I'm lost | 11 | 4.5 | D1, D2 |
| D8 Waiting-room board with spoken call-outs and "Enable sound" | 14 | 1.5 | S4 |
| D9 Out of service: routing option, staff toggle, no-route fallback to the Help desk | 17 | 4 | D7, S5 |
| D10 Route printed on the slip | 18 | 2 | D5, D7 |
| D11 Wait range line on My turn and the calibration readout card | 16 | 2.5 | S7, D6 |

Total 30 h. Until S4 lands, build against `MemoryStore` (the `Authority` in-process). The screens do not change when the `RemoteStore` arrives.

## Ashutosh

| Ticket | What | When |
| --- | --- | --- |
| A1 Hindi check of `glossary-hi.json` and the dictionary. Needs a Hindi reader, so confirm who can do it (#12) | Sat |
| A2 Evidence for the deck: pick the safe numbers in `docs/research/03` and cite them | Sat |
| A3 Demo script and storyboard from `docs/research/08` section 6 (#13) | Sat, done by Sun 09:00 |
| A4 Real-phone test pass at 360 px with the largest text, on Android and iOS if available | Sat night and Sun morning |
| A5 Record, edit and voice the video | from Sun 15:00 |

Soumyajit builds the deck after the Sun 12:00 freeze, with Ashutosh's evidence and screenshots. Swayam owns the README, the final link check and the submission.

## Order

```
Wave 0  S0, S1 -> S2                      D2 drafts strings while S1 and S2 merge
Wave 1  S3                                D1, D2, D3 on MemoryStore
Wave 2  S4                                D4, D5, D6
Wave 3  S5, S6                            D7, D8                       Sat 20:00 gate
Wave 4  S7, S8                            D9, D10, D11
```

Contracts freeze Sat early afternoon, items 1 to 11 are live Sat 20:00, feature freeze Sun 12:00 (`docs/hackathon.md`). If S6 does not run end to end on the live URL by Sat 18:00, cut it (`scope.md`).

## Before any of this starts

Ticket #16: Swayam posts Soumyajit's and Ashutosh's GitHub handles and invites them. No lane starts without it.
