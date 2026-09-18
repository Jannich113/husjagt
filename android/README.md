# Android WebView (legacy)

**Leftover wrapper — do not require for daily use.**

Husjagt is a **Chrome PWA**. Hunt, Del, and agency links work in the installed site with no APK. This folder is an optional `WebView` around the same origin.

If you still build it:

1. Set `web_url` in [`app/src/main/res/values/strings.xml`](app/src/main/res/values/strings.xml) to the published HTTPS origin:

```xml
<string name="web_url">https://husjagt.grok.me</string>
```

2. Open this `android/` folder in Android Studio (API 26+), or:

```bash
cd android
./gradlew :app:assembleDebug
```

Same-origin navigation stays in the WebView. Outbound http(s) still opens in Chrome Custom Tabs. `HusjagtNative.share` is only used when Web Share is missing.

A Trusted Web Activity / Play listing (old roadmap A4) is **not** planned unless someone explicitly asks for it.
