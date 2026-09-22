export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const HUNT_BLOB_KEYS = [
  "husjagt-favorites",
  "husjagt-hidden",
  "husjagt-seen",
  "husjagt-first-seen",
  "husjagt-search-alerts",
  "husjagt-keywords",
  "husjagt-social-watch",
] as const;

export type HuntBlobPayload = {
  v: 1;
  savedAt: number;
  stores: Record<string, JsonValue>;
};

function asJson(value: unknown): JsonValue | undefined {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((row) => asJson(row) ?? null);
  if (typeof value === "object") {
    const out: Record<string, JsonValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      const next = asJson(nested);
      if (next !== undefined) out[key] = next;
    }
    return out;
  }
  return undefined;
}

export function collectHuntBlob(now = Date.now()): HuntBlobPayload {
  const stores: Record<string, JsonValue> = {};
  if (typeof localStorage === "undefined") return { v: 1, savedAt: now, stores };
  for (const key of HUNT_BLOB_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = asJson(JSON.parse(raw));
      if (parsed !== undefined) stores[key] = parsed;
    } catch {
      /* skip broken */
    }
  }
  return { v: 1, savedAt: now, stores };
}

export function applyHuntBlob(payload: HuntBlobPayload) {
  if (typeof localStorage === "undefined" || payload?.v !== 1) return;
  for (const key of HUNT_BLOB_KEYS) {
    const value = payload.stores[key];
    if (value === undefined) continue;
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function blobIsNewer(remote: HuntBlobPayload | null, localSavedAt: number): boolean {
  if (!remote || remote.v !== 1) return false;
  return remote.savedAt > localSavedAt + 1000;
}
