# Husjagt roadmap

Split of the original task: an Android app that lists Danish houses for sale within filters, pulling from the major sites and agencies (via Boligsiden).

Default slice: Odense · villa / rækkehus / andelsbolig · max 2.000.000 kr.

## Done (MVP)

| ID | Story | Notes |
| --- | --- | --- |
| S1 | Search live Boligsiden listings | `BoligsidenClient` · home, Nybolig, EDC, danbolig, Estate, … |
| S2 | Default filters from the shared URL | Odense, three types, `priceMax=2000000` |
| S3 | Kommune + type + price + rooms + m² filters | Bottom sheet on the list screen |
| S4 | Listing cards | Price, address, m², rooms, energy, agency, liggetid |
| S5 | Listing detail | Photo, facts, open original Boligsiden URL |
| S6 | Save / unsave houses | In-memory favorites on the session |
| S12 | Sort control | Price, liggetid, m²-pris, ejerudgift, grund |
| S13 | Energy-label filter | A–G chips; A2010/A2015 count as A |

## Backlog

### Must

| ID | Story | Acceptance |
| --- | --- | --- |
| S7 | Map of current results | Same listings as the list; tap a pin → detail. Optional map-bounds filter from the original URL. |
| S8 | Persist saved houses | Survive process death (`DataStore` / Room). |
| S9 | Pagination / load more | Boligsiden `page` + `per_page`; do not cap at 50. |
| S10 | Gradle CI | GitHub Action runs `./gradlew :app:assembleDebug` on push. |

### Should

| ID | Story | Acceptance |
| --- | --- | --- |
| S11 | Photo gallery on detail | Swipe all case images, not only the cover. |
| S14 | Draw map bounds | Pinch/drag a box instead of the hardcoded Odense snippet. |
| S15 | Hide / dismiss a listing | Hidden ids stay out of list + map until reset. |

### Could

| ID | Story | Acceptance |
| --- | --- | --- |
| S16 | Saved search alerts | Re-run the current filter; badge / notify when a new case appears. |
| S17 | Notes on a saved house | Free-text per listing, stored with favorites. |
| S18 | Compare 2–3 houses | Side-by-side price, m², rooms, energy, ejerudgift. |
| S19 | Price history | Chart if Boligsiden exposes changes; else show `%` change only. |
| S20 | Realkredit sketch | Rough monthly payment from cash price (not advice). |
| S21 | Share listing | Android share sheet with address + Boligsiden URL. |
| S22 | Search by street / address | Free-text against the current kommune result set. |
