import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadOfflineSearch, OFFLINE_SEARCH_KEY, saveOfflineSearch } from "./offline-cache.ts";
import type { SearchFilters, SearchResult } from "./types.ts";

const filters = { municipality: "odense" } as SearchFilters;
const result = {
  listings: [{ id: "1", title: "Villa" }],
  live: true,
  sources: ["boligsiden"],
} as unknown as SearchResult;

describe("offline search cache", () => {
  it("round-trips through localStorage and rejects junk", () => {
    const store = new Map<string, string>();
    const ls = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    const g = globalThis as { window?: unknown };
    const prev = g.window;
    g.window = { localStorage: ls };
    try {
      assert.equal(loadOfflineSearch(), null);
      saveOfflineSearch(filters, result);
      const loaded = loadOfflineSearch();
      assert.equal(loaded?.result.listings[0]?.id, "1");
      assert.equal(store.has(OFFLINE_SEARCH_KEY), true);

      store.set(OFFLINE_SEARCH_KEY, "{not json");
      assert.equal(loadOfflineSearch(), null);
    } finally {
      if (prev === undefined) delete g.window;
      else g.window = prev;
    }
  });
});
