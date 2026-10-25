# Accessibility, plain-language Hindi and whether to add Odia

Ticket #8, part of #1. Researched 24 Oct 2026 (all access dates below are 24 Oct 2026 unless stated). Glossary data: `docs/research/07-accessibility-and-languages/glossary-hi.json`.

## Decision-ready summary

1. **i18n: hand-rolled typed dictionary, no library.** `en.ts` is `as const`; `hi.ts` is typed `Record<MessageKey, string>`, so a missing or extra key fails `tsc`. Add one vitest test for placeholder parity. About 40 lines, 0 KB, no codegen. (Section 5)
2. **Hindi glossary: 61 terms plus 9 emergency signs in `glossary-hi.json`.** Spoken Hindi, English loanwords in Devanagari. Every string is an AI draft and flagged `needsNativeCheck`; 30+ are `high` priority and must be read by a Hindi speaker before the demo video. (Section 3)
3. **Odia: No for the build.** Android's Google voices list has no Odia, so Listen would be text-only. Cost is an estimated 12 to 16 hours of a 32-hour budget. No judge profile suggests an Odia reader. Revisit only as a static emergency card after the Sunday 12:00 freeze. (Section 6)
4. **Our floor already clears WCAG 2.2 AA on size.** 56px buttons beat the AA minimum (24px) and the AAA one (44px). What bites instead: a sticky Emergency button hiding focused fields (2.4.11), colour-only status (1.4.1), and 320px reflow. (Section 2)
5. **Emergency signs: seven of the brief's eight map to WHO/MoHFW wording; "child very unwell" and "serious injury" need firmer words.** Use the IMNCI danger signs for children. Add fits and "baby moving less". (Section 4)
6. **Show only 112 and 108.** 108 is confirmed free and toll-free by NHM Odisha. 102 is a state-run transport service for mothers and children and sources disagree on it, so skip it. (Section 4)
7. **Demo risk: tapping a `tel:112` link on a phone dials the real number.** Do not tap it while recording. (Section 4)
8. **Voice: build Listen on `speechSynthesis` with a Hindi voice check, and record about 15 Hindi audio clips for the critical phrases.** Device voices vary. (Section 2.3)

Confidence: High on WCAG, GIGW and the clinical sign lists. Medium on helplines (government sites were unreachable from the research environment, see Unverified). Low on Hindi wording and on Odia hour estimates.

## 1. Method and limits

Primary sources first: W3C, GIGW (guidelines.india.gov.in), WHO, MoHFW and NHM documents, Google platform documentation, npm registry. Where a government site refused the connection (112.gov.in, pib.gov.in returned errors) the claim is marked as seen only through a search-result summary. Labels used below: **Fact** (sourced), **Inference** (our reasoning), **Rec** (recommendation for OPD Saathi). Confidence is H, M or L.

## 2. Accessibility

### 2.1 What "accessible" means for Kamla

**Inference (H).** Kamla is 62, reads a little Hindi, has a basic Android phone, walks slowly and avoids stairs. So accessible here means five things at once: large text and targets (low vision, less precise touch), words she can read plus voice for words she cannot, one decision per screen (cognitive load), a step-free route, and no step that needs her to guess what an English term means. The brief says the same: "accessibility is a core requirement, not an add-on" [S1-brief].

### 2.2 WCAG 2.2 AA items that bite

**Facts (H)**, all from WCAG 2.2 [S1]:

| SC | Level | Requirement | Our position |
| --- | --- | --- | --- |
| 1.4.1 Use of Color | A | Colour not the only way to convey information | Overcrowding, doctor status, token state: colour plus word plus icon |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 text; 3:1 for large text (18pt or 14pt bold) | Check every theme, including high contrast and the board |
| 1.4.4 Resize Text | AA | Text to 200% with no loss of content or function | Use rem. Test at browser zoom 200% |
| 1.4.10 Reflow | AA | No two-way scroll at 320 CSS px wide. Maps exempt | We target 360px; also test 320px |
| 1.4.11 Non-text Contrast | AA | 3:1 for UI component boundaries and states | Button borders, focus ring, route line on the floor plan |
| 1.4.12 Text Spacing | AA | Survives line height 1.5, letter 0.12, word 0.16 | Devanagari needs generous line height; test with a spacing bookmarklet |
| 2.4.7 Focus Visible | AA | Visible focus indicator | Default ring is not enough on tinted cards; style it |
| 2.4.11 Focus Not Obscured (Min) | AA | Focused item not entirely hidden by author content | Sticky Emergency bar can cover it (see below) |
| 2.5.7 Dragging Movements | AA | Single-pointer alternative to any drag | Floor plan pan or zoom needs buttons |
| 2.5.8 Target Size (Min) | AA | 24 by 24 CSS px, with spacing exception | 56px rule exceeds it. AAA 2.5.5 asks 44 |
| 3.2.6 Consistent Help | A | Repeated help sits in the same place | Emergency and Help desk in a fixed position |
| 3.3.7 Redundant Entry | A | Do not ask again for info already given | "Back keeps every answer"; slip lookup should not re-ask the name |
| 2.3.3 Animation from Interactions | AAA | Motion can be disabled | Not required, but honour `prefers-reduced-motion` anyway |
| 3.1.5 Reading Level | AAA | Text beyond lower secondary needs a simpler version | The "Class 8 words" rule in the prompt is this, informally |
| 3.3.8 Accessible Authentication | AA | No cognitive test to log in | N/A: no login. Staff PIN, if added, must allow paste |

**Inference (M), two traps specific to this app:**

- A sticky bottom Emergency bar plus the soft keyboard can cover the focused input. That fails 2.4.11 and frustrates every user. **Rec:** `scroll-padding-bottom` equal to the bar height, and test the name field with the keyboard open at the largest text size.
- The board alternates English and Hindi automatically. Auto-changing content may need a pause control (SC 2.2.2, A) if it runs over 5 seconds with other content. **Rec (M):** show both languages in each card on the board, stacked, and drop the carousel. A glance at a TV should never need a wait for the right language. This departs from the brief's wording "alternating"; the team should decide.

**Also Rec (H):** set `lang="hi"` on Hindi text and `lang="en"` on inline English (SC 3.1.1 and 3.1.2, AA; GIGW lists the same checkpoint [S4]). Screen readers and TTS pick voices from it.

### 2.3 Voice

**Facts.**
- `speechSynthesis` support: about 95.9% of users globally; Chrome for Android supported [S22] (H).
- `getVoices()` returns only voices on the current device; MDN's own example also listens to `voiceschanged`, so the list can fill late [S21] (H).
- Google's Text-to-Speech languages for Android (the TalkBack list) include Hindi (India), Bangla, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Tamil, Telugu and Urdu, and the page warns that some devices may not support all languages in all regions [S18] (H).
- `SpeechRecognition` is only partial in Chrome for Android and absent in Firefox for Android [S23] (H). It needs a network in Chrome (L, widely known, not checked on a primary page).

**Inference (M).** A basic Android phone may lack the Hindi voice data or have a different TTS engine. A bare `speak()` call can stay silent.

**Rec.**
1. Wait for `voiceschanged`, then look for a voice whose `lang` starts with `hi` (compare after replacing `_` with `-`; some Android builds report `hi_IN`. L: unverified here, so test on the actual phone).
2. If no Hindi voice exists, hide Listen and show "Voice not available on this phone" in Hindi and English. The brief's own add-on rule for extra languages says the same.
3. For the roughly 15 phrases that matter most (the emergency card, "Your turn is close", "You have been called", "Token ... go to Room ..."), record Hindi audio clips (Ashutosh's lane). Opus clips are small, play on any phone and sound better than a device voice. Do the dynamic parts (token number, room) with `speechSynthesis`, or record digits 0 to 9 and room names.
4. Test how a Hindi voice reads `MED-042`. It may spell letters oddly. If so, add a `spoken` field per token, e.g. the Devanagari letters.
5. Mic input: keep it as an enhancement behind a feature check, never the only way to enter a name.

### 2.4 GIGW

**Facts (H).** GIGW 3.0 applies to Central, State and local government websites and apps, is built on WCAG 2.1 AA, ISO 23026, the RPwD Act 2016 and the IT Act 2000, and adds guidance for mobile apps [S2][S3]. Checkpoints that match our work [S4]:
- The site or app is bilingual, with a prominent language choice offered before entering, and uses Unicode.
- Hindi and regional fonts are tested on popular browsers for layout loss.
- Text resizes to 200%; content works in portrait and landscape; no reliance on shape, colour, size or position alone; the default language of each page is set with `lang`.

**Rec (H).** Cite GIGW 3.0 in the README accessibility section and use the first-visit language chooser as the evidence for the bilingual checkpoint. GIGW is not a hard requirement for a hackathon prototype (Inference, H), but a government-hospital judge will recognise the name. Do not claim certification; STQC certification is a separate process [S2].

### 2.5 Patterns for low-literacy and elderly users

**Facts.**
- Illiterate users in three Bangalore slums preferred text-free interfaces with semi-abstracted graphics and voice feedback; a consistent help feature was an overlooked need [S7] (M: abstract and index read, full paper restricted).
- W3C's COGA guidance lists the objectives we use: help users understand what things are, use clear content, avoid mistakes, help users focus, do not rely on memory, provide help. It names patterns "Use Clear Words", "Keep Text Succinct", "Separate Each Instruction", "Make Short Critical Paths", "Avoid Data Loss and Timeouts" [S5] (H).
- W3C's older-user guidance asks for text resize to 200%, contrast, no colour-only meaning, consistent navigation, adjustable timing and error correction help [S6] (H).

**Inference (M).** Kamla reads a little Hindi, so text-free is the wrong target; icon plus word plus voice is right. Icons without a word fail for the cultural reasons the Medhi work warns about, and a word without an icon fails for low literacy.

**Rec (H):** one question per screen (already in the brief); an icon and a Hindi word on every action; Listen on every screen; assisted mode as the brief defines it; Back keeps answers; no timeouts on the registration flow (COGA 4.5.9, SC 2.2.1); a visible "Help desk" and "Emergency" in a fixed place on every screen.

### 2.6 Test checklist (use at feature freeze)

Run on a real Android phone if one is available, otherwise Chrome DevTools device mode at 360 by 640.

- [ ] Every screen at 360px with the largest text step: no sideways scroll, no clipped Hindi (matras above and below the line).
- [ ] Every screen at 320px wide and at browser zoom 200%.
- [ ] Every button and link at least 56px tall; gaps between targets of at least 8px.
- [ ] Text contrast 4.5:1 and UI boundary contrast 3:1 in normal and high-contrast modes (axe or Lighthouse, then eyeball).
- [ ] Remove all colour (DevTools grayscale emulation): overcrowding, doctor status, token state and the route are still readable.
- [ ] Tab through the registration flow: a visible focus ring everywhere; the focused field is never under the Emergency bar.
- [ ] Open the keyboard on the name step: field and Emergency button both visible.
- [ ] Every icon-only or icon-plus-word control has an accessible name in the current language; every input has a label.
- [ ] TalkBack on: complete registration in Hindi without sight of the screen.
- [ ] `lang` attribute changes with the language switch; inline English terms carry `lang="en"`.
- [ ] Emulate `prefers-reduced-motion`: no non-essential motion; the board does not auto-rotate.
- [ ] Listen: with a Hindi voice, with no Hindi voice (button hidden), and after reload.
- [ ] Emergency button reachable on every route, including before registration, with the app offline.
- [ ] Pan or zoom on the floor plan has button controls.
- [ ] Pull the network: slip and last-known queue still show, with "last updated" text.

## 3. Plain Hindi

### 3.1 Register

**Facts (L, search summary of an official Rajbhasha page that was not read directly [S26]).** The Department of Official Language's simple-Hindi guidance tells officers to prefer commonly understood foreign words written in Devanagari over hard coined equivalents; the examples named were ticket, signal, station, police and airport.

**Inference (M).** For Kamla the same logic holds: she says "OPD", "line", "lift" and "X-ray" more readily than formal Sanskritised terms. So the glossary writes loanwords in Devanagari (ओपीडी, टोकन, लिफ्ट, एक्स-रे), keeps spoken Urdu-origin words that Hindi speakers use daily (मरीज़, इंतज़ार, जाँच), and keeps formal terms (बाह्य रोगी विभाग) in a `formal` field for printed signage only.

**Rec (H on the rules, L on exact words):**
- Polite "आप" form. Short sentences, one idea each.
- No gendered first-person verbs ("मैं खो गया/गई"). Use "रास्ता नहीं मिल रहा".
- Keep every placeholder (`{n}`, `{m}`, `{time}`, `{room}`) identical to the English key.
- Write numbers and tokens in Latin digits (`MED-042`, `25`) so the slip, board and voice agree.
- Always "लगभग" (about) before a wait. Never write "आप इंतज़ार कर सकते हैं".
- Give the one-line gloss (`hiGloss`) the first time OPD, token, Emergency, Casualty, ward, ramp and lift appear.

### 3.2 Glossary

`docs/research/07-accessibility-and-languages/glossary-hi.json` holds 61 entries (places, departments, queue words, staff actions, doctor status phrases, mode names, form labels) and the emergency block. Fields: `key`, `en`, `hi`, `hiGloss`, `formal`, `basis`, `needsNativeCheck`, `checkPriority`. Spot check of the wording that matters most:

| English | Hindi (draft) | Check |
| --- | --- | --- |
| OPD | ओपीडी (gloss: डॉक्टर को दिखाने की जगह, भर्ती हुए बिना) | high |
| Token | टोकन (gloss: आपकी बारी का नंबर) | high |
| Emergency / Casualty | इमरजेंसी / कैज़ुअल्टी | high |
| About {m} minutes | लगभग {m} मिनट | high |
| The doctor is on a break until {time} | डॉक्टर {time} तक ब्रेक पर हैं | high |
| The doctor is running {m} minutes late | डॉक्टर {m} मिनट देरी से चल रहे हैं | high |
| Avoid stairs | सीढ़ियों से बचें | normal |
| Lift / Ramp | लिफ्ट / रैंप (gloss: सीढ़ी की जगह ढलान वाला रास्ता) | normal |

**Fact (M).** Only "पंजीकरण" (registration) was confirmed on a government Hindi page (the ORS portal, seen in a search result) [S28]. Every other Hindi string is our draft. **No string has been read by a native speaker.** All 61 plus 9 sign entries carry `needsNativeCheck: true`. Ashutosh owns the review; start with `checkPriority: "high"`.

## 4. Emergency signs, safe wording and helplines

### 4.1 The eight signs checked against authority

| Brief sign | Source support | Verdict |
| --- | --- | --- |
| Chest pain | WHO: pain or discomfort in the centre of the chest, arms, left shoulder, elbows, jaw or back; breathlessness; light-headedness or faintness; cold sweat. "Seek medical care immediately" [S8] | Supported. Widen the wording to "pain or pressure, or pain that spreads to arm, jaw or back" |
| Trouble breathing | WHO: difficulty in breathing or shortness of breath [S8]. WHO BEC treats airway and breathing first [S14] | Supported |
| Heavy bleeding | WHO BEC: look for life-threatening bleeding [S14]. WHO: severe bleeding after birth can kill within hours [S11] | Supported. "Or bleeding that will not stop" is our plain-words addition |
| Fainting or not waking up | WHO: "fainting or unconsciousness" [S8][S9]. IMNCI: lethargic or unconscious [S13] | Supported |
| Sudden weakness or drooping face | WHO stroke: facial droop, weakness in one or both arms, slurred or strange speech, sudden vision loss, sudden dizziness or loss of balance; "treated as a health emergency" [S9] | Supported. Add speech and sight |
| Serious injury | WHO BEC covers trauma care but gives no patient-facing list [S14] | Weak. Examples (bad fall, road accident, deep cut, burn) are our inference. Staff should read them |
| Pregnant woman bleeding or in severe pain | MoHFW booklet: severe pain in abdomen, bleeding per vaginum, convulsions, fever as danger signals; at an FRU: bleeding in advanced pregnancy, decreased or no foetal movement, blurring of vision, fits [S12]. WHO: severe headache, visual disturbance, upper abdominal pain for pre-eclampsia [S10] | Supported. Add fits and reduced baby movement |
| Child very unwell | NHM IMNCI general danger signs: not able to drink or breastfeed, vomits everything, has had convulsions, lethargic or unconscious; "urgent referral" [S13] | "Very unwell" is vague. Use the four danger signs in plain words |

**Rec (H).** Add one general sign: fits. Keep the list at nine so it still fits one screen at the largest text size. Close with "This list is not complete. If you are worried, tell any staff member."

**Fact (M).** The MoHFW booklet separates signs by where to go (PHC or FRU), but its core instruction for all is "If any complications occur, seek help immediately" [S12]. A queue app inside a hospital has one answer for all: Emergency.

### 4.2 Safe wording rules

- Say what to do ("Go to Emergency now. You don't need a token."), never what the patient has.
- Never "you can wait", "mild", "not serious", "non-urgent". The same rule holds in Hindi (`neverSay` block in the JSON).
- The urgent flag confirmation must not promise a time or an outcome. Draft: "Staff are being told now. If you can, go to Emergency or call out to any staff member." **Needs a hospital staff or clinician read**; this sentence is safety wording, not only language.
- The sign list is informational. The app does not triage and says so in the footer (CONTEXT: Emergency signs).
- Do not show wait estimates on the Emergency screen.

### 4.3 Helplines

**Facts.**
- **112**: one national emergency number run by the Ministry of Home Affairs (ERSS) for police, fire, ambulance and other emergencies; reachable by voice, SMS, email, panic button and the 112 India app. A 2025 PIB document, seen only through search, says it unifies 100, 101, 108 and 181 [S16] (M).
- **108**: NHM Odisha says beneficiaries get the EMAS ambulance free of charge by dialling the toll-free number 108, with 860 ambulances (449 BLS, 411 ALS) [S15] (H for Odisha).
- **104**: NHM Odisha lists a 24x7 health helpline for counselling and enquiries [S15] (H). Not an emergency number.
- **102**: basic transport for pregnant women and children in some states, run by states; NHM Odisha's page does not list it [S15]. A MoHFW-run health portal Hindi page tells a stroke witness to call 102 [S17] (L, snippet). The sources disagree on 102 across states.
- **14416** Tele-MANAS: free 24x7 mental-health line launched by MoHFW on 10 Oct 2022 [S27] (M).
- Responsibility for ambulances sits with States/UTs; the Centre supports through NHM [S16] (M, search summary of a parliamentary answer).

**Rec (H).** Emergency screen shows **112** (all emergencies) and **108** (ambulance), nothing else. Offer 104 only on a Settings or About screen as "health advice (not for emergencies)". Skip 102 and 14416; they add choices at the worst moment and the first is state-specific.

**Rec (H, demo safety).** Render numbers as `tel:` links so a real phone can call, but never tap them while recording; a tap dials the real 112. For the desktop demo they are plain text. Add a README note that numbers are real while the hospital is made up.

## 5. i18n tooling and keeping EN and HI in sync

### 5.1 Options

| Option | Facts [S24] | Fit |
| --- | --- | --- |
| Hand-rolled typed dictionary | 0 deps | Fits: two languages, string interpolation only |
| typesafe-i18n 5.27.1 | Last modified 11 Feb 2026; 2.8 MB unpacked (includes generator); needs a codegen watcher | Types are good, but a watcher in the weekend loop is one more thing to break |
| i18next 26.5.7 + react-i18next 17.1.5 | Both published 23 Oct 2026 (active); 0.5 MB and 1.0 MB unpacked | Strongest ecosystem; typed keys need module augmentation; more than we need |
| Paraglide JS 2.29.1 | Published 19 Oct 2026; compiler with per-message tree-shaking; 3.7 MB unpacked | Elegant, but a build plugin and a new mental model in 43 hours |

Bundle sizes after build were not measured (L). The unpacked sizes are on-disk, not shipped.

**Rec (H).** Hand-rolled. It also matches AGENTS rule 4 ("strings live in the i18n dictionaries with typed keys") with no extra moving part. Library features we would need later (ICU plurals, runtime locale loading) are not needed for two fixed languages. Avoid plurals by phrasing ("आपके आगे {n} लोग हैं"); Hindi plural forms for 0 and 1 differ from English.

### 5.2 Shape

```ts
// packages/shared/src/i18n/en.ts
export const en = {
  'queue.ahead': '{n} people ahead of you',
  'queue.wait': 'About {m} minutes',
  'emergency.go': 'Go to Emergency now, or tell any staff member.',
} as const;
export type MessageKey = keyof typeof en;

// hi.ts: the annotation makes tsc reject missing and extra keys
import type { MessageKey } from './en';
export const hi: Record<MessageKey, string> = {
  'queue.ahead': 'आपके आगे {n} लोग हैं',
  'queue.wait': 'लगभग {m} मिनट',
  'emergency.go': 'अभी इमरजेंसी जाइए, या किसी भी स्टाफ़ को बताइए।',
};

// t.ts: typed params pulled from the English literal
type Params<S extends string> =
  S extends `${string}{${infer P}}${infer Rest}` ? P | Params<Rest> : never;
export type ParamsOf<K extends MessageKey> = Params<(typeof en)[K]>;
export function t<K extends MessageKey>(
  lang: 'en' | 'hi', key: K,
  ...args: [ParamsOf<K>] extends [never] ? [] : [Record<ParamsOf<K>, string | number>]
): string {
  const dict: Record<MessageKey, string> = lang === 'en' ? en : hi;
  const p = (args[0] ?? {}) as Record<string, string | number>;
  return dict[key].replace(/\{(\w+)\}/g, (_, name: string) => String(p[name]));
}
```

(`as const` makes `en` values literal types, which is what `Params` reads. `en` assigned to `Record<MessageKey, string>` widens safely. Sketch, not compiled here.)

### 5.3 Sync plan

1. **Compile time:** the `Record<MessageKey, string>` annotation. Adding a key to `en.ts` breaks the build until `hi.ts` has it.
2. **Test time:** one vitest test that, for every key, checks the `{placeholder}` set is equal in both languages, `hi` is non-empty, and `hi` differs from `en` unless the key is on a short allow-list (e.g. `112`). About 15 lines.
3. **Review time:** a PR that touches `en.ts` must touch `hi.ts` (lane rule; add to `docs/git-workflow.md`).
4. **Data files:** place names, landmarks and departments live in `src/data` with `{ en, hi }` objects typed once (`type Bilingual = { en: string; hi: string }`) so the compiler also enforces Hindi place names and landmarks.
5. **Hindi review column:** keep a `needsNativeCheck` list by key outside the shipped bundle; the glossary JSON is the seed.

### 5.4 Fonts

**Fact (M).** `@fontsource/noto-sans-devanagari` 5.3.0 is 1.5 MB unpacked, `@fontsource/noto-sans-oriya` 1.2 MB [S24]; these are all-weight, all-subset packages, not what a page would load.
**Rec (M).** Start with the system font stack; Android devices normally render Devanagari. Test on the real phone (L: not verified for old basic phones). Only if rendering is bad, ship one weight of one subset as woff2. Use `line-height` of at least 1.6 for Hindi so matras do not clip (Inference, M).

## 6. Odia as a third language

### 6.1 Facts

- **Voice, Android:** Google's Text-to-Speech languages on the TalkBack page do not include Odia, while Bangla, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Tamil, Telugu and Urdu are listed [S18] (H for that list; the list is TalkBack's, not a statement about every Android TTS engine).
- **Voice, cloud:** the Cloud Text-to-Speech voices page showed no Odia row among the Standard, WaveNet or Chirp 3 HD voices when fetched; Hindi and Bengali (India) are present [S19] (M: page is long and was text-searched). A search summary says Gemini-TTS lists `or-IN` as Preview (L, not confirmed). Both are paid server APIs and not the browser voice a phone would use.
- **Speech to text:** Cloud Speech-to-Text lists Odia (`or-IN`) only for the Chirp models [S20] (M). That is a server API, not Web Speech in Chrome. Whether Chrome's `SpeechRecognition` accepts `or-IN` was not verified (L).
- **Script and font:** the Unicode block is U+0B00 to U+0B7F; Noto Sans Oriya is OFL-licensed with 513 glyphs [S25] (M, secondary). Odia needs complex-text shaping from the platform [S25].
- **Judges:** the six listed judges come from Metropolis, Aditya Birla Capital, C-DAC, Thapar, GCET Jammu and Sharda [S29]. None is from Odisha.
- **Brief:** the "Another language" add-on suggests Tamil, with every string, department card, place name, landmark, direction, emergency sign and board announcement, and says to hide Listen if the browser lacks a voice for it [S1-brief].

### 6.2 Effort estimate (Inference, L)

| Item | Count | Words |
| --- | --- | --- |
| UI strings | about 300 | about 1,800 |
| Place names and landmarks | about 60 | about 300 |
| Direction templates and board lines | about 25 | about 200 |
| Emergency block | 12 | about 180 |
| Total | about 400 | about 2,500 |

At 250 words an hour for translate-and-review of safety text, about 10 hours. Add 3 hours for script layout and font testing and 2 to 3 hours for resyncing as English changes after the freeze. Estimate: **12 to 16 hours** out of about 32 focused hours. An LLM first draft cuts typing but Odia is lower-resource than Hindi (Inference, M), so native review stays the bottleneck. The estimate depends on an Odia reader on the team, which is unconfirmed.

### 6.3 Does it help with these judges?

**Inference (M).** Weakly. The brief scores "language accessibility" and Hindi plus English already meets it. A judge who cannot read Odia cannot verify it, and with no Odia voice on Android it would be a silent, text-only language, which undercuts the voice-first story. Three half-checked languages risk breaking AGENTS rule 4 ("every string") more than two checked ones. On the other side, a Bhubaneswar team naming Odia as the first real-world next step is a credible Impact line.

### 6.4 Recommendation

**No for the build window.** Instead:
- Make the type system ready: `Lang` is a union, `Bilingual` is one place to extend, so adding Odia later is a compiler-guided task (a Rec, H).
- Put Odia under "what we'd build next" in the README with the voice gap as the stated reason (honest and specific).
- **Optional stretch, only after the 12:00 Sunday freeze and only if someone on the team reads Odia:** one static `/emergency` card in Odia (the emergency signs, 112, 108, Casualty direction), about 25 strings, 3 to 4 hours, with the native check done by that person. Skip if the freeze slips.

## 7. Unverified and weak spots

- Government sites 112.gov.in, pib.gov.in (some pages) and telemanas.mohfw.gov.in could not be fetched from the research environment (connection refused, 403, certificate error). The 112 and 108 integration claim and the Rajbhasha simple-Hindi claim rest on search-result summaries of those sites. The 112 FAQ's police routing (it reportedly mentions both 100 and 101) is internally inconsistent in that summary and was not used.
- The Hindi MoHFW booklet PDF used a legacy font and could not be text-extracted; Hindi sign wording is therefore not copied from MoHFW Hindi text.
- No Hindi string was read by a native speaker. No Odia string exists.
- Whether Chrome for Android returns `hi-IN` or `hi_IN`, and how a Hindi voice reads `MED-042`, need a real-phone test.
- Odia rendering on old basic Android phones and Chrome `SpeechRecognition` for `or-IN` were not tested.
- Odia effort hours rest on assumed string counts and an unconfirmed Odia reader.
- The "Medhi et al." findings come from the abstract and index entries, not the full paper.
- Bundle sizes of the i18n libraries were not measured.

## 8. Open questions for the team

1. Does anyone on the team read Odia well enough to review? That decides the stretch in 6.4.
2. Who is the native Hindi reviewer, and when (before the demo video at 15:00 Sunday)?
3. Do we drop the alternating-language board for stacked EN plus HI cards (2.2)?
4. Do we record Hindi audio clips (about 15) or rely on device voices only (2.3)?
5. Which phone do we test Listen on, and does it have Hindi voice data installed?
6. Is the urgent-flag confirmation sentence (4.2) acceptable to a clinician or hospital staff contact?
7. Add "fits" and "baby moving less" to the emergency list, or keep the brief's eight verbatim?

## Sources

All fetched or searched 24 Oct 2026. "Search only" means the page was seen through a search-result summary and not read directly.

- S1 WCAG 2.2, W3C. https://www.w3.org/TR/WCAG22/
- S1-brief `docs/brief/problem-statement.md` in this repo.
- S2 GIGW 3.0, Scope and objective. https://guidelines.india.gov.in/scope-and-objective/
- S3 GIGW 3.0, New features. https://guidelines.india.gov.in/?p=10063
- S4 GIGW 3.0, Guidelines and attributes. https://guidelines.india.gov.in/guidelines/
- S5 Making Content Usable for People with Cognitive and Learning Disabilities, W3C. https://www.w3.org/TR/coga-usable/ (first 100,000 characters read)
- S6 Web Design Guidance for Older Users, W3C WAI. https://www.w3.org/WAI/older-users/developing/
- S7 Medhi, Sagar, Toyama, Text-free user interfaces for illiterate and semi-literate users, ITID 4(1), 2007. https://www.microsoft.com/en-us/research/?p=160568 and https://ideas.repec.org/a/tpr/itintd/v4y2007i1p37-50.html (search only)
- S8 WHO, Cardiovascular diseases fact sheet. https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)
- S9 WHO, Stroke fact sheet. https://www.who.int/news-room/fact-sheets/detail/stroke
- S10 WHO, Pre-eclampsia. https://www.who.int/news-room/fact-sheets/detail/pre-eclampsia
- S11 WHO, Maternal mortality. https://www.who.int/news-room/fact-sheets/detail/maternal-mortality
- S12 MoHFW/NHM, My Safe Motherhood Booklet (English). https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf
- S13 NHM, IMNCI Module 5, Assess and classify. https://nhm.gov.in/New-Update-2022-24/CH-Programmes/Pediatric_Care/IMNCI-Resource-Materails/module_5.pdf
- S14 WHO/ICRC/IFEM, Basic Emergency Care. https://www.who.int/teams/integrated-health-services/clinical-services-and-systems/emergency-and-critical-care/bec (search only)
- S15 NHM Odisha, ambulance and helpline page. https://nhmodisha.gov.in/?p=1003
- S16 MHA/PIB on ERSS 112. https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=1601844&reg=3&lang=2 and https://www.mha.gov.in/sites/default/files/2022-08/NERSGuideline_2100815[1].pdf (search only); Rajya Sabha answer on 108/102 at https://rsdebate.nic.in/bitstream/123456789/757940/1/PQ_267_04022025_U296_p534_p537.pdf (search only)
- S17 National Health Portal, World Stroke Day (Hindi). https://hi.nhp.gov.in/विश्व-स्ट्रोक-दिवस_pg (search only)
- S18 Languages supported by TalkBack, Google. https://support.google.com/accessibility/android/answer/11101402?hl=en
- S19 Cloud Text-to-Speech supported voices. https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types
- S20 Cloud Speech-to-Text supported languages. https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages
- S21 MDN, SpeechSynthesis.getVoices(). https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- S22 Can I use, Speech Synthesis API. https://caniuse.com/speech-synthesis
- S23 Can I use, Speech Recognition API. https://caniuse.com/speech-recognition
- S24 npm registry metadata (`npm view`, registry.npmjs.org) for typesafe-i18n, i18next, react-i18next, @inlang/paraglide-js, @fontsource/noto-sans-oriya, @fontsource/noto-sans-devanagari.
- S25 Fontsource, Noto Sans Oriya. https://fontsource.org/fonts/noto-sans-oriya/about (search only)
- S26 Department of Official Language, simple Hindi guidance. https://rajbhasha.gov.in/ (search only)
- S27 PIB, Tele-MANAS launch. https://www.pib.gov.in/PressReleasePage.aspx?PRID=1866498&reg=48&lang=2 (search only)
- S28 Online Registration System, Hindi portal. https://ors.gov.in/indexH.html (search only)
- S29 `docs/hackathon.md` in this repo (judge list).
