import assert from "node:assert/strict";
import { generateKeyPairSync, createSecretKey } from "node:crypto";
import { describe, it } from "node:test";
import { SignJWT, exportJWK } from "jose";
import {
  gateKeyResolver,
  verifyGateIdentityToken,
  type GateJwks,
} from "../auth/gate-identity.server.ts";

const ISSUER = "https://gate.app-builder-testing.com";
const AUDIENCE = "app:proj-123";

function b64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function edKey(kid: string) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jwk = await exportJWK(publicKey);
  return { privateKey, jwk: { ...jwk, alg: "EdDSA", use: "sig" as const, kid } };
}

function resolver(jwks: GateJwks) {
  return gateKeyResolver("https://test.invalid/jwks", async () => jwks);
}

describe("JWT signature attacks against gate identity", () => {
  it("rejects alg=none (unsigned)", async () => {
    const key = await edKey("k1");
    const token = `${b64url({ alg: "none", typ: "JWT", kid: "k1" })}.${b64url({
      sub: "attacker",
      iss: ISSUER,
      aud: AUDIENCE,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    })}.`;
    const identity = await verifyGateIdentityToken(token, {
      issuer: ISSUER,
      audience: AUDIENCE,
      getKey: resolver({ keys: [key.jwk] }),
    });
    assert.equal(identity, null);
  });

  it("rejects HS256 algorithm confusion", async () => {
    const key = await edKey("k1");
    const hmac = createSecretKey(Buffer.from("public-jwk-as-secret"));
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ sub: "attacker" })
      .setProtectedHeader({ alg: "HS256", kid: "k1" })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .sign(hmac);
    const identity = await verifyGateIdentityToken(token, {
      issuer: ISSUER,
      audience: AUDIENCE,
      getKey: resolver({ keys: [key.jwk] }),
    });
    assert.equal(identity, null);
  });

  it("rejects RS256 when only EdDSA is allowed", async () => {
    const ed = await edKey("k1");
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ sub: "attacker" })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .sign(rsa.privateKey);
    const identity = await verifyGateIdentityToken(token, {
      issuer: ISSUER,
      audience: AUDIENCE,
      getKey: resolver({ keys: [ed.jwk] }),
    });
    assert.equal(identity, null);
  });

  it("ignores an oct HMAC key planted in JWKS", async () => {
    const now = Math.floor(Date.now() / 1000);
    const secret = createSecretKey(Buffer.alloc(32, 7));
    const token = await new SignJWT({ sub: "attacker" })
      .setProtectedHeader({ alg: "EdDSA", kid: "planted" })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .sign(secret)
      .catch(() => `${b64url({ alg: "EdDSA", kid: "planted" })}.${b64url({
        sub: "attacker",
        iss: ISSUER,
        aud: AUDIENCE,
        iat: now,
        exp: now + 300,
      })}.fakesig`);
    const identity = await verifyGateIdentityToken(token, {
      issuer: ISSUER,
      audience: AUDIENCE,
      getKey: resolver({
        keys: [
          {
            kty: "oct",
            k: Buffer.alloc(32, 7).toString("base64url"),
            alg: "EdDSA",
            kid: "planted",
          },
        ],
      }),
    });
    assert.equal(identity, null);
  });
});
