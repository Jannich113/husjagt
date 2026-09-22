import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { HIDDEN_KEY, useHidden } from "./hidden.ts";

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
  useHidden.setState({ ids: [], ready: false });
});

describe("hidden listings persist", () => {
  it("hides an id and restores it after reload", () => {
    useHidden.getState().hide("abc");
    assert.equal(useHidden.getState().has("abc"), true);
    assert.ok(store.get(HIDDEN_KEY)?.includes("abc"));

    useHidden.setState({ ids: [], ready: false });
    useHidden.getState().hydrate();
    assert.deepEqual(useHidden.getState().ids, ["abc"]);
  });

  it("unhide and clear restore the house", () => {
    useHidden.getState().hide("a");
    useHidden.getState().hide("b");
    useHidden.getState().unhide("a");
    assert.deepEqual(useHidden.getState().ids, ["b"]);
    useHidden.getState().clear();
    assert.deepEqual(useHidden.getState().ids, []);

    useHidden.setState({ ids: [], ready: false });
    useHidden.getState().hydrate();
    assert.deepEqual(useHidden.getState().ids, []);
  });
});
