# Accounts, tokens, and per-user data

**Status:** plan. Do not turn on Better Auth / Grok broker on the current `*.grok.me` origin.

This is the next product slice after the hunt backlog. It unblocks sync and, later, [#29 seller chat](https://github.com/Jannich113/husjagt/issues/29). It does **not** replace [#45](https://github.com/Jannich113/husjagt/issues/45) self-host.

## What we have today

Everything personal lives in the browser:

| Key | Data |
| --- | --- |
| `husjagt-favorites` | Saved houses + notes |
| `husjagt-hidden` | Dismissed ids |
| `husjagt-seen` / `husjagt-first-seen` | Seen + freshness |
| `husjagt-search-alerts` | Watched hunt + known case ids |
| `husjagt-keywords` | Keyword watchlist |
| `husjagt-social-watch` | Lyt accounts / tags |
| `husjagt-oauth` | OAuth2 connections (access/refresh tokens, device-only) |

No Husjagt account. No server copy. Clearing site data wipes the hunt. Two phones are two separate hunts.

## Three kinds of secret (do not mix)

| Class | Examples | Where it may live |
| --- | --- | --- |
| **A — session** | Husjagt sign-in cookie | httpOnly, Secure, same-origin cookie on **our** hostname. Never `localStorage`. |
| **B — hunt blob** | Hearts, notes, hidden, alerts, keywords, Lyt follows | Device first (IndexedDB). Optional encrypted copy on the server, scoped by `user_id`. Not a “secret”, but it is personal. |
| **C — vault** | Portal passwords, Boliga/DBA tokens, GitHub PAT, any API key the user pastes | **Ciphertext only** on the server. Plaintext only in memory on the device after unlock. Never logs, never git, never a world-writable table. |

Operator secrets for the *app itself* (VAPID private key, `DATABASE_URL`, GitHub deploy PAT) are **class D**: host env / GitHub Actions secrets. They are not user data and must not go into this vault UI.

[#45](https://github.com/Jannich113/husjagt/issues/45) / [#46](https://github.com/Jannich113/husjagt/issues/46) already forbid federating production login to `auth.grok.me`. Keep `VITE_AUTH_ENABLED=false` until we have our own origin.

## Recommended shape

```
┌──────── device ─────────┐     ┌────── our origin (after #45) ──────┐
│ IndexedDB UserBlob      │     │ users / sessions (Better Auth)     │
│ WebCrypto DEK           │◄──►│ user_blob (ciphertext + iv)        │
│ Vault entries (locked)  │     │ vault_item (ciphertext, never raw) │
└─────────────────────────┘     └────────────────────────────────────┘
```

- **Offline is the source of truth.** Sign-in is optional sync, not a gate on hunting.
- One versioned JSON blob for class B (`v`, `updatedAt`, stores…). Last-write-wins per field is enough for v1; no CRDT.
- Class C: one row per site `{ site, kind: "password"|"token"|"cookie", wrapped }`. AES-GCM. DEK wrapped with a passkey PRF or a user password (PBKDF2). If the user never sets a vault password, class C stays on-device only.
- Server functions that touch B or C use `authMiddleware` and `WHERE user_id = context.userId`. No client-supplied user id.

## What we will not do

- Store Boligsiden / Boliga / DBA passwords in Postgres in the clear.
- Turn on the Grok/Melvin broker “just to get accounts”.
- Put GitHub PATs in the repo, in chat, or in `localStorage`.
- Fake [#29](https://github.com/Jannich113/husjagt/issues/29) delivery when a portal has no public messaging API.
- Unowned DB rows for favorites (world-readable on an auth-off deploy).

## Stories

| ID | Slice | Can ship before self-host? |
| --- | --- | --- |
| **ACC-1** | Export / import hunt JSON (class B). Settings: *Eksporter data* / *Importer*. | Yes |
| **ACC-2** | Versioned `UserBlob` in IndexedDB; keep localStorage as a one-time migrate. | Yes |
| **ACC-3** | Vault UI (class C) on-device: add token, reveal once, delete. No server. | Yes |
| **ACC-4** | Own-origin sign-in (email/password or passkey). Blocked on #45. | No |
| **ACC-5** | Encrypted blob sync (class B ciphertext). Needs ACC-4. | No |
| **ACC-6** | Encrypted vault sync (class C ciphertext). Needs ACC-3 + ACC-4. | No |
| **ACC-7** | Revisit #29: connect portal → deep-link or real API only. | After ACC-3 |

Start at **ACC-1**. It is useful even if we never sign in, and it is the backup if a phone dies.

## OAuth 2.0 (ACC-3 slice)

Husjagt does **not** use the Grok/Melvin broker for this. Users bring their own OAuth client (Google / GitHub / X).

- Authorization Code + PKCE in the browser
- `/oauth/callback` returns the `code` to the opener
- Our server only **relays** the token request (avoids CORS); it does not store tokens
- Tokens land in `husjagt-oauth` on the device (class C, still plaintext in localStorage until ACC-6 encryption)
- Redirect URI to register at the provider: `{origin}/oauth/callback`
- Boligsiden / Boliga / DBA have **no** public OAuth; they stay out of the provider list

UI: **Konti** in the header.

## #29 (seller chat) after this

Most listing portals have **no** public inbox API. First honest product:

1. Vault holds “I have an account on X” + optional token.
2. Detail shows *Skriv til mægler* → open the listing / `tel:` / `mailto:` (already partly there).
3. In-app thread **only** if we later find a real API. Document misses; do not fake send.
