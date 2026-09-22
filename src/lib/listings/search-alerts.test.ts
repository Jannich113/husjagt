import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { DEFAULT_FILTERS } from "./types.ts";
import {
  mergeKnownIds,
  newListingIds,
  searchFingerprint,
  useSearchAlerts,
} from "./search-alerts.ts";

describe("saved search alerts", () => {
  it("does not alert on the first snapshot", () => {
    assert.deepEqual(newListingIds([], ["a", "b"]), []);
  });

  it("returns only ids that were not known", () => {
    assert.deepEqual(newListingIds(["a"], ["a", "b", "c"]), ["b", "c"]);
  });

  it("keeps known ids and prepends new ones", () => {
    assert.deepEqual(mergeKnownIds(["a"], ["a", "b"]), ["b", "a"]);
  });

  it("ignores sort and page when comparing hunts", () => {
    const a = { ...DEFAULT_FILTERS, municipality: "odense", page: 1, sortBy: "price" as const };
    const b = { ...DEFAULT_FILTERS, municipality: "odense", page: 2, sortBy: "daysListed" as const };
    assert.equal(searchFingerprint(a), searchFingerprint(b));
    assert.notEqual(
      searchFingerprint(a),
      searchFingerprint({ ...a, municipality: "assens" }),
    );
  });
});

describe("search alerts persist", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const memory = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    };
    Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true });
    useSearchAlerts.setState({
      ready: false,
      enabled: false,
      filters: null,
      knownIds: [],
      newIds: [],
      lastCheck: null,
      notify: false,
    });
  });

  it("seeds known ids without new alerts, then flags later arrivals", () => {
    useSearchAlerts.getState().watch(DEFAULT_FILTERS, ["a"]);
    assert.equal(useSearchAlerts.getState().enabled, true);
    assert.deepEqual(useSearchAlerts.getState().ingest(["a", "b"]), ["b"]);
    assert.deepEqual(useSearchAlerts.getState().newIds, ["b"]);

    useSearchAlerts.setState({ ready: false, enabled: false, filters: null, knownIds: [], newIds: [], lastCheck: null, notify: false });
    useSearchAlerts.getState().hydrate();
    assert.equal(useSearchAlerts.getState().enabled, true);
    assert.deepEqual(useSearchAlerts.getState().newIds, ["b"]);
  });
});
