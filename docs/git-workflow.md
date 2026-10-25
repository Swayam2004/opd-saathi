# Git workflow

Two developers and one non-code teammate, about 43 hours, a deploy on every merge. The workflow is trunk-based: short branches, small PRs, a `main` that always works.

## Branches

- `main` is always deployable. Every merge to `main` redeploys. Broken `main` is the first thing anyone fixes.
- Branch from fresh `main`:
  ```
  git switch main && git pull --ff-only && git switch -c feat/<area>-<short-name>
  ```
- Prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`. Research uses `research/<topic>`.
- A branch lives for hours. If it is older than half a day, merge what works behind a flag or split it.
- One lane and one purpose per branch.

## Commits

Conventional commits: `type(scope): summary`.

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- Scope is the area: `patient`, `staff`, `board`, `routing`, `queue`, `server`, `i18n`, `a11y`, `infra`, `shared`.
- Imperative mood, 72 characters or fewer. Example: `feat(routing): add avoid-stairs option to dijkstra`.
- No `Co-Authored-By` trailers, from people or from tools. History stays uniform.
- Commit often on a branch. Branches are squashed on merge, so WIP commits cost nothing.

## Pull requests

- Open as a draft early. Mark ready when CI is green.
- Squash merge. The PR title is the final conventional commit message.
- Keep a PR under about 400 changed lines. Split anything larger.
- Before marking ready: `git fetch && git rebase origin/main`, then typecheck, lint and test (the scripts in `package.json`).
- The other developer reviews. During the crunch the review SLA is 45 minutes. After that, with CI green and your own smoke test done, you may self-merge and say so in chat.
- Docs-only and research PRs: self-merge.
- Delete the branch after merge.

## Never

- Never force push `main`.
- On your own feature branch, force push only with `--force-with-lease`.
- Never commit secrets, `.env` files, API keys, claim codes or the hackathon team code. Env var names go in `.env.example`; values go in the host dashboards.
- Never rewrite published history. Rollback means redeploying a previous tag.

## Shared files (conflict magnets)

| File or folder | Rule |
| --- | --- |
| `packages/shared` (types, schemas, queue engine) | A change that touches a type other lanes use goes in its own small PR with the `contract` label. Merge it within 30 minutes and announce it in chat |
| `pnpm-lock.yaml` | On conflict, take `main`'s copy and run `pnpm install` again. Never hand-edit |
| Root config (`package.json`, `tsconfig`, lint, CI) | One owner at a time. Say so in chat before touching |
| `src/i18n` dictionaries | One file per area per language, so two people rarely edit the same file |

Lane ownership lives in `docs/plan/lanes.md`. If a ticket needs files in another lane, comment on the ticket first.

## Deploys

- `main` deploys automatically. Targets and env vars are in `docs/plan/deploy.md`.
- Pull requests get preview deploys where the host supports it.
- Check the preview before merging anything that changes UI.

## Tags and checkpoints

- Tag a known-good commit at each milestone: `checkpoint-1`, `checkpoint-2`, and so on.
- Tag the submitted commit `submission`.
- To roll back, redeploy the last good tag. Do not revert history unless a revert PR is the fastest fix.

## Freeze schedule (IST)

| When | What changes |
| --- | --- |
| Sat 24 Oct, early afternoon | Contracts frozen. Shared type changes need the `contract` label from here on |
| Sun 25 Oct 12:00 | Feature freeze. Bug fixes and polish only |
| Sun 25 Oct 15:00 | Release candidate deployed. Only fixes for broken demo paths |
| Sun 25 Oct 17:30 | Submit. The 4 hours after are buffer, not build time |
