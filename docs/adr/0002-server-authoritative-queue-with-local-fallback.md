---
status: superseded by 0004
---

# Server-authoritative queue state behind a Store interface

Judges open the live URL on their own devices, so the patient screen, staff dashboard and board must sync across devices, not only across tabs. A server owns the queue state. App code talks to a `Store` interface, and one pure `Authority` (decide, reduce, project) sits behind it.

Accepted on 24 Oct 2026 in #11, with one change from the first draft. The `LocalStore` adapter (localStorage plus BroadcastChannel) was meant to cover a sleeping free-tier server. It is now a stretch item (`docs/plan/scope.md`). The interface stays, so the adapter can be added later without touching screens. A fallback never switches on silently, because a phone showing a one-browser queue as if it were the hospital queue is wrong information.

The in-process `MemoryStore` is a different thing. It is a development and test double, about 20 lines, so UI work does not wait for the server.

Reopen this ADR if the first-hour test shows that a WebSocket on the free Render tier does not survive sleep, wake and reconnect.

## Considered options

- Local only (the prompt's default). Works anywhere, but a patient phone cannot talk to a staff laptop.
- Server only, with no adapter seam. Simplest, but adding a fallback later means touching every screen.
- Firebase or Supabase instead of our own server. Less code, but it weakens the Render track entry.
