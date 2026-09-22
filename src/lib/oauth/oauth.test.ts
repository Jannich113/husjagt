import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorizeUrl, pkceChallenge } from "./pkce.ts";
import { tokenUrlAllowed } from "./ssrf.ts";
import { parseTokenResponse, redactToken, tokenExpired } from "./tokens.ts";

describe("oauth pkce", () => {
  it("builds an authorization url with S256", () => {
    const url = authorizeUrl("https://accounts.google.com/o/oauth2/v2/auth", {
      clientId: "abc",
      redirectUri: "https://husjagt.example/oauth/callback",
      scopes: "openid email",
      state: "st",
      challenge: "ch",
    });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("code_challenge_method"), "S256");
    assert.equal(parsed.searchParams.get("response_type"), "code");
    assert.equal(parsed.searchParams.get("client_id"), "abc");
  });

  it("hashes a verifier to a url-safe challenge", async () => {
    const challenge = await pkceChallenge("verifier-token-value");
    assert.match(challenge, /^[A-Za-z0-9_-]+$/);
    assert.notEqual(challenge, "verifier-token-value");
  });
});

describe("oauth ssrf", () => {
  it("allows public https token hosts and blocks private ones", () => {
    assert.equal(tokenUrlAllowed("https://oauth2.googleapis.com/token"), true);
    assert.equal(tokenUrlAllowed("http://oauth2.googleapis.com/token"), false);
    assert.equal(tokenUrlAllowed("https://127.0.0.1/token"), false);
    assert.equal(tokenUrlAllowed("https://169.254.169.254/latest/meta-data"), false);
    assert.equal(tokenUrlAllowed("https://user:pass@evil.example/token"), false);
  });
});

describe("oauth tokens", () => {
  it("parses a standard token payload", () => {
    const tokens = parseTokenResponse({ access_token: "tok", refresh_token: "r", expires_in: 3600 }, 1_000);
    assert.equal(tokens?.accessToken, "tok");
    assert.equal(tokens?.refreshToken, "r");
    assert.equal(tokens?.expiresAt, 1_000 + 3_600_000);
  });

  it("redacts and expires", () => {
    assert.equal(redactToken("abcdefghijklmnop"), "abcd…mnop");
    assert.equal(tokenExpired(500, 0, 1000), true);
    assert.equal(tokenExpired(null), false);
  });
});
