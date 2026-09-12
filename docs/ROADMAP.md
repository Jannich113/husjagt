# Husjagt roadmap

The Android app is a WebView over the Husjagt web app. Product work lives in the web UI; this repo is the Play-store shell.

Default slice: Odense · villa / rækkehus / andelsbolig · max 2.000.000 kr.

## Done

| ID | Story | Notes |
| --- | --- | --- |
| S1 | Live Boligsiden listings | Web app aggregates home, Nybolig, EDC, danbolig, Estate, … |
| S2 | Default filters from the shared URL | Odense, three types, `priceMax=2000000` |
| S3–S6 | List, filters, detail, saved | Rendered by the web app inside the WebView |
| S7 | Map of current results | Leaflet in the web app |
| S8 | Persist saved houses | WebView `localStorage` |
| A1 | Android shell | `MainActivity` WebView + Custom Tabs + offline retry |

## Backlog

| ID | Story | Acceptance |
| --- | --- | --- |
| A2 | Configurable start URL | `web_url` in `strings.xml` — set to the published `*.grok.me` (or custom domain) after Publish |
| A3 | Gradle CI | GitHub Action runs `./gradlew :app:assembleDebug` on push |
| A4 | TWA / Play Digital Asset Links | Optional later, once the web origin is stable |
| S16 | Saved search alerts | Re-run the current filter; notify when a new case appears |
