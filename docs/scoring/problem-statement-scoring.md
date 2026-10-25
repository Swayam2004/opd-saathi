# HackCache '26 problem-statement scoring

A first-pass filter, not a verdict. Every score comes from the brief text alone, before anyone has built anything. Its job is to pick the 2 or 3 statements worth a hands-on look. We build one.

Team: Swayam (Python, FastAPI, React, agents), Ashutosh (research, video, voiceover), Soumyajit (slides, AI-assisted drafting). Tools are Claude Pro x2 plus free Vercel and Render accounts. About 32 hours were left when I scored. The deadline is 25 Oct, 9:30 pm.

## Method

There are seven statements: the six fixed ones plus Open Innovation. I scored them in one pass against one rubric, then computed the totals with a script. All 7 are present, none duplicated.

| Dimension | Scale | Weight | How it is read here |
| --- | --- | --- | --- |
| Feasibility | 1-5 | 1.3 | This team, about 32h, building with Claude, including the time to check content |
| Competition favorability | 1-5 | 1.0 | Inverse of how many teams ship the same thing. Every team gets the same Build 1 prompt, so I score against that shared baseline |
| Research-burden favorability | 1-5 | 1.0 | 5 means little specialist knowledge needed. Soumyajit's menstrual-health knowledge is not counted |
| Novelty | L/M/H = 1/3/5 | 1.0 (raised from 0.5) | What we can add beyond the prompt's output. Judges score Innovation as 1 of 5 equal criteria |
| Panel fit | L/M/H = 1/3/5 | 1.0 | Replaces business-priority alignment. Fit with the six judges and the brief's stated focus |
| Demo-ability | 1-5 | 1.2 | A live URL plus a 5-minute video, judged remotely |

Three changes from the original rubric:

- **Selection chance is dropped.** Nothing is selected here. Every submission gets judged.
- **Novelty goes from 0.5 to 1.0.** The max total is 32.5. A second run at 0.5 (max 30.0) shows how much the ranking depends on that choice.
- **Render fit is a separate column** (Y, Maybe or N) that never touches a total. It only breaks ties. Render Workflows are beta or limited early access, have a Python SDK only, and can't serve HTTP, so a web service has to trigger them.

The judges: product at Metropolis Healthcare, product at Aditya Birla Capital, engineering at C-DAC, CS and deep learning at Thapar, the computer engineering HOD at GCET Jammu, and data science at Sharda.

## Shortlist

| # | Statement | Total (max 32.5) | Why it is here |
| --- | --- | --- | --- |
| 1 | 2. OPD Saathi (hospital queue and navigation) | 23.7 | The best balance. A three-tab live demo (patient, staff, TV board) and a Dijkstra route on a floor plan. Strong fit with the healthcare and product judges. First at either novelty weight |
| 2 | 6. Jawabdehi (accountability) | 23.4 | The most novel idea in the set, a hash-chained record with a live tamper test, and few teams will finish it. It is also the hardest build, and it falls to 6th when novelty counts for 0.5 |
| 3 | 7. Open Innovation † | 23.0 | A placeholder score. It needs an idea and 3 interviews we don't have, so it can't be deep-dived yet |

† Until an idea exists, the practical third pick is 4. Baaki (Invoice Chase) at 22.9. It ties with Saral Banking on total and wins the tie on Render fit.

## All 7, ranked

Scores run F, C, R, N, P, D in the order of the rubric above. Rows marked ★ are the top 3.

| Rank | Statement | F | C | R | N | P | D | Total | At N=0.5 | Render fit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 ★ | 2. OPD Saathi | 3 | 3 | 4 | M | H | 4 | 23.7 | 22.2 | Maybe |
| 2 ★ | 6. Jawabdehi | 2 | 4 | 2 | H | H | 4 | 23.4 | 20.9 | Y |
| 3 ★ | 7. Open Innovation † | 4 | 4 | 3 | M | M | 4 | 23.0 | 21.5 | N |
| 4 | 3. Saral Banking | 3 | 2 | 3 | M | H | 5 | 22.9 | 21.4 | N |
| 5 | 4. Baaki (Invoice Chase) | 3 | 3 | 2 | M | H | 5 | 22.9 | 21.4 | Y |
| 6 | 1. Licence Saathi (mParivahan) | 5 | 2 | 4 | L | M | 5 | 22.5 | 22.0 | N |
| 7 | 5. Saheli (menstrual health) | 3 | 2 | 2 | M | M | 4 | 18.7 | 17.2 | N |

Ranks 1 to 6 sit within 1.2 points, which is inside the noise of a judgment made from text. Only Saheli is clearly behind. Read the shortlist as a group, not a strict order.

At novelty 0.5, OPD Saathi stays first. The order then runs OPD Saathi, Licence Saathi, Open Innovation, Saral Banking and Baaki (tied), Jawabdehi, Saheli. Jawabdehi's second place depends on the novelty weight and on us finishing it.

## Notes per statement

### Reimagining Government

**1. Licence Saathi.** F5 C2 R4 N-L P-M D5.
- It is frontend only with simulated data. The real work is 40 bilingual questions and about 18 SVG signs.
- It is the easiest and most public brief, so expect many near-identical entries.
- Rules are well known, though fees and rules still need a check.
- The prompt already specifies almost everything, so there is little room to add.
- Render: no backend need.

**2. OPD Saathi ★.** F3 C3 R4 N-M P-H D4.
- It has many parts (patient, staff, board, floor-plan routing, QR, speech, tab sync), but each one is standard.
- Few teams will finish the staff and board sides.
- The emergency-first design and the "avoid stairs" route are what set it apart.
- Three tabs side by side make a strong video. Syncing across devices needs a server.
- Render: a live queue server fits. A Workflows task such as no-show sweeps or wait-time recompute is plausible but not obvious.

### Banking and finance

**3. Saral Banking.** F3 C2 R3 N-M P-H D5.
- It is large but all frontend and deterministic: 3 customers with 60 transactions each, 3 modes, statements as CSV and print.
- Banking attracts many teams.
- The same standard under three bank skins is a good hook, and the bank switcher shows it in seconds.
- Render: N.

**4. Baaki (Invoice Chase).** F3 C3 R2 N-M P-H D5.
- The precision work is heavy (GST per line, GSTIN check digit, payment matching, a 13-week forecast), but every piece is a pure function we can test.
- The accuracy burden thins the field.
- Nobody on the team knows GST, MSMED interest or the rules for what a demand letter may say, so research burden is the weak spot.
- Chase scoring plus the forecast beats a plain invoice tool. A demo-date control makes the video easy.
- Render: a daily 10:00 IST reminder job and a reconciliation sweep are natural scheduled tasks.

### Social impact

**5. Saheli.** F3 C2 R2 N-M P-M D4.
- The code is fine (local-first, PIN encryption, a prediction engine). The cost is content: every health fact needs a source, plus 30 or more bilingual answers.
- Period trackers are a common pick.
- I scored research burden as if nobody on the team knew the subject. The team does have a domain person, and I did not count that.
- On-device privacy, discreet mode and a doctor-visit printout are real hooks. An empty Network tab makes a good demo moment.
- Only one healthcare judge, and health liability makes the others cautious.
- Render: N by design, since nothing leaves the phone.

**6. Jawabdehi ★.** F2 C4 R2 N-H P-H D4.
- It is the largest build: hash chain, role-based views, escalation engine, AI draft with transcription, redaction, 15 sample complaints and the legal routes.
- Few teams will finish it.
- Legal routes (RTI, BNSS sections) need checking against sources.
- The tamper test is the strongest differentiator in the set. The academics and the C-DAC engineer should value the integrity design.
- Without an AI key the AI step shows a labelled demo result, so the demo still runs.
- Render: a strong fit. An hourly escalation job and AI evidence analysis as a long task both belong in Workflows.

### Open innovation

**7. Open Innovation †.** F4 C4 R3 N-M P-M D4.
- Every score is a placeholder.
- We set the scope, so feasibility is high, and teams diverge, so competition is lower.
- The cost is finding a real problem and 3 interviews inside 32 hours. A copy of an existing app scores badly on originality.
- Render: N until an idea exists.

## Open points

1. Confirm Render Workflows access on the free tier before relying on it.
2. The FAQ doesn't say whether a team can submit more than once. Ask the organizers if it matters.
3. The HackCache page contradicts itself on registration close and event dates. The dashboard shows a 25 Oct, 9:30 pm deadline.
4. For the deep-dive, answer three things per top statement: the smallest end-to-end demo, what we add beyond the prompt, and where the 32 hours go.
