import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blobIsNewer, collectHuntBlob, applyHuntBlob } from "./blob.ts";

describe("hunt blob", () => {
  it("round-trips selected localStorage keys", () => {
    const store = new Map<string, string>();
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
    store.set("husjagt-favorites", JSON.stringify({ ids: ["a"] }));
    store.set("other", "nope");
    const blob = collectHuntBlob(10);
    assert.deepEqual(blob.stores["husjagt-favorites"], { ids: ["a"] });
    assert.equal(blob.stores.other, undefined);
    store.clear();
    applyHuntBlob(blob);
    assert.equal(store.get("husjagt-favorites"), JSON.stringify({ ids: ["a"] }));
  });

  it("prefers a newer remote snapshot", () => {
    assert.equal(blobIsNewer({ v: 1, savedAt: 5000, stores: {} }, 10), true);
    assert.equal(blobIsNewer({ v: 1, savedAt: 10, stores: {} }, 5000), false);
  });
});
