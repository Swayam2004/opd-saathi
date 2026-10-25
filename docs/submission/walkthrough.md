# Walkthrough of the live site

For Ashutosh, before recording. It takes about 15 minutes. The site is a made-up hospital, City District Hospital. Use made-up names only. Our character is Kamla, 62.

Live site: https://hackcache26-opd-saathi.onrender.com

## Setup (2 min)

Use one browser, Chrome, with three windows. The queue only syncs between windows of the same browser, so do not mix browsers or use a private window.

- Window A, the Patient. Make it phone-narrow, about 390px wide, or use a phone view in DevTools. Open the live URL.
- Window B, `/staff`. Press Reset everything and confirm, then Add 20 sample patients. Press Enable sound for urgent flags.
- Window C, `/board`. Press Enable sound once. The browser stays silent without it.

## 1. Language and Emergency (2 min)

In window A pick हिंदी on the first screen. Look for the Emergency button at the top. It must be on every screen, so check it on each page. Press it. You should see the way to Casualty, "Call 112 for any emergency. Call 108 for an ambulance." and the button I need urgent help. Do not press that one yet. Go back.

## 2. Register Kamla (3 min)

Press Register. The first screen is "First, check these signs". Press None of these. Continue. Turn on Someone is helping me. Text gets bigger and it reads aloud. Fill in name Kamla, age 62, gender Woman, mobile Skip, then pick a department. Check the details and press Get my OPD slip.

## 3. The slip and the route (2 min)

The slip shows token, department, room, floor, doctor, people ahead, estimated wait and a QR code. Press Read aloud, then Find my room. You should see a floor plan, written steps with landmarks, and Avoid stairs already on. Press Listen. Turn Avoid stairs off and on and see how the route changes.

## 4. The queue moves (3 min)

On the slip press See my turn. It shows people ahead, an "about" wait and a range such as "usually 15 to 40". In window B press Speed up time 10x, then Call next in Kamla's department until her number drops. Window C announces tokens aloud and window A updates. When 3 are ahead a banner appears with a sample message marked "no real SMS was sent". When she is called the screen says Your turn now.

## 5. Urgent flag (1 min)

In window A press Emergency, then I need urgent help. Window B pins "Urgent help needed" at the top with a sound. Press Mark as seen. The app never says who is urgent. Only staff do.

## 6. Staff extras (1 min)

In `/staff` find Lifts and ramps and mark the lift out of service. In window A open Find a place. The route changes, or it sends you to the Help desk. Switch the lift back.

## 7. Hindi pass (your main job)

Repeat steps 1 to 5 in हिंदी, and also check the Emergency screen, the slip, My turn, the route steps and the board. Write down every string that reads wrong, the screen it is on, and your fix. Send the list to Soumyajit before recording.

## Know before you film

- There is no mic input. Skip it.
- There is no server. It is one browser with three windows. Say so in the video.
- The Hindi voice depends on the device. If the screen says "This phone has no Hindi voice", use another device or skip Listen.
- Press Reset everything before every take.
- If something breaks, tell Soumyajit the screen and what you did. Do not merge a fix without telling Swayam, because every merge redeploys the site.
