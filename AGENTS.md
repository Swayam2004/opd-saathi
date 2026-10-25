# OPD Saathi

Queue and wayfinding web app for a government hospital outpatient department (OPD). Entry for HackCache '26, problem statement 2. A prototype on made-up data. Submission closes Sun 25 Oct 2026, 21:30 IST.

## Read first

- `CONTEXT.md`: the domain words. Use them exactly in code, UI strings, commits and docs.
- `docs/brief/problem-statement.md`: the official brief and the baseline prompt every team gets. We build past it.
- `docs/plan/`: lanes, ticket order, contracts, deploy. Check `lanes.md` before touching files.
- `docs/research/`: sourced findings. Cite them; research again only for a gap.
- `docs/adr/`: decisions with reasons. Read before changing architecture, and add one when you make a decision that is hard to reverse.
- `docs/git-workflow.md`: branch, commit, PR and deploy rules. Binding.
- `docs/hackathon.md`: dates, judging, deliverables.

## Rules that stay fixed

1. **Emergency first.** An Emergency button sits on every screen, reachable before registration. No flow, token or queue ever gates it. The app shows the way to Casualty, 112 and 108, and raises an urgent flag. Only qualified staff judge urgency.
2. **Staff decide urgency.** The app never labels a case urgent or non-urgent, and never tells anyone they can wait.
3. **Made-up data only.** No real names, Aadhaar or ABHA numbers, phone numbers or hospital data. The slip shows token, first name and department.
4. **Two languages everywhere.** English and Hindi for every user-facing string, direction, landmark and announcement. Strings live in the i18n dictionaries with typed keys.
5. **Accessibility floor.** Body text 18px or larger, buttons 56px or taller, an icon and a word on every action, state shown by more than colour, usable at 360px width with the largest text size.
6. **TypeScript strict by default** (`docs/adr/0001`). Avoid `any`; when one is unavoidable, justify it in a comment. Use the project logger, never `console.log`.
7. **Pure logic gets tests first.** Queue engine, wait estimate and routing are pure functions under `packages/shared` with unit tests written before the code (`tdd` skill).
8. **Secrets stay out of git.** `.env.example` lists names only.

## Working here

- Take a GitHub issue labelled for your lane. Comment to claim it before starting.
- Prefer a small vertical slice that works end to end over a wide stub.
- Run typecheck, lint and test before pushing. The scripts in `package.json` are the source of truth.
- When a domain term changes or a new one appears, update `CONTEXT.md` in the same PR.
- Write prose (docs, PR text, commit bodies) plainly. Apply the `unslop` skill.
- Keep a PR under about 400 changed lines.
