# Browser capabilities and fallbacks (ticket #6)

Researched 24 Oct 2026. Every "access date" below is 24 Oct 2026 unless a row says otherwise.

## Decision-ready summary

1. **QR scan: native `BarcodeDetector` is not enough.** Chrome ships it on Android, ChromeOS and macOS only, not Windows or Linux, and no Firefox or Safari (flagged off). A judge on a Windows laptop gets no native scanner. Ship `qr-scanner` (nimiq): 5.6 kB gzip when native exists, 15.6 kB gzip plus a 44 kB lazy worker otherwise.
2. **Never use the `barcode-detector` ponyfill as-is.** It fetches a ~947 kB `.wasm` from jsDelivr at runtime. Self-host it or skip it.
3. **Voices are the biggest risk.** No source we could reach confirms an `or-IN` browser voice on any platform. Hindi and English-India voices are likely on Android, Windows and Apple but are unverified on Linux. Plan for "no hi-IN voice" and test on the actual board machine.
4. **Sound needs one tap per page load.** Chrome blocks `speechSynthesis.speak()` and Web Audio without user activation. Put an "Enable sound" button on `/board` and `/staff`, and re-show it after every reload.
5. **Vibration is Android Chrome only** (none on iOS, disabled in Firefox Android) and needs a prior tap. **Notifications on Android Chrome must go through `registration.showNotification()`**; `new Notification()` throws. On iOS they exist only in a Home Screen app. The in-page banner, sound and vibration are the primary alert; the notification is a bonus.
6. **Wake Lock works on Chrome, Edge, Firefox 126+ and Safari 16.4+** but is released whenever the tab is hidden. Re-acquire on `visibilitychange`.
7. **Camera needs HTTPS and a user-granted prompt.** Always keep type-the-token as the equal path.
8. **QR generation:** `uqr` (4.2 kB gzip) or `qrcode-generator` (7.6 kB). **Fonts:** self-host the Noto Sans Devanagari variable woff2 (121 kB). **Slip image:** draw to canvas, no DOM-to-image library.
9. **PWA:** `vite-plugin-pwa` 2.0.0 defaults do not precache fonts or images; add them to `globPatterns`. Do not let the service worker cache API or socket routes.

## Method and source rules

- Support data comes from `@mdn/browser-compat-data` v8.1.7, timestamp 2026-10-22 (the data behind MDN tables), read from the JSON directly because the MDN page text did not render the tables. Cited as "BCD".
- caniuse (`https://caniuse.com/mdn-api_barcodedetector`, 24 Oct 2026) was used for BarcodeDetector only.
- Web Speech details come from the spec source (`WebAudio/web-speech-api` `index.bs`, 24 Oct 2026).
- Bundle sizes are **measured by us** on 24 Oct 2026: `npm i` of the current version, `esbuild --bundle --minify`, `gzip -9`. Treat as indicative; tree-shaking in the real Vite build will differ a little.
- Real-device behaviour (voices, iOS quirks) could not be tested here. Those rows are marked **Unverified**.

## Support matrix (support claims dated 22-24 Oct 2026)

Legend: Y = supported. P = partial or conditional (see notes). N = not supported. ? = could not verify.

| Feature | Android Chrome | Android Firefox | iOS Safari | Windows Chrome/Edge | macOS Chrome / Safari | Linux Chrome/Firefox |
| --- | --- | --- | --- | --- | --- | --- |
| BarcodeDetector | Y (83+, needs Play Services) | N | N (flag only) | N | P (Chrome yes; Safari flag only) | N |
| SpeechRecognition | Y (Chrome 139+ unprefixed, `webkit` from 33) | N | P (`webkit`, 14.5+) | Y (Chrome/Edge, network) | Y (Chrome); P (Safari `webkit` 14.1+) | Chrome Y; Firefox N ("preview") |
| speechSynthesis API | Y | Y (62+) | Y | Y | Y | Y (voices ?) |
| hi-IN / en-IN voice present | likely Y, ? | ? | ? | Y for Narrator voices; ? in browser | ? | ? |
| or-IN voice present | ? (not on TalkBack list) | ? | ? | ? | ? | ? |
| Vibration | Y (needs prior tap) | N (stub, no vibration) | N | N (no hardware) | N | N |
| Notification via service worker | Y | Y | P (Home Screen app only, 16.4+) | Y | Y | Y |
| `new Notification()` | N (throws) | N | N | Y | Y | Y |
| Screen Wake Lock | Y (84+) | Y (126+) | Y (16.4+; Home Screen apps 18.4+) | Y | Y | Y |
| BroadcastChannel | Y | Y | Y (15.4+) | Y | Y | Y |
| getUserMedia (camera) | Y | Y | Y (11+) | Y | Y | Y |
| `beforeinstallprompt` | Y | N | N | Y (Chrome/Edge) | N | N (Chrome Y) |
| `navigator.canShare` files | Y (75+) | Y (96+) | Y (14+) | Y (Chrome 128+) | Y (Safari 14+) | ? |

Sources for the table: BCD v8.1.7 (2026-10-22) paths `api.BarcodeDetector`, `api.SpeechRecognition`, `api.SpeechSynthesis`, `api.Navigator.vibrate`, `api.Notification`, `api.ServiceWorkerRegistration.showNotification`, `api.WakeLock`, `api.BroadcastChannel`, `api.MediaDevices.getUserMedia`, `api.BeforeInstallPromptEvent`, `api.Navigator.canShare`. Browser-compat-data repo: https://github.com/mdn/browser-compat-data.

## 1. BarcodeDetector and QR scanning

### Facts
- BCD: Chrome Android 83+, WebView 83+, Samsung Internet 13+. Desktop Chrome 88+ is marked partial with the note "Supported on ChromeOS and macOS only." Edge notes macOS only. Firefox: not supported. Safari desktop and iOS: behind a flag from 17.
- caniuse (24 Oct 2026) agrees: Firefox none in any version, Safari 17.0 to 27.2 "Disabled by default", Firefox for Android none. https://caniuse.com/mdn-api_barcodedetector
- Chrome's own page: available on macOS, ChromeOS and Android; "Android requires Google Play Services"; it does not mention Windows or Linux. Call `BarcodeDetector.getSupportedFormats()` instead of only checking the global. https://developer.chrome.com/docs/capabilities/shape-detection
- MDN marks it "experimental" and not Baseline. https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
- `getUserMedia` works only in secure contexts, always prompts at least the first time, and can fail with `NotAllowedError`, `NotFoundError`, `NotReadableError`. `facingMode: { exact: "environment" }` throws `OverconstrainedError` when no rear camera exists. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Measured sizes (gzip, 24 Oct 2026): `qr-scanner` 1.4.2 is 15.6 kB, or ~5.6 kB if native BarcodeDetector exists, plus a 44 kB worker loaded on demand (README says it uses the native detector when available). Last published Nov 2022. `jsqr` 1.4.0 is 46.4 kB. `barcode-detector` 3.2.3 ponyfill is 15.2 kB JS but its README states a `.wasm` is fetched at runtime from a jsDelivr URL by default (file in `zxing-wasm` 3.1.6 is 947 kB raw); it documents a `locateFile` override for self-hosting. https://github.com/nimiq/qr-scanner , https://github.com/Sec-ant/barcode-detector

### Inferences
- The brief's "hide the scan button where BarcodeDetector doesn't exist" would hide it on every Windows and Linux judge laptop. Medium confidence that judges use such laptops (not known).
- `qr-scanner` is old but our need (decode one QR of a short token URL) is stable. Low risk.

### Recommendations for OPD Saathi
- Add `qr-scanner`. Show the scan button whenever `navigator.mediaDevices?.getUserMedia` exists (secure context), not when `BarcodeDetector` exists.
- Keep **type the token** as the first, larger option (Kamla's phone may be basic).
- Add a third path: `<input type="file" accept="image/*" capture="environment">` then `QrScanner.scanImage(file)`. It needs no live camera permission and works when the permission was denied.
- On `NotAllowedError`, show a one-line "Camera is blocked. Type the token instead." with an icon and a word.
- If you ever use the wasm ponyfill, copy `zxing_reader.wasm` into `public/` and set `locateFile`, or the scanner silently needs the internet (Fact: README).

## 2. Speech recognition (hi-IN, en-IN)

### Facts
- BCD: Chrome and Edge 139+ unprefixed (webkit-prefixed from 33 / 79), Chrome Android 139+, Samsung 30+, Safari 14.1+ and iOS 14.5+ with `webkit` prefix, Firefox: "preview" (not shipped), Firefox Android: no.
- MDN: in Chrome "an audio is sent to a web service for recognition processing, so it won't work offline", with privacy implications. `processLocally` is Chrome 139+ desktop only; BCD shows false for Chrome Android and Safari. https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- Spec defines error codes `not-allowed`, `service-not-allowed`, `language-not-supported`, `network`. Source: spec `index.bs`.
- No first-party list of languages for Chrome's Web Speech backend was found. Whether `hi-IN` and `en-IN` are accepted, and `or-IN`, is **Unverified**.
- On Safari, whether the user must have Siri or Dictation enabled is **Unverified** here.

### Recommendations
- Use `const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition`; hide the mic button when absent (the brief says "where the browser supports it").
- Set `lang` from the app language: `hi-IN` or `en-IN`. Handle `error` events: show "Voice did not work. Please type." and keep the typed field focused.
- Name and age are the only mic fields; a mis-heard made-up name is harmless. Never label voice as required.
- Offline demo: voice will fail. Say so on the slide.

## 3. speechSynthesis voices (hi-IN, en-IN, or-IN)

### Facts
- API support is universal: BCD Chrome 33, Firefox 49, Safari/iOS 7. `voiceschanged` event: Safari/iOS 16+, Chrome 33. https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- Spec: "It is user agent dependent which voices are available". `getVoices()` "must return a ... list of length zero" if the list is not yet known. `speak()` without a chosen voice uses a default voice that "should support the current language". Source: spec `index.bs`.
- Google TalkBack language list (Android) includes Hindi (India) and English (India) and not Odia. This is TalkBack, a proxy for the Google TTS engine, not the engine's own list. https://support.google.com/accessibility/android/answer/11101402 (24 Oct 2026)
- Windows Narrator support appendix lists Hindi (India) legacy voices Hemant and Kalpana; English (India) legacy Ravi and Heera, natural Prabhat and Neerja; Odia is not listed. Narrator's voices, not guaranteed to be exposed to browsers. https://support.microsoft.com/en-us/topic/appendix-a-supported-languages-and-voices-4486e345-7730-53da-fcfe-55cc64300f01
- Azure Speech (cloud, not the browser) has `or-IN-SubhasiniNeural` and `or-IN-SukantNeural`, plus many `hi-IN` and `en-IN` neural voices. https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts (page read to 100,000 of 165,178 characters).
- Chromium on Linux enumerates voices through speech-dispatcher; with no module it returns none. https://chromium.googlesource.com/chromium/src/+/012c3f9/chrome/browser/speech/tts_linux.cc (found via search; source snapshot, version not checked).
- Apple's voice list could not be fetched. Hindi (Lekha) and English-India (Rishi) system voices are from memory: **Unverified**. No source found for any Odia voice on Apple.

### Inferences
- Treat `or-IN` as absent everywhere. Treat `hi-IN` and `en-IN` as present on most Android phones with Google TTS, and **maybe** present on a judge's desktop. Medium-low confidence.
- Edge's online "Natural" voices may expose Azure voices (including Odia) to Web Speech. Not verified.

### Recommendations
- One helper: wait for `voiceschanged` (or 1 s), pick exact `lang` match, then same-prefix (`hi`), else return `null`.
- When `null`: hide the **Listen** button on patient screens, and on the board show the announcement as large text only. This matches the prompt's rule for added languages.
- Debug line in Settings: "Voice: Hindi available / not available" so the team sees it on each device in the demo checklist.
- For the board only, consider pre-rendered audio clips (digits, department prefixes, room numbers, "please go to room") in Hindi and English, so announcements work on any machine. About 40 small clips. Generating them needs a TTS licence check (**Unverified**); recording by a team member avoids that.

## 4. Vibration

### Facts
- BCD: Chrome and Chrome Android 32+; Edge 79+; Samsung 2+. Firefox Android 79+ marked partial: "returns true, but no vibration takes place". Firefox desktop removed in 129. Safari and iOS: none.
- Chrome 60+ returns `false` without a user gesture (BCD note). MDN says sticky activation is required, and that Silent or Do Not Disturb mode may stop it. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate

### Recommendations
- `navigator.vibrate?.([200, 100, 200])` guarded, and never the only signal. Pair with banner, sound and text.
- Patient must have tapped something on "My turn" (language choice or a "Keep me posted" button) before the "3 ahead" alert, or Chrome will refuse silently.

## 5. Notifications

### Facts
- MDN: the constructor "throws a TypeError when called in nearly all mobile browsers"; use a service worker and `showNotification()`; secure context only. https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
- BCD: Chrome Android 42+ "partial: a notification can only be sent from a service worker". iOS/iPadOS 16.4+: `Notification` is undefined unless the page is a Home Screen web app with a non-default `display`. Safari macOS 16+ (Ventura).
- WebKit: a site becomes a Home Screen web app with manifest `display` standalone or fullscreen; permission may be requested only "in response to direct user interaction". https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- Real push (phone closed or tab backgrounded) needs the Push API plus a server, which we do not plan. A page-open notification via `showNotification` needs only permission and a registered service worker.

### Inferences
- `vite-plugin-pwa` generateSW registers a service worker, enough for page-triggered `showNotification`. A `notificationclick` handler to focus the app needs `injectManifest` or `importScripts`. Not needed for the demo.
- A backgrounded Android tab may throttle timers or drop its socket, so the alert may arrive late. Not tested.

### Recommendations
- Order of alerts at "3 ahead": in-page banner + sound + vibration + simulated SMS card, then `showNotification` if permission is granted.
- Ask permission from a button ("Alert me when my turn is near"), never on load. Handle `denied` quietly.
- Code: `const reg = await navigator.serviceWorker?.ready; reg ? reg.showNotification(...) : 'Notification' in window && new Notification(...)` inside try/catch.
- On iOS show the helper text "Add to Home Screen to get alerts" only if detected as iOS and not standalone. Judges on iOS will rarely see this; low priority.

## 6. Web Audio and speech autoplay (board, staff alarm)

### Facts
- Chrome: Web Audio has been under autoplay policy since Chrome 71; a context created before a gesture starts `suspended` and needs `resume()` after one. Sound autoplay is allowed after the user interacted with the domain, or on desktop when the Media Engagement Index threshold is met, or when the PWA is installed (desktop) or added to Home Screen (mobile). https://developer.chrome.com/blog/autoplay
- Chrome blocks `speechSynthesis.speak()` without prior user activation since M71; it fires an error (`not-allowed`). Blink intent: https://groups.google.com/a/chromium.org/g/blink-dev/c/XpkevOngqUs . A WPT test "speechSynthesis.speak requires user activation" exists. The spec lists `not-allowed` as "Synthesis was not allowed to start by the user agent". I found no current Chrome doc page; the milestone date is from the intent and release notes seen through search.
- MDN: Firefox `media.autoplay.block-webaudio` defaults to true; audio contexts play only after sticky activation. https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- WebKit (2017 post, macOS focus): "assume any use of `<video>` or `<audio>` requires a user gesture". https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
- iOS: a search found developer reports that iOS requires a gesture before speech and a silent-utterance workaround; no first-party page confirmed current behaviour. **Unverified**.

### Recommendations
- A single "Enable sound" full-width button (icon + word, 56 px) on `/board` and `/staff`. On tap: create or resume `AudioContext`, play a 50 ms silent buffer, call `speechSynthesis.speak(new SpeechSynthesisUtterance(''))`, then `speechSynthesis.cancel()`, and store `soundUnlocked` in memory only.
- Show a red "Sound is off" badge until unlocked. Reloading the page needs another tap (activation does not persist across loads).
- Staff alarm: Web Audio oscillator beep loop (no file download), gated by `soundUnlocked`; also flash the urgent card and change the tab title, so a muted laptop still shows the flag.
- Board announcements: queue them, one at a time; wait for `utterance.onend`. Cancel a stale queue on reset.

## 7. Screen Wake Lock (waiting-room board)

### Facts
- BCD: Chrome and Edge 84+, Firefox 126+, Safari 16.4+, Samsung 14+. iOS Safari 18.4+; before that, 16.4 partial and "Does not work in standalone Home Screen Web Apps".
- MDN: secure context; locks are released automatically when the document becomes inactive, or by the system for low battery or power-save; re-acquire on `visibilitychange`; a request can be rejected. https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- The MDN page does not state a user-activation requirement.

### Recommendations
- Request on "Start board" click (same tap that unlocks sound). Re-request on `visibilitychange` and `fullscreenchange`. Show a small "Screen stays on: yes/no" indicator.
- If unsupported or rejected: tell the operator to set the OS screen timeout to never. A looping hidden-video "NoSleep" trick exists but is **Unverified** here; do not build it this weekend.

## 8. BroadcastChannel

### Facts
- Baseline widely available since March 2022. Scope is the same storage partition, "same origin" plus top-level site partitioning. Data is structured-cloned. https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
- BCD: Chrome 54, Firefox 38, Safari/iOS 15.4.

### Recommendations
- It only syncs tabs in one browser profile. It cannot sync a patient phone to a staff laptop, which is why ADR 0002 puts the server first. Keep it as the local fallback adapter only, and do not call the demo "live across devices" when running on this adapter.
- Private windows may be separate partitions (**Unverified**), so open all three demo tabs in one normal window profile.

## 9. Camera permission checklist

### Facts (MDN `getUserMedia`, 24 Oct 2026)
- Needs HTTPS or localhost. Prompts at least first time; the promise may never settle if the user ignores the prompt. `NotAllowedError` after denial.

### Recommendations
- Trigger the prompt from a "Scan QR" tap. Add a timeout of ~10 s with a "Still waiting? Type your token" hint.
- Stop tracks on unmount (`track.stop()`), or the camera stays on and a second scan fails with `NotReadableError`.
- Permissions-Policy: if you set a header, include `camera=(self)` and `microphone=(self)`.

## 10. PWA installability and offline with vite-plugin-pwa

### Facts
- Current plugin: `vite-plugin-pwa` 2.0.0, npm last-modified 3 Oct 2026; peer deps `vite` up to ^8 and `workbox-build` ^7.4.1 (npm registry, 24 Oct 2026).
- From plugin source (v2.0.0, read 24 Oct 2026): defaults include `navigateFallback: "index.html"` and `cleanupOutdatedCaches: true`. With `registerType: "autoUpdate"` it sets `skipWaiting` and `clientsClaim` true.
- Workbox 7.4.1 defaults: `globPatterns` is `**/*.{js,wasm,css,html}` (so no woff2, svg, png), `maximumFileSizeToCacheInBytes` is 2,097,152 (2 MiB).
- vite-pwa docs: manifest needs 192 and 512 px icons (plus `any` and `maskable`), `apple-touch-icon` 180 px, served over HTTPS as `application/manifest+json`. https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
- Chrome install criteria: manifest with name, 192 and 512 icons, `start_url`, `display`; HTTPS; user clicked at least once and viewed 30 s; `beforeinstallprompt` is Chrome-family only (BCD: Safari and Firefox false). https://web.dev/articles/install-criteria
- iOS Safari evicts script-writable storage including Cache API after 7 days without interaction, except for installed Home Screen apps. https://web.dev/articles/storage-for-the-web

### Inferences
- `autoUpdate` reloads on a new deploy and can discard in-progress registration state during judging. A deploy during judging is unlikely but a mid-demo reload would hurt.
- A service worker serving the cached shell for `/api/*` or the socket path would break live sync.

### Recommendations
- `registerType: "prompt"` (or `autoUpdate` only if all registration state is persisted). Freeze deploys after the release candidate, 25 Oct 15:00.
- `workbox.globPatterns: ['**/*.{js,css,html,woff2,svg,png,webp,json,wasm}']`; if self-hosting the QR wasm, it is under 2 MiB.
- `workbox.navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//]`. Do not use `runtimeCaching` for those.
- Offline UI (from brief): show "Queue position may be out of date. Last updated hh:mm" when `navigator.onLine` is false or the socket is down.
- Install button in Settings: show only when `beforeinstallprompt` fired; otherwise show the iOS "Share, then Add to Home Screen" text.
- Test with Chrome DevTools > Application > Offline and Lighthouse once, on the deployed URL (not localhost).

## 11. Small QR generators (bundle size)

Measured 24 Oct 2026 (minified, gzip -9, one entry that imports the main render function):

| Package | Version | Min | Gzip | Notes |
| --- | --- | --- | --- | --- |
| `uqr` | 0.1.3 (Apr 2026) | 10.7 kB | 4.2 kB | SVG string, tiny, young library |
| `qr-creator` | 1.0.0 (2022) | 11.9 kB | 4.9 kB | canvas output |
| `qrcode-generator` | 2.0.4 | 20.8 kB | 7.6 kB | SVG, canvas, data-URL, mature |
| `qrcode` | 1.5.4 | 24.8 kB | 9.6 kB | popular, browser build |

- Recommendation: `qrcode-generator` or `uqr`, rendered as inline SVG (matches "inline SVG, no image downloads"). Encode `https://<host>/t/<token>` (URL of the patient queue screen, no personal data beyond token). Use error correction level M, 4-module quiet zone, black on white even in high-contrast mode, so printing and scanning work.
- Confidence: sizes high (measured); long-term maintenance not assessed.

## 12. Devanagari font strategy without external requests

### Facts (measured from `@fontsource` 5.3.0 packages, 19 Jul 2026, OFL-1.1)
- `noto-sans-devanagari` static woff2: Devanagari subset 400 = 50 kB, 700 = 54 kB; Latin subset 43.9 kB.
- Variable `@fontsource-variable/noto-sans-devanagari`: Devanagari subset 121 kB (all weights), Latin 25 kB. CSS uses `unicode-range` so browsers fetch a subset only when characters need it (`unicode-range` supported since Chrome 1, Firefox 36, Safari 3, BCD).
- Odia (`@fontsource/noto-sans-oriya` Odia subset 400): 39 kB.

### Recommendations
- Import the two static weights (400, 700) of Devanagari (104 kB) and Latin 400/700 only if the UI font is Noto; otherwise keep a system Latin stack and ship Devanagari only.
- `font-display: swap`. Precache the woff2 files (see PWA section) so the Hindi UI renders offline.
- Font stack: `"Noto Sans Devanagari", "Nirmala UI", "Mukta", system-ui, sans-serif`. Nirmala UI and Android system Devanagari support are from memory: **Unverified**; the self-hosted file makes the point moot.
- Body text must stay at least 18 px (AGENTS.md rule 5); Devanagari matras need `line-height` of 1.6 or more or they clip. Check the largest text size at 360 px.
- Odia UI is out of scope unless the third-language add-on is chosen; if so add the 39 kB Odia file.

## 13. Print and save the OPD slip as an image

### Facts
- `canvas.toBlob`: Chrome 50, Firefox 18, Safari/iOS 11. `<a download>`: Chrome 14, Firefox 20, Safari 10.1, iOS 13 (BCD). `navigator.canShare` with files: Chrome Android 75, Safari/iOS 14, Chrome desktop 128 (BCD notes the older partial support on ChromeOS and Windows only). Web Share needs transient activation (MDN). https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- `document.fonts` and `FontFace`: Chrome 35, Firefox 41, Safari/iOS 10 (BCD) so `await document.fonts.ready` works before drawing.
- `html-to-image` 1.11.13 is 5.2 kB gzip (measured). `html2canvas` is 3.4 MB unpacked.

### Inferences
- DOM-to-image libraries rely on SVG `foreignObject` and font embedding; Devanagari fonts are the likely failure. Medium confidence, not tested.

### Recommendations
- Draw the slip directly: build it as an inline SVG (QR as SVG paths, text as `<text>`), then serialize, load into an `Image`, draw to a canvas after `document.fonts.ready`, `toBlob('image/png')`. Zero dependencies. Test the Hindi text.
- **Save**: use `navigator.canShare({files:[file]})` then `navigator.share`; else `<a download>`; else open the image in a new tab with "Press and hold to save".
- **Print**: a `@media print` stylesheet that shows only the slip (token, first name, department, room, QR), black on white, A6 or 80 mm width. Call `window.print()` from the button (blocked inside sandboxed iframes without `allow-modals`, BCD). Registration counter staff print; patients usually save.
- The slip shows token, first name and department only (AGENTS.md rule 3).

## Demo-day checklist (10 minutes before)

1. Open the live HTTPS URL on each device. Confirm padlock, no console errors.
2. **Board laptop**: Chrome or Edge; tap **Enable sound**; confirm "Sound on" and a test announcement in English and Hindi. If no Hindi voice, confirm text-only mode shows.
3. **Board**: tap **Start board**; confirm "Screen stays on". Set OS sleep to never. Plug in power.
4. **Staff laptop**: tap **Enable sound**; raise a test urgent flag; confirm the beep and the pinned flag; mark seen.
5. **Patient phone (Android Chrome)**: language, register, slip. Tap once on My turn, then add 20 demo patients and speed up; confirm banner, sound, vibration, and notification permission prompt appears from the button.
6. **Scan**: try the camera path; if it fails, type the token and the file-capture path.
7. **Offline**: toggle airplane mode on the phone; confirm the "may be out of date" line and the cached slip.
8. **Reload test**: reload all three screens; confirm sound badge returns to "off" and re-enable works.
9. Tabs: for the local adapter, all three tabs in one normal window profile.
10. Keep the recorded video as the backup if any step fails; do not deploy after 25 Oct 15:00.

## Open questions for the team

1. Which devices will judges use (Windows/Linux laptops vs Macs vs phones)? This decides how much the native BarcodeDetector matters.
2. Which machine runs the `/board`? We need to test its hi-IN and en-IN voices and wake lock before the video.
3. Do we pre-record board announcement clips, or accept text-only on machines with no Hindi voice?
4. Do we ship the third language (Odia)? There is no verified Odia browser voice, so Listen would be hidden and a font added.
5. `prompt` or `autoUpdate` for the service worker, given a frozen release at 15:00?
6. Who can test on a real iPhone? Several rows (voices, Speech Recognition on Safari, autoplay) are Unverified without one.
7. Is a short 40-clip audio set worth the time compared to polishing the demo script?

## Could not verify

- Browser-exposed voice lists per platform (Apple, Edge Natural voices, Chrome on Linux), and any `or-IN` voice.
- Chrome's server-side language support for `hi-IN`, `en-IN`, `or-IN` recognition.
- iOS current speech and Web Audio gesture rules and the silent-switch behaviour.
- Real-device behaviour of notifications on backgrounded Android tabs.
- Maintenance status of `qr-scanner` after 2022 beyond npm metadata.
