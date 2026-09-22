# JWT signature vulnerabilities (audit)

Husjagt does **not** mint JWTs for login. The Husjagt session is a Better Auth **HMAC-signed cookie** (`__Host-grok-auth.session_token`), looked up in the session table. `verify.server.ts` says this on purpose: *no client-minted JWT*.

The only JWT we verify is the **Grok gate identity** on `x-grok-identity` (`src/lib/auth/gate-identity.server.ts`). Portal OAuth access tokens are treated as **opaque** strings; we never `jwt.decode` them.

Do not rewrite the gate verifier — it is template-owned. Attack cases live in `src/lib/security/jwt-attacks.test.ts`.

## Classic JWT signature bugs vs this verifier

| Attack | What it is | Here |
| --- | --- | --- |
| **`alg=none`** | Header says unsigned; library accepts the payload | **Blocked.** `jwtVerify(..., { algorithms: ["EdDSA"] })`. Unsigned tokens return `null`. |
| **HMAC/RSA confusion** | `alg=HS256` with the *public* key used as HMAC secret | **Blocked.** Algorithm allowlist is EdDSA only. Key import is `importJWK(key, "EdDSA")`. |
| **`alg` confusion RS256/ES256** | Attacker picks a weaker/other alg the lib still verifies | **Blocked.** Same allowlist. RS256 tokens return `null`. |
| **Key injection via `kid`** | `kid` is a path/URL/SQL; server fetches attacker key | **Blocked.** `kid` is only an exact match into a JWKS we fetched from a **fixed** gate origin (`https://gate.grok.me` / testing / loopback). Not interpolated into a URL. |
| **JWKS confusion** | Host header points JWKS at the attacker | **Blocked.** `Host` / `X-Forwarded-Host` only picks a **hard-coded issuer** (`gate.grok.me`), never `https://${host}/jwks`. Fetch uses `redirect: "manual"`. |
| **Plant `oct` key in JWKS** | Symmetric key in the key set, then HS256/EdDSA | **Blocked.** Resolver requires `kty === "OKP" && crv === "Ed25519"`. |
| **Same `kid`, different key** | Token signed by attacker key, `kid` copied | **Blocked.** Signature check against the published public key fails (existing test). |
| **Missing `exp` / replay** | Immortal token | **Blocked.** `requiredClaims: ["sub","iat","exp"]` and `maxTokenAge: "10 minutes"`. |
| **Issuer/audience mix-up** | Token for another app | **Blocked.** `iss` + `aud` (`preview` vs `app:$GROK_PROJECT_ID`). |
| **Decode without verify** | `jwt.decode` / split on `.` and trust payload | **Not used** on identity tokens. DBA scrape `decodeB64Json` is HTML JSON, not auth. |
| **Better Auth cookie as JWT** | Treat session cookie as three-part JWT | **Wrong model.** Opaque HMAC cookie + DB row. `alg=none` does not apply. |

## What jose is doing (the important line)

```ts
await jwtVerify(token, options.getKey, {
  algorithms: ["EdDSA"],
  issuer: options.issuer,
  audience: options.audience,
  requiredClaims: ["sub", "iat", "exp"],
  maxTokenAge: "10 minutes",
});
```

`algorithms` is an allowlist, not a default. Libraries that *trust the header `alg`* are the ones that fall to `none` / HS256 confusion. This call does not.

## Out of scope / leftover risk

- **XSS** still wins against preview bearer and portal tokens (see [session-tokens.md](session-tokens.md)). That is not a JWT-alg bug.
- **Preview `BETTER_AUTH_SECRET`** is a process-local 32-byte value. Restart invalidates preview sessions; deployed secret comes from the platform. Do not put it in the client.
- **Do not** add `jwt.decode` for Google/GitHub `id_token` without `jwtVerify` against *their* JWKS. Today we never parse those JWTs.
- **Do not** widen `algorithms` to “whatever the header says”.

## Rule

If we ever verify a JWT ourselves (portal id_token, future API): allowlist the alg, pin issuer + audience, load keys from a fixed JWKS URL, fail closed. Never trust `JSON.parse(atob(payload))`.
