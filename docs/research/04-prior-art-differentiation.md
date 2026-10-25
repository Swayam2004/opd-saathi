# Prior art, what other teams will build, and where OPD Saathi can stand out

Ticket: #5. Researched 24 Oct 2026. Every URL below was accessed on 24 Oct 2026 unless it is marked "not opened".

## Decision-ready summary

1. Build these three, in this order: **honest wait range with a calibration readout (6 h)**, **lift or ramp outage that reroutes live (5 h)**, **slip that carries the written route in print (3 h)**. About 14 h in total. Stretch: an urgent-flag "seen by staff" reply (2.5 h).
2. The nearest government system, ABDM Scan and Share, fixes the registration-counter queue only. Its own playbook has staff verbally direct the patient to the department afterwards. Our honest claim is "starts where Scan and Share ends": slip to room.
3. Commercial wayfinding exists (Pointr, Gozio). Both are paid, global products. Pointr's live directions rely on BLE positioning. Neither page we opened mentions India or Hindi. We can claim a no-hardware, floor-plan-graph route in Hindi and English. We cannot claim "first" or "no one does wayfinding".
4. A team that follows the prompt exactly ships the same 12 screens, a single-number wait estimate, a simulated SMS, and state that lives in one browser. The team already fixes the last point (`docs/adr/0002`).
5. Estimated wait as a point value is what the prompt specifies. A range plus a predicted-vs-actual readout is cheap and speaks to the two data-science judges and the product judges. Evidence that estimates raise satisfaction is weak (one RCT, n=100, no effect); evidence that patients want them is stronger (70% preferred them).
6. The one hackathon project we opened that touches urgency (reassurED, McHacks 12) uses an LLM to suggest a triage level. That conflicts with our rule 2. Say so in the pitch as a principle, not a gap.
7. Real SMS to Indian numbers needs DLT entity and template registration (vendor docs only). Do not promise a feature-phone SMS path. Show a labelled simulation.
8. Avoid: Hindi voice-first input as a headline (device and server dependent), real SMS, indoor positioning (BLE).
9. Confidence: medium on the landscape (searches were not exhaustive), medium-high on the technical facts (MDN and browser-compat data opened), low on hour estimates (my judgement).

---

## 1. Facts: what exists

Each bullet carries its source. "Opened" means I read the page or file, not only a search snippet.

### 1.1 Indian government systems

- **ABDM Scan and Share.** Patient scans a hospital QR with an ABDM-enabled app and shares name, age, gender and ABHA number. The hospital's HMIS issues a token that goes to the phone and shows on overhead screens. The patient then goes to the counter to get the OPD card. Source: NHA Scan and Share Playbook, file `ABDM_Scan_and_Share_Onboarding_Manual_18_01_2023` (opened, text extracted). https://abdm.gov.in/strapicms/uploads/ABDM_Scan_and_Share_Onboarding_Manual_18_01_2023_1_0600fe7747.pdf
  - Its worked example gives "average validity of the token is 30 mins and the wait time is 4-5 mins" at the counter, then the patient "is asked basic questions about health issues, followed up, and directed to the gynaecology department". The routing step is a person, not software. Same file.
  - The playbook asks hospitals for display screens, QR standees and "facilitation centers" that create ABHA for people without smartphones. Same file.
  - Pilot began at Lady Hardinge Medical College, New Delhi, October 2022. Source: MyGov blog, Jan 2023 (opened). https://blog.mygov.in/?p=134813
  - Scale: 28,818 facilities and over 22 crore tokens, per a piece by a former NHA CEO. Self-reported and promotional, undated in my fetch; it names smartphone and ABHA as prerequisites and does not discuss people without them. (opened) https://www.digitalhealthnews.com/scan-share-how-a-simple-qr-code-eliminated-hospital-queues-for-millions
- **e-OPD at JPN Apex Trauma Centre, AIIMS Delhi (NIC and Digital Empowerment Foundation).** Booking by phone, token by SMS that also carries appointment time and approximate wait, display boards outside each doctor's room, SMS on doctor unavailability. Claims waits under 2 hours for most patients, with no baseline or method. (opened) https://digitalknowledgecentre.in/?p=4259
- **Hospital token displays.** Gurugram Civil Hospital tender (24 May 2026): live token displays outside 20 OPDs, keypad callers, signage players, central software. Wayfinding, SMS and language are not mentioned. (opened) https://medicaldialogues.in/news/health/hospital-diagnostics/gurugram-civil-hospital-plans-centralised-token-system-to-reduce-opd-wait-time-171170
- **eHealth Kerala.** Advance OP tokens by portal or app, token by SMS. A failure case: on 22 Aug 2025 at Government Medical College Kottayam, online tokens for Radiation Oncology were not accepted because the booking form lacked a field the department needed. (opened) https://www.onmanorama.com/news/kerala/2025/08/22/kottayam-mch-online-ticket-issue.html
- **GMCH-32 Chandigarh token rollout, ORS (ors.gov.in), TOKENN and IndiaMART token vendors:** seen in search snippets only. Not opened. Treat as unverified detail. ORS is described in snippets as Aadhaar-based appointment booking on eHospital with SMS confirmation.

### 1.2 Indoor wayfinding products

- **Pointr.** Its indoor-navigation page lists an "Accessibility mode to avoid stairs or enable turn-by-turn voice guidance". Live directions rely on BLE positioning, with a fallback to step-by-step directions. No numeric accuracy on that page. (opened) https://pointr.tech/solutions/indoor-navigation
  Search snippets (not opened) say deployments reuse existing Wi-Fi/BLE access points and Siemens Healthineers resells it (March 2024).
- **Gozio Health.** Sensor-fusion turn-by-turn wayfinding "from home, to parking, to point of care", delivered as a branded app, inside MyChart, or as an SDK. The page says nothing about accessibility routing, languages or queue integration. (opened) https://goziohealth.com/platform/healthcare-wayfinding
- No product in either page mentions Hindi or Indian public hospitals. That is absence on two vendor pages, not proof.

### 1.3 Hackathon projects

Search was via the open web; Devpost, Devfolio and GitHub results were thin, so this is a sample, not a census.

| Project | Where | What it does | Source |
| --- | --- | --- | --- |
| reassurED | McHacks 12 (Devpost) | Symptom input, LLM triage level (DeepSeek), nearest-hospital ranking by scraped Quebec ED waits, personal care timeline. Floor-map navigation is listed under "What's next". | https://devpost.com/software/reassured (opened) |
| Care Path | Octopus Hackathon (Devpost) | Fake-drug check (Gemini), hospital map (OpenStreetMap), remote queue join with WebSockets and DB locking. | https://devpost.com/software/care-path (opened) |
| QueueLens | GLYTCH, ETHIndia track (Devfolio) | Live queue, token status, doctor availability, estimated wait, React + Firebase. Team says Supabase sync problems pushed them to Firebase. | https://devfolio.co/projects/queuelens-cde9 (opened) |
| neuroQ | AI Tinkerers hackathon | WhatsApp queue card with ETA, indoor navigation on a 2D floor plan, ML wait predictor, receptionist and admin views. | Search snippet only; page returned 403. Not opened. Unverified. |
| Medigo / TimAlpha | AI Tinkerers hackathon | Voice input, NFC checkpoints, live queue status. | Search snippet only. Not opened. Unverified. |
| SIH 2024 problem 1714 "Queuing models in OPDs/availability of beds/admission" | Smart India Hackathon | A queue problem statement that a K J Somaiya team won. | Search snippet only. Not opened. Unverified. |

I found no project that combined step-free routing, Hindi, assisted mode and an emergency-first rule. With this sample size I would not put that in a pitch as a fact.

### 1.4 Evidence on wait-time information

- RCT, King Abdulaziz Medical City, Riyadh, 100 ED patients: satisfaction with waiting did not differ with or without estimates (5.92 vs 5.45 out of 10, p=0.476). 70% preferred having an estimate. (opened) https://smj.org.sa/content/41/8/883.full.pdf
- A second RCT (Almulhim et al., J Family Community Med 2025, n=190) tested displaying an estimate in an ED. I saw only the design, not the satisfaction result. Not opened; result unverified. https://doaj.org/article/d2a9ec5a36e342f29c0113a14d8138c1
- A 2004 systematic review (Taylor and Benger) is quoted in snippets as finding information provision and perceived wait among the top drivers of ED satisfaction. Not opened (publisher 403). https://emj.bmj.com/content/21/5/528
- I found no study on presenting wait times as ranges. That is a gap, not a negative result.

### 1.5 Technical facts that shape the prompt's build

From MDN's browser-compat data package (opened; fetched as JSON from unpkg, https://unpkg.com/@mdn/browser-compat-data/data.json):

| API the prompt uses | Chrome Android | Firefox Android | Safari iOS |
| --- | --- | --- | --- |
| `navigator.vibrate` | 32 | 79 | not supported |
| `BarcodeDetector` | 83 | not supported | 17 |
| `SpeechSynthesis` | 33 | 62 | 7 |
| `SpeechRecognition` (unprefixed) | 139 | not supported | 14.5 |
| `Notification` | 42 | 22 | 16.4 |

- MDN marks Vibration API and Barcode Detection as "Limited availability" and SpeechRecognition as server-based on Chrome ("it won't work offline"). https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API , https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API , https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- `getVoices()` returns "all the available voices on the current device", so whether Hindi speech exists depends on the phone. https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- Real SMS to Indian numbers: vendor help pages describe TRAI DLT registration (entity ID, header, per-message templates) as a condition for delivery. Secondary sources only; I did not find the TRAI text. Not verified against a primary source. e.g. https://www.infobip.com/docs/essentials/asia-registration/dlt-registration (not opened)

---

## 2. Table: what exists, what it misses, what OPD Saathi can claim

| Existing | Covers | Misses (from the sources above) | OPD Saathi can honestly claim |
| --- | --- | --- | --- |
| ABDM Scan and Share | QR to token to OPD card at the registration counter | Routing to the room is a person's job. Needs smartphone and ABHA, or help to create one. No wait estimate for the doctor's queue in the playbook. | "Starts where Scan and Share ends: slip to room." Do not claim ABDM integration; made-up data only (rule 3). |
| e-OPD, AIIMS Delhi | SMS token with approximate wait, boards outside rooms | Booking by phone first; no stated wayfinding or Hindi/English detail on the page. Self-reported results. | Queue and board parity, plus walk-in registration at a counter. |
| Hospital token displays (Gurugram tender, GMCH-32) | Screens and callers | Tender text names no wayfinding, SMS or language. | Board with spoken bilingual call-outs (prompt feature). |
| eHealth Kerala | Advance token, SMS | Brittle on edge cases (Kottayam). | Counter flow that never blocks on a missing field; emergency path that needs no token. |
| Pointr / Gozio | Positioning, turn-by-turn, accessibility mode (Pointr) | Paid, hardware or SDK integration, no India or Hindi on the pages. | No-hardware floor-plan graph, written steps with landmarks, Hindi and English, step-free routing, works on a basic phone. Not live positioning. |
| Hackathon queue apps (QueueLens, Care Path) | Live tokens, remote join | No navigation, no assisted mode, no emergency rule visible in the pages. | Whole-visit flow, emergency-first rule, assisted mode. |
| Hackathon triage apps (reassurED) | LLM triage level | The app decides urgency. | Staff decide urgency; the app only routes and raises a flag. |

Claims to avoid: first-of-its-kind, "reduces waits by X%", ABDM-compliant, WCAG-certified, live indoor positioning. Wait numbers come from simulated consultation times.

---

## 3. Inferences: what a team that follows the prompt ships

The prompt is verbatim in `docs/brief/problem-statement.md`. These points follow from it. Confidence: medium-high, because they derive from the prompt text and the table in 1.5, not from other teams' code.

1. **State lives in one browser.** The prompt keeps shared state in localStorage with BroadcastChannel and also puts a QR code on the slip that opens "this patient's queue screen". A judge who scans that QR on another phone gets an empty store. Our ADR 0002 already moves state to a server. Most prompt-only teams will not.
2. **Wait estimate is one number.** The formula is people ahead times a mean of the last 10, plus delay, rounded to 5. It looks exact and hides spread.
3. **Simulated SMS and notifications.** Vibration does nothing on iOS Safari, `BarcodeDetector` is missing on Firefox Android, speech input depends on a server and a recent Chrome. Demos on a judge's iPhone will lose features silently unless there is a fallback.
4. **Avoid stairs depends on one lift.** In the sample hospital the only ground-to-first and first-to-second links that skip stairs are the lift (the ramp is on the ground floor). The prompt has no case for the lift being out of order. Expect "no route found" crashes or a stair route slipping through.
5. **Identical content.** Same hospital, same 12 screens, same README outline, same demo script. Differences will be polish and bugs, not ideas.
6. **Hindi partly done.** Landmarks, directions and board announcements are where translation usually lags.
7. **Staff screens are generic.** Four buttons per queue and a note that real hospitals need a login.

Typical consequence: judges see many correct, similar apps. Distinguishing features need to be visible within the 5-minute demo.

---

## 4. Candidate differentiators

Judge appeal is my judgement on a 0 to 3 scale per criterion (Innovation, Technical Execution, Design and UX, Impact, Presentation). Hours are for one developer, including tests, English and Hindi strings, and wiring. Demo-ability is how clearly it shows in under 30 seconds. All numbers are estimates; confidence is low to medium.

| # | Candidate | Inn | Tech | UX | Imp | Pres | Hours | Demo | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | Honest wait range plus predicted-vs-actual readout | 2 | 3 | 2 | 3 | 2 | 6 | high (speed-up narrows the range) | low |
| B | Lift or ramp outage: staff marks it, routes recompute, no-route fallback | 3 | 3 | 2 | 2 | 3 | 5 | very high | low-medium |
| C | Slip prints the written route (and mini map) in the patient's language | 2 | 1 | 3 | 3 | 2 | 3 | high (print preview) | low |
| D | Urgent flag gets a "staff have seen your request" reply, plus time-to-seen on the dashboard | 1 | 1 | 2 | 3 | 3 | 2.5 | high | low |
| E | Staff burden: keyboard-first counter, stalled-queue and no-show prompts | 1 | 2 | 2 | 3 | 1 | 5 | medium | low |
| F | Offline PWA: cached app, slip, route | 1 | 2 | 2 | 2 | 2 | 4.5 | high (airplane mode) | medium (stale cache after deploy) |
| G | Hindi voice-first department choice | 3 | 2 | 3 | 2 | 3 | 6 | medium | high (device voices, server STT, noisy rooms) |
| H | Feature-phone SMS path | 1 | 1 | 1 | 3 | 2 | 2 (simulated) | medium | high if presented as real |

Notes on each:

- **A. Wait range.** Keep the prompt's "about 25 minutes" and add "usually 15 to 40". Sketch (inference, not tested): for n people ahead with mean m and standard deviation s of the last 10 consultations, range = n·m ± 1.28·s·√n (about an 80% band if consultations are independent), plus the doctor's delay, rounded to 5, minimum width 10. Add a staff-side readout: share of finished patients whose actual wait fell inside the shown range, from the simulation. Show "last updated" next to it. The text must never tell a patient they can leave or wait (rule 2). Pure function under `packages/shared`, tests first. Evidence is mixed on satisfaction (1.4), so pitch it as honesty and trust, not as proven satisfaction gain.
- **B. Outage reroute.** Add an `outOfService` flag on a Place or Path. The route function skips it; if no step-free route remains, return a typed "no route" result and the UI says "Ask at the Help desk. Wheelchair point is on the ground floor", plus the card for staff. It reuses the existing graph and the "Avoid stairs" switch, and it links the staff dashboard to the patient screen in one tap, which is a clear demo. Needs tests for disconnected graphs.
- **C. Printed route.** The prompt's slip has token, department, room, floor, people ahead and QR, but no directions. Print the Dijkstra steps and a small SVG on the slip, using the registration counter's print path. It helps a patient whose phone dies or has no data, and it makes the counter slip useful for people with no phone. No new infrastructure.
- **D. Urgent reply.** Staff mark "seen"; the patient's screen shows a neutral line ("Staff have seen your request. Stay where you are or go to Emergency.") with no triage and no promise on timing. Dashboard shows time from raise to seen. Wording must be reviewed against rule 2.
- **E. Staff burden.** The product judges (Metropolis Healthcare, Aditya Birla Capital) are likely to ask who operates this all day (inference). Shortcuts for call next, no-show and send to end; a prompt when a called token has not arrived after N minutes. Less visible in a 5-minute demo.
- **F. Offline PWA.** The prompt pack offers it as an add-on. Good hospital-reality story (airplane-mode demo) but service-worker caching bugs are a known demo risk, and it competes with the Render deploy for attention.
- **G. Voice.** The prompt already requires mic buttons and Listen. Going further depends on a Hindi voice being installed (`getVoices()` is device-specific) and on server-based recognition (MDN). Keep the baseline, do not headline it.
- **H. SMS path.** A real SMS needs DLT registration (vendor docs). Show the simulated SMS the prompt already asks for, label it "simulated", and say what a feature phone would receive. Selling it as real is a credibility risk with the engineering judges.

Judge fit (judge profiles are in `docs/hackathon.md`; I did not research the judges further). Product and finance judges (Metropolis, Aditya Birla Capital): A, E, D. Engineering (C-DAC, GCET): B, A, and the pure-function tests. Data science and AI (Sharda, Thapar): A with its calibration readout. This mapping is inference from job titles only.

---

## 5. Recommendations for OPD Saathi

Ranked. Hour figures include tests and bilingual strings.

1. **A. Honest wait range with calibration readout, 6 h.**
   Why first: the brief names "little information about waiting times" as a pain point; it is pure logic that suits tests-first; it gives the data-science judges something to inspect; and it costs the least demo risk.
2. **B. Lift or ramp outage reroute, 5 h.**
   Why second: it targets Kamla (avoids stairs, walks slowly), exposes the weakest point of every prompt-only build (one lift), and ties the staff screen to the patient screen in a single visible action.
3. **C. Slip carries the written route, 3 h.**
   Why third: cheapest, and it covers the no-phone and dead-battery cases without claiming SMS we cannot send.

Stretch if time is left after feature freeze work is safe: **D. Urgent reply and time-to-seen, 2.5 h.** It strengthens the emergency-first story the judges will look for.

Do not build: indoor positioning, real SMS, AI triage, headline voice-first. Treat F (offline) as an option only if the Render deploy and server sync are stable by Saturday night.

Pitch lines that stay honest:
- "Scan and Share gets you a token. OPD Saathi gets you from the slip to the room."
- "We show a range because a single number pretends to know more than it does."
- "Staff decide who is urgent. The app only gets you to Casualty and raises a flag."

Where this meets existing plan: server-authoritative state is already decided (ADR 0002, status proposed). I did not see `docs/plan/` in this worktree, so I could not check these three against the lane plan.

---

## 6. Confidence and what I could not verify

- **High:** the Scan and Share flow and its worked example (read the playbook text); the browser-support table (read the compat data); the Riyadh RCT figures.
- **Medium:** the landscape. Searches were broad but not exhaustive; Devpost, Devfolio and GitHub coverage was thin.
- **Low:** hour estimates, judge-appeal scores, the range formula (an untested sketch), and which differentiators other teams will actually pick.
- **Not opened or blocked:** Tribune (GMCH-32), ORS and Vikaspedia pages, neuroQ and Medigo pages, SIH problem 1714, PubMed and BMJ pages, the Almulhim result, MHA ERSS page (JavaScript shell), the Harmonised Guidelines 2021 text, Siemens/Pointr hardware claims, TRAI DLT primary text, the PIB Scan and Share figures.
- **112 and 108:** I could not confirm from a primary page whether 108 is still a separate ambulance number in every state. Search snippets conflict. The prompt requires showing both, so keep both and label them as national numbers to confirm locally.
- **Elderly phone ownership:** I found only one village study and a 2025 survey for ages 15 to 29. No usable national figure for people over 60. Do not quote a percentage for Kamla's group.

## 7. Open questions for the team

1. Does `docs/plan/lanes.md` already cover any of A to D? If so, strike them here to avoid double work.
2. Who owns the wait-range function and its tests (queue-engine lane)? The pure function and the dashboard readout can be split.
3. Is the graph in `hospital.js` allowed to contain a second step-free link between floors? Without one, B's fallback fires on every outage; that may be the point of the demo, or it may look broken.
4. Do we want a third language? The prompt suggests Tamil. Nothing in this research supports it over the three items above.
5. Can Ashutosh check with one real OPD patient or staff member (made-up data stays made-up; this is only a flow check) whether "usually 15 to 40" reads as honest or as noise?
6. Who reviews the Hindi wording of the urgent reply and the range line, so neither reads as advice to wait?
