# Husjagt

Danish house hunt. **Chrome PWA is the product** — install from the published HTTPS site. The Android WebView APK is a leftover wrapper and is **not** required for daily use.

Default search: **Odense** · villa / rækkehus / andelsbolig · max **2.000.000 kr**.

Listings come from [Boligsiden](https://www.boligsiden.dk), Boliga, GulogGratis, DBA, plus a **Lyt** tab for Instagram / TikTok reels. Pick any Danish city from **By i Danmark**.

## Modules

New hunt features are isolated modules. Register UI in [`src/lib/hunt/modules.ts`](src/lib/hunt/modules.ts), listing backends in [`src/lib/listings/sources.ts`](src/lib/listings/sources.ts). How to add or remove one: [`.grok/skills/hunt-modules/SKILL.md`](.grok/skills/hunt-modules/SKILL.md).

## Run

```bash
npm install
npm run dev
```

Dev server: `http://localhost:8080`.

```bash
npm run build
```

Canonical origin after publish: `https://husjagt.grok.me` (or any other HTTPS host). In Chrome (desktop or Android), use **Tilføj til hjemmeskærm** / Install. **Del** uses the system share sheet, with a clipboard fallback.

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/web-push.md](docs/web-push.md). Product epic: [#35](https://github.com/Jannich113/husjagt/issues/35).

## Leftover: Android WebView

Optional. Do not require it for hunt, share, or outbound links. Details: [`android/README.md`](android/README.md).

## License

MIT
