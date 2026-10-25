# Routing, directions and queue algorithms

Ticket #7, part of #1. Written 24 Oct 2026. Code and tests: `docs/research/06-routing-and-queue-algorithms/` (18 files, 122 tests, all pass on Node 22.18.0).

## Decision-ready summary

1. Adopt the schema in `types.ts`: `Place {id, kind, floor, x, y, landmark{rel,obj}, facing}` and `Path {id, a, b, metres, stairs, oneWay, extraSeconds}`. Corridor junctions are unnamed `waypoint` places. Names, landmarks and floors live in the i18n dictionaries, keyed by id.
2. Route with Dijkstra on seconds, not metres. The avoid-stairs filter runs while building the adjacency list, so the search cannot see a stair path. A search over the 46-node sample takes about 17 microseconds. Skip A*.
3. Lift wait is `extraSeconds` on one edge per floor pair, so it is paid once per ride. With a 55 s wait the stairs win when stairs are allowed. Avoid-stairs always lifts, however long the wait.
4. A step is `{key, params}` made of ids and numbers. Each language owns its sentence templates and word order. Door counting ("second door on your left") is computed from coordinates and only valid when every door on the corridor is in the data.
5. Wait estimate: pad the last-10 window with the seed average, cap each sample at 3x the seed, treat each room as a server, round to 5 with a floor of 5 when anyone is ahead. With one doctor this equals the brief's formula exactly.
6. Queue state is plain JSON (fits ADR 0002). Move-department keeps the original queue order under a new token. Send-to-end is capped at 2 per token. A no-show can be reinstated once.
7. A validator catches orphans, dangling ends, one-way traps, step-free dead ends, short distances and missing landmarks. The sample passes it, and 12 mutation tests prove it catches each mistake.
8. Proof: 12 hand-listed pairs in both modes, two fully hand-computed totals, and every one of 2,116 place pairs in both modes checked against Floyd-Warshall.

Confidence: high that the code does what the tests say, medium that the sample coordinates and Hindi wording match what the team wants, low on the walking-speed constants (assumptions, section 8).

## 1. Facts (sourced)

All accessed 24 Oct 2026.

| Claim | Source |
| --- | --- |
| Type stripping is on by default from Node v22.18.0. | Node changelog, "Type stripping is enabled by default": https://raw.githubusercontent.com/nodejs/node/v22.x/doc/changelogs/CHANGELOG_V22.md |
| Enums, runtime namespaces and parameter properties need `--experimental-transform-types`. Imports must include the `.ts` extension. Type-only imports must use `import type`. `erasableSyntaxOnly` makes `tsc` enforce this. | Node v22 TypeScript docs: https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/typescript.md (rendered at https://nodejs.org/docs/latest-v22.x/api/typescript.html, which did not resolve from my fetch tool) |
| `node:test` is stable (Stability 2) since v20.0.0. | https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/test.md |
| `<polyline points="x,y x,y ...">` takes absolute coordinates, comma pairs separated by spaces. | MDN: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/polyline |
| Unicode MessageFormat (formerly MessageFormat 2.0) exists so that "developers and translators ... create natural-sounding, grammatically-correct" messages. Its Final Candidate is in LDML 46.1. | https://raw.githubusercontent.com/unicode-org/message-format-wg/main/spec/README.md |
| Hindi plural rule: category `one` is `i = 0 or n = 1`. So 0 and 1 are both "one" in Hindi but 0 is "other" in English. | CLDR: https://raw.githubusercontent.com/unicode-org/cldr/main/common/supplemental/plurals.xml. Confirmed locally: `new Intl.PluralRules('hi')` gives `one, one, other, other` for 0,1,2,5 (ICU 77.1). |
| Indian access guidance gives ramps a 1:12 gradient with 1500 x 1500 mm landings every 9 m, and a 1500 mm minimum corridor width. | NIUA toolkit (a Ministry of Housing and Urban Affairs institute) summarising the Harmonised Guidelines: https://niua.in/intranet/sites/default/files/2187.pdf. This is a secondary document. The CPWD original returned "Request Rejected" to my fetch. |

Dijkstra (1959) and A* (Hart, Nilsson, Raphael 1968) are the textbook algorithms. I did not fetch the papers (the Springer link redirected to a login), so I rely on the code and the Floyd-Warshall oracle for correctness, not on a citation.

What the facts mean here (inference, high confidence): a 1:12 ramp for a 4 m floor rise is 48 m of ramp plus landings, so inter-floor ramps are unrealistic for this hospital. The brief's "Ramp" on the ground floor is modelled as the entrance ramp beside the entrance steps. The schema still supports an inter-floor ramp (a `ramp` place on each floor joined by a path), but no test exercises it.

## 2. Graph schema (recommended)

```ts
type PlaceKind = 'entrance'|'room'|'ward'|'service'|'facility'|'lift'|'stairs'|'ramp'|'waypoint';
interface Place { id; kind; floor: 0|1|2; x; y;            // metres from the plan's top-left, y down
                  landmark?: { rel: 'opposite'|'next_to'|'near'; obj: string };
                  facing?: number }                          // degrees a person faces leaving a lift or stairs
interface Path  { id; a; b; metres; stairs: boolean; oneWay: boolean; extraSeconds: number }
interface Graph { floors: {id; widthM; heightM}[]; places: Place[]; paths: Path[] }
```

Choices and reasons:

- **Waypoints.** The brief's graph only has named places. Real directions need corridor corners to say "turn left", so unnamed `waypoint` places are added. They never appear in search. They may carry a landmark, which becomes "The turn is near the notice board."
- **Lifts and ramps are places, not path flags.** A lift is one `lift` place per floor, joined by `lift` to `lift` paths. A floor change is any path whose ends are on different floors. The validator requires both ends to be the same connector kind.
- **Lift wait.** `extraSeconds` on the path: 55 s between adjacent floors, 65 s ground to second. One direct edge for each floor pair means the wait is not charged twice when passing floor 1.
- **Stair-only.** `stairs: true`. The sample has three: the entrance steps (8 m, beside the ramp) and the two stair flights. The entrance steps make a short trip like entrance to lift 23 m by steps and 48 m by ramp.
- **One-way.** `oneWay: true` means `a` to `b` only. The sample has one: the pharmacy exit door to the lift lobby. Pharmacy to lift is 14 m, lift to pharmacy is 29 m, and a test pins that asymmetry.
- **Landmark as `{rel, obj}`.** English says "opposite the blue chairs". Hindi says "नीली कुर्सियों के सामने" with the object first. Two ids and a per-language template per relation keep word order out of the data.
- **Metres vs coordinates.** `metres` is the measured walking distance. The sample derives it from coordinates (rounded up), which a tape measure will replace. The validator rejects any path shorter than the straight line.
- **Cost.** `seconds = metres / (0.8 m/s, or 0.4 on stairs) + extraSeconds`. Seconds make lifts and stairs comparable. The route also reports metres.

Sample dataset (`hospital.ts`): 31 searchable places (13 ground, 12 first, 6 second) and 15 waypoints, 50 paths, three 60 x 36 m floors. Lifts and stairs sit at identical coordinates on every floor. The brief's list is covered: entrance, registration, help desk, emergency, pharmacy, laboratory, X-ray, water, toilets, wheelchair point, lift, stairs, ramp, rooms 1 to 8, waiting hall A, wards 4 to 6, nurses' station. Rooms and wards use the ids `room1` to `room8` and `ward4` to `ward6`.

### Validation script (`validate.ts`)

`validateGraph(graph, entranceId?) => Issue[]` returns `{code, subject, message}`. Codes: `duplicate_place`, `duplicate_path`, `dangling_endpoint`, `self_loop`, `bad_metres`, `shorter_than_straight_line`, `bad_connector`, `stairs_flag_mismatch`, `parallel_path`, `orphan_place`, `missing_landmark`, `unknown_floor`, `connector_not_aligned`, and four connectivity codes.

Connectivity runs a directed reachability search from the entrance and a reverse one back to it, twice: with all paths and with stair paths removed. That catches both one-way mistakes (a place you can leave but never reach, or enter but never leave) and step-free dead ends (a ward reachable only by stairs). Mutation tests prove each: a flipped one-way, a removed exit door, a removed lift link, a shortened distance, a duplicated pair, a missing landmark, a floor-changing path between two rooms.

Not covered: a one-way path that is correct in the data but wrong on the ground. Wire the validator into CI on the real data.

## 3. Routing (`route.ts`)

```ts
findRoute(graph, from, to, { avoidStairs, walkSpeedMps?, stairsSpeedFactor? }): RouteResult
// { ok: true, route: { nodes, legs[{pathId,from,to,metres,seconds,stairs}], metres, seconds, avoidStairs } }
// | { ok: false, reason: 'unknown_place' | 'no_route' }
```

- `buildAdjacency` drops stair paths first when `avoidStairs` is set, and adds both directions for two-way paths. Dijkstra then uses a binary min-heap with id tie-breaking, so equal-cost routes are the same on every run.
- Stale heap entries are skipped, so the heap needs no decrease-key.
- **Why not A*.** The whole sample takes 17 microseconds per search (measured: 21,160 searches). A cross-floor heuristic needs care because lifts move you between planes. There is nothing to gain. Revisit only if the graph grows by orders of magnitude.
- **Proof.** `route.test.ts` runs Floyd-Warshall on the same filtered graph and compares seconds for all 2,116 ordered pairs in both modes. It also asserts that no avoid-stairs route has a stair leg or a staircase node.
- **Defaults when stairs are allowed.** Stairs beat the lift (30 s against 60 s for one floor), which is realistic for a walker with no restriction. The glossary turns avoid-stairs on by default in assisted mode only.

Hand-checked totals, entrance to Room 3:

| Mode | Path | Metres | Seconds |
| --- | --- | --- | --- |
| Stairs allowed | steps 8, lobby to hub 6, to staircase 9, stairs 12, to hub 9, 12, door 8 | 64 | 105 (44 m flat at 0.8 = 55, steps 20, stairs 30) |
| Avoid stairs | ramp 13 + 20, 6, 9, lift 4 (5 s walk + 55 s wait), 9, 12, 8 | 81 | 156.25 |

## 4. Steps with landmarks (`steps.ts`, `strings.ts`)

```ts
buildSteps(graph, route, { countDoors?, straightTolerance? }): Step[]
renderStep(dict: Dictionary, step: Step): string
interface Step { main: Msg; hint?: Msg; floor; legs: [from, to) }   // legs index into route.legs
interface Msg  { key: TemplateKey; params: Record<string, MsgParam> } // numbers and ids only
```

How it works:

1. Each leg is classified: walk, ramp, steps, lift, stairs.
2. Walk legs merge into one run while the heading stays within 30 degrees of straight. Headings come from coordinates: `atan2(dx, -dy)`, 0 is plan-up, so a positive turn is a right turn.
3. A run becomes `go.straight|left|right|around` with distance rounded to 5 m (minimum 5). Lift and stair legs of the same kind merge, so ground to second floor is one "Take the lift to the second floor."
4. Lifts and stairs have `facing`, the direction a person faces when stepping out, so the first turn after a lift is computed correctly.
5. A final single leg that turns at least 45 degrees into a room, ward, service or facility becomes the arrival. The door ordinal is the rank among door-kind places on the same side of the preceding corridor run, within 10 m, counting from where that run started. Beyond the fifth door, or with `countDoors: false`, it falls back to "You have arrived at ...".
6. A turn at a waypoint with a landmark adds a hint sentence.

**Translatable by construction.** No step is built by joining English fragments. A step is a template key plus ids. The English template for left-arrival is `{place} is the {door} on your left, {landmark}.` and Hindi is `{place} आपके बाएं हाथ पर {door} है, {landmark}।`. Doors are whole phrases ("तीसरा दरवाज़ा") so gender agreement lives in the translation. Landmark relations are templates with an `{obj}` slot. Tests assert the same keys and placeholders in both languages, and that every Hindi value contains Devanagari, which catches an English string pasted into the Hindi table. Unicode MessageFormat is the standards-track alternative. For about 20 templates it is not worth a library this weekend. If a third language arrives (Tamil add-on), use `Intl.PluralRules` for any count, since Hindi treats 0 as singular.

Output for entrance to Room 4, step-free (verbatim from the tests):

```
You are at Main entrance, near the security desk.
Take the ramp, about 35 metres.
Turn right and walk about 15 metres. The turn is near the notice board.
Take the lift to the first floor.
Walk straight for about 10 metres.
Turn left and walk about 20 metres. The turn is near the notice board.
Room 4 is the second door on your left, next to the drinking water point.
```
```
आप मुख्य प्रवेश द्वार पर हैं, सिक्योरिटी डेस्क के पास।
रैंप से जाएँ, लगभग 35 मीटर।
दाएं मुड़ें और लगभग 15 मीटर चलें। यह मोड़ सूचना पट के पास है।
लिफ्ट से पहली मंज़िल पर जाएँ।
लगभग 10 मीटर सीधे चलें।
बाएं मुड़ें और लगभग 20 मीटर चलें। यह मोड़ सूचना पट के पास है।
कमरा 4 आपके बाएं हाथ पर दूसरा दरवाज़ा है, पीने के पानी की जगह के बगल में।
```

A sweep renders all 1,922 (31 x 31 x 2 modes) routes in both languages and checks for leftover braces, empty text, and that every leg belongs to exactly one step in order.

Limits: "Room 4 is the second door" is wrong if the real corridor has an unlisted door (a store cupboard). The team must walk the corridors and either list every door or set `countDoors: false` for that run. Hindi text is mine and needs a native read. Digits stay Latin, as on hospital signs.

## 5. SVG floor plans (`svg.ts`)

```ts
routePolylines(graph, route): { floor, points: [x, y][] }[]
renderFloorSvg(graph, floor, { route?, dict, scale?, labels? }): string
```

- Returns a string with no DOM, so it works in React (`dangerouslySetInnerHTML` is avoidable by mapping the same data to JSX), on the server and in tests.
- A route is cut into one polyline per stay on a floor. The line on floor 0 ends at the lift and the line on floor 1 starts at the same coordinates. Entrance to Room 3 gives `300,340 420,320 300,260 300,200 280,120` on floor 0 and `280,120 300,200 420,200 420,120` on floor 1, at 10 px per metre.
- Start is a filled circle and end is a square, so the pair works without colour. The route is dashed. Place kinds differ by shape (square lift, triangle stairs, wedge ramp). Stair paths are dashed corridors.
- `role="img"` plus a `<title>` with the floor name from the dictionary. All text is escaped (`Nurses' station` becomes `Nurses&#39; station`) and Hindi labels render from the same function.
- Not handled: overlapping labels on a crowded plan, pan and zoom, and a floor visited twice (the split logic supports it, no data tests it). The UI needs a floor tab strip and "Step 3 of 7" synced to `Step.legs`.

## 6. Queue rules (`queue.ts`, `wait.ts`, `clock.ts`)

State is plain JSON: `{day, departments{config, counter, history[10]}, tickets{token: Ticket}, nextOrder}`. Every action is a pure function returning `{ok: true, state, ...} | {ok: false, error}`. A JSON round trip is tested, so the server and the local fallback (ADR 0002) store the same shape.

```ts
issueToken(state, deptId, nowMs)            callNext(state, deptId, room, nowMs)
callToken(state, token, room, nowMs)        startConsult(state, token, nowMs)
completeConsult(state, token, nowMs)        markNoShow(state, token)
reinstate(state, token)                     sendToEnd(state, token)
moveDepartment(state, token, toDept)        peopleAhead(state, token)
newDay(state, day)                          waitingQueue / inService / deptAverage
```

Rules:

- **Token.** `PREFIX-NNN`, three digits minimum, per department per day (`MED-042`, `MED-1000`). Prefixes: MED, PED, WOM, BON, ENT, EYE, SKN. Each is three letters so the board can read them out.
- **Order.** One increasing counter, `order`. Lower goes first. Nothing else (age, gender, department) affects it. The app has no priority lane, matching AGENTS rule 2.
- **Call next.** Takes the lowest-order waiting token in the department. A room can hold one called or in-consultation token. Two rooms of one department share one queue (General Medicine, rooms 1 and 2).
- **Call a specific token.** `callToken` calls a waiting token out of order. This is the staff action for an urgent case, so the app never decides urgency and staff still can act.
- **No-show.** Only a called token, only by staff. Never on a timer. It leaves the queue and frees the room.
- **Reinstate.** A no-show can come back once, at the back. Reason: Kamla walks slowly and may arrive after the call. Second time returns `reinstate_limit`.
- **Send to end.** New `order`, same token. Capped at 2 per token (`deferral_limit`) so a patient cannot be bumped forever.
- **Move department.** New token in the new series (`MED-002` becomes `SKN-003`), old ticket marked `moved` with `movedTo`, original `order` kept. A counter mistake then costs the patient nothing. The slip must be reprinted, and the UI should say so.
- **People ahead** = waiting tokens with lower order, plus tokens already called or in a room. The slip and the estimate use the same number.

### Wait formula

`estimateWait(ahead, avgMin, ctx)` with `ctx = {nowMin, openMin, closeMin, doctors: DoctorStatus[]}`.

The brief: people ahead x average of the last 10 + doctor delay, rounded to 5. Each doctor `d` frees slots at `delay_d + k x avg`. The person with `ahead` people in front takes slot number `ahead` in sorted order. For one doctor that is exactly `ahead x avg + delay`. For two doctors it is about half, which the plain formula overstates.

| Case | Behaviour | Test |
| --- | --- | --- |
| Empty history | The seed average from `departments.ts`. | `averageConsultMinutes(5, []) = 5` |
| Fewer than 10 samples | Missing slots filled with the seed: `(3+3+3+7x5)/10 = 4.4`. One data point moves the estimate a tenth of the way. | yes |
| One forgotten "complete" (90 min) | Each sample capped at 3x the seed and floored at 1 min. | `[90]` with seed 5 gives 6 |
| 6 ahead x 4 min | Raw 24, shown "about 25" (the slip example in the brief). | yes |
| 1 ahead x 2 min | Raw 2, shown 5. Never "about 0" when someone is ahead. | yes |
| 0 ahead, doctor available | 0. The UI says "You are next". | yes |
| Doctor running late 15 min | Adds 15. | 4 x 5 + 15 = 35 |
| Doctor on break until 11:30, now 10:50 | Adds 40. A break that already ended adds 0. | yes |
| Before 9:00 | Wait counts from opening time. | 08:30, 2 x 5 gives 40 |
| After 14:00 | `unknown: closed`. No number. | yes |
| All doctors off | `unknown: no_doctor`. | yes |
| Two rooms | 4 ahead x 6 min gives 10, not 25. | yes |
| Estimate runs past closing | `pastClosing: true` for the staff dashboard. Patients get "ask at the help desk", not a verdict. | yes |
| Demo at 10x | `SimClock` converts real to simulated ms. Durations are recorded in simulated minutes. Changing speed re-anchors, so time never jumps. | 4 tests |

Rounding is to the nearest 5 (7.5 gives 10). Display "about N minutes". The estimate is derived from state on every read, never stored, so it cannot go stale.

Not done: crediting the time the person in the room has already used (the estimate counts them as a full consultation, which errs high), and a "late patient" penalty. Both are small later changes.

### Fairness summary

First come first served by issue counter. No cutting in by anyone except a staff `callToken`. Deferral and reinstatement are capped, so nobody is starved and nobody games the queue. Moving department keeps the place in line. A no-show is a human decision. Hospital policy, not code, should settle the caps; they are constants (`MAX_DEFERRALS`, `MAX_REINSTATES`).

## 7. Adopted API and test list

Put the code in `packages/shared/src/{routing,queue}` as written. Names are final unless the team renames in the same PR:

- Routing: `validateGraph`, `findRoute`, `buildSteps`, `renderStep`, `routePolylines`, `renderFloorSvg`. Data: `hospital.ts`, `strings.ts` (to be split into `en.ts` and `hi.ts` per AGENTS rule 4).
- Queue: the 14 functions in section 6, `estimateWait`, `averageConsultMinutes`, `SimClock`.

Tests adopted (122, grouped):

- Routing, 48: 12 place pairs x 2 modes (24), two hand totals, Floyd-Warshall on all pairs in both modes, speed check, stair-only shortcut, one-way asymmetry, lift-penalty swing, empty route, unknown place vs no route, plus 15 validator tests.
- Steps and i18n, 24: heading and turn math, English goldens, Hindi golden, door counting both sides, straight-ahead, same place, 1,922-route sweep, dictionary parity, Devanagari check, SVG polylines and escaping.
- Queue and wait, 50: numbering, call, no-show, deferral, reinstate, move, fairness, JSON round trip, new day, 13 wait cases, 6 average cases, clock.

## 8. Inferences and unverified items

Inferences (not sourced):

- Walking speed 0.8 m/s and stairs at half that are assumptions for a slow walker. Tune them with a stopwatch in the real building. They only change which route wins when stairs are allowed.
- Lift wait 45 s plus 10 s a floor is a guess for a busy district hospital lift.
- 30 degrees as "straight", 45 degrees as "turn into a door", 10 m as the door-offset limit are tuned to the sample layout.
- Lift doors are assumed single-sided, so a person leaves facing the way they entered from. The `facing` field is the fix for a through lift.
- Caps of 2 deferrals and 1 reinstatement, and the 3x sample cap, are judgment calls.

Could not verify:

- The CPWD/MoHUA Harmonised Guidelines original (fetch rejected). The 1:12 ramp figure comes from a secondary NIUA toolkit. I did not confirm lift car size.
- The Dijkstra and A* papers, and the nodejs.org rendered pages (read the same text from the Node repo instead).
- Hindi wording and the left/right words (बाएं, दाएं) with a native speaker.
- The `inter-floor ramp` path and revisiting a floor in a real route. Code exists, no test.
- The SVG in a browser. I tested strings only and did not render a picture.

Strict typecheck: `tsc` 5 with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`, `verbatimModuleSyntax` reports no errors. No `any` appears in the code. The `tsc` run used a copy outside the repo.

## 9. How to run

```
cd docs/research/06-routing-and-queue-algorithms
node --test *.test.ts        # Node >= 22.18, no flags, no build step
```

`package.json` in that folder sets `"type": "module"`. No dependencies.

## 10. Test output (condensed from `node --test --test-reporter=spec *.test.ts`)

```
✔ token numbering (5 tests)
✔ call next (6 tests)
✔ no-show, send to end, reinstate (6 tests)
✔ move department (2 tests)
✔ people ahead and estimated wait together (5 tests)
✔ fairness (2 tests)
✔ route table: 12 pairs, with and without avoid-stairs (24 tests)
    entrance -> room3 | entrance -> ward4 | helpdesk -> room8 | room1 -> ward6
    room4 -> emergency | xray -> room2 | ward6 -> laboratory | entrance -> toilets_1
    room5 -> room1 | registration -> toilets_g | entrance -> lift_g | nurses -> room2
    (each pair passes with stairs allowed and with avoid stairs)
✔ hand-checked totals (2 tests)
✔ route properties (7 tests)
✔ geometry helpers (2 tests)
✔ English steps (8 tests)
✔ Hindi steps (1 tests)
✔ every route renders in both languages (1 tests)
✔ translation dictionaries (3 tests)
✔ route polylines (2 tests)
✔ floor SVG (7 tests)
✔ sample hospital (3 tests)
✔ validator catches mistakes (12 tests)
✔ average consultation time (6 tests)
✔ rounding (1 tests)
✔ estimated wait (13 tests)
✔ demo clock at 10x (4 tests)
ℹ tests 122
ℹ suites 22
ℹ pass 122
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 640.771223
```

## Open questions for the team

1. Who walks the real corridors to confirm every door is listed? Without that, set `countDoors: false` and rely on landmarks.
2. Should avoid-stairs be on by default for everyone, or only in assisted mode? The glossary says assisted only.
3. Are the deferral cap (2) and the single reinstatement acceptable to the hospital story we pitch? Both are one-line constants.
4. Does a moved patient keep their place (our default) or join the back? Judges may ask.
5. Who reviews the Hindi strings? One native read before the demo video is enough.
6. Do we draw the sample map from these coordinates, or from a real hospital's published plan? The brief allows made-up layouts.
7. Show "past closing" to patients at all? It is information about hours, not a triage label, but the wording needs care under AGENTS rule 2.
