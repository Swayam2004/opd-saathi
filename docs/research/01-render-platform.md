# Research 01: Render platform and Workflows for a live queue app

Ticket #2. Researched 24 Oct 2026. All "accessed" dates are 24 Oct 2026. Docs were read as markdown (`Accept: text/markdown` on render.com/docs) so code samples are verbatim.

## Decision-ready summary

1. **Use Workflows.** It is a stated qualifying requirement of the Render track ([S1](#sources)), it is GA since 1 Sep 2026 and available on the free Hobby plan ([S2](#sources), [S3](#sources)). Not using it means no Render prizes.
2. **Make the use real, keep it off the hot path.** Queue engine, wait estimate and the emergency/urgent-flag path stay in the web service and `packages/shared`. Workflows get the batch and delayed work: a daily flow report fanned out per department, and a durable "called but not arrived" timer.
3. **Free web service is the weak link, not Workflows.** It sleeps after 15 min idle and takes about 1 minute to wake, keeps no files, and may restart at any time ([S4](#sources)). Plan for it with a static-site front end, a local fallback and a keep-warm ping.
4. **A free web service cannot receive private-network calls** ([S4](#sources)). Tasks must reach it over public HTTPS with a shared secret. Better: pass data in task arguments and return results, so tasks need no callback at all.
5. **Region: Singapore** for all three services (closest listed region to India; [S5](#sources)).
6. **No database for the demo.** Server memory plus seed on boot. Free Postgres dies 30 days after creation, which would hit around 23 Nov ([S4](#sources)).
7. **Monorepo trap:** files outside a service's `rootDir` are not available at build time ([S6](#sources)). Leave `rootDir` unset and use `buildFilter` so `packages/shared` is visible.
8. **Hobby limits that can bite:** 50 root task starts per minute with HTTP 429 and no queueing; 500 build pipeline minutes per month; 5 GB bandwidth ([S3](#sources), [S7](#sources), [S8](#sources)).
9. **Fallback:** a `JobRunner` interface with a Render adapter and an in-process adapter running the same pure functions. It keeps the app working but forfeits the Workflows track, so test access in the first hour.
10. **First hour:** create the workflow service by hand, run `calculateSquare` from the dashboard, then from the web service via SDK. Everything below depends on that working.

Confidence: high on documented limits and syntax; medium on integration behaviour (latency, cold-start handling), which no doc quantifies. See [Open questions](#open-questions-for-the-team).

---

## 1. Render Workflows

### Facts

| Topic | Finding | Source |
| --- | --- | --- |
| Status | Public beta from 7 Apr 2026. GA on 1 Sep 2026, when the Flex plan and new pricing took effect. The changelog has no separate GA entry; the date comes from Render's own pricing post and the Flex changelog. The docs pages carry no beta label. | [S9](#sources), [S10](#sources), [S11](#sources) |
| Plans | Listed as available on Hobby ($0/month plus compute), Pro, Scale, Enterprise. | [S8](#sources) |
| Languages | Tasks in TypeScript (`@renderinc/sdk` `^1.0`) or Python (`render>=1.0.1`). Other languages planned. The SDK repo shows TS 1.4.0 released 21 Oct 2026, Node `>=18`. | [S12](#sources), [S13](#sources) |
| Service type | New "Workflow" service linked to a Git repo. Runtime `node` or `python` (or Docker, dashboard only). Region is required and fixed at creation. All task runs execute in that region. | [S14](#sources), [S6b](#sources) |
| Defining | `task({ name, plan?, timeoutSeconds?, retry? }, function (ctx: TaskContext, ...args) {...})`. Arguments and return value must be JSON-serialisable, 4 MB total per run. Start command must run the file that imports every task module. | [S12](#sources) |
| Chaining | `await ctx.run(otherTask, args)` starts a run on its own instance. `Promise.all` makes them parallel; without it they run serially. Chained runs must be in the same workflow service. | [S12](#sources) |
| Triggering | SDK `new Render().workflows.startTask('{workflow-slug}/{task-name}', [args])` then `await run.get()`, or `runTask` to start and wait. REST: `POST https://api.render.com/v1/task-runs` with `{"task": "...", "input": [...]}`. Needs `RENDER_API_KEY`. Dashboard and CLI can also start runs. | [S15](#sources) |
| Result streaming | `taskRunEvents(ids)` streams terminal events over SSE. Statuses: `pending`, `running`, `completed`, `failed`, `canceled`. | [S13](#sources) |
| Retries | Default: 3 retries (4 attempts), 1 s wait, doubling. Per task: `retry: { maxRetries, waitDurationMs, backoffScaling }`. A run fails on throw, timeout, resource limit or instance error. | [S12](#sources) |
| Timeouts | Default 2 h. Settable from 30 s to 24 h per task (`timeoutSeconds`). | [S12](#sources) |
| Concurrency | Each run gets its own instance, "within seconds". Over the limit, runs queue. Limits per workflow service: 10,000 CPU / 40,000 GB active; new compute per minute 16 CPU / 64 GB on Hobby. | [S3](#sources), [S16](#sources) |
| Rate limits | Root-level starts: 50 per minute per workspace on Hobby; over the limit returns 429 and the run is **not queued**. Chained runs: 1,000 per minute. 500 task definitions per service. | [S3](#sources) |
| Pricing | Default `flex`: $0.20 per CPU-hour and $0.05 per GB-hour of actual use, minimum one second at 0.1 CPU / 0.1 GB. Fixed plans from $0.40/h (`2c-4g`). Task state (args and results) kept 30 days at $0.25/GB-month. Queuing and provisioning are free. | [S3](#sources) |
| Local dev | `render workflows dev -- npm start` (CLI 2.12.0+) runs a local task server on port 8120. Point the SDK at it with `RENDER_USE_LOCAL_DEV=true` (and `RENDER_LOCAL_DEV_URL` for a non-default port). Only task endpoints are simulated. Logs live in memory. | [S17](#sources) |
| Observability | Dashboard Tasks and Runs pages, per-run logs, CLI log tailing. There is no dedicated observability doc page (404 on the guessed URL). | [S16](#sources), [S15](#sources) |
| Idempotency | The TS SDK README documents `startTask(slug, args, { idempotencyKey })`; the same key within 24 h returns the original run. Not on the docs pages. | [S18](#sources) |
| Blueprints | Supported since 16 Sep 2026: `type: workflow` in `services`. `plan` is not set in YAML (per-task in code). `previews`, `preDeployCommand` and Docker fields are unsupported. | [S10](#sources), [S6b](#sources) |
| Not supported | Native scheduling (use a cron job), preview environments, Blueprint replication, HIPAA workspaces. Runs accept no inbound connections. | [S14](#sources) |

### Inferences

- A task run is a separate instance with no access to the web service's memory. Anything it needs must arrive as an argument or come from an HTTP call. (From the execution model in [S14](#sources).)
- Cost is negligible. A report run of 8 chained department tasks at about 2 s each and 0.2 CPU / 0.2 GB is roughly $0.0003 by the published flex rates. A 5-minute sleeping timer task at about 0.1 GB is under $0.001. Even 200 timers in a demo cost cents. The $50 credit covers the weekend many times over.
- Cold-start of a task is "within seconds" in the docs and "sub-second" on the pricing page ([S14](#sources), [S8](#sources)). Treat as 1 to 10 s until measured. Show a visible "running on Render Workflows" state in the UI.
- A retry reruns the whole task from the top (inferred from "retry a failed run"). So put sleep and side effects in separate tasks with separate retry boundaries, as the docs advise for chaining ([S12](#sources)).
- With 50 root starts a minute, "Demo controls: add 20 patients, speed x10" can burst past the limit if every token starts one run. Batch, or start one run per department.

### Not Workflows-shaped (so do not force it)

Docs position Workflows for long-running, distributed, retry-worthy work: agents, ETL, batch jobs ([S14](#sources)). The queue engine, wait estimate and routing are millisecond pure functions that AGENTS.md requires in `packages/shared`. Running them as tasks adds a network hop and seconds of latency.

---

## 2. Free-tier web service

### Facts

| Topic | Finding | Source |
| --- | --- | --- |
| Spin-down | After 15 min with no inbound traffic. HTTP requests and WebSocket messages on existing connections count as traffic. | [S4](#sources) |
| Cold start | "About one minute" on the next HTTP request or new WebSocket connection. Browsers see a loading page meanwhile. | [S4](#sources) |
| Instance hours | 750 free hours per workspace per month, shared across all free web services. Spun-down time is free. At zero, all free web services are suspended until next month. | [S4](#sources) |
| Bandwidth | Counts against included outbound bandwidth. Hobby includes 5 GB, then $0.15/GB. With no payment method, free services are suspended when it runs out. | [S4](#sources), [S8](#sources) |
| Build minutes | Hobby includes 500 pipeline minutes per month. With no payment method, new builds are disabled when they run out; running services stay up. | [S7](#sources), [S4](#sources) |
| Filesystem | Ephemeral. Lost on redeploy, restart and spin-down. No persistent disks. | [S4](#sources) |
| Restarts | Render may restart a free service at any time. | [S4](#sources) |
| Private network | A free web service cannot receive private-network traffic. It can send to data stores and paid services in the same region. | [S4](#sources) |
| WebSocket | Supported. Public WebSocket traffic uses the service's single HTTP port. No fixed connection timeout; connections close when the instance is replaced (deploy, maintenance). Docs recommend ping/pong keepalives and client reconnect with backoff. Graceful shutdown window 30 s (up to 300 s). | [S19](#sources) |
| Health checks | Web services can set `healthCheckPath`; any 2xx/3xx is healthy. Unhealthy running instances are restarted automatically. Default is a TCP probe. | [S20](#sources) |
| Regions | Oregon, Ohio, Virginia, Frankfurt, Singapore. Region cannot be changed later. Services in different regions cannot use the private network. | [S5](#sources) |
| Static sites | Free, global CDN, no region choice, count against the same bandwidth and build minutes. Redirect/rewrite rules support SPA routing. | [S4](#sources), [S21](#sources) |
| Cron jobs | Not free: $1 minimum per month per cron job. | [S22](#sources) |
| Env vars | `RENDER_EXTERNAL_URL` holds a web service's own public URL (empty for workflows). | [S23](#sources) |
| Node | Current default Node.js is 24.22.1 for services created on or after 21 Oct 2026. Pin with `.node-version` or `engines`. | [S24](#sources) |

### Inferences and keep-warm tactics

- **Singapore** is the closest listed region to India by geography. Not benchmarked.
- One always-on free service fits the monthly budget: a 31-day month is 744 hours, under 750. A second always-on free service would not. Our Blueprint has exactly one free web service, so this works, but do not add another.
- **Keep-warm, in order of cost:**
  1. An external pinger (cron-job.org, UptimeRobot, or a GitHub Actions schedule) hitting `/healthz` every 10 minutes. Start it a few hours before recording and stop it after results.
  2. An open staff dashboard or board tab with an application-level heartbeat message every 30 s. Docs say WebSocket messages on existing connections count; whether protocol-level ping frames count is not stated, so send a real message.
  3. Manual: open the URL 2 minutes before any live demo.
- **Static-site front end** means the app shell loads instantly even when the API sleeps. The shell can show "Waking the hospital server, about a minute" and run on the local adapter from ADR 0002. A single web service serving the SPA would show Render's loading page instead.
- **Deploy-induced disconnects:** every merge to `main` redeploys and drops WebSockets. Clients must reconnect and refetch state. After the 15:00 Sunday release candidate, stop merging.
- **Build minutes:** three services on every merge to `main` can burn the 500-minute budget. Rough: 3 services x 2 to 3 min x 40 merges is 240 to 360 minutes. Use `buildFilter` per service and `autoDeployTrigger: checksPass`.
- **Cold-start behaviour for API (non-browser) clients is not documented.** It may hold the request for about a minute or return an error. Make workflow callbacks retry for longer than a minute (see below).

### Postgres: do we need it?

- Free Postgres: one per workspace, 1 GB, **expires 30 days after creation**, 14-day grace, no backups ([S4](#sources)). Created on 24 Oct it expires around 23 Nov, and the judging window may run past that. Date is computed, judging dates are not published.
- Recommendation: **no database**. Made-up data seeds on boot (`resetAndReseed`), and state loss on restart is acceptable for a prototype. Say so in the README under "what is simulated". If a persistent store is wanted later, add it behind the same `Store` interface.

---

## 3. Blueprint sketch (pnpm monorepo)

### Facts that shape it

- `rootDir` hides everything outside it, including at build time ([S6](#sources)). `packages/shared` sits outside `apps/*`, so **do not set `rootDir`**. Scope redeploys with `buildFilter` ([S6b](#sources)).
- `sync: false` env vars prompt once at first Blueprint creation and are ignored on later updates; they are not allowed in env groups. `generateValue: true` works in groups ([S6b](#sources)).
- Static sites take `routes` for rewrites; `staticPublishPath` is relative to the root ([S6b](#sources), [S21](#sources)).
- Docs show `pnpm install` as a valid Node build command ([S25](#sources)). How pnpm is provisioned on Render's Node runtime is not documented.

### `render.yaml` (unvalidated; the Render CLI is not installed here)

```yaml
envVarGroups:
  - name: opd-shared
    envVars:
      - key: WORKFLOW_CALLBACK_SECRET
        generateValue: true          # same value in api and workflow

services:
  # 1. API: queue state, WebSocket, triggers workflow runs
  - type: web
    name: opd-saathi-api
    runtime: node
    plan: free
    region: singapore
    buildCommand: corepack enable && pnpm install --frozen-lockfile && pnpm --filter @opd/server build
    startCommand: node apps/server/dist/index.js
    healthCheckPath: /healthz
    autoDeployTrigger: checksPass
    buildFilter:
      paths: [apps/server/**, packages/shared/**, package.json, pnpm-lock.yaml]
    envVars:
      - fromGroup: opd-shared
      - key: NODE_ENV
        value: production
      - key: RENDER_API_KEY          # triggers task runs; workspace-wide power, keep out of git
        sync: false
      - key: WORKFLOW_SLUG           # copy from the workflow's page in the dashboard
        value: opd-saathi-workflow
      - key: STAFF_PIN
        sync: false
      - key: WEB_ORIGIN              # CORS allow-list for the static site
        sync: false

  # 2. Static front end: loads instantly even when the API sleeps
  - type: web
    name: opd-saathi-web
    runtime: static
    buildCommand: corepack enable && pnpm install --frozen-lockfile && pnpm --filter @opd/web build
    staticPublishPath: apps/web/dist
    autoDeployTrigger: checksPass
    buildFilter:
      paths: [apps/web/**, packages/shared/**, package.json, pnpm-lock.yaml]
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL            # public API URL, baked in at build time
        sync: false

  # 3. Workflow: tasks only, no inbound traffic
  - type: workflow
    name: opd-saathi-workflow
    runtime: node
    region: singapore                # required for workflows
    buildCommand: corepack enable && pnpm install --frozen-lockfile && pnpm --filter @opd/workflow build
    startCommand: node apps/workflow/dist/index.js
    autoDeployTrigger: checksPass
    buildFilter:
      paths: [apps/workflow/**, packages/shared/**, package.json, pnpm-lock.yaml]
    envVars:
      - fromGroup: opd-shared
      - key: API_URL                 # public URL of opd-saathi-api, for callbacks
        sync: false
```

Notes on the sketch:

- `buildFilter` and `autoDeployTrigger` are not listed as unsupported for workflows in the field reference ([S6b](#sources)), but the docs do not confirm them either. If Render rejects them, drop them for the workflow only.
- The workflow slug is "available from your task's page in the Dashboard" ([S15](#sources)); do not assume it equals the service name.
- `API_URL` and `VITE_API_URL` need the API's real `onrender.com` URL. Create the API first, read `RENDER_EXTERNAL_URL`, then fill the prompts. A custom domain would make this stable but is optional.
- `RENDER_API_KEY` on the API service is a full workspace key. Never commit it, never log it, and delete it after judging.
- No `previews` block: workflows do not support preview environments and `sync: false` vars are not copied into previews ([S6b](#sources)). A PR preview of the API therefore has no `RENDER_API_KEY`. The `InProcessRunner` below covers that.

### Workflow package shape

Keep SDK imports in one thin package so `packages/shared` stays pure and testable.

```
apps/workflow/src/index.ts            # imports ./tasks/*   (start command runs the build of this file)
apps/workflow/src/tasks/report.ts     # task() wrappers calling pure functions from packages/shared
apps/workflow/src/tasks/timer.ts
packages/shared/src/analytics/*       # summariseDepartment(), mergeReports(): pure, TDD
```

---

## 4. Candidate Workflows uses, ranked

Ranking is judge value against effort, with an honest "is it contrived" verdict. Judge criteria on the Render track are innovation, effective use of Workflows, technical implementation, real-world impact and UX ([S1](#sources)).

| # | Use | Judge value | Effort | Honest verdict |
| --- | --- | --- | --- | --- |
| 1 | **Daily flow report.** Root task `generateDailyReport(events)` fans out `summariseDepartment` per department with `Promise.all`, then merges into one report (throughput, average and p90 wait, peak overcrowding, no-show rate, busiest hour). | High | Medium (about 4 h) | **Real.** This is the textbook batch fan-out and roll-up. It is genuine hospital value (where are the bottlenecks) and off the request path. Weakness: at 8 departments with a few hundred events a loop in the server would also work. The honest pitch is that a real hospital has months of events and many sites. |
| 2 | **Called-token timer.** On `Called`, start `watchCalledToken(tokenId, delayMs)`. After the delay it chains `confirmStillWaiting`, which calls the API; the API raises a "no-show candidate" notice for staff. Staff still mark the no-show. | Medium-high | Low-medium (about 3 h) | **Mostly real.** Durable delayed work that survives API sleep or restart, with per-step retry. A `setTimeout` in the server does the same while the server is up, so claim durability, not necessity. Domain rule holds: **No-show** is a staff action in CONTEXT.md, so the task only prompts staff. |
| 3 | **Notification fan-out.** When a token is 3 ahead, fan out one `sendNotice` run per subscriber with retry and backoff. | Medium | Medium | **Half contrived.** The SMS is simulated and we hold no real phone numbers. The retry story is only real with a real push or SMS provider. Stretch goal. |
| 4 | **Daily reset and reseed.** `resetAndReseed(seed)` triggered by Demo controls and by a morning cron. | Low-medium | Low (about 1 h) | **Convenience, contrived.** Wiping in-memory state takes milliseconds. Useful as a visible "Run on Render" button in the demo and for per-day token numbering, but do not oversell it. Scheduling needs a $1/month cron job or an external trigger. |
| 5 | **Wait-time recompute.** | Low | Low | **Contrived. Do not do it.** Must update on every queue move, is pure, and belongs in `packages/shared` (AGENTS.md rule 7). A task adds seconds of lag. |
| 6 | **Anything on the emergency path** (urgent flag, Emergency button, routing to Casualty). | Negative | n/a | **Never.** AGENTS.md rule 1: nothing gates Emergency. A cold run, a 429 or an outage must not touch it. State this explicitly in the pitch; judges from healthcare will look for it. |

### Recommended task list (minimum credible set)

| Task | Plan | Timeout | Retry | Notes |
| --- | --- | --- | --- | --- |
| `generateDailyReport(events, speed)` | flex | 120 s | default | Root. Chains `summariseDepartment` per department in parallel, merges with a pure function. Data goes in as arguments (a few KB, well under 4 MB) and the report comes back as the result. **No callback needed.** |
| `summariseDepartment(dept, events)` | flex | 60 s | default | Pure function from `packages/shared`. |
| `watchCalledToken(tokenId, calledAt, delayMs)` | flex | `delayMs + 120 s` | default | Sleeps, then `await ctx.run(confirmStillWaiting, ...)`. Receives `delayMs` already scaled by the demo speed factor. |
| `confirmStillWaiting(tokenId, callId)` | flex | 300 s | `maxRetries: 5, waitDurationMs: 5000, backoffScaling: 2` (waits 5, 10, 20, 40, 80 s, total about 155 s) | POSTs to the API with `WORKFLOW_CALLBACK_SECRET`. The long backoff is a real use of retries: it outlasts the roughly 1-minute cold start of the free API. The API must dedupe on `callId` so a retried POST is idempotent. |
| `resetAndReseed(seedName)` (stretch) | flex | 60 s | default | Only if time allows. |

Task sketch (TypeScript, matches the documented API in [S12](#sources)):

```ts
import { task, type TaskContext } from '@renderinc/sdk/workflows'
import { summariseDepartment as summarise, mergeReports } from '@opd/shared'

export const summariseDepartment = task(
  { name: 'summariseDepartment' },
  function summariseDepartment(_ctx: TaskContext, dept: DeptId, events: QueueEvent[]): DeptSummary {
    return summarise(dept, events)
  }
)

export const generateDailyReport = task(
  { name: 'generateDailyReport', timeoutSeconds: 120 },
  async function generateDailyReport(ctx: TaskContext, byDept: Record<DeptId, QueueEvent[]>): Promise<DailyReport> {
    const parts = await Promise.all(
      Object.entries(byDept).map(([dept, ev]) => ctx.run(summariseDepartment, dept as DeptId, ev))
    )
    return mergeReports(parts)
  }
)
```

Web service side: `new Render().workflows.startTask(WORKFLOW_SLUG + '/generateDailyReport', [byDept], { idempotencyKey })`, then stream status with `taskRunEvents` or poll `getTaskRun`, and push progress to the staff dashboard over the existing socket. Show run id, status, duration and attempt in the UI so the demo video proves it is the real thing.

### What to show judges

- Staff dashboard "Today's report" card with a visible "Running on Render Workflows" state and run id.
- In the video, cut to the Render dashboard Runs page showing the parent run and the parallel chained runs (the dashboard visualises chaining, per [S12](#sources)).
- README paragraph: which work runs on Workflows and why, which deliberately does not (emergency path, wait estimate), and what is simulated.

---

## 5. Fallback plan if Workflows access is unavailable

1. **Detect early.** In the first hour create the workflow service by hand ([S14](#sources)) and run a task from the dashboard. If "New > Workflow" is missing, a payment method is demanded, or the API returns 401/403 for task runs, stop and ask the HackCache organisers and Render support before building anything else. Hackathon page lists "Render Workflows" and a credits guide as resources ([S1](#sources)).
2. **Design for it anyway.** Define `interface JobRunner { run<T>(name: JobName, args: JobArgs): Promise<JobHandle<T>> }` in `packages/shared`. Two adapters:
   - `RenderWorkflowsRunner`: the SDK call above.
   - `InProcessRunner`: calls the same pure functions inside the API with `setTimeout` and `Promise.all`. Selected automatically when `RENDER_API_KEY` is absent (local dev, PR previews, outage).
3. **Same UI either way.** The run card shows "Ran on Render Workflows" or "Ran in-process (Workflows unavailable)". Never fake the first label.
4. **If only the SDK or API trigger fails** but the dashboard works: start runs from the Dashboard or CLI for the demo video and keep the in-process path live for the URL. Disclose it.
5. **Local verification without a deploy:** `render workflows dev -- node apps/workflow/dist/index.js` with `RENDER_USE_LOCAL_DEV=true` ([S17](#sources)). This tests task code and the trigger path on a laptop, but does not prove Render access.
6. **Cost of the fallback:** the app and demo still work; the Render track entry is weaker or void, since "use Render Workflows" is the qualifying condition ([S1](#sources)).

---

## 6. Recommendations for OPD Saathi

1. **Hour 1:** hand-create the workflow, run `calculateSquare` in the dashboard, call it from a scratch script with `RENDER_API_KEY`, and time the start-to-complete latency. Record the real number in the README.
2. **Pick TypeScript** for tasks (ADR 0001). Pin `@renderinc/sdk` to the version the lockfile resolves; the docs only require `^1.0`.
3. **Ship tasks 1 and 2 first** (`generateDailyReport` with fan-out, and `watchCalledToken` with `confirmStillWaiting`). Add notification fan-out only if there is slack after feature freeze minus 6 hours.
4. **Keep the emergency path off Workflows,** and say so in the pitch.
5. **Draft ADR 0003** once the hour-1 test passes: "Workflows for batch and delayed work only; JobRunner interface; no database." ADR 0002 stays `proposed` until the WebSocket-on-free-tier behaviour (sleep, reconnect) is tested for real.
6. **Reconnect and catch-up** on the client after every deploy and after a cold start. Show "Last updated N minutes ago" as the problem-statement add-on asks.
7. **Spending guard:** without a payment method Render suspends free services when limits run out instead of billing, which is safe but means exhausted build minutes block the last fix. Check the Billing page for pipeline minutes before each deploy-heavy stretch.
8. **Freeze rule:** after the 15:00 Sunday release candidate, no merges to `main` except fixes for broken demo paths, so deploys do not drop live sockets mid-judging.

---

## Open questions for the team

1. Does the hackathon account (Hobby, no card?) let us create a workflow service and start runs? Do the $50 credits apply to Workflows compute? The credits guide has no public URL on the event page ([S1](#sources)).
2. Does the Hobby workspace need a payment method for Workflows or for Free services to avoid suspension? Not stated on the pages read.
3. Who holds the Render account and `RENDER_API_KEY`, and do both developers have dashboard access to see runs?
4. Measured task start latency and measured wake-up behaviour of the free API for non-browser clients (503, held request, or timeout)?
5. Does pnpm work on Render's Node runtime via `corepack enable`, and which version? If not, fall back to `npm i -g pnpm`.
6. Does `buildFilter` / `autoDeployTrigger` work on `type: workflow` in Blueprints? Does the Blueprint parse as written?
7. When is judging, and how long must the live URL stay up? That decides whether to stop the keep-warm pinger, and whether a free Postgres would survive.
8. Is an external keep-warm pinger acceptable under Render's terms? Not found in the docs read.
9. Do protocol-level WebSocket pings count as "traffic" for the 15-minute idle timer?
10. Is the workflow slug equal to the service name?

## Sources

All accessed 24 Oct 2026.

- S1. HackCache event page, Render track: https://cachedinfo.in/hackcache
- S2. Render changelog index (beta 7 Apr 2026, Flex 1 Sep 2026, Blueprint support 16 Sep 2026): https://render.com/changelog
- S3. Limits and Pricing for Render Workflows: https://render.com/docs/workflows-limits
- S4. Deploy for Free: https://render.com/docs/free
- S5. Regions: https://render.com/docs/regions
- S6. Monorepo Support: https://render.com/docs/monorepo-support
- S6b. Blueprint YAML Reference: https://render.com/docs/blueprint-spec
- S7. Build Pipeline (included minutes): https://render.com/docs/build-pipeline
- S8. Render pricing (Workflows listed for Hobby; Hobby bandwidth 5 GB): https://render.com/pricing
- S9. Render Workflows now in public beta: https://render.com/changelog/render-workflows-now-in-public-beta
- S10. Added Blueprint support for Render Workflows: https://render.com/changelog/added-blueprint-support-for-render-workflows
- S11. Upcoming changes to Workflows pricing (10 Aug 2026; GA 1 Sep): https://render.com/blog/upcoming-changes-to-workflows-pricing
- S12. Defining Workflow Tasks: https://render.com/docs/workflows-defining
- S13. Workflows SDK for TypeScript, and SDK repo changelog: https://render.com/docs/workflows-sdk-typescript , https://github.com/render-oss/sdk/blob/main/typescript/CHANGELOG.md
- S14. Intro to Render Workflows (FAQ, limitations): https://render.com/docs/workflows , tutorial: https://render.com/docs/workflows-tutorial
- S15. Triggering Task Runs: https://render.com/docs/workflows-running
- S16. Intro page, "Rich observability" and execution flow: https://render.com/docs/workflows
- S17. Local Dev with Render Workflows: https://render.com/docs/workflows-local-development
- S18. TS SDK README, idempotency keys: https://github.com/render-oss/sdk/blob/main/typescript/README.md
- S19. WebSockets on Render: https://render.com/docs/websocket
- S20. Health Checks: https://render.com/docs/health-checks
- S21. Static Site Redirects and Rewrites: https://render.com/docs/redirects-rewrites
- S22. Cron Jobs: https://render.com/docs/cronjobs
- S23. Environment variables: https://render.com/docs/environment-variables
- S24. Node.js version: https://render.com/docs/node-version
- S25. Deploys, build command examples: https://render.com/docs/deploys
