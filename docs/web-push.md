# Web Push for saved-search alerts (PWA-6 spike)

**Status:** research only. No Push handlers in `public/sw.js`, no permission prompt, no subscription store.

Informs [S16 — saved search alerts (#17)](https://github.com/Jannich113/husjagt/issues/17). Does **not** ship alerts.

Husjagt today: Chrome PWA, no accounts, no database. Hunt filters and hearts live in `localStorage`. The service worker (`public/sw.js`) is an app-shell cache (PWA-1). It does not handle `push` / `notificationclick`.

---

## What Web Push actually needs

A notification that fires while the tab is closed is **not** local. The browser’s push service (FCM on Chrome, Mozilla on Firefox, APNs on iOS Safari) holds a device endpoint. **Our origin** must:

1. Ask for `Notification` permission (user gesture).
2. `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
3. Send `{ endpoint, p256dh, auth }` to **our** server.
4. Later, when a new listing matches, the server signs a payload with **VAPID** and POSTs it to the endpoint.
5. The service worker’s `push` event shows `self.registration.showNotification(...)`.
6. `notificationclick` opens `/` with the saved hunt query.

Without a server that stores endpoints and decides “this hunt has a new case id”, there is nothing to push.

Periodic Background Sync (`periodicSync`) is a different API: Chrome Android may wake the SW about once a day, still on-device. It is **not** Web Push, not available on iOS or desktop Chrome, and not guaranteed. Fine as an opportunistic extra; not an S16 v1 backbone.

---

## VAPID keys

- One origin-wide key pair (`npx web-push generate-vapid-keys`).
- **Public** key goes to `subscribe({ applicationServerKey })`.
- **Private** key stays in server env — never git, never the SW, never `localStorage`.
- Header `Authorization: vapid t=…, k=…` plus `TTL` (hours, not weeks).
- Rotate: new pair + re-subscribe; old endpoints 410 Gone.

The published host (`*.grok.me`) must be HTTPS. `localhost` works for a lab; the Grok preview iframe does not (no SW in the embedded studio, and permission UX is wrong in a nested frame).

---

## Permission UX (Danish)

Ask **after** the buyer has a hunt they care about — never on first paint, never in the same breath as “Tilføj til hjemmeskærm”.

Suggested copy, only from a tap on a saved hunt:

> **Få besked om nye boliger?**  
> Vi giver et skub, når der kommer et nyt hus i *Odense* under 2 mio. kr.  
> Ingen konto. Du kan slå det fra under Del / indstillinger.  
> [Ikke nu]  [Tillad beskeder]

If they deny: stay quiet. Chrome will not show the prompt again for a long time. Offer “Åbn Chrome-indstillinger” only as a link, never a second fake prompt.

On grant: subscribe, POST the endpoint, confirm with an **already-visible** in-app line (“Beskeder er slået til”) — do not fire a test notification unless they tap “Send en prøve”.

Denied / default: S16 still works as a **badge when they reopen** Husjagt.

---

## Chrome vs desktop vs iOS

| Surface | Push while closed? | Notes |
| --- | --- | --- |
| Chrome Android, **installed PWA** | Yes | Best path. `userVisibleOnly` required; silent push is blocked. |
| Chrome Android, tab only | Yes, with caveats | Permission + SW; more likely to be rate-limited / battery-killed. |
| Chrome desktop | Yes if Chrome can run | Windows Focus Assist / macOS can swallow it. Installed PWA is more reliable than a random tab. |
| iOS / iPadOS Safari | **Only** if Add to Home Screen (16.4+) | Gesture-gated permission; no push in an ordinary Safari tab; WebView/APK does **not** get Safari push. |
| Firefox Android / desktop | Yes | Same VAPID flow, different push service URL. |
| Leftover Android WebView APK | No Web Push | Would need FCM in Kotlin. Out of scope — PWA is the product. |

Do not promise “besked på iPhone” unless they installed the PWA.

---

## Backend fan-out (if we ever do v2)

We would add a store we do not have today. Minimum viable:

| Piece | Option | Why |
| --- | --- | --- |
| Subscription rows | KV / SQLite / one small table `{endpoint, keys, hunt, seenIds, updatedAt}` | No user account — the endpoint **is** the identity |
| Matcher | Cron 1–6 h: `searchHousesFast(hunt)` → diff case ids | Same aggregator as the live hunt; no extra portal logins |
| Sender | `web-push` / Web Push protocol | One payload: title, body, `data.url` = hunt link |
| Cap | 1 hunt per endpoint; drop 410/404; TTL 90 days idle | Stops unbounded Boligsiden polling |

**Do not** put hearts, notes, or portal passwords on that row. Hunt query (kommune, types, max price) is enough.

Fan-out cost is dominated by **polling listings**, not by FCM (transport is free at this scale). A few thousand endpoints × hourly Boligsiden is the thing to budget and rate-limit. Rough: tens of dollars/month in worker time before it is a product problem; the privacy and “we now have a server” cost is larger than the invoice.

---

## Privacy

A push `endpoint` is a persistent device identifier. Combined with a hunt (Odense, villa, 2 mio.) it is personal data under GDPR.

v2 rules if we build it:

- Lawful basis: consent (the Tillad tap).
- No email, no name, no precise GPS.
- “Stop beskeder” deletes the row (and `unsubscribe()`).
- Unused endpoints expire.
- Payload is listing count + hunt name, not a dossier of every new house (that belongs in the app after tap).
- Logs: status codes, not URLs of endpoints.

Fits the same posture as [docs/credentials.md](credentials.md): on-device first; anything that leaves the phone is explicit.

---

## Recommendation for v1

**Do not ship Web Push for S16 v1.**

S16 says *no account required (local)* and *notify on new case ids*. That is already true without a push service:

1. Persist the active hunt (we already share it as a URL; store the last snapshot of case ids in `localStorage`).
2. On open (and on `visibilitychange`), run the hunt, diff ids, show a **Ny** badge / “3 nye i Odense”.
3. Optional later: Chrome Android `periodicSync` to refresh the snapshot — still local, still no VAPID.

Why not Push in v1:

- It forces a server and a personal-data store, against the current PWA (no auth, no DB).
- Permission UX is easy to burn; iOS only works if installed.
- The leftover APK cannot receive these pushes anyway.
- Installability (PWA-1–5) does not depend on it.

**v2 (only if S16 local badges are not enough):** opt-in Web Push as above, one hunt per device, cron fan-out, Danish copy, VAPID in env. Track as a child of #17, not as a PWA install story.

S16 is **unblocked for the local badge slice**. Web Push is **not** a blocker for that slice; it is a later, optional server-backed extra.

---

## Out of scope for this spike

- No `push` / `notificationclick` in `public/sw.js` (cache bump stays a SHELL string only).
- No `Notification.requestPermission` in the UI.
- No VAPID in the repo.
- No saved-search alert implementation (that is #17).
