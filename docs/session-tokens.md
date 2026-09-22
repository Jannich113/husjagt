# Session token security (audit)

Spike for [#48](https://github.com/Jannich113/husjagt/issues/48). **Do not rewrite** `src/lib/auth/server.ts` — that cookie model is frozen.

## What a “session token” is here

| Token | Where | HttpOnly | Lifetime |
| --- | --- | --- | --- |
| Husjagt session (`__Host-grok-auth.session_token`) | Cookie, this origin only | Yes | Better Auth session (days) |
| Session cache (`__Host-grok-auth.session_data`) | Cookie | Yes (signed, 5 min) | 300 s |
| Preview bearer (`grok-auth.bearer-token`) | `sessionStorage` | No | Tab lifetime |
| PKCE verifier + GitHub secret (in-flight) | `sessionStorage` `husjagt-oauth-pending` | No | Until callback |
| Portal OAuth access/refresh | `localStorage` `husjagt-oauth` | No | Until disconnect |

Passwords are Better Auth hashes in `account.password`. Broker Google/X tokens are `encryptOAuthTokens: true` in the auth DB. They never reach the Husjagt client.

## What is already solid

- **`__Host-` prefix**: `Secure` + `Path=/` + no `Domain`. A sibling `*.grok.me` app cannot toss a `Domain=.grok.me` cookie onto this origin.
- **SameSite=Lax** plus **Fetch-Metadata** (`assertSameSiteRequest`): scripted same-site sibling `fetch` cannot ride the cookie into `authMiddleware` server functions.
- **CSRF / origin**: `trustedOrigins` on Better Auth POSTs (email sign-up/in). Do not disable this if you see “Invalid origin”.
- **No client-minted user id**: `requireUserId` / `getSession` only. Hunt blob reads/writes filter `user_id = context.userId`.
- **Bearer plugin** only when `Authorization` is present — deployed cookie path is unchanged.
- **OAuth code+PKCE**: popup posts the *code* (not the access token) to `window.opener` with `event.origin` check. Token URL allowlist blocks SSRF.
- **Hunt blob** does not include `husjagt-oauth`. Portal tokens stay off the server.

## Risks (ranked)

### 1. XSS steals anything not HttpOnly — **high if XSS exists**

Any script on this origin can read:

- preview bearer (`sessionStorage`)
- PKCE pending (code verifier + client secret)
- portal access/refresh tokens (`localStorage`)

The **deployed Husjagt session cookie cannot** be read by JS. That is the important one.

Mitigations we already lean on: React (no `dangerouslySetInnerHTML` in hunt UI), no user HTML in notes (plain textarea). **Do not** add `eval` / markdown HTML. A CSP (`default-src 'self'`) is the next real control — not done yet.

### 2. Preview bearer equals the session — **preview-only**

Partitioned iframe cookies cannot be sent, so the popup copies the session token into `sessionStorage` and `authMiddleware` forwards it on every server function. That is equivalent to a **non-HttpOnly session** for the Grok preview only. Tab close drops it. Deployed apps do not set this key.

### 3. Portal tokens + GitHub client secret in `localStorage` — **ours, fixable**

`husjagt-oauth` was persisting `clientSecret` next to `accessToken`. That is a stored password for the OAuth app, not just a user token. **Stop persisting `clientSecret`** after the code exchange (pending flow may still hold it in `sessionStorage` for one round-trip). Access tokens remain device-only until ACC-6 (WebCrypto wrap).

### 4. Token-exchange relay — **accepted**

`exchangeOAuthCode` sees `code`, `verifier`, and optional `clientSecret` for one request so we can bypass CORS. It must not log the body or write rows. Tokens return to the client only. Token host must be public HTTPS (`tokenUrlAllowed`).

### 5. `session_data` cookie cache (5 min)

Signed snapshot of the session. If you swap identity, the gate plugin expires this cookie so `/get-session` cannot serve the previous user. Do not lengthen `maxAge` casually.

## Rules we keep

1. Session identity = HttpOnly `__Host-` cookie (deployed) or preview bearer (sandbox only).
2. Never put the Husjagt session token in `localStorage`.
3. Never put portal tokens or client secrets in `hunt_blob` / Postgres.
4. Never log tokens, codes, verifiers, or passwords.
5. Do not turn off `trustedOrigins`, `__Host-`, or Fetch-Metadata isolation.
6. XSS is the remaining session-class bug class — treat any HTML injection as a session incident.

## Later (ACC-6)

Wrap class-C vault with WebCrypto (DEK from passkey PRF or account password). Until then, portal OAuth is “device local, XSS-visible”.
