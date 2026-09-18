# Husjagt roadmap

**Now = Chrome PWA.** The TanStack Start / Vite site is the app. Install it from the published HTTPS origin (`*.grok.me`). The Android WebView APK is leftover / optional and is **not** required for daily use.

Default slice: Odense · villa / rækkehus / andelsbolig · max 2.000.000 kr.

Product epic: [#35](https://github.com/Jannich113/husjagt/issues/35). The old Android epic ([#1](https://github.com/Jannich113/husjagt/issues/1)) is superseded.

## Now

| ID | Story | Notes |
| --- | --- | --- |
| PWA | Chrome PWA is the product | Installable standalone, SW shell, Danish manifest, Del without APK |
| PWA-5 | Docs match that | This file + root README + `android/` leftover note |
| PWA-6 | Web Push spike | Optional later — [#41](https://github.com/Jannich113/husjagt/issues/41); informs S16 |

## Done

| ID | Story | Notes |
| --- | --- | --- |
| S1–S7 | Hunt, filters, detail, map, saved | Web UI (localStorage hearts) |
| S23 | Shareable hunt + listing links | Query-string hunt, Web Share + clipboard, grok.me deep links |
| S24 | Lyt accounts + tags | Always-search Instagram/TikTok accounts; tag discovery |
| S29 | Unseen + seen pins | Grey-green seen pins; mark seen on explicit open |
| S30 | Newly listed | Ny i dag / Ny uge, Kun nye |
| PWA-1 | Service worker + offline shell | Last-search cache; prod-only SW |
| PWA-2 | Manifest icons + DA metadata | 192 / 512 / maskable, `lang: da` |
| PWA-3 | Install prompt + standalone | Tilføj til hjemmeskærm; hide studio in standalone |
| PWA-4 | Share + outbound without APK | `navigator.share`; `noopener noreferrer` |

## Leftover Android (optional)

Do **not** require the APK. Wrapper lives under `android/` — see [`android/README.md`](../android/README.md).

| ID | Story | Status |
| --- | --- | --- |
| A1 | WebView shell | Leftover — Custom Tabs + native Del still in the APK only |
| A2 | Start URL | `web_url` in `strings.xml` if you still build the APK |
| A3 | Gradle CI | **Cancelled** — not needed while Chrome PWA is the product |
| A4 | TWA / Play Digital Asset Links | **Deferred** unless a Play TWA is explicitly wanted later |

## Backlog (web)

| ID | Story | Notes |
| --- | --- | --- |
| S16 | Saved search alerts | Local filters; Web Push is a spike first (PWA-6) |
| S22+ | Street search, zones, keywords, … | Open issues on the board |
