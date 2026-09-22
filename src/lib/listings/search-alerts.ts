import { create } from "zustand";
import type { SearchFilters } from "./types";

export const ALERTS_KEY = "husjagt-search-alerts";
export const ALERTS_INTERVAL_MS = 5 * 60 * 1000;
export const ALERTS_KNOWN_MAX = 2000;

export function searchFingerprint(filters: SearchFilters): string {
  const {
    page: _page,
    perPage: _per,
    sortBy: _sort,
    sortAscending: _asc,
    freshOnly: _fresh,
    ...rest
  } = filters;
  return JSON.stringify(rest);
}

export function newListingIds(known: string[], incoming: string[]): string[] {
  if (!known.length) return [];
  const have = new Set(known);
  const out: string[] = [];
  for (const id of incoming) {
    if (!id || have.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function mergeKnownIds(known: string[], incoming: string[]): string[] {
  const seen = new Set(known);
  const extra: string[] = [];
  for (const id of incoming) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    extra.push(id);
  }
  return [...extra, ...known].slice(0, ALERTS_KNOWN_MAX);
}

export function notifyNewListings(count: number, place: string) {
  if (count < 1) return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("Husjagt", {
      body: count === 1 ? `1 ny bolig i ${place}` : `${count} nye boliger i ${place}`,
      tag: "husjagt-search",
    });
  } catch {
    /* ignore */
  }
}

type AlertState = {
  ready: boolean;
  enabled: boolean;
  filters: SearchFilters | null;
  knownIds: string[];
  newIds: string[];
  lastCheck: number | null;
  notify: boolean;
  hydrate: () => void;
  watch: (filters: SearchFilters, ids: string[]) => void;
  unwatch: () => void;
  ingest: (incoming: string[]) => string[];
  clearNew: () => void;
  setNotify: (on: boolean) => void;
};

type Stored = Pick<AlertState, "enabled" | "filters" | "knownIds" | "newIds" | "lastCheck" | "notify">;

function canStore(): boolean {
  return typeof globalThis.localStorage?.getItem === "function";
}

function readStorage(): Stored {
  const empty: Stored = { enabled: false, filters: null, knownIds: [], newIds: [], lastCheck: null, notify: false };
  if (!canStore()) return empty;
  try {
    const raw = globalThis.localStorage.getItem(ALERTS_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      enabled: Boolean(parsed.enabled && parsed.filters),
      filters: parsed.filters ?? null,
      knownIds: Array.isArray(parsed.knownIds) ? parsed.knownIds.filter((id) => typeof id === "string") : [],
      newIds: Array.isArray(parsed.newIds) ? parsed.newIds.filter((id) => typeof id === "string") : [],
      lastCheck: typeof parsed.lastCheck === "number" ? parsed.lastCheck : null,
      notify: Boolean(parsed.notify),
    };
  } catch {
    return empty;
  }
}

function writeStorage(state: Stored) {
  if (!canStore()) return;
  globalThis.localStorage.setItem(
    ALERTS_KEY,
    JSON.stringify({
      enabled: state.enabled,
      filters: state.filters,
      knownIds: state.knownIds,
      newIds: state.newIds,
      lastCheck: state.lastCheck,
      notify: state.notify,
    }),
  );
}

export const useSearchAlerts = create<AlertState>((set, get) => ({
  ready: false,
  enabled: false,
  filters: null,
  knownIds: [],
  newIds: [],
  lastCheck: null,
  notify: false,
  hydrate: () => {
    if (get().ready) return;
    set({ ...readStorage(), ready: true });
  },
  watch: (filters, ids) => {
    const next: Stored = {
      enabled: true,
      filters,
      knownIds: ids.filter(Boolean).slice(0, ALERTS_KNOWN_MAX),
      newIds: [],
      lastCheck: Date.now(),
      notify: get().notify,
    };
    writeStorage(next);
    set({ ...next, ready: true });
  },
  unwatch: () => {
    const next: Stored = {
      enabled: false,
      filters: null,
      knownIds: [],
      newIds: [],
      lastCheck: null,
      notify: get().notify,
    };
    writeStorage(next);
    set({ ...next, ready: true });
  },
  ingest: (incoming) => {
    const state = get();
    const fresh = newListingIds(state.knownIds, incoming);
    const knownIds = mergeKnownIds(state.knownIds, incoming);
    const newIds = [...fresh, ...state.newIds.filter((id) => !fresh.includes(id))].slice(0, 80);
    const next: Stored = {
      enabled: state.enabled,
      filters: state.filters,
      knownIds,
      newIds,
      lastCheck: Date.now(),
      notify: state.notify,
    };
    writeStorage(next);
    set({ ...next, ready: true });
    return fresh;
  },
  clearNew: () => {
    const state = get();
    const next: Stored = {
      enabled: state.enabled,
      filters: state.filters,
      knownIds: state.knownIds,
      newIds: [],
      lastCheck: state.lastCheck,
      notify: state.notify,
    };
    writeStorage(next);
    set({ newIds: [], ready: true });
  },
  setNotify: (on) => {
    const state = get();
    const next: Stored = {
      enabled: state.enabled,
      filters: state.filters,
      knownIds: state.knownIds,
      newIds: state.newIds,
      lastCheck: state.lastCheck,
      notify: on,
    };
    writeStorage(next);
    set({ notify: on, ready: true });
  },
}));
