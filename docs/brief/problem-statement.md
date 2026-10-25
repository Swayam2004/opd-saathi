# Problem statement 2: Smart queue management and accessible navigation for government hospitals

Source: https://cachedinfo.in/hackcache/problems/hospital-queue-navigation (copied 24 Oct 2026). Track: Reimagining Government.

This file holds the official brief and the build prompt that HackCache gives to every registered team. Every other team has the same text, so a build that follows the prompt and nothing more will look like the rest. Our edge is in `docs/plan/` and `docs/research/`.

## The challenge

Patients at government hospitals often spend hours waiting to register, get an OPD slip, and see a doctor. Even with a slip, many can't find the right ward or department. For example, they know they need Ward 4 but not where it is.

Registration is hard for people unfamiliar with digital services, people who speak regional languages, elderly patients and people with disabilities. Long queues, unclear signs, crowded corridors and little information about waiting times add stress and delay. Urgent patients may also be delayed if emergencies aren't identified promptly.

Build a smart hospital queue management and navigation solution that makes registration easy for everyone, helps patients find their destinations, and cuts unnecessary waiting and confusion during a hospital visit.

## Possible areas to explore (from the brief)

- Simple registration: few steps, clear instructions, OPD slip generation.
- Native language support: local and regional languages.
- Accessibility and inclusion: elderly, disabled, low digital literacy, unfamiliar with smartphones. Voice guidance, text-to-speech, readable interfaces, assisted registration.
- Smart queue management: token numbers, estimated waiting times, live queue status, notifications as a turn approaches.
- Hospital navigation: wards, departments, labs, pharmacies, consultation rooms via maps, floor plans, landmarks or step-by-step directions.
- Slip-to-destination guidance: enter or scan the OPD slip, get directions to the assigned ward or department.
- Emergency prioritization: urgent cases flagged for immediate assessment by qualified medical staff.
- Real-time updates: doctor availability, delays, queue changes, next steps.
- Hospital staff dashboard: patient flow, overcrowding, coordination between registration counters and departments.

## Expected outcome

A working prototype showing a patient who can register in a preferred language, get an OPD slip, find the correct department, track their turn, and reach the right doctor with minimal confusion.

## Important (from the brief)

- No need for a full hospital management system. Focus on one high-impact problem or combine features.
- A sample hospital layout and simulated patient data are fine. No real hospital integration needed.
- **Emergency cases must be assessed by qualified medical staff. Digital queues must never delay emergency care, and accessibility is a core requirement, not an add-on.**

## Evaluation focus (brief-specific)

Ease of registration, language accessibility, inclusive design, queue-management efficiency, navigation accuracy, emergency handling, technical execution, real-world usefulness.

The judges score five generic criteria, each out of 10: Innovation, Technical Execution, Design and UX, Impact, Presentation. See `docs/hackathon.md`.

---

## The build prompt every team gets: Build 1 (verbatim)

> Build a working web app prototype for a hackathon. Build the whole thing, not a plan: every screen below should work when I open it.
>
> **OUR CHOICES (change these, or leave them as they are)**
> - App name: OPD Saathi
> - Hospital: City District Hospital, a sample government hospital with three floors
> - Main user: Kamla, 62, visiting alone, reads a little Hindi, has a basic Android phone, walks slowly and avoids stairs
> - Part of the visit we go deepest on: getting from the OPD slip to the right room
>
> **THE PROBLEM**
> Patients at government hospitals wait hours to register, get an OPD slip and see a doctor, and then can't find the room or ward written on the slip. Registering is hard for elderly patients, people with disabilities, people who don't read English and people who rarely use smartphones. The app lets a patient register in their own language, get an OPD slip with a token, see their place in the queue, find their way, and know when to go in. Staff get a dashboard to run the queues. It does not connect to any real hospital system: the hospital and every patient are made up.
>
> **EMERGENCIES COME FIRST (this is not optional)**
> - An "Emergency" button is on every screen, including before registration. It shows the way to the Emergency (Casualty) department on the map, tells the person to go there now or tell any staff member, and shows 112 (and 108 for an ambulance).
> - The first registration screen lists the signs that need care right away (chest pain, trouble breathing, heavy bleeding, fainting or not waking up, sudden weakness or a drooping face, a serious injury, a pregnant woman who is bleeding or in severe pain, a child who is very unwell), with "Any of these? Go to Emergency now. You don't need a token."
> - An "I need urgent help" button lets a patient or helper raise a flag at any time. The flag goes to the top of the staff dashboard, with a sound, until a staff member marks it as seen.
> - The app never decides whether something is an emergency, never tells anyone they can wait, and never makes an urgent case wait for registration or a token. Only qualified staff assess urgent cases.
>
> **HOW TO BUILD IT**
> - React + Vite + Tailwind CSS, plain JavaScript (no TypeScript), React Router. No backend and no login.
> - Keep the shared hospital state (queues, tokens, flags, doctor status) in localStorage and sync it between open tabs with BroadcastChannel. That way the patient screen, the staff dashboard and the waiting-room board update live when they are open in different tabs of the same browser.
> - Keep the hospital, departments and sample patients in files under src/data: hospital.js (floors, places, the paths between them), departments.js and patients.js. Keep all interface text in src/i18n/en.js and src/i18n/hi.js.
> - Draw floor plans and icons as inline SVG. No image downloads.
> - Use only made-up data. Never ask for a real Aadhaar or ABHA number. The slip shows the token, first name and department only.
> - If you can't create a project (for example, you're a chat assistant), build it in plain HTML, CSS and JavaScript as a few files with no build step, each in its own code block with its file name above it. If you run out of space, stop at the end of a file and I'll say "continue".
>
> **THE SAMPLE HOSPITAL (put this in src/data/hospital.js)**
> - Ground floor: Main entrance, Registration counters, Help desk, Emergency (Casualty), Pharmacy, Laboratory (blood tests), X-ray, Drinking water, Toilets, Wheelchair point, Lift, Stairs, Ramp.
> - First floor: OPD rooms 1 to 8 (General Medicine in rooms 1 and 2, Children 3, Women and pregnancy 4, Bones and joints 5, Ear, nose and throat 6, Eyes 7, Skin 8), Waiting hall A, Lift, Stairs, Toilets.
> - Second floor: Ward 4 (Medicine), Ward 5 (Surgery), Ward 6 (Children), Nurses' station, Lift, Stairs.
> - Each place has a name, a floor, an x/y position on its floor plan, and one landmark people can see ("opposite the blue chairs", "next to the drinking water").
> - The paths between places form a graph, with the walking distance in metres and whether the path uses stairs.
> - In departments.js, give each department its room, doctor's name, OPD hours (9:00 to 14:00) and a sample average consultation time.
>
> **PATIENT SCREENS**
> 1. Home: big buttons with an icon and a word each: Register / I have my slip / Find a place / Emergency. On the first visit, ask for a language, showing each language's name in its own script.
> 2. Register: one question per screen, with a progress bar ("Step 2 of 5"): name, age, gender, mobile number (optional, for alerts), and "Which doctor do you need?" as picture cards in plain words (General Medicine "fever, cough, BP, sugar"; Children; Women and pregnancy; Bones and joints; Ear, nose and throat; Eyes; Skin). Add "Not sure? Ask at the help desk", which shows the way there. A big microphone button on each text question lets the patient speak instead of typing, where the browser supports it. A "Someone is helping me" switch turns on assisted mode: bigger text, everything read aloud, and a helper can fill it in for them. Back keeps every answer.
> 3. OPD slip: the token (for example MED-042), department, room and floor, the doctor's name, how many people are ahead, the estimated wait, and a QR code that opens this patient's queue screen. It can be saved as an image, printed, read aloud, and shown in large type to staff.
> 4. My turn: the patient's place in the queue ("6 people ahead of you, about 25 minutes"), the token being served now, the doctor's status (in the room / on a break until 11:30 / running late), and what to do next. When 3 people are ahead, the phone vibrates, plays a sound, and shows a banner and a browser notification, and a simulated SMS appears ("Your turn is close. Please go to Room 3 on the first floor"). When the token is called, the screen says so in big type, with directions to the room.
> 5. I have my slip: enter the token number, or scan the QR code with the camera (use the browser's BarcodeDetector where it exists, and hide the scan button where it doesn't). This opens My turn and the directions.
> 6. Find a place: search or pick any place (wards, rooms, lab, pharmacy, toilets, water). Show the floor plan in SVG with the route drawn on it, plus step-by-step directions with landmarks ("Take the lift to the first floor. Turn right. Room 3 is the third door on your left, opposite the blue chairs"). Work out the route with Dijkstra's shortest path over the graph in hospital.js. An "Avoid stairs" switch (on by default in assisted mode) routes through lifts and ramps only. A "Listen" button reads each step aloud. An "I'm lost" button shows the way to the nearest help desk, plus a large card to show any staff member with the destination in the patient's language and in English.
> 7. Emergency: as described under EMERGENCIES COME FIRST.
> 8. Settings: language (English / हिंदी), text size (three steps), high contrast, read aloud, avoid stairs.
>
> **STAFF SCREENS**
> 9. Staff dashboard (/staff): every department's queue, with the token being served now, the waiting count and the average wait. Buttons to call next, mark a no-show, send a patient to the end of the queue, and move a patient to another department. The doctor's status for each room (available / on a break until a time / running late by some minutes), which patients see straight away. An overcrowding colour for each waiting area, based on how many people are waiting compared with its seats. Urgent flags pinned at the top, with a sound, until marked as seen. Say on the screen that a real hospital would need a staff login.
> 10. Registration counter: register a patient for them in a few taps (for someone with no phone) and print their slip.
> 11. Waiting-room board (/board): a large-screen view for a TV, showing the token being served in each room, the next three tokens, and any delays, alternating between English and Hindi. Announce each called token aloud ("Token MED-042, please go to Room 1").
> 12. Demo controls on the staff dashboard: add 20 sample patients, speed time up 10x, and reset everything, so the whole flow can be shown in two minutes.
>
> **HOW WAITING TIME WORKS**
> Estimated wait = the number of people ahead x the average consultation time of the last 10 patients in that department (starting from the sample average in departments.js), plus any delay the doctor is running. Round it to 5 minutes, show it as "about", and update it every time the queue moves.
>
> **DESIGN RULES**
> - Mobile first: designed for a 360px-wide screen, and fine on a laptop and a TV.
> - Plain words a Class 8 student would understand. One main action per screen. Every term like OPD, token or Casualty gets a one-line explanation the first time it appears.
> - Usable by someone who barely reads: every button has an icon and a word, and every screen can be read aloud.
> - Body text at least 18px, buttons at least 56px tall, strong colour contrast (WCAG AA), visible keyboard focus, and a label on every icon and form field for screen readers. Never rely on colour alone.
> - Switching language changes every piece of text, including directions, landmarks and announcements.
> - Calm and reassuring tone.
> - Fast on a weak connection: no big images and no heavy libraries.
>
> **BEFORE YOU FINISH, CHECK**
> - Every screen above opens and works, with no console errors.
> - With the patient screen, the staff dashboard and the board open in three tabs, a patient can register, get a slip, show up on the dashboard and the board, be called, and see the call on their own screen.
> - An urgent flag raised on the patient screen appears at the top of the staff dashboard within a second.
> - Directions are correct between any two places, including across floors, and "Avoid stairs" never uses stairs.
> - Every piece of text switches between English and Hindi.
> - Everything works at 360px wide with text at the largest size, and survives a page reload.
> Then tell me how to run it, and list anything you did not finish.

## Build 2: the "finish what's missing" checklist

Emergency button on every screen with the way to Emergency, 112 and 108; emergency signs on the first registration screen; urgent flags pinned with sound until seen; nothing ever makes an urgent case wait. Home with four big buttons and a first-visit language choice. Register: one question per screen, progress bar, picture cards, "Not sure?" to the help desk, microphone input, assisted mode, Back keeps answers. OPD slip with token, room, floor, doctor, people ahead, estimated wait and a QR code, savable, printable, readable aloud, large-type view. My turn with the alert at 3 ahead (vibration, sound, banner, notification, simulated SMS) and the called screen with directions. I have my slip with token entry and QR scanning. Find a place with SVG floor plans, route drawn, landmark directions, Dijkstra, Avoid stairs, Listen, I'm lost. Settings. Staff dashboard (queues, call next, no-show, end of queue, move department, doctor status, overcrowding colours). Registration counter, waiting-room board with spoken announcements, demo controls. Estimated wait from the last 10 consultations plus the doctor's delay, rounded to 5 minutes. Live sync between tabs. All hospital data in src/data and all text in translation files. Works at 360px, largest text, after reload, no console errors.

## Add-ons the prompt pack offers

- **Live across phones.** Node + Express + Socket.io (or Firebase/Supabase). Shared state moves to the server. Every change reaches every open screen within a second. A phone that loses connection keeps the last known position with "Last updated 2 minutes ago", reconnects, catches up. Patients see only their own token and the public queue. Only staff screens can call, move or remove patients, behind a simple staff PIN, with a note that a real hospital needs proper staff login.
- **Works on a weak connection.** PWA via vite-plugin-pwa, install button in Settings, cache the app, floor plans, directions and the patient's own slip. While offline show one line that queue position may be out of date with the last-updated time. Registrations made offline are kept and sent on reconnect, with the slip marked "waiting to be confirmed".
- **Another language.** Third language (the prompt suggests Tamil) with every string, department card, place name, landmark, direction, emergency sign and board announcement. Hospital-sign terms (OPD, Casualty, X-ray) stay as they are, in brackets. Listen and board announcements use a voice for that language if the browser has one, else hide Listen and keep announcements in Hindi and English.

## Submit prompt: what the organisers expect

README with: problem in two lines, who it's for, one line per screen, how emergencies are handled and why the app never decides who is urgent, design decisions (assisted mode, picture cards, avoid stairs, languages, read aloud), how waiting time is worked out, how it improves on a hospital visit today, how to run it, what is simulated, what we'd build next. Plus deploy steps (with a rewrite so a refresh doesn't 404), a 3-minute demo script showing patient, staff and board side by side (register in Hindi in assisted mode, follow the avoid-stairs route, get the "3 ahead" alert, raise an urgent flag), and a list of live-demo risks.

The debug prompts in the pack are generic and live on the source page.
