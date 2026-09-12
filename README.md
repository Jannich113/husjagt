# Husjagt

Android app that lists Danish houses for sale matching your filters.

Default search matches this [Boligsiden query](https://www.boligsiden.dk/kommune/odense/tilsalg/villa,raekkehus,andelsbolig/kort?mapBounds=10.342263,55.333931,10.348721,55.34033&priceMax=2000000):

- Kommune: **Odense**
- Types: **villa, rækkehus, andelsbolig**
- Max price: **2.000.000 kr**

Live data is pulled from [Boligsiden](https://www.boligsiden.dk), which already aggregates the major Danish agencies — home, Nybolig, EDC, danbolig, Estate, LokalBolig, Realmæglerne and independents.

## Open in Android Studio

1. Clone this repo
2. Open the `android/` folder in Android Studio (Ladybug / Koala or newer)
3. Let Gradle sync, then Run on a device or emulator (API 26+)

```
android/
  app/src/main/java/dk/husjagt/
    data/     Boligsiden API client + models
    ui/       Compose list, filters, detail, saved
    MainActivity.kt
```

Command line:

```bash
cd android
./gradlew :app:assembleDebug
```

## Filters

| Filter | Notes |
| --- | --- |
| Kommune | All 98 Danish municipalities |
| Boligtype | Villa, rækkehus, andelsbolig, ejerlejlighed, … |
| Price | Min / max in DKK |
| Rooms | Minimum room count |
| Living area | Minimum m² |
| Map bounds | Optional bounding box (the original link used a ~400×700 m snippet in Odense) |
| Sort | Price, days on market, size |

Tap a house for photos, energy label, agency, liggetid and a link to the original listing.

## API

Public Boligsiden JSON (no key):

```
GET https://api.boligsiden.dk/search/list/cases
  ?municipalities=odense
  &addressTypes=villa,terraced house,cooperative
  &priceMax=2000000
  &sortBy=price
  &sortAscending=true
  &per_page=50
  &page=1
```

The HTTP client sends a browser `User-Agent`. Datacenter IPs may see Cloudflare; phones on residential networks typically do not.

## Roadmap

User stories live in [docs/ROADMAP.md](docs/ROADMAP.md).

## License

MIT
