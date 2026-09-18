import type { SearchFilters, SearchResult } from "./types";

export const OFFLINE_SEARCH_KEY = "husjagt-offline-search";

type OfflineSearch = {
  filters: SearchFilters;
  result: SearchResult;
  savedAt: number;
};

export function saveOfflineSearch(filters: SearchFilters, result: SearchResult): void {
  if (typeof window === "undefined") return;
  try {
    const payload: OfflineSearch = { filters, result, savedAt: Date.now() };
    window.localStorage.setItem(OFFLINE_SEARCH_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function loadOfflineSearch(): OfflineSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OFFLINE_SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineSearch>;
    if (!parsed?.result || !Array.isArray(parsed.result.listings)) return null;
    return parsed as OfflineSearch;
  } catch {
    return null;
  }
}
