# Husjagt roadmap

The product right now is the **Android WebView**. The web hunt is on hold — it already loads inside the viewer.

Default slice: Odense · villa / rækkehus / andelsbolig · max 2.000.000 kr.

## Now

| ID | Story | Notes |
| --- | --- | --- |
| A1 | Android WebView shell | Full-screen `WebView` of the live site, Custom Tabs for agencies, offline retry, native Del |
| A2 | Start URL | `web_url` in `strings.xml` — set to the published `*.grok.me` after Publish |

## Done (web, frozen)

| ID | Story | Notes |
| --- | --- | --- |
| S1 | Live Boligsiden listings | Web app aggregates home, Nybolig, EDC, danbolig, Estate, … |
| S2 | Default filters | Odense, three types, `priceMax=2000000` |
| S3–S7 | List, filters, detail, map, saved | Rendered inside the WebView |
| S23 | Shareable hunt + listing links | Query-string hunt, native share sheet, grok.me deep links |

## Backlog

| ID | Story | Acceptance |
| --- | --- | --- |
| A3 | Gradle CI | GitHub Action runs `./gradlew :app:assembleDebug` on push |
| A4 | TWA / Play Digital Asset Links | Optional later, once the web origin is stable |
| S16 | Saved search alerts | On hold with the rest of the web app |
