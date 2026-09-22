import { create } from "zustand";

export const HIDDEN_KEY = "husjagt-hidden";
export const HIDDEN_MAX = 500;

export function parseHiddenIds(raw: string | null): string[] {
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

function canStore(): boolean {
  return typeof globalThis.localStorage?.getItem === "function";
}

function readStorage(): string[] {
  if (!canStore()) return [];
  try {
    return parseHiddenIds(globalThis.localStorage.getItem(HIDDEN_KEY));
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]) {
  if (!canStore()) return;
  globalThis.localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
}

type HiddenState = {
  ids: string[];
  ready: boolean;
  hydrate: () => void;
  has: (id: string) => boolean;
  hide: (id: string) => void;
  unhide: (id: string) => void;
  clear: () => void;
};

export const useHidden = create<HiddenState>((set, get) => ({
  ids: [],
  ready: false,
  has: (id) => get().ids.includes(id),
  hydrate: () => {
    if (get().ready) return;
    set({ ids: readStorage(), ready: true });
  },
  hide: (id) => {
    if (!id) return;
    const state = get();
    const current = state.ready ? state.ids : readStorage();
    if (current.includes(id)) {
      if (!state.ready) set({ ids: current, ready: true });
      return;
    }
    const ids = [id, ...current].slice(0, HIDDEN_MAX);
    writeStorage(ids);
    set({ ids, ready: true });
  },
  unhide: (id) => {
    const state = get();
    const current = state.ready ? state.ids : readStorage();
    const ids = current.filter((row) => row !== id);
    writeStorage(ids);
    set({ ids, ready: true });
  },
  clear: () => {
    writeStorage([]);
    set({ ids: [], ready: true });
  },
}));
