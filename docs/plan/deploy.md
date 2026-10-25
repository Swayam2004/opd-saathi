# Deploy

Owner: Swayam. Topology and reasons are in `architecture.md`. Render rules, limits and a `render.yaml` sketch are in `docs/research/01-render-platform.md`, section 3. The sketch is unvalidated, so run it against Render before trusting it.

## Services (Singapore)

| Name | Type | Build filter paths |
| --- | --- | --- |
| `opd-saathi-web` | static site, rewrite `/*` to `/index.html` | `apps/web`, `packages/shared`, `package.json`, `pnpm-lock.yaml` |
| `opd-saathi-api` | free web service, health check `/healthz` | `apps/server`, `packages/shared`, `package.json`, `pnpm-lock.yaml` |
| `opd-saathi-workflow` | workflow | `apps/workflow`, `packages/shared`, `package.json`, `pnpm-lock.yaml` |

Leave `rootDir` unset. Use `buildFilter`, because files outside `rootDir` are missing at build time. Set `autoDeployTrigger: checksPass`. Build minutes are capped at 500 a month.

## Environment variable names

Names only. Values live in the Render dashboard, never in git.

| Name | Where | Note |
| --- | --- | --- |
| `RENDER_API_KEY` | api | Workspace-wide power. Delete it after judging |
| `WORKFLOW_SLUG` | api | Copy from the task page in the dashboard |
| `WEB_ORIGIN` | api | CORS allow-list for the static site |
| `VITE_API_URL` | web | Public API URL, baked in at build |

Create the API first, read its public URL, then fill `VITE_API_URL`. Add every name to `.env.example` as the services appear.

## Keep-warm and freeze

- Pinger on `/healthz` every 10 minutes, from the Sun 15:00 release candidate until the video is recorded. Then stop it.
- No merges to `main` after Sun 15:00 except fixes for a broken demo path. Every merge redeploys and drops live sockets.
- Tag known-good commits `checkpoint-1`, `checkpoint-2`, and the submitted one `submission`. Roll back by redeploying a tag.

## Before submitting

1. Open the live URL, the repo and the deck in a private window on a phone, signed out.
2. The README holds the live URL, says the first load can take a minute, and lists what is simulated.
3. The repo is public. Scan history for secrets and the team code first.
4. The video is Unlisted on YouTube, not Private, and plays in a private window.
5. Submit once on the HackCache page. It is final. The form asks for the problem statement, title, description, repo, live link, video and deck.
