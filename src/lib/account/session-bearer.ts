/** Same key as `src/lib/auth/client.ts` — that setter is not exported. */
const BEARER_KEY = "grok-auth.bearer-token";

export function persistSessionBearer(token: string | null | undefined) {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (token) sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* ignore */
  }
}

export function sessionTokenFromAuthData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const token = (data as { token?: unknown }).token;
  return typeof token === "string" && token.length > 0 ? token : null;
}
