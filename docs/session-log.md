# Session log: how we got here (24 Oct 2026, 00:00 to about 04:00 IST)

Read this to pick up where the first planning session stopped. It records what was decided, why, and what is still open. Nothing here is a spec. Specs live in `docs/plan/` once the decision tickets close.

## The team and the constraints

- Team 3Piece, three people at OUTR Bhubaneswar. Details in `docs/team.md`.
- Swayam has Claude Pro, so usage limits are tight. This session hit the limit once and resumed after the reset. Soumyajit has Claude Max x5. Ashutosh's seat is unconfirmed.
- Vercel and Render are on free tiers. A Render credits code exists on the HackCache dashboard and is not yet claimed.
- Swayam's standing preferences: TypeScript strict, no `any`, no `console.log`, conventional commits, feature branches, no `Co-Authored-By` trailer, and an `unslop` pass on prose.

## How we chose the problem

1. Swayam pasted the seven HackCache briefs (six fixed statements plus Open Innovation) and a scoring method from an earlier hackathon.
2. We changed the method for this event:
   - Dropped "selection chance". Nothing is selected here, every submission is judged.
   - Raised novelty weight from 0.5 to 1.0. Judges score Innovation as 1 of 5 equal criteria, and every team gets the same Build 1 prompt.
   - Replaced "business-priority alignment" with "panel fit".
   - Added a separate Render-fit column that never changes a total.
   - Scored Saheli (menstrual health) as if no teammate had domain knowledge, even though Soumyajit does.
3. Result, out of 32.5: OPD Saathi 23.7, Jawabdehi 23.4, Open Innovation 23.0 (placeholder), Saral Banking 22.9, Baaki 22.9, Licence Saathi 22.5, Saheli 18.7. Full table in `docs/scoring/problem-statement-scoring.md`. The top six sit within 1.2 points, so the choice was close.
4. Swayam picked **OPD Saathi** (statement 2) and asked for deep research, a task split, an AI-friendly repo and a GitHub push.

## What exists now

- Private repo: https://github.com/Swayam2004/hackcache26-opd-saathi (owner Swayam2004). Local clone at `~/Projects/HackCache'26`.
- `AGENTS.md` and `CLAUDE.md` (the latter imports the former), `CONTEXT.md` (glossary), `docs/` with the brief, event facts, git rules, team, two ADRs, and the research notes.
- Wayfinder map: issue #1. Research tickets #2 to #9. Decision tickets #10 to #14. Task tickets #15 and #16. Blocking edges are wired between them.
- All eight research notes are merged to `main`. The accessibility agent (#8) was cut off by the usage limit, resumed, and finished.

## Research findings that change the plan

Short gists. The notes hold the sources.

- **Render Workflows** (`01`): generally available since 1 Sep 2026 and open on the Hobby plan, per Render's own pages. Real uses are a per-department daily report and a durable "called but not arrived" timer. Keep Workflows off the emergency path. The free web service sleeps after 15 minutes and takes about a minute to wake. No database for the demo. Region Singapore. Monorepo needs `buildFilter`, not `rootDir`.
- **Realtime** (`02`): Socket.IO 4.8.4 on one instance, in-memory state, server-authoritative with role-projected snapshots. Catch-up on reconnect is just the current snapshot. Two `Store` adapters wrap the same pure `Authority`. A local-only fallback must never switch on silently. Emergency flags never depend on the Store.
- **Domain** (`03`): waits are real but vary by site (59, 98.6 and about 12 minutes in three studies). The best evidence for us is wayfinding: at AIIMS Bhubaneswar 97.78% of 507 people still asked for directions after trilingual signs. Registration closes before OPD ends, so the brief's flat 9:00 to 14:00 is wrong. Only 11% there were native Hindi speakers and 50% spoke Odia. Say "108 in many states".
- **Prior art** (`04`): ABDM Scan and Share fixes the registration queue only, and staff still direct patients by voice. Our claim is "starts where Scan and Share ends". Suggested additions: wait range with a predicted-versus-actual readout (6h), live lift-outage reroute (5h), slip that prints the route (3h). Do not promise real SMS (DLT registration) or triage.
- **Browsers** (`05`): native `BarcodeDetector` is missing on Windows and Linux, so ship a scanner library and keep typed tokens. No source confirms an Odia browser voice. Board and staff screens need an "Enable sound" tap per page load. Android notifications must go through a service worker.
- **Routing** (`06`): working, tested TypeScript in `docs/research/06-routing-and-queue-algorithms/` (122 tests, checked against Floyd-Warshall on all 2,116 place pairs). Reusable almost as is.
- **Accessibility and languages** (`07`): hand-rolled typed dictionary instead of an i18n library. A 61-term Hindi glossary and 9 emergency signs sit in `docs/research/07-accessibility-and-languages/glossary-hi.json`, every string flagged for a native-speaker check. Signs trace to WHO, MoHFW and NHM IMNCI. Show 112 and 108 only. Odia: no for the build (no Android Odia voice found, 12 to 16 hours of work). A `tel:` link dials for real, so do not tap it while recording.
- **Judging** (`08`): the guides say only one of five criteria is about the build, so the video and deck carry most of the score. Cut order if time runs short: third language, PWA, QR scan, then Workflows.

## Open problems

1. ~~Deadline~~ Resolved: Sun 25 Oct 2026, 21:30 IST (Swayam, 24 Oct). Keep a minimal end-to-end build deployed by Sat 20:00 as a safety gate.
2. **No task split yet.** `docs/plan/lanes.md`, `contracts` and `deploy.md` do not exist, although `AGENTS.md` points at them. They wait on the decision tickets #10, #11 and #14. The default lane hints in `docs/team.md` are a starting guess only.
3. **Teammates are not invited.** Ticket #16 holds the steps. We need their GitHub handles.
4. ~~Render access~~ Resolved: the $50 hackathon credit shows on Swayam's Render account (valid to 1 Oct 2027), and the New Workflow page opens with TypeScript and Python starters. Not yet run: a first task from the dashboard and from a web service.
5. ADR 0002 (server-authoritative queue) is still `proposed`.
6. ~~TypeScript versus JavaScript~~ Resolved: either is fine. Default stays TypeScript strict (ADR 0001).

## Tooling notes for the next session

- The agent harness could not create worktrees because its base directory is `/home/swayam`, not the repo. Research agents made their own `git worktree add /tmp/wt/<name>` instead. Those worktrees are still on disk and can be removed with `git worktree remove` after merging.
- `gh` calls to the API fail now and then with "error connecting". Retry. `gh issue view` can fail on a Projects (classic) error, so use `gh api repos/.../issues/N` instead.
- Sub-issue links and blocking edges use the REST endpoints `issues/N/sub_issues` and `issues/N/dependencies/blocked_by`. Tickets #14's edges may be incomplete, so check them in the GitHub UI.
- Private data stays out of git: team code, ticket image, calendar file, perk codes. They are in `.gitignore`.

## Next steps, in order

1. Close the research tickets (#2 to #9), since their notes are merged.
2. Swayam invites teammates (#16) and runs a first Workflows task (the hour-one check in `docs/research/01-render-platform.md`).
3. Work the decision tickets in order: scope (#10), architecture (#11), languages (#12), demo story (#13), then lanes and contracts (#14). Each is a grilling session with Swayam.
4. Write `docs/plan/` from those answers, scaffold the monorepo, and open build tickets per lane.

## Update, Sat 24 Oct 2026, about 03:30 IST

Tickets #10, #11 and #14 are decided. Read `docs/plan/` in this order: `scope.md`, `architecture.md`, `lanes.md`, `contracts.md`, `deploy.md`.

- Scope: core is the prompt minus mic input, offline, a third language and a staff PIN, plus wait range, out-of-service reroute, route on the slip and a thin Workflows report. Core is 50 h against a 40 h budget, with a cut ladder.
- Architecture: Render only, static site plus API plus workflow. ADR 0002 accepted with the local adapter as stretch. ADR 0003 added.
- Lanes: drafted for Swayam, who has not yet checked them with Soumyajit.
- Still open: #12 (languages sign-off, who reads Hindi), #13 (demo story), #16 (invites).
