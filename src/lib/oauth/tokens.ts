export type TokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  tokenType: string;
  accountLabel: string | null;
};

export function parseTokenResponse(raw: unknown, now = Date.now()): TokenSet | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const access = rec.access_token;
  if (typeof access !== "string" || !access) return null;
  const expiresIn = typeof rec.expires_in === "number" ? rec.expires_in : Number(rec.expires_in);
  return {
    accessToken: access,
    refreshToken: typeof rec.refresh_token === "string" ? rec.refresh_token : null,
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? now + expiresIn * 1000 : null,
    tokenType: typeof rec.token_type === "string" ? rec.token_type : "Bearer",
    accountLabel: null,
  };
}

export function tokenExpired(expiresAt: number | null, skewMs = 60_000, now = Date.now()): boolean {
  if (expiresAt == null) return false;
  return expiresAt - skewMs <= now;
}

export function redactToken(token: string): string {
  if (token.length < 8) return "••••";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
