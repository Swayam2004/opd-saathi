# How Indian government hospital OPDs run, and what evidence we can cite

Ticket #4. Researched and written 24 Oct 2026. Every source below was opened on 24 Oct 2026 unless the "Not verified" section says otherwise. Source IDs like [S3] point to the Sources table at the end, which has the URL and what was actually read.

## Decision-ready summary

1. **Waiting is real but the size varies by site.** Observed means: 59.0 min (Pune, n=80), 98.6 min (Kolkata, n=432), about 12 min outside the room (Valsad, n=135). Cite ranges and name the hospital. Never say "India averages X".
2. **Consultation is short and spread wide.** Two observed studies give 6.9 min (SD 7.7) and 6.5 min (SD 13.7). A mean of the last 10 is noisy. Keep "about" and 5-minute rounding. Use 6 to 7 min as the sample average in `departments.js`.
3. **There are two queues, not one.** Registration counter, then the doctor's room. Pune: 23.7 min at registration and 13.6 min outside the OPD. ABDM Scan and Share fixes the first queue. Our slip-to-room, live-position, board and wayfinding sit in the second. This is our gap, and it sits next to government systems.
4. **Wayfinding is the best-evidenced pain point for us.** AIIMS Bhubaneswar, after installing trilingual signs: 97.78% still reconfirmed their destination with staff or other patients, and only 6.67% reached it with no help (n=507). Bhopal: 69.6% relied on human help (n=336).
5. **Government systems already exist: ORS/eHospital (booking), ABHA Scan and Share (registration token), eHospital Queue Management App (details unread).** Never claim to replace them. Do not ask for ABHA numbers (AGENTS.md rule 3). Show ABHA as a "next step" slide only.
6. **Registration closes before OPD ends** in every hospital I checked (for example register 8:30 to 11:30, OPD 9:00 to 13:00). The brief's flat 9:00 to 14:00 hides this. Model "registration closes" separately.
7. **Hindi is not enough for Odisha.** At AIIMS Bhubaneswar, 11% of respondents were native Hindi speakers; 50% Odia. Justify Hindi nationally, show a language architecture that takes a third language.
8. **Emergency wording:** "Go to Emergency now. Tell any staff member. Call 112." Say "108 for an ambulance in many states", because 108 is merged into 112 in some states and not others. Never say "not urgent", "can wait" or "triage".
9. **Confidence:** high on how the systems work (primary government documents). Medium on wait numbers (small single-site studies). Low on Hindi lay terms and on any single hospital's current hours.

---

## 1. The real patient journey

Confidence: high on the systems and process (government documents); medium on hours and fees, which differ by hospital and some pages are undated.

### Facts

**Walk-in registration (the default).** The patient queues at the registration counter and gives name, age, gender and a description of the ailment, or a referral slip. The clerk keys it in and prints an OPD card that names the department. The NHA playbook lists the causes of delay as manual keying by the data-entry operator, noise causing wrong entries and repeat registration, and too few counter staff. It also says that at large government hospitals the wait "may extend from a couple of hours to the whole day", with some people joining at 4 am and some sent home because counters closed [S1].

**What the OPD card is.** Delhi's GB Pant hospital says every outpatient "is registered and issued a Card for recording symptoms, diagnosis and treatment" [S9]. So it is a running clinical record the patient carries, not only a queue ticket. ORS issues an "E-OPD card" and a UHID (Unique Health Identification number) to a new patient verified by Aadhaar [S3].

**Online booking (ORS, NIC eHospital).** The Online Registration System (ors.gov.in) is the common patient portal of the eHospital platform, which the Prime Minister launched on 1 July 2015 [S3]. Per the live FAQ [S2]:
- Steps: verify mobile, pick hospital and department, pick a date, verify with mobile or ABHA, get a confirmation SMS.
- A new patient needs a registered mobile number or ABHA. Basic details are name, age or date of birth, gender, mobile and address. ABHA is optional "for faster registration". An OTP confirms it.
- An OPD appointment slip is generated that can be downloaded or printed and shown at the hospital.
- Walk-in versus web quotas are set by each hospital.
- Patients without Aadhaar get an appointment ID online but collect the UHID and OPD card at the counter "by paying registration fee" [S3].
- AIIMS Delhi runs ORS alongside IVRS, a call centre, about two hundred self-service kiosks and an Android app, and says its call centre exists because "most of the patients who visit AIIMS are illiterate and are not able to utilize the web portal/IVRS" [S6]. That is AIIMS's own statement, undated, with no number.

**ABDM Scan and Share.** From the NHA playbook [S1] and a hospital's own handout [S10]:
1. The patient scans a QR code on a standee in the registration area with an ABDM-enabled app (ABHA, EkaCare, Arogya Setu and others).
2. The app shares name, age, gender and ABHA number with the hospital system (HMIS).
3. The HMIS makes a token number and sends it to the patient's phone.
4. The patient waits until the token shows on overhead screens, then goes to the counter, where the operator pulls up the details and prints the OPD slip. Patients visit the counter only for payment and the card.
5. No smartphone: the patient queues, and the counter scans the QR on a physical ABHA card ("Scan and Pull") [S1].
- Hospitals need an ABDM-enabled HMIS, dedicated counters, display screens, QR standees, a facilitation desk and reliable fibre and power [S1].
- Scale: 23.21 crore ABHA-linked tokens as on 18 June 2026, per PIB [S4].

**What the token is in practice.** In Scan and Share it is a registration-counter token, issued before the OPD card [S1]. AIIMS Delhi's published OPD rule is "first come first serve" with "out of turn consultation... in case of emergency or to senior citizens" [S7]. That page is undated and its banner mentions January 2015, so treat it as old. Our `MED-042` format has no source; it is our design.

**OPD hours.** They differ by hospital, and registration always closes earlier than consultation:

| Hospital | Registration | Consultation |
|---|---|---|
| Guru Gobind Singh Govt Hospital, Delhi (district) [S8] | Mon to Fri 7:30 to 12:00 (charter) or 8:00 to 12:00 (OPD page of the same site) | General 8:00 to 15:00, specialty 13:00 to 15:00, Sat general to 13:00 |
| Lady Hardinge MC, Delhi [S11] | 8:30 to 11:30 (Sat to 11:00) | All specialties 9:00 to 13:00; special clinics 14:00 to 16:00 |
| AIIMS Delhi, general OPD [S7] | 8:30 to 10:30 | 8:30 to 13:00; specialty clinics register 13:00 to 14:00, consult to 18:00 |

**Fees.** Not uniform. GGSGH and GB Pant say OPD services are free for patients [S8][S9]. AIIMS Delhi's page lists a Rs 10 OPD card [S7], but the page is undated. ORS charges a registration fee at the counter for no-Aadhaar patients [S3].

**Departments and names.** Hindi government sites transliterate the sign words: ओपीडी, ईएनटी [S11][S12]. Terms found on official Hindi pages:

| Our English | Hindi on an official page | Where |
|---|---|---|
| General Medicine | काय-चिकित्सा विभाग | Lady Hardinge [S11] |
| Children | बाल चिकित्सा | Safdarjung [S12] |
| Women and pregnancy | प्रसूति एवं स्त्री रोग | Safdarjung, Lady Hardinge [S11][S12] |
| Bones and joints | आर्थोपेडिक विभाग; also अस्थि रोग (Safdarjung institute name) | [S11][S12] |
| Ear, nose and throat | ईएनटी (कान, नाक, और गला) | Safdarjung [S12] |
| Eyes | नेत्र विज्ञान | Safdarjung, Lady Hardinge [S11][S12] |
| Skin | त्वचारोग | Safdarjung [S12] |
| Emergency (Casualty) | आपातकालीन चिकित्सा; आपातकालीन सेवाएं | [S12][S8] |
| Registration | पंजीकरण | [S11] |
| Enquiry counter | पूछताछ काउंटर | GGSGH [S8] |
| Pharmacy | फार्मेसी | GGSGH [S8] |

"सामान्य चिकित्सा" for General Medicine, "पर्ची" for slip and "चर्म रोग" for skin are common lay usage but I did not find them on a page I opened. Have a Hindi speaker confirm before they ship.

**Real sign word for the Help desk.** Hospitals say "Enquiry counter" or "Reception" (GGSGH [S8], GB Pant: "Enquiry counters exist in the OPD Hall" [S9]). Our `CONTEXT.md` uses "Help desk" and avoids "Information counter". Show "Help desk (Enquiry counter)" in English and "सहायता (पूछताछ काउंटर)" in Hindi so the words match the signs people will see.

**Casualty.** GGSGH runs round-the-clock Casualty staffed by casualty medical officers and resident doctors, with specialists called as needed. If a service is missing, serious patients get first aid, are stabilised, then are referred or transferred to a nearby government hospital. Medicolegal cases are handled round the clock [S8]. eHospital has separate registration for OPD and Casualty [S5]. The Supreme Court (Parmanand Katara v. Union of India, 1989) held that doctors in government and private hospitals must give immediate medical aid to protect life, and police formalities must not delay it [S13].

**Who the staff are.** Registration counter clerk or data-entry operator [S1]. Nurses in uniform, doctors in white aprons, ID cards on all staff, enquiry-counter staff, security guards [S8][S9]. Casualty medical officers, resident doctors, senior residents and specialists [S8]. GB Pant puts up "boards indicating unit on duty on various days" [S9], so the doctor in a room changes by day.

### Inferences

- The first-time patient gets one card and one department. The returning patient (follow-up) takes a different path with a UHID and often a booked slot [S3][S6]. The brief's flow only covers a first visit.
- Our slip has four things the sources do not describe: people ahead, estimated wait, a QR for the queue screen, and the room and floor. Say so honestly: the OPD Saathi slip is a visit slip that sits beside the OPD card, not a replacement.
- Scan and Share makes the registration token, but nothing I read gives the patient a position in the doctor-room queue or a route to the room. The playbook's display screens show counter and registration-token numbers only [S1]. I did not read the eHospital Queue Management App, so "nobody does this" is not a claim we can make.

---

## 2. Wait and consultation numbers

Confidence: medium. All are small single-site studies with different definitions of "wait".

Safe means: fine on a slide if the attribution and caveat travel with it. Unsafe means: use in speech or notes only, or not at all.

| # | Number | Source and setting | Slide? |
|---|---|---|---|
| 1 | Mean total wait 59.0 min (SD 39.5, range 9 to 191); registration desk 23.7 min; outside OPD 13.6 min; consultation 6.9 min (SD 7.7) | Acharya et al., Int J Community Med Public Health 2023;10(8):2813-20. One government tertiary hospital in Pune, 80 first-time adult patients shadowed with a stopwatch, Feb to Apr 2021 [S14] | **Safe.** Say "one Pune government hospital, 80 patients". The "total" includes waits for tests. |
| 2 | Satisfied with the wait: 18 of 22 at 30 min or less; 4 of 13 at 90 min or more. Correlation between wait and satisfaction -0.445 (p 0.01) | Same paper, Tables 2 and Figure 8 [S14] | **Safe** as "patients who waited under 30 min were far more often satisfied". Small n. |
| 3 | Mean wait 98.6 min (SD 45.4), consultation 6.5 min (SD 13.7), n=432. General medicine 122 min, paediatrics 43 min | Datta, Indian J Community Med 2024;49 (Suppl 1):S61, conference abstract. Tertiary medical college hospital in Kolkata, May to June 2023. Wait defined as registration to chamber entry [S15] | **Safe with caveat.** Say "a Kolkata tertiary hospital study". It is an abstract. 80.1% of the sample lived in rural areas. |
| 4 | Mean wait outside the OPD 12.16 min (SD 2.35), n=135; 48.89% found the OPD through hospital staff | Patel and Patel, Int J Community Med Public Health 2017;4(3):857-63. GMERS Hospital, Valsad, Gujarat [S16] | **Safe**, and use it for honesty: waits are not 2 hours everywhere. |
| 5 | After trilingual signs: 97.78% reconfirmed the destination with staff or other patients; 84.44% kept asking while searching; 31.11% were lost and had to call others; 6.67% reached the place with no help. n=507 (48% patients, 43% attendants, 9% visitors) | Sahoo et al., Cureus 2024;16(7):e65435. 960-bed tertiary teaching hospital in eastern India (authors at AIIMS Bhubaneswar) [S17] | **Safe.** Caveat: one hospital, after-installation survey only, no baseline. Best number for our story. |
| 6 | 69.6% of first-time outpatients relied on human help to navigate (n=336) | Ali et al., Int J Community Med Public Health 2026;13(7). Gandhi Medical College, Bhopal [S18] | **Safe** as "about 7 in 10". I read the landing page and abstract only. |
| 7 | 23.21 crore ABHA-linked tokens issued as on 18 June 2026 | PIB backgrounder "ABDM: India's Digital Health Backbone", 6 July 2026 [S4] | **Safe** as scale of the existing system, phrased "tokens", not "patients". |
| 8 | "Reduced waiting times from approximately one hour to just 2 to 5 minutes" | Same PIB backgrounder, citing an IIHMR study that I could not find or open [S4] | **Unsafe.** A scheme's own promotion; the study is unread. Do not repeat it. |
| 9 | 62% of tertiary hospital patients waited over 30 min to see a doctor; 436 of 750 sampled patients were seen in 5 min or less | CAG Report No. 2 of 2025 on J&K health, as reported by Daily Excelsior, 1 Apr 2026 [S19] | **Unsafe until read in the CAG PDF.** I only saw a newspaper summary. Also J&K, not national. |
| 10 | India primary-care consultation mean 2.0 min (2015) and 2.3 min (2013, n=412) | Irving et al., BMJ Open 2017;7:e017902, systematic review of 67 countries. Both India studies rated "poor" quality [S20] | **Unsafe.** Primary care, old, poor-quality inputs. Background only. |

Also from [S14], unsafe on a slide: of the 42 who said finding the way was easy, 73.75% credited staff and 15% sign boards. The denominators are unclear and the options overlap.

### Inferences

- Consultation spread: SD is about equal to the mean in both studies (7.7 vs 6.9 min; 13.7 vs 6.5 min). If ten consultations are independent with SD 7.7, the mean of ten has a standard error of about 2.4 min (my arithmetic, not a source). A "6 ahead" estimate can easily be off by 15 minutes. Keep "about", round to 5 minutes, never promise.
- Registration plus outside-room waits were both substantial in the one study that split them (23.7 and 13.6 min) [S14]. The data supports a pitch of "waiting is two queues plus a search for the room".
- Do not claim OPD Saathi reduces waiting time. A prototype on made-up data cannot show that. Claim it makes the wait visible, and removes the search for the room.

---

## 3. Documented pain points

Confidence: medium to high for wayfinding (three independent hospital studies); medium for crowding; high for the accessibility standard text.

**Signage and wayfinding.** [S17] above. The authors conclude "human assistance is also necessary for wayfinding" in large hospitals and recommend digital navigation and Braille. Bhopal [S18] found language barriers among the most common challenges (no percentage on the page I read). Valsad's conclusion: "Many patients face the difficulties in finding the various departments" [S16]. Pune recommends "a strategically well-placed information desk along with designated helpers" and "pictorial sign boards... for those unable to read the local language" [S14].

**Language.** At AIIMS Bhubaneswar the respondents' native languages were Odia 50%, Bengali 36%, Hindi 11%, other 3% [S17]. The Pune team translated its questionnaire into Marathi and Hindi [S14]. The accessibility standards require signage "language of common use" [S21].

**Low literacy and digital access.** AIIMS's own note on illiterate patients and the call centre [S6]. Scan and Share assumes a smartphone and ABHA; the playbook adds a counter-scan path because of that [S1].

**Elderly and disabled access.** The Gazette notification SO 598(E) of 9 Aug 2023 adds the Health Ministry's "Accessibility Standards and Guidelines for Health Care" to the Rights of Persons with Disabilities Rules, 2017 (rule 15) [S21]. Points that touch our UI:
- Reception counters two-tier, with a lower part 750 to 800 mm high with knee space; a hearing loop at reception; light on the receptionist's face.
- Written information in large print and Braille; flashing alarms that are also audible; simple-language explanations for people with cognitive disabilities.
- Information boards and display screens "near the place where the information is sought"; information by audible means for people with low vision.
- Signage "clear and bright", language of common use, orientation signs large and easy to read.
Pune patients asked for better wheelchair access [S14]. This supports our 18px text, 56px buttons, read-aloud and Avoid stairs.

**Crowding.** Pune's top suggestion was more distance at registration and in waiting areas; patients said crowding made them feel unsafe and deterred visits [S14]. GGSGH's charter asks users not to crowd or make noise [S8]. I found no source for a seats-to-people threshold, so the colour bands in the staff dashboard are our own choice and must be labelled "demo setting".

**Touts.** GGSGH's charter tells users to "beware of touts" and to avoid money transactions with unauthorized people [S8]. Worth one line in Help.

---

## 4. Existing government systems and where OPD Saathi sits

| System | What it does | Source |
|---|---|---|
| ORS (ors.gov.in) | Book an OPD appointment before the visit; slip you print; Hindi and English | [S2][S3][S6] |
| eHospital@NIC | The hospital system behind ORS: OPD, Casualty, appointments, IPD, billing, clinic. Its site lists a "Queue Management App" and says eHospital is integrated with ABDM | [S5] |
| ABHA and Scan and Share | National health ID. QR scan at the registration area yields a registration token and a prefilled OPD slip | [S1][S4][S10] |
| Hospital HMIS plus token displays | Overhead screens that call registration tokens | [S1] |

**Placement.** The patient has booked or registered. They hold a slip. They are now somewhere in a building they do not know, waiting for a room. OPD Saathi starts there:
- Input: a token (our `MED-042`) or a made-up slip. A future version could take the registration token and OPD card details from the hospital system through ABDM-style sharing.
- Output: where to go, who is ahead, what the doctor's status is, when it is time.
- Staff: dashboard, board and counter on the same data.

**Say:** "Works beside ORS and Scan and Share. They get you registered; we get you to the room and keep you informed."
**Do not say:** "replaces the OPD card", "integrates with ABDM" (it does not), "reduces waiting by X%".

---

## 5. Safe wording for medical and emergency content

Confidence: high on the legal duty and the 112 facts; low on the wording itself until a clinician reviews it.

### Facts

- 112 is India's single emergency number under the Home Ministry's ERSS. Tripura Police says 108 is integrated with 112 [S22]. Kerala Police says only police is integrated so far and describes fire and ambulance merging as a goal [S23]. So 108 works differently by state.
- Emergency care cannot wait on paperwork (Parmanand Katara) [S13].
- A Delhi district hospital runs Casualty round the clock, staffed by casualty medical officers and resident doctors, with specialists called when needed [S8].
- AIIMS Delhi's published rule lets emergencies and senior citizens go out of turn [S7]. That decision belongs to staff.

### Recommendations for OPD Saathi

Use these strings (Hindi to be checked by a Hindi speaker):
- Emergency button: "Emergency / आपातकालीन".
- Result: "Go to Emergency (Casualty) now, or tell any staff member. Call 112. In many states you can also call 108 for an ambulance."
- Registration entry: "Any of these? Go to Emergency now. You don't need a token." (Brief wording.)
- Footer on the signs list: "This list is not complete. If you are worried, go to Emergency or tell any staff member."
- Urgent flag: "Staff have been told." only after the server confirms. If offline: "We could not reach staff. Go to the nearest staff member or Emergency now." (Fits ADR 0002.)
- Estimated wait: "about 25 minutes. Staff may call you sooner or later."

Never write: "not urgent", "can wait", "mild", "low priority", "triage", "your turn is safe to miss", or any symptom-to-department advice beyond the picture cards in the brief. Never show an estimated wait or token on an Emergency or urgent-flag screen. Never imply senior citizens or anyone else jump the queue automatically; staff decide (the staff dashboard has Send to end, Move department and the urgent flag, nothing automatic).

The emergency signs list comes from the HackCache prompt, not from a clinical source I checked. A clinician on the team, or a source such as MoHFW or WHO danger signs, should review it before it is called "from the Ministry".

---

## 6. One-page evidence pack for the deck

**Slide headline:** "The wait is two queues and a search for the room."

Lines you can put up, each with its source on the slide:
- One Pune government hospital: patients waited 23.7 min at registration and 13.6 min outside the doctor's room, then saw the doctor for 6.9 min (n=80, Acharya 2023). [S14]
- A Kolkata tertiary hospital: mean wait 98.6 min, consultation 6.5 min (n=432, Datta 2024, conference abstract). [S15]
- Patients who waited 30 min or less were mostly satisfied (18 of 22); at 90 min or more, mostly not (9 of 13 unsatisfied). [S14]
- Signs are not enough: after trilingual signs at a large eastern India hospital, 97.78% still asked staff to confirm where to go; 6.67% needed no help (n=507, Sahoo 2024). [S17]
- About 7 in 10 first-time outpatients at a Bhopal hospital relied on human help to find their way (n=336, Ali 2026). [S18]
- The national system for registration is real and large: 23.21 crore ABHA-linked tokens as on 18 June 2026 (PIB). [S4]

Speaker notes only:
- Waits vary: Valsad measured 12 min outside the room [S16]. Say we are not guessing a national average.
- NHA's own playbook says that at large government hospitals, waits can run "from a couple of hours to the whole day" and some people queue from 4 am [S1].
- Accessibility rules exist in law since 2023 [S21]; we built to them.

## 7. Domain facts the app must get right

Ordered by how much a judge or hospital person would notice.

1. **Emergency is never behind a token or registration.** Already a fixed rule; keep the Hindi and English strings in section 5.
2. **Registration closes earlier than OPD ends.** Add `registrationCloses` per department or hospital (sample: 11:30 against OPD to 14:00). After it closes, the app says so plainly and points to the Help desk, not to a dead end. Decision for the team: this changes the brief's "9:00 to 14:00".
3. **Two queues.** Keep the language clear: the slip token is the doctor-room queue. Do not suggest we issue the registration-counter token.
4. **Slip is a visit slip, not the OPD card.** Real hospitals keep a card with symptoms, diagnosis and treatment [S9]. Slip copy: "Keep your OPD card. Bring this slip to the room."
5. **Doctor changes by day.** Show the doctor's name as "today" and treat the room as the stable thing [S9]. Demo data should show a different doctor on another day.
6. **Hospital words stay.** OPD, ENT, X-ray, Casualty stay as sign words with a plain gloss, since Hindi pages also write ओपीडी and ईएनटी [S11][S12]. Match "Enquiry counter" next to "Help desk".
7. **Department names and Hindi** from the table in section 1. Mark unconfirmed ones in the i18n file.
8. **Fees:** show no fee amount. Real fees differ or are zero [S7][S8][S9]. Add "If a counter asks for payment, ask for a printed receipt" only after a hospital person confirms it.
9. **Follow-up patients exist.** One extra first-screen question ("First visit or follow-up?") with the same flow is enough. Optional; do not build it before the core.
10. **Consultation time defaults 6 to 7 min** and wait labelled "about", rounded to 5 [S14][S15].
11. **Language set:** English and Hindi required. Make the third-language add-on Odia if the team is in Odisha, because Odia was the largest native language at AIIMS Bhubaneswar [S17].
12. **Staff priority is manual.** Out-of-turn for emergencies and senior citizens is a staff decision [S7]. Our dashboard already has the controls.
13. **Registration assistance is a staff job.** The Registration counter screen matches the real clerk role [S1]. A facilitation desk for people without phones is an explicit part of Scan and Share [S1], so the counter flow is on-pattern.
14. **No Aadhaar or ABHA input.** Rule 3. Mention only as "next step".

---

## Not verified

- The IIHMR study behind "one hour to 2 to 5 minutes". PIB 2024 releases on Scan and Share returned 403 on fetch; I used only the July 2026 PIB document.
- The eHospital Queue Management App: features, adoption and whether it includes wayfinding. I only saw the download link on ehospital.gov.in.
- The CAG J&K report text (only a newspaper summary). I did not find a primary PDF.
- Whether AIIMS Delhi still charges Rs 10 for the OPD card (the search results hinted it was dropped; I did not open that report). The AIIMS OPD page is undated and appears to be from about 2015.
- Casualty registration and triage steps in practice. No MoHFW document on casualty triage turned up. Section 5 says only what staff do, not how.
- Clinical review of the emergency signs list.
- Per-state status of 108 and 112.
- Odisha-specific hospitals (OPD hours, forms, languages, state HMIS). All hospital examples are Delhi, Pune, Kolkata, Valsad, Bhopal and Bhubaneswar. None is a typical Odisha district hospital.
- Hindi lay terms (सामान्य चिकित्सा, पर्ची, चर्म रोग).
- NQAS or IPHS standards on waiting time or signage. The search returned older IPHS editions only and I did not read them.
- Full text of the Ali 2026 (Bhopal) paper beyond its landing page.

## Open questions for the team

1. Do we change the brief's 9:00 to 14:00 to add a registration cut-off? (Section 7, item 2.)
2. Which third language, if any: Odia, Tamil (the prompt's suggestion) or none? What city will judges and the demo be in?
3. Does anyone on the team have a doctor or nurse contact to read the emergency signs list and the Casualty wording?
4. Is a Hindi speaker available to confirm the department names and the "Enquiry counter" gloss?
5. Do we add the first-visit or follow-up question, or keep the flow as the brief has it?
6. Does the deck carry any number from section 2 beyond the six "safe" lines, given the sample sizes?
7. Do we show an ABHA "Scan and Share" mock on the next-steps slide, and are we comfortable that it is a mock?

---

## Sources

All accessed 24 Oct 2026. "Read" says what I actually opened.

| ID | Source | URL | Read |
|---|---|---|---|
| S1 | NHA/ABDM, Scan and Share Playbook and Onboarding Manual (Jan 2023) | https://abdm.gov.in/strapicms/uploads/ABDM_Scan_and_Share_Onboarding_Manual_18_01_2023_1_0600fe7747.pdf | Full text of 8-page PDF |
| S2 | ORS Patient Portal FAQ (NIC) | https://ors.gov.in/faq.html | Full page |
| S3 | NIC, Common Patient Portal (ors.gov.in) On-boarding Manual for Hospitals, v1.0, July 2015 | https://ors.gov.in/ORS_onboarding_ver_1.0.pdf | Overview and benefits sections |
| S4 | PIB, "Ayushman Bharat Digital Mission: India's Digital Health Backbone", 6 Jul 2026 | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202676912801.pdf | Full text (11 pages) |
| S5 | eHospital@NIC home page | https://ehospital.gov.in/ | Home page text |
| S6 | AIIMS Delhi Computer Facility, "Appointment system at AIIMS" (data to June 2017) | https://www.aiims.edu/images/pdf/notice/Digital%20AIIMS/appointment%20system-white.pdf | Text; charts not read |
| S7 | AIIMS Delhi, Out Patient Department services (undated) | https://www.aiims.edu/index.php/en/component/content/article?id=229 | OPD schedule paragraph |
| S8 | Guru Gobind Singh Govt Hospital, Delhi: citizen charter, OPD schedule, emergency services, enquiry counter | https://ggsgh.delhi.gov.in/hi/node/7440 ; /hi/node/7422 ; /hi/node/7427 ; /hi/node/7434 | Full pages |
| S9 | GB Pant Hospital, Delhi: citizen charter | https://gbpant.delhi.gov.in/hi/node/7170 | Full page |
| S10 | IHBAS Delhi, Scan and Share handout | https://ihbas.delhi.gov.in/sites/default/files/ihbas/our-services-files/ihbas_opd_token_1.pdf | Full text |
| S11 | Lady Hardinge Medical College, OPD and special clinics (Hindi) | https://lhmc-hosp.gov.in/index4.php?lang=2&lid=24&linkid=24&level=0 | Page text |
| S12 | VMMC and Safdarjung Hospital, OPD schedule (Hindi) | https://vmmc-sjh.mohfw.gov.in/hi/opd-schedule | Page text, department names only |
| S13 | Parmanand Katara v. Union of India, 1989 AIR 2039 (summary) | https://lawfoyer.in/pt-parmanand-katara-vs-union-of-india/ | Summary page, not the judgment text |
| S14 | Acharya et al. 2023, DOI 10.18203/2394-6040.ijcmph20232370 | https://www.ijcmph.com/index.php/ijcmph/article/download/11281/6835/51826 | Full paper |
| S15 | Datta 2024, DOI 10.4103/ijcm.ijcm_abstract210 | https://doaj.org/article/eddf9f61ef654d8ea8c61cea48214dd9 (read via the DOAJ API record) | Abstract |
| S16 | Patel and Patel 2017, DOI 10.18203/2394-6040.ijcmph20170772 | https://www.ijcmph.com/index.php/ijcmph/article/download/1136/976/4024 | Abstract and discussion |
| S17 | Sahoo et al. 2024, Cureus 16(7):e65435, DOI 10.7759/cureus.65435 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11345034/ | Full article via summary fetch |
| S18 | Ali et al. 2026, Int J Community Med Public Health 13(7) | https://www.ijcmph.com/index.php/ijcmph/article/view/15904 | Landing page and abstract |
| S19 | Daily Excelsior on CAG Report No. 2 of 2025 (J&K), 1 Apr 2026 | https://www.dailyexcelsior.com/cag-flags-long-waits-short-consultations-in-jk-opds/ | Newspaper article, not the CAG report |
| S20 | Irving et al. 2017, BMJ Open 7:e017902 | https://pmc.ncbi.nlm.nih.gov/articles/5695512 | First 100,000 of 128,000 characters; India, Bangladesh and Pakistan tables |
| S21 | Gazette of India SO 598(E), 9 Aug 2023, notifying MoHFW Accessibility Standards for Health Care under RPwD Rules 2017; listed at DEPwD | https://cdnbbsr.s3waas.gov.in/s3e58aea67b01fa747687f038dfde066f6/uploads/2023/11/202311291347281424.pdf (listing: https://depwd.gov.in/acts) | Reception, waiting, signage and communication sections |
| S22 | Tripura Police, ERSS 112 | https://police.tripura.gov.in/112-police-helpline | Page text |
| S23 | Kerala Police, ERSS | https://keralapolice.gov.in/page/emergency-response-support-system | Page text |
