import { create } from "zustand";

export const SEEN_KEY = "husjagt-seen";
export const SEEN_MAX = 2000;

export function parseSeenIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { ids?: unknown }).ids)
        ? (parsed as { ids: unknown[] }).ids
        : [];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const value of list) {
      if (typeof value !== "string" || !value || seen.has(value)) continue;
      seen.add(value);
      ids.push(value);
    }
    return ids;
  } catch {
    return [];
  }
}

export function addSeenId(ids: string[], id: string): string[] {
  if (!id || ids[0] === id) return ids;
  if (ids.includes(id)) return [id, ...ids.filter((row) => row !== id)];
  return [id, ...ids].slice(0, SEEN_MAX);
}

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return parseSeenIds(window.localStorage.getItem(SEEN_KEY));
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
}

type SeenState = {
  ids: string[];
  ready: boolean;
  hydrate: () => void;
  has: (id: string) => boolean;
  mark: (id: string) => void;
};

export const useSeen = create<SeenState>((set, get) => ({
  ids: [],
  ready: false,
  has: (id) => get().ids.includes(id),
  hydrate: () => {
    if (get().ready) return;
    set({ ids: readStorage(), ready: true });
  },
  mark: (id) => {
    if (!id) return;
    const state = get();
    const current = state.ready ? state.ids : readStorage();
    const ids = addSeenId(current, id);
    if (ids === current && state.ready) return;
    writeStorage(ids);
    set({ ids, ready: true });
  },
}));
