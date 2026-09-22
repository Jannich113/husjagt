export function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function randomUrlToken(bytes = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function createPkce(): Promise<{ verifier: string; challenge: string; state: string }> {
  const verifier = randomUrlToken(32);
  return {
    verifier,
    challenge: await pkceChallenge(verifier),
    state: randomUrlToken(16),
  };
}

export function oauthRedirectUri(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin.replace(/\/$/, "")}/oauth/callback`;
}

export function authorizeUrl(
  authorizationEndpoint: string,
  params: {
    clientId: string;
    redirectUri: string;
    scopes: string;
    state: string;
    challenge: string;
  },
): string {
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", params.scopes);
  return url.toString();
}
