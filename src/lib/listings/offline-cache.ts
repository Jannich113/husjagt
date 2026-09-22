import type { SearchFilters, SearchResult } from "./types";

export const OFFLINE_SEARCH_KEY = "husjagt-offline-search";

type OfflineSearch = {
  filters: SearchFilters;
  result: SearchResult;
  savedAt: number;
};

function keyFor(municipality: string): string {
  const slug = municipality.trim().toLowerCase() || "danmark";
  return `${OFFLINE_SEARCH_KEY}:${slug}`;
}

export function saveOfflineSearch(filters: SearchFilters, result: SearchResult): void {
  if (typeof window === "undefined") return;
  if (!result.listings.length && !result.live) return;
  try {
    const payload: OfflineSearch = { filters, result, savedAt: Date.now() };
    window.localStorage.setItem(keyFor(filters.municipality), JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function loadOfflineSearch(municipality?: string): OfflineSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const slug = municipality?.trim().toLowerCase();
    const raw = slug
      ? window.localStorage.getItem(keyFor(slug))
      : window.localStorage.getItem(OFFLINE_SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineSearch>;
    if (!parsed?.result || !Array.isArray(parsed.result.listings)) return null;
    if (slug && parsed.filters?.municipality && parsed.filters.municipality !== slug) return null;
    return parsed as OfflineSearch;
  } catch {
    return null;
  }
}
