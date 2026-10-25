# Pitch deck brief

For Soumyajit. Copy the HackCache template ([guide](https://cachedinfo.in/hackcache/guides/pitch-deck-template)) with Make a copy. Keep its 7 slides and replace every word, number and picture. Delete the first slide, "How to use this template", before submitting. Read the speaker notes under each slide.

Share the deck as Share, General access, Anyone with the link, Viewer. Open the link in a private window to check it, then send the link to Swayam.

Take every screenshot from the live site, not a local build, so the deck matches the video. Use a phone-width window.

## 1. Title

- Project name: OPD Saathi
- One line: Register, follow your turn and find your room at a government hospital OPD, in Hindi or English.
- Team 3Piece. HackCache '26, problem statement 2.
- Do not name the Render Workflows track.

## 2. The problem

Use one sourced number and say whose it is. No invented figures, and no quote unless a real person said it.

- Best number. After trilingual signs were installed at AIIMS Bhubaneswar, 97.78% of 507 people surveyed still asked staff or other patients to confirm where to go, and 6.67% reached their destination with no help (Sahoo et al., Cureus 2024;16(7)). Say it was one hospital, surveyed after the signs went up.
- Honest second number. At one Kolkata tertiary hospital the mean wait was 98.6 minutes (n=432). At a Valsad hospital the wait outside the room was about 12 minutes. Waits vary by site, so never say "India averages".
- Name the person. Kamla, 62, basic Android phone, avoids stairs, reads Hindi. She reaches the hospital, gets a slip and cannot find Room 3.

Sources and caveats are in [`docs/research/03-india-opd-domain.md`](../research/03-india-opd-domain.md), section on safe numbers.

## 3. The solution

One sentence, then one screenshot of the OPD slip.

> OPD Saathi gives a Patient a token, a live place in the queue and a route to the room, in Hindi or English, and gives Staff one screen to run the queues. An Emergency button on every screen works before registration.

## 4. How it works

The same journey the video shows, in three screenshots.

1. Register in Hindi with assisted mode on. Screenshot of a registration step.
2. The OPD slip, then the route with avoid stairs on, with written steps.
3. My turn with the 3-ahead alert, next to the Staff dashboard and the Waiting-room board.

Add one line under the screenshots. The estimated wait is people ahead times the recent consultation time, rounded to 5 minutes, always shown as "about".

## 5. How it's built

Say plainly what is real and what is simulated.

- Built with React 19, TypeScript in strict mode, Vite, Tailwind and React Router. Hosted as a static site on Render.
- Built with AI help from Claude Code, which the hackathon rules allow. The team can explain every part.
- Real. The queue engine, the wait estimate and range, and the routing are pure functions with 229 passing tests.
- Simulated. There is no server, so the queue lives in the browser and syncs across tabs of one browser. No real SMS is sent. There is no staff login. All data is made up.
- Cut. The Node server, the daily report on Render Workflows and the monorepo scaffold. The app is a working demo, not a multi-device system.

## 6. Impact and next steps

Who it helps. Patients who cannot read signs, who need to avoid stairs, or who read only Hindi. Staff who today answer "where is Room 3" all day.

Next steps, three only.

1. A real server, so queues sync across phones, the board and the dashboard.
2. Scan and Share with ABHA for registration. A next step only. The app never asks for Aadhaar or ABHA numbers today.
3. A third language, Odia, and a trial in a real OPD to measure the time from slip to room.

Do not say the app replaces any government system.

## 7. Team and links

- Swayam Sahoo, planning, deployment and documentation
- Soumyajit Sarkar, app build
- Ashutosh Mohapatra, Hindi review, evidence and demo video
- OUTR Bhubaneswar
- Live: https://hackcache26-opd-saathi.onrender.com
- Repo: https://github.com/Swayam2004/opd-saathi
