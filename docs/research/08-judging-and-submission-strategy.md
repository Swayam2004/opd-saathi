# Judging criteria and submission strategy

Ticket: #9. Researched 24 Oct 2026 (access date for every URL below), about 02:00 IST. All five HackCache guide pages and the event page loaded without a login.

## Decision-ready summary

1. **The deadline is unresolved.** The dashboard says Sun 25 Oct 21:30 IST (`docs/hackathon.md`). The guides say Sat 24 Oct, "before midnight IST", and "Saturday by 8 p.m." The event page gives no time. Ask in the organisers' WhatsApp group now and screenshot the answer. Plan against Sunday, but keep a submittable build by Sat 20:00.
2. **Submission is final, and judges open the links days later.** Do not redeploy after submitting. Tag the release, put the live URL on a service that survives a sleep, and say in the README that the first load can take a minute.
3. **Judges score on five equal criteria and the guide says only one is about the build.** Innovation, Design and UX, Impact and Presentation can be earned in the video. Spend the last 6 hours on the video and deck, not on features.
4. **Show something working in the first 30 seconds.** The guide allows 90. The brief expects patient, staff and board side by side, so open on all three.
5. **Say what is simulated.** The guides tell teams to be honest about simulated parts and say it is read as confidence. The limitations beat goes in the video at about 3:55 and on deck slide 5.
6. **Polish first:** Hindi assisted-mode registration, avoid-stairs route, staff dashboard with urgent flag, board announcements. **Cut first:** third language, PWA/offline, QR scanning, settings polish, Render Workflows if it is not working by Sat 18:00.
7. **Judge fit:** two product judges, one engineer, three academics. Nobody has a public profile that says "healthcare accessibility". Explain the problem in plain words and show numbers on screen.
8. **Free-tier hosting is a risk to the live URL.** Render free web services sleep after 15 minutes and wake in about a minute. The free Postgres database expires after 30 days. Seed state on boot.
9. **Storyboard:** 4 min 40 s, in section 6. **Timeline:** section 8, with 6 hours of sleep in each of two blocks.
10. **Confidence:** high on the deliverables, medium on the timeline, low on the judges' interests.

## 1. What the five HackCache guides say

**Facts.** Sources: <https://cachedinfo.in/hackcache/guides/your-first-hackathon>, `/finding-your-idea`, `/your-working-demo-in-48-hours`, `/tech-resource-library`, `/pitch-deck-template`, and <https://cachedinfo.in/hackcache>. All accessed 24 Oct 2026. Quotes are as returned by the fetch tool, which summarises, so wording may differ slightly from the page.

- Six judges score independently on five criteria, each out of 10; "Averages decide the ranking, no single judge can swing a result." No weights are given. The guide notes "Only one of the five is about the build itself."
- "What wins is one idea that clearly works, explained well." "Small ideas done completely beat big ideas done halfway."
- "A strong project with a confusing demo loses to a simpler project that the judges understand." "A project that really stands out is one that was clearly considering the judging criteria." "Be honest about what is simulated."
- The finding-your-idea guide wants one specific user, one painful moment, "a result you can show working in 90 seconds", and warns against "five features instead of one".
- Four links are submitted from the dashboard: public repo (README must contain the live link), demo URL that opens without sign-in, video of 5 minutes or less, deck shared as "Anyone with the link".
- "Submitting is final." Once submitted, nothing can be edited. Check every link in a private window first.
- Video structure the guide suggests (about 4 minutes): 0:00-0:20 pitch and problem, 0:20-3:00 main journey, 3:00-3:45 how it's built and what is real, 3:45-4:15 who uses it and what's next. "Show something working within about 90 seconds." YouTube must be **Unlisted**, not Private. Uploads can take minutes to hours.
- Common mistakes listed: login pages, video over 5 minutes or Private, repo still private, teammates' pieces that never join, placeholder content, starting uploads at 11:50 p.m.
- Deck template, 7 slides: Title; Problem (a real quote and real numbers); Solution (one sentence, one screenshot); How it works (three screenshots, matching the video); How it's built (tools, AI used, real versus simulated); Impact and next steps (who benefits, three next things); Team and links. Delete the "How to use this template" slide. Replace drawn phones with real screenshots.
- Hosting page: "Judging happens after the submission deadline, and judges open your links then, possibly days later." "Do not change your live app after you submit." Open every link in a private window on a phone, signed out, before submitting and again a few days later. The page says its limits were checked in September 2026.

**Inference.** The guides were written for a generic Thu-Sat schedule ("Friday morning: build a bare version", "Saturday by 8 p.m.: submit"). The event actually starts Fri 21:30, so the guide's dates are template text. That explains the contradiction with the dashboard but does not prove the dashboard is right.

**Not usable here.** The finding-your-idea page links two external judging articles (JetBrains, Devpost). Their content is not on the page and I did not read them; they are secondary sources anyway.

## 2. Criteria mapped to what a judge sees

A judge sees two things: a 5-minute video and a live URL they open later on their own device. Everything has to be visible in one of those two.

| Criterion | What the judge must see | Where | Evidence on screen |
| --- | --- | --- | --- |
| Innovation (10) | More than the shared Build 1 prompt delivers. Candidates: server-authoritative sync across real devices, estimated wait that moves with doctor delay and the last 10 consultations, spoken Hindi announcements, route with landmarks in both languages | Video 1:25-3:25; README "How it differs" | Phone and board updating without a refresh; a caption naming the formula |
| Technical Execution (10) | It works across devices, not only tabs; routing is correct across floors; reload survives; no console errors | Video 3:55 beat; live URL; repo (strict TypeScript, tests on queue, wait and routing) | Terminal or CI badge for tests for 3 seconds; avoid-stairs route that visibly uses the lift |
| Design and UX (10) | Kamla's path with one action per screen, large type, icon plus word, Hindi everywhere, usable at 360 px | Video 0:35-1:25; live URL on a phone | Assisted mode with larger text; the whole screen in Hindi, including directions |
| Impact (10) | A named person with a named painful moment, and a plausible path to a real hospital | Video 0:00-0:20 and 4:25-4:40; deck slides 2 and 6 | One real number or quote with its source. Do not invent one; the guide's sample numbers are invented and must be replaced |
| Presentation (10) | A video that is clear on first watch; a deck that matches it | Video as a whole; deck | Captions, steady pacing, no dead air, consistent names (Patient, Staff, Board) |

**Recommendation.** The brief's own focus list (ease of registration, language accessibility, inclusive design, queue efficiency, navigation accuracy, emergency handling, technical execution, real-world usefulness) is guidance for what to show. Use its words as on-screen captions so the judge can tick them off.

## 3. The six judges

**Facts, event page only** (<https://cachedinfo.in/hackcache>, accessed 24 Oct 2026):

- Shubham Gaur: Product Manager, Metropolis Healthcare; IIT Jammu and IIT Jodhpur background.
- Rutvik Gupta: Product Owner, Aditya Birla Capital.
- Ankush Kapoor: Project Engineer, C-DAC India.
- Dr. Nitigya Sambyal: Assistant Professor, Thapar Institute; deep learning and medical image analysis.
- Dr. Simmi Dutta: Head of Computer Engineering, GCET Jammu.
- Dr. Yugaanshu Sanjay Ticku: Assistant Professor, Data Science, Sharda University.

**Facts, beyond the event page.** I searched for each name. Only one profile turned up: Dr. Dutta, on a faculty page at `test.gcetj.ac.in/faculty/50` (a test subdomain, so treat it as unconfirmed). It lists her as Professor and Head, CSE, with expertise in AI, machine learning, software engineering, wireless networks, internet technologies and educational technology, about 40 publications, and Controller of Examinations since 2025. For the other five I found nothing public beyond the event page. I did not look further on social media, in line with the instruction to use public information only.

**Inference, labelled as guesses from job titles. Confidence: low.**

| Judge | Likely probe | What to have ready |
| --- | --- | --- |
| Gaur (healthcare PM) | Does the flow match how an OPD works? Who is the user, what is the metric? | Named user, one metric you would track (time from slip to room), the staff-decide-urgency rule |
| Gupta (product owner) | Prioritisation and adoption: why this scope, who would pay or champion it | A "what we cut and why" line; next-steps slide with three items in order |
| Kapoor (C-DAC engineer) | How sync works, what breaks, government-deployment realism | ADR 0002 in one sentence; what happens when the server sleeps; "a real hospital needs a staff login" said aloud |
| Sambyal (deep learning) | Is "smart" real? Any ML claim must be evidenced | State that wait time is arithmetic, not a model; no ML claims at all |
| Dutta (HOD, software engineering) | Can the team explain what they built; code quality; testing | Tests on the pure functions, strict TypeScript, clean README and repo; every member can speak to any part |
| Ticku (data science) | How is the estimate computed, and was it validated? | The formula on screen, the sample consultation times, a note that it is not validated against real hospital data |

**Recommendation.** No judge has a public accessibility background, so spend a few seconds on why assisted mode and avoid-stairs matter (elderly, mobility) instead of assuming the judge knows. Keep jargon out; "OPD" and "token" get a one-line explanation, as the brief itself requires.

## 4. Deliverables spec

| Item | Requirement (source) | OPD Saathi plan |
| --- | --- | --- |
| Public repo | "A public GitHub repository"; README contains the live link; a private repo cannot be judged (guide 3) | Make `hackcache26-opd-saathi` public by Sun 16:00. Before that, scan history for secrets and the team code (`docs/git-workflow.md` already forbids them). README follows the "Submit prompt" list in `docs/brief/problem-statement.md` |
| Live URL | Opens without sign-in (guide 3). Render track: the demo link is the live Render URL (event page) | One Render URL. No login; staff screens use a demo PIN or none, with the "real hospital needs login" note |
| Video | 5 minutes or under; guide targets about 4. Upload Unlisted | 4:40 cut, captions on, Unlisted on YouTube, check it plays in a private window |
| Deck | 7-slide template, shared "Anyone with the link" as Viewer | Google Slides link; template slide deleted; real screenshots |

**Render track.** Requires Render Workflows plus a public repo, a demo video and a live Render URL (event page). Workflows are TypeScript or Python tasks run on their own instances; they are triggered by SDK, API, CLI or dashboard, billed per second, and the docs page I read states no free tier ( <https://render.com/docs/workflows>, accessed 24 Oct 2026). I did not confirm early-access status. A separate research ticket owns this; here I only note the schedule risk.

**What "cannot be edited after submission" means for us.**

- **Fact:** the four links are fixed once submitted (guide 3; guide 1 says "Submitting is final"). The event page has no rule about editing.
- **Inference:** the link targets are not frozen by HackCache, but the guide tells teams not to change the live app, and judges open links days later. A changed or broken app after submission could mismatch the video.
- **Recommendations:**
  1. Submit once, at Sun 17:30. The FAQ does not say whether a second submission is allowed (`docs/hackathon.md`).
  2. Git tag `submission-v1` and do not deploy from `main` afterwards. Turn off auto-deploy on Render right after submitting, or point it at the tag.
  3. Do not delete or rename the video, the deck or the repo. Do not make the repo private again.
  4. Put the video and the deck on the team's personal account, not a university one that can lock.
  5. Test all four links in a private window on a phone, once before submitting and again on Mon 26 Oct.

## 5. Hosting and demo risk register

Render free-tier facts from <https://render.com/docs/free>, accessed 24 Oct 2026: free web services spin down after 15 minutes without inbound traffic and take about a minute to start; 750 free instance hours per workspace per month; the filesystem is wiped on restart or spin-down; free Postgres expires 30 days after creation with a 14-day grace period; the service "might restart at any time". Netlify's credit pause rule is on the tech-resource page.

| # | Risk | Likelihood | Impact | Avoidance |
| --- | --- | --- | --- | --- |
| 1 | Judge opens the URL days later, gets a one-minute spin-up and thinks it is broken | High | High | README and deck line: "first load can take up to a minute" (guide 4 says to do this). Add an uptime ping on the one web service. One always-on service uses about 744 hours in a 31-day month, under 750; a second would not fit. After 1 Nov the quota resets. |
| 2 | Server restarts and queue state is wiped | High | High | Seed hospital and 20 sample patients on boot. Demo controls include Reset. ADR 0002 local fallback keeps one browser working. Do not rely on the filesystem. |
| 3 | Free database expires | Medium | High | Do not use free Postgres for the demo state, or note the creation date (24 Oct, expires about 23 Nov). In-memory seeded state is enough. |
| 4 | Hindi speech synthesis voice missing on the judge's device | Medium | Medium | Hide the Listen button when no Hindi voice exists (the brief's own add-on rule) and record the voice in the video so it is shown at least once. I did not test voice availability across browsers. |
| 5 | Vibration and notification permission cannot be shown on a screen recording | High | Low | In the video show the banner and simulated SMS, and say aloud that the phone also vibrates. Do not promise it in the live URL. |
| 6 | Live demo across three devices fails during recording | Medium | High | Pre-fill with Demo controls, record on one laptop with phone-sized browser window, board on the second window. Take two full takes. |
| 7 | Microphone input blocked by browser or unsupported | Medium | Low | Typing path always works; mic button hidden when unsupported. |
| 8 | Video over 5 minutes, Private, or still uploading at the deadline | Medium | High | Target 4:40, Unlisted, start upload by Sun 16:30 (guide 3 warns uploads take minutes to hours). |
| 9 | Repo still private or leaks a secret at submission | Low | High | Public-switch checklist on Sun 16:00; `.env.example` only. |
| 10 | Feature work breaks the demo path after freeze | Medium | High | Freeze Sun 12:00. Only fixes on the demo path afterward. |
| 11 | Deadline is Sat night, not Sun | Low-medium | Very high | Section 8 gate at Sat 20:00. Ask organisers now. |
| 12 | Deck and video disagree on names or screens | Medium | Medium | Take deck screenshots from the same release candidate used for recording. |

## 6. Five-minute video storyboard

Total 4:40, leaving 20 seconds under the limit. Uses the guide's structure but moves the working demo earlier. Film one laptop screen split three ways: phone-width patient window left, staff dashboard centre, `/board` right. Subtitles on throughout, in English; Hindi UI text stays on screen.

| Time | Beat | Show | Say (summary) |
| --- | --- | --- | --- |
| 0:00-0:20 | Hook | Title card, then Kamla (62, basic Android, avoids stairs) | One sentence: "For Kamla, who reaches the hospital, gets a slip, and cannot find Room 3." One cited number or real quote if the team has one; if not, no number |
| 0:20-0:35 | The three surfaces | The three windows side by side with a caption each: Patient, Staff, Board | "Same hospital, three screens, live." Something is already moving on the board (the guide wants working output early) |
| 0:35-1:25 | Hindi assisted registration | Language choice, emergency signs on the first screen, "Someone is helping me" on, larger text, read aloud, mic input, picture card, slip with token and QR | Caption: "Emergency button on every screen." Do not click through all steps; cut between three |
| 1:25-2:05 | Slip to room, avoid stairs | Route on the SVG plan crossing floors via lift; written steps with landmarks in Hindi; Listen | Show the stairs path that would have been shorter, then the lift path chosen. Caption: "Avoid stairs: on by default in assisted mode" |
| 2:05-2:50 | Queue moves, 3-ahead alert | Staff: Demo controls add 20 patients, 10x time; call next; board announces a token aloud; patient screen shows people ahead dropping, then the 3-ahead banner and simulated SMS | Show estimated wait changing and say the formula in one sentence |
| 2:50-3:25 | Urgent flag | Patient or helper presses "I need urgent help"; flag pins at the top of the staff dashboard with sound; staff marks seen | Say clearly: the app does not decide who is urgent; only staff do. This is the strongest rule in the brief |
| 3:25-3:55 | Called and arrival | Patient's called screen, directions, board line; staff marks done | Close the loop for Kamla |
| 3:55-4:20 | Honest limitations and how it's built | Architecture in one frame: one server owns queue state, local fallback; deploy target | Say: made-up hospital and patients; no real hospital integration; no staff login; wait time is an average, not a prediction model; Hindi voice depends on the device; not tested in a real OPD |
| 4:20-4:40 | Impact and next | Three next steps; URL and repo on screen | Who benefits; what you would measure first (time from slip to room) |

**Recommendation.** If the cut runs long, drop the detail in 0:35-1:25 and 2:05-2:50 first, never the urgent-flag or limitations beats. Ashutosh records voiceover from a script; everyone reads it twice before recording (guide 3: "rehearse twice").

## 7. What to polish and what to cut

**Inference from the criteria and the storyboard. Confidence: medium.** Ranked by how many video seconds and how many criteria each item serves.

Polish, in order:

1. Hindi assisted-mode registration, including the emergency-signs first screen. It appears at 0:35 and serves Design and UX, Impact and Innovation.
2. Avoid-stairs route and Hindi written steps across floors. It is the brief's core and the easiest to show wrong. Unit-test every pair of places.
3. Urgent flag to staff dashboard with sound, and the "staff decide" wording. It is the one place a judge may penalise us for safety.
4. Staff dashboard plus Demo controls. The 2-minute full flow depends on it.
5. Board with spoken announcement. High visual payoff, low effort.
6. Estimated wait and the 3-ahead alert.
7. README, deck and video captions. These are the Presentation score.

Cut, in order, if time runs short:

1. Third language (Tamil in the prompt pack). Hindi and English cover the brief.
2. PWA and offline queue. ADR 0002's local fallback is enough.
3. QR camera scanning; keep typed token entry.
4. Settings polish beyond language and text size.
5. Registration counter print layout beyond a plain printable slip.
6. Render Workflows, if not deployed and working by Sat 18:00. A half-working track entry costs more than it gains; the main prize does not depend on it.
7. Move-department action and overcrowding colour detail. Keep them in the staff screen only if already built.

## 8. 43-hour timeline in IST

Now is Sat 24 Oct, 02:00 (repo created). Deadline plan is Sun 25 Oct 21:30 per the dashboard. The hackathon.md milestones (contracts early afternoon, freeze Sun 12:00, RC and recording 15:00, submit 17:30) are kept. Two sleep blocks of at least 6 hours; the first guide says to plan at least six hours of sleep.

| When | What | Checkpoint |
| --- | --- | --- |
| Sat 02:00-04:00 | Scaffold, shared types, first deploy of an empty app to Render | Public URL loads on a phone |
| Sat 04:00-10:00 | **Sleep** | |
| Sat 10:00-13:00 | Hospital data, routing, queue engine with tests first | Contracts frozen at 13:00 |
| Sat 13:00-20:00 | Patient, staff and board slices in parallel; i18n as each screen lands | **20:00 gate:** a minimal end-to-end flow is deployed, so a Sat-night deadline would still be met. Confirm the deadline with organisers before this |
| Sat 20:00-23:30 | Assisted mode, urgent flag, board announcements, Demo controls | Full flow runs in under 2 minutes |
| Sat 23:30-Sun 06:30 | **Sleep** | |
| Sun 07:00-12:00 | Polish list items 1-6; Hindi review by a fluent reader; phone test with someone who has not seen the app | **12:00 feature freeze** |
| Sun 12:00-15:00 | Bug fixes on the demo path; README; deck draft; make repo public at 16:00 | 15:00 release candidate deployed and tagged |
| Sun 15:00-16:30 | Record video, two takes; deck screenshots from the RC | Raw video exported |
| Sun 16:30-17:30 | Upload (Unlisted), captions check, test four links in a private window on a phone | **17:30 submit** |
| Sun 17:30-21:30 | Buffer. Do not redeploy. Fix only a broken link | Turn off auto-deploy |
| Mon 26 Oct | Re-test all four links | |

**Inference.** This leaves roughly 27 hours awake against the "about 32 focused hours" in `docs/hackathon.md`; the difference is the second sleep block. If the team prefers the 32-hour plan, shorten the first sleep to 5 hours but not below.

## Open questions for the team

1. What time does the organisers' system actually close submissions: Sat midnight or Sun 21:30? Who asks in the WhatsApp group, and who screenshots the reply?
2. Does the dashboard allow a second submission before the deadline? If yes, submit a safe version early and replace it.
3. Do we enter the Render track? If so, who owns Workflows and what is the Sat 18:00 go or no-go?
4. Is there one real quote or sourced number for the problem slide? If not, the slide uses a sourced statistic from another research file or none.
5. Which uptime ping will we use, and does the team accept the free-tier hours cost?
6. Who reads the Hindi script and UI strings for correctness before the video?
7. Is the repo made public Sun 16:00 or earlier, and who checks the history for secrets first?
8. Who speaks to which beat in the video, and who answers any live questions after submission?
