# Husjagt

Danish house hunt. Web app plus a thin Android WebView wrapper.

Default search: **Odense** · villa / rækkehus / andelsbolig · max **2.000.000 kr**.

Listings are aggregated from [Boligsiden](https://www.boligsiden.dk), Boliga, GulogGratis, DBA, plus a Lyt tab for Instagram / TikTok reels of private ads.

## Web app

TanStack Start (Vite) PWA. From the repo root:

```bash
npm install
npm run dev
```

Opens on `http://localhost:8080`. Production:

```bash
npm run build
```

Point the published host at `husjagt.grok.me` (or any other origin) after **Publish** in Grok Build.

## Android wrapper

One `WebView` loads the live site. Same-origin navigation stays in-app; agency links open in Chrome Custom Tabs. **Del** uses the Android share sheet.

Set `web_url` in [`android/app/src/main/res/values/strings.xml`](android/app/src/main/res/values/strings.xml), then open `android/` in Android Studio (API 26+):

```xml
<string name="web_url">https://husjagt.grok.me</string>
```

```bash
cd android
./gradlew :app:assembleDebug
```

## License

MIT
