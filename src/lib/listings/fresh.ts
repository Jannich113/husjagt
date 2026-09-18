import { create } from "zustand";

export const FIRST_SEEN_KEY = "husjagt-first-seen";
export const FIRST_SEEN_MAX = 2000;
export const FRESH_TODAY_DAYS = 1;
export const FRESH_WEEK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const PRUNE_MS = (FRESH_WEEK_DAYS + 1) * DAY_MS;

export type Freshness = "today" | "week" | null;

export function freshnessFromDays(days: number | null | undefined): Freshness {
  if (days == null || Number.isNaN(days) || days < 0) return null;
  if (days <= FRESH_TODAY_DAYS) return "today";
  if (days <= FRESH_WEEK_DAYS) return "week";
  return null;
}

export function freshnessFromAge(ageMs: number): Freshness {
  if (ageMs < 0) return "today";
  if (ageMs <= FRESH_TODAY_DAYS * DAY_MS) return "today";
  if (ageMs <= FRESH_WEEK_DAYS * DAY_MS) return "week";
  return null;
}

export function listingFreshness(
  listing: { id: string; days: number | null },
  firstSeenAt: number | null | undefined,
  now = Date.now(),
): Freshness {
  const fromPortal = freshnessFromDays(listing.days);
  if (fromPortal || listing.days != null) return fromPortal;
  if (firstSeenAt == null) return "today";
  return freshnessFromAge(now - firstSeenAt);
}

export function freshnessLabel(kind: Freshness, compact = false): string | null {
  if (kind === "today") return compact ? "I dag" : "Ny i dag";
  if (kind === "week") return compact ? "Ny uge" : "Ny uge";
  return null;
}

export function parseFirstSeen(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!id || typeof value !== "number" || !Number.isFinite(value)) continue;
      out[id] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function rememberFirstSeen(
  map: Record<string, number>,
  ids: string[],
  now = Date.now(),
): Record<string, number> {
  const cutoff = now - PRUNE_MS;
  const next: Record<string, number> = {};
  for (const [id, ts] of Object.entries(map)) {
    if (ts >= cutoff) next[id] = ts;
  }
  let changed = Object.keys(next).length !== Object.keys(map).length;
  for (const id of ids) {
    if (!id || next[id] != null) continue;
    next[id] = now;
    changed = true;
  }
  const entries = Object.entries(next);
  if (entries.length > FIRST_SEEN_MAX) {
    entries.sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(entries.slice(0, FIRST_SEEN_MAX));
  }
  return changed ? next : map;
}

function readStorage(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return parseFirstSeen(window.localStorage.getItem(FIRST_SEEN_KEY));
  } catch {
    return {};
  }
}

function writeStorage(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FIRST_SEEN_KEY, JSON.stringify(map));
}

type FirstSeenState = {
  seenAt: Record<string, number>;
  ready: boolean;
  hydrate: () => void;
  remember: (ids: string[]) => void;
};

export const useFirstSeen = create<FirstSeenState>((set, get) => ({
  seenAt: {},
  ready: false,
  hydrate: () => {
    if (get().ready) return;
    set({ seenAt: readStorage(), ready: true });
  },
  remember: (ids) => {
    if (!ids.length) return;
    const state = get();
    const current = state.ready ? state.seenAt : readStorage();
    const seenAt = rememberFirstSeen(current, ids);
    if (seenAt === current && state.ready) return;
    writeStorage(seenAt);
    set({ seenAt, ready: true });
  },
}));
