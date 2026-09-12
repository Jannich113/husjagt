# Husjagt

Android wrapper around the **Husjagt** web app. One `WebView` loads the live site — list, map, filters, saved houses — instead of a separate native UI.

Default search matches this [Boligsiden query](https://www.boligsiden.dk/kommune/odense/tilsalg/villa,raekkehus,andelsbolig/kort?mapBounds=10.342263,55.333931,10.348721,55.34033&priceMax=2000000):

- Kommune: **Odense**
- Types: **villa, rækkehus, andelsbolig**
- Max price: **2.000.000 kr**

Listings come from [Boligsiden](https://www.boligsiden.dk), which already aggregates home, Nybolig, EDC, danbolig, Estate, LokalBolig, Realmæglerne and independents.

## Point the app at the web version

The WebView loads `web_url` in [`android/app/src/main/res/values/strings.xml`](android/app/src/main/res/values/strings.xml):

```xml
<string name="web_url">https://husjagt.grok.me</string>
```

Replace that with the URL you get after **Publish** in Grok Build (`*.grok.me`), or any other host you deploy the web app to.

Same-origin navigation (list → house → back) stays inside the app. Boligsiden/agency links open in Chrome Custom Tabs. Offline / failed loads show a retry screen.

## Open in Android Studio

1. Clone this repo
2. Set `web_url` as above
3. Open the `android/` folder in Android Studio (Ladybug / Koala or newer)
4. Run on a device or emulator (API 26+)

```
android/
  app/src/main/java/dk/husjagt/
    MainActivity.kt   WebView, back stack, Custom Tabs
    HusjagtApp.kt
```

Command line:

```bash
cd android
./gradlew :app:assembleDebug
```

## What the web app does

| Filter | Notes |
| --- | --- |
| Kommune | All 98 Danish municipalities |
| Boligtype | Villa, rækkehus, andelsbolig, ejerlejlighed, … |
| Price | Min / max in DKK |
| Rooms / m² / lot / year | Range filters |
| Energy | A–G |
| Map | Pins for the current result set |
| Saved | Hearts, stored in the WebView’s localStorage |

## License

MIT
