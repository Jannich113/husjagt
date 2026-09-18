# S31 — Safe local credential handling (research spike)

**Issue:** [#32 — S31: Research spike — safe local credential handling for portal logins](https://github.com/Jannich113/husjagt/issues/32)  
**Blocks:** [#29 — S28: Unified seller chat across listing sites](https://github.com/Jannich113/husjagt/issues/29)  
**Date:** 2026-09-18 (CEST)  
**Status:** Research only — **does not implement storage**. S28 (#29) stays blocked on this note.

---

## Answer first

| Surface | Store locally? | What is encrypted at rest? |
| --- | --- | --- |
| **Android WebView** | **Yes** — prefer portal **session cookies** / OAuth tokens in `CookieManager`, not passwords. | App private data sits under Android **file-based encryption (FBE)** (credential-encrypted after unlock). WebView/Chromium **does not** apply a separate OSCrypt layer to cookies on Android (unlike desktop Chrome). HttpOnly limits *script* access; it is **not** at-rest encryption. |
| **Chrome PWA** | **Yes for sessions** (cookies). **No** for plaintext portal passwords in `localStorage` / IndexedDB. | Cookies / `localStorage` / IndexedDB are **not** app-level encrypted beyond OS disk / profile protection. Same-origin isolation ≠ encryption. |

**v1 recommendation (normative for Husjagt):**

1. **Local-only** — never send Boligsiden / Boliga / GulogGratis / DBA (etc.) passwords to Husjagt servers, logs, analytics, crash reports, or git.
2. Prefer **session cookie / OAuth / magic link**; do not persist the password if a cookie is enough.
3. On Android, if a secret must persist beyond the cookie jar: **Android Keystore** (hardware-backed when available) wrapping ciphertext; never plaintext `SharedPreferences` / DataStore / files.
4. Explicit **“Forget this login”** that clears WebView cookies for that origin (+ any keystore-wrapped secret + related prefs).
5. PWA path: rely on **browser password manager / Credential Management / WebAuthn** — never roll our own password in `localStorage`.

> **Uncertainty:** Exact on-disk layout of System WebView cookie SQLite varies by WebView provider version; Chromium’s public stance is that on Android the *profile* is protected rather than per-cookie OSCrypt. Treat “cookies are Keystore-encrypted” as **false** unless we re-verify against the shipped WebView AOSP/Chromium revision.

---

## Context

Husjagt is an **Android WebView** shell around Danish housing portals, with a **Chrome PWA** surface in play for the web hunt. [#29](https://github.com/Jannich113/husjagt/issues/29) needs “connect account once → message seller” without jumping apps. Before any storage lands, this spike records what is safe.

This document is the design note for [#32](https://github.com/Jannich113/husjagt/issues/32). It will live as `docs/credentials.md` in-repo. **No app code** is introduced here.

---

## 1. Can we store locally? Encryption at rest

### 1.1 Android WebView

| Store | OK for secrets? | At-rest story |
| --- | --- | --- |
| `CookieManager` session / persistent cookies | **Preferred** for portal sessions | Persisted under the app’s private data. Protected by **app sandbox + FBE** when the device uses file-based encryption. **No** documented WebView API that encrypts cookie *values* with Android Keystore. HttpOnly / Secure / SameSite are transport & script-access controls, not disk encryption. |
| `SharedPreferences` (plaintext) | **Never** for passwords / tokens | XML on disk; readable with root / backup / debug pull. |
| Jetpack `EncryptedSharedPreferences` | Historically yes; **API deprecated** (2026 guidance: prefer platform Keystore + Tink / encrypted DataStore) | Keys+values encrypted; master key in Android Keystore. **Must exclude from Auto Backup** — restore without the Keystore key yields unusable ciphertext. |
| Encrypted DataStore (`datastore-tink` / `AeadSerializer`) or Tink + Keystore | **Yes** for any secret we must keep | AEAD ciphertext on disk; keyset wrapped with `android-keystore://…`. |
| WebView `localStorage` / IndexedDB (page origin) | **No** for passwords | Same as Chrome web storage: not Keystore-encrypted. |
| Clipboard / Intent extras / Logcat | **No** | Transient or world-readable in common failure modes. |

**Primary sources**

- [Android Keystore system](https://developer.android.com/privacy-and-security/keystore) — non-exportable keys; optional TEE / StrongBox; user-auth bindings.
- [CookieManager](https://developer.android.com/reference/android/webkit/CookieManager) — WebView cookie jar; `flush()`, `removeAllCookies()`, `removeSessionCookies()`.
- [EncryptedSharedPreferences](https://developer.android.com/reference/androidx/security/crypto/EncryptedSharedPreferences) — encrypts prefs; **deprecated**; warning: do not Auto Backup.
- [Jetpack Security releases](https://developer.android.com/jetpack/androidx/releases/security) — deprecates security-crypto in favour of platform Keystore / existing APIs.
- [DataStore + datastore-tink](https://developer.android.com/jetpack/androidx/releases/datastore) — `AeadSerializer` + `AndroidKeysetManager` with `android-keystore://master_key`.
- [File-based encryption (AOSP)](https://source.android.com/docs/security/features/encryption/file-based) — CE vs DE storage.
- Chromium `cookie_store_util.cc` — OS cookie crypto delegate is used on **desktop** OSes; comment states ChromeOS/Android already protect the **entire profile**, so Android returns no OSCrypt cookie delegate in that build path:  
  <https://chromium.googlesource.com/chromium/src/+/HEAD/components/cookie_config/cookie_store_util.cc>

**Uncertainty:** Whether a given OEM’s WebView build still matches upstream “no OSCrypt on Android” is not re-proven on every WebView update. Operational rule: **assume cookies are sandbox + FBE only**.

### 1.2 Chrome PWA

| Store | OK for secrets? | At-rest story |
| --- | --- | --- |
| HttpOnly `Secure` session cookies | **Preferred** | Profile storage; on Android, profile protection — **not** application-controlled Keystore wrapping. |
| Chrome / Google Password Manager (Autofill) | **Preferred** if the *portal* origin owns the password | Managed by the browser; sync behaviour is a user/Google-account risk (see threats). Husjagt must not scrape these into app storage. |
| Credential Management API (`PasswordCredential`) | **OK** as hand-off to the UA password manager | Spec: [Credential Management Level 1](https://www.w3.org/TR/credential-management-1/). Stores via the **user agent**, not via our IndexedDB. |
| WebAuthn / passkeys | **Best** where portals support it | Authenticator-held private keys; [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API), [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/). Husjagt cannot invent passkeys for third-party portals. |
| `localStorage` / sessionStorage | **Never** for passwords | Plaintext in profile files. |
| IndexedDB | **Never** plaintext passwords; ciphertext only if user-held passphrase / WebAuthn-wrapped vault key | Files on disk are readable with profile access; XSS sees plaintext after decrypt in JS. |
| Cache Storage / Service Worker | **No** for secrets | Same disk exposure class. |

**Primary sources**

- [Credential Management Level 1](https://www.w3.org/TR/credential-management-1/)
- [How Chrome protects autofill and password data](https://support.google.com/chrome/answer/14271924)
- Industry consensus (not a W3C guarantee): IndexedDB/localStorage are **not** encrypted at rest by the browser beyond OS/profile protections.

---

## 2. State of the art — prefer in this order

### 2.1 Do not store the password if a session is enough

1. Let the user sign in **inside WebView** (or Chrome) on the **portal origin**.
2. Keep the resulting **session cookie** (ideally `HttpOnly; Secure; SameSite=…`).
3. Use `CookieManager` / browser cookie jar for subsequent chat/API navigations.
4. Prefer OAuth / magic-link / portal SSO when available — still local session only.

`CookieManager` is already the OS-backed jar for the app’s WebViews. That is the v1 happy path for Danish portals that only expose cookie sessions.

### 2.2 Android — if we must persist a secret

Order of preference:

1. **Avoid persistence** — re-auth when the session dies.
2. **Android Keystore** hardware-backed AES/GCM (or StrongBox when available and appropriate) to wrap any DEK.
3. Ciphertext in **encrypted DataStore (Tink AEAD)** or an encrypted file — **not** plaintext prefs.
4. Optionally gate key use with **user authentication** (`setUserAuthenticationParameters` / biometrics) so a stolen unlocked process still faces friction.
5. **Android Credential Manager / Autofill** for credentials that belong in the system password manager — do not duplicate them in app storage.

**Do not use** plaintext `SharedPreferences`, unencrypted DataStore, Room without SQLCipher (and even then: protect the passphrase with Keystore), or embedding a key in the APK / JS bundle.

> **Note (2026):** `androidx.security.crypto.EncryptedSharedPreferences` / `MasterKey` are **deprecated**. Still conceptually correct (Keystore-wrapped AEAD), but new code should follow current Jetpack guidance: **Keystore + Tink** and/or **`datastore-tink`**. Flag: migration docs are still maturing — verify artifact stability before locking an implementation issue.

### 2.3 Web / PWA — never put passwords in `localStorage`

Options if the PWA must remember something:

| Option | Mechanism | Verdict for Husjagt v1 |
| --- | --- | --- |
| (a) User passphrase → Argon2id/scrypt → AES-GCM in IndexedDB | Real at-rest crypto; UX cost; XSS still catastrophic once unlocked | Defer — overkill if Android WebView is primary |
| (b) WebAuthn / passkey wrapping a vault key | Strong; needs user ceremony | Defer unless we build a first-party vault |
| (c) OS / browser password manager via Credential Management + Autofill | Password lives with Chrome/GPM, not our origin storage | **Preferred** for PWA |
| JS-only key in the bundle | Security theatre | **Forbidden** |

### 2.4 Never send portal passwords to Husjagt

Hard rules:

- No portal password in HTTP bodies to Husjagt backends.
- No passwords in structured logs, Sentry/Crashlytics breadcrumbs, analytics events, or debug builds that ship off-device.
- No secrets in git (`.env` samples must be empty placeholders).
- No cloud backup of secrets unless the user **opts in** and the blob is **passphrase-wrapped** (v1: **no cloud copy at all**).

---

## 3. Threats

| Threat | WebView / Android | Chrome PWA | Mitigation for v1 |
| --- | --- | --- | --- |
| **Root / compromised device** | Attacker can read app CE storage once unlocked; may use Keystore keys *in-process* but not extract hardware-bound key material | Full profile access | Accept residual risk; Keystore still raises bar vs plaintext; no server copy limits blast radius |
| **XSS in PWA / injected WebView content** | Malicious script on portal origin reads non-HttpOnly cookies & any JS-visible secrets | Same | Prefer HttpOnly cookies; never stash passwords in JS-readable storage; tight WebView allowlists / no `addJavascriptInterface` for secrets |
| **Backup / sync** | Auto Backup can upload prefs/DB unless excluded; Keystore keys **do not** restore → ciphertext orphan or worse if plaintext leaked into backup | Chrome Sync / GPM syncs saved passwords with the Google Account (encryption model depends on sync passphrase settings) | Exclude secret files from Auto Backup / `dataExtractionRules`; v1: **no** Husjagt cloud backup of portal secrets; do not call `navigator.credentials.store` for *portal* passwords from a Husjagt origin (wrong RP) |
| **Clipboard** | Paste of password into WebView; other apps on older Android; clipboard managers | Same | Prefer OS Autofill over paste; mark sensitive clips where we control copy; clear ASAP; educate in UI |
| **Screenshots / Recents / screen share** | Login UI can appear in screenshots, cast, Recents thumbnails | Browser may still allow screenshots | `FLAG_SECURE` on native login / WebView activities that show secrets ([Android fraud-prevention / secure activities](https://developer.android.com/security/fraud-prevention/activities)); accept that FLAG_SECURE is not absolute on rooted devices |

Additional notes:

- **Auto Backup:** defaults include SharedPreferences and many app files. EncryptedSharedPreferences docs explicitly warn: **exclude from backup**. Use `android:fullBackupContent` / `android:dataExtractionRules`. Prefer `getNoBackupFilesDir()` for secret ciphertext if not using encrypted DataStore exclusions. Docs: [Auto Backup](https://developer.android.com/identity/data/autobackup).
- **Chrome sync:** saved portal passwords in GPM follow the user’s Google Account. That is *user-controlled*, not Husjagt-controlled — fine as long as **we** never exfiltrate them.
- **WebView third-party cookies:** default deny on modern targets — portal SSO flows may need careful first-party navigation, not blanket third-party enablement.

---

## 4. v1 recommendation (actionable)

**Product stance**

- **Local-only** portal sessions and (if unavoidable) secrets.
- **OS Keystore** on Android for any non-cookie secret.
- **No server copy** of portal passwords or session cookies.
- Explicit **Forget this login** per portal (and “Forget all”).

**Implementation sketch (for a future issue — not this spike)**

1. Sign-in UX: Custom Tab or in-app WebView navigates to portal login URL (allowlisted hosts only).
2. On success: rely on `CookieManager` cookies for that host; optionally record *metadata* only (portal id, username display, expiry hint) in ordinary prefs.
3. “Forget this login”: `CookieManager.removeAllCookies` scoped approach — clear cookies for that portal’s hosts; delete any Keystore alias + ciphertext; update UI to “Not connected”.
4. Backup rules: exclude keysets, encrypted stores, and WebView data directories that hold cookies if feasible; set `allowBackup` policy consciously.
5. Logging policy: redacting middleware; assert no `password=` in OkHttp/WebView debug logs.
6. PWA: deep-link / “open in Chrome” for portals that refuse WebView; never duplicate password into Husjagt IndexedDB.

**Out of scope for v1**

- Husjagt-operated credential vault in the cloud.
- Scraping Google Password Manager.
- Implementing Argon2id vault in the PWA.
- Claiming WebView cookies are Keystore-encrypted (they are not, per Chromium Android path).

---

## 5. Spike scope — what this note does *not* do

- **Does not implement** Keystore, EncryptedSharedPreferences, DataStore, CookieManager wiring, UI, or backup XML.
- **Does not** unblock coding for account linking until an implementation story cites this note.
- **[#29 S28 Unified seller chat](https://github.com/Jannich113/husjagt/issues/29) remains blocked** on acceptance of this research (per [#32](https://github.com/Jannich113/husjagt/issues/32)).

Suggested follow-ups (separate issues):

1. Android: “Forget login” + CookieManager session lifecycle + backup exclusion XML.
2. Android: Keystore-wrapped token store **only if** a portal requires a refresh secret beyond cookies.
3. Threat-model test plan (root backup pull, Logcat password grep, screenshot Recents check).
4. Portal matrix: which of Boligsiden / Boliga / GulogGratis / DBA expose OAuth vs password+cookie only (**uncertain until probed**).

---

## Sources (primary-first)

| Topic | URL |
| --- | --- |
| Android Keystore | https://developer.android.com/privacy-and-security/keystore |
| EncryptedSharedPreferences (deprecated) | https://developer.android.com/reference/androidx/security/crypto/EncryptedSharedPreferences |
| Jetpack Security | https://developer.android.com/jetpack/androidx/releases/security |
| DataStore / datastore-tink | https://developer.android.com/jetpack/androidx/releases/datastore |
| CookieManager | https://developer.android.com/reference/android/webkit/CookieManager |
| Auto Backup | https://developer.android.com/identity/data/autobackup |
| File-based encryption | https://source.android.com/docs/security/features/encryption/file-based |
| Secure activities / FLAG_SECURE guidance | https://developer.android.com/security/fraud-prevention/activities |
| Chromium cookie OS crypto (desktop vs Android) | https://chromium.googlesource.com/chromium/src/+/HEAD/components/cookie_config/cookie_store_util.cc |
| Credential Management L1 | https://www.w3.org/TR/credential-management-1/ |
| WebAuthn (MDN) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API |
| Chrome autofill / password protections | https://support.google.com/chrome/answer/14271924 |
| Issue #32 | https://github.com/Jannich113/husjagt/issues/32 |
| Issue #29 (blocked) | https://github.com/Jannich113/husjagt/issues/29 |

---

## Decision log

| Decision | Choice |
| --- | --- |
| v1 storage locus | Device only |
| v1 secret material | Session cookies first; Keystore-wrapped ciphertext only if required |
| Plaintext prefs / localStorage passwords | Forbidden |
| Husjagt server / logs / git | Forbidden for portal passwords |
| EncryptedSharedPreferences | Acceptable concept; prefer Keystore+Tink/DataStore for new code (ESP deprecated) |
| Unlocks #29? | **No** — this spike only; implementation still required |

