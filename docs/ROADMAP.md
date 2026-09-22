# Husjagt roadmap

**Now = Chrome PWA.** The TanStack Start / Vite site is the app. Install it from the published HTTPS origin (`*.grok.me`). The Android WebView APK is leftover / optional and is **not** required for daily use.

Default slice: Odense · villa / rækkehus / andelsbolig · max 2.000.000 kr.

Product epic: [#35](https://github.com/Jannich113/husjagt/issues/35). The old Android epic ([#1](https://github.com/Jannich113/husjagt/issues/1)) is superseded.

## Now

| ID | Story | Notes |
| --- | --- | --- |
| PWA | Chrome PWA is the product | Installable standalone, SW shell, Danish manifest, Del without APK |

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
| PWA-5 | Docs match the product | README + this file + leftover `android/` note |
| PWA-6 | Web Push spike | [docs/web-push.md](web-push.md) — **no Push in v1**; local badge first |

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
| S16 | Saved search alerts | Local badge on reopen (#17). Web Push is v2 only — see [web-push.md](web-push.md) |
| ACC | Accounts + vault | Plan: [accounts.md](accounts.md). Start with export/import; no Grok-broker login |
| S22+ | Street search, zones, keywords, … | Open issues on the board |
