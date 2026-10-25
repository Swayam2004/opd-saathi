# Contracts

The types two lanes both touch. They live in `packages/shared/src/contract/`. A change needs the `contract` label, its own PR under 100 lines, a merge within 30 minutes and a note in chat (`docs/git-workflow.md`). Swayam writes the first version in S2. They freeze **Sat 24 Oct, early afternoon**.

Start from the sketches in `docs/research/02-realtime-sync/types.ts` and `docs/research/06-routing-and-queue-algorithms/types.ts`. They compile and have tests. Make these changes on the way in.

## Changes to the sketches

- Drop `Ticket.key` and the key on `PublicView.mine`. The QR carries the token only (`architecture.md`).
- Add `outOfService: PlaceId[]` to `HospitalState`, and a `SetOutOfService` command (staff only). Routing takes an `avoidPlaces` option beside `avoidStairs`. `RouteResult` already has `no_route`.
- Add `WaitRange` as `{ aboutMin, lowMin, highMin }`, all rounded to 5. Add `CalibrationReadout` as `{ shown: number, inside: number }`.
- Keep seven departments: `MED`, `CHI`, `WOM`, `BON`, `ENT`, `EYE`, `SKI`. Medicine has rooms 1 and 2 under one queue. The room is set when a token is called.
- Keep `RaiseUrgentFlag` open to every role, with no token.

## The contract

| Type | Used by |
| --- | --- |
| `HospitalState`, `Ticket`, `UrgentFlag`, `DoctorStatus`, `Clock` | server, staff, patient, board |
| `Command`, `CommandInput` | every screen that sends changes |
| `Signal` | sound, vibration and announcement effects |
| `PublicView`, `StaffView` (role-projected snapshots) | every screen |
| `Store` (`dispatch`, `subscribe`, connection state) | every screen |
| `JobRunner`, `DailyReport`, `DeptSummary` | server, workflow, staff report card |
| `Graph`, `Place`, `Path`, `Route`, `RouteResult` | routing, find a place, slip, staff toggle |
| `WaitRange`, `CalibrationReadout` | wait functions, My turn, staff dashboard |
| `Lang`, `MessageKey` | every user-facing string |

`MessageKey` comes from the English dictionary. The Hindi dictionary is typed so a missing key fails the build.

## Rules

- Pure types and pure functions only. No DOM, Node or socket imports in `packages/shared`.
- No `any`.
- After the freeze, add fields rather than change or remove them.
