---
status: superseded by 0004
---

# Render Workflows for batch work only, behind a JobRunner, with no database

Decided on 24 Oct 2026 in #11. The Render track requires Workflows, so we use them. They run on their own instance, take seconds to start, and cost a network hop. That rules out the queue engine, the wait estimate and anything on the emergency path.

Workflows get one task: `generateDailyReport`, which fans out `summariseDepartment` per department and merges the results. Data goes in as task arguments and the report comes back as the result, so there is no callback and no shared secret.

A `JobRunner` interface in `packages/shared` has two adapters. `RenderWorkflowsRunner` calls the SDK. `InProcessRunner` runs the same pure functions in the server, and is used when `RENDER_API_KEY` is absent (local dev, PR previews, an outage). The UI labels each run "Ran on Render Workflows" or "Ran in-process", and never fakes the first.

There is no database. State lives in server memory and seeds on boot. A restart loses it. That is acceptable for made-up data, and the README says so. Free Render Postgres expires after 30 days, which would break the live URL during judging.

## Consequences

- Swayam runs the hour-one check before anyone writes Workflows code. If access is blocked, we cut Workflows at the Sat 18:00 gate and say so in the deck.
- A persistent store, if ever wanted, goes behind the `Store` interface.
- The "called but not arrived" timer is stretch. If built, it only prompts staff. Staff still mark the no-show.

## Considered options

- Skip Workflows. Safer, but forfeits the Render prizes.
- Run the queue or the wait estimate as tasks. Contrived, adds lag, and breaks the rule that pure logic lives in `packages/shared`.
- Free Postgres. Persistent for 30 days, then gone, with no benefit for a demo that reseeds.
