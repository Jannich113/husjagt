import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { useFavorites } from "./favorites.ts";
import type { Listing } from "./types.ts";

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
  useFavorites.setState({ ids: [], items: {}, notes: {}, ready: false });
});

function house(id: string, street: string): Listing {
  return {
    id,
    type: "villa",
    price: 1_800_000,
    priceChange: null,
    area: 120,
    lot: 500,
    rooms: 4,
    energy: "C",
    year: 1978,
    expense: 2500,
    m2price: 15000,
    days: 4,
    lat: 55.4,
    lon: 10.4,
    image: "https://cdn.example/h.jpg",
    imageAlt: null,
    agency: "home",
    agencySlug: "home",
    street,
    city: "Odense C",
    zip: 5000,
    slug: id,
    slugAddress: street,
    source: "boligsiden",
    caseUrl: null,
  };
}

describe("favorites persist", () => {
  it("writes a listing snapshot and restores it after reload", () => {
    const row = house("abc", "Aavej 3");
    useFavorites.getState().toggle(row);
    assert.equal(useFavorites.getState().has("abc"), true);
    assert.equal(useFavorites.getState().items.abc?.street, "Aavej 3");

    useFavorites.setState({ ids: [], items: {}, notes: {}, ready: false });
    useFavorites.getState().hydrate();
    assert.deepEqual(useFavorites.getState().ids, ["abc"]);
    assert.equal(useFavorites.getState().items.abc?.price, 1_800_000);
  });

  it("unsave removes the house from storage", () => {
    const row = house("abc", "Aavej 3");
    useFavorites.getState().toggle(row);
    useFavorites.getState().toggle(row);
    assert.equal(useFavorites.getState().has("abc"), false);

    useFavorites.setState({ ids: [], items: {}, notes: {}, ready: false });
    useFavorites.getState().hydrate();
    assert.deepEqual(useFavorites.getState().ids, []);
    assert.equal(useFavorites.getState().items.abc, undefined);
  });

  it("stores a note on a saved house", () => {
    const row = house("abc", "Aavej 3");
    useFavorites.getState().toggle(row);
    useFavorites.getState().setNote("abc", " visning torsdag  ");
    assert.equal(useFavorites.getState().notes.abc, "visning torsdag");
    useFavorites.setState({ ids: [], items: {}, notes: {}, ready: false });
    useFavorites.getState().hydrate();
    assert.equal(useFavorites.getState().notes.abc, "visning torsdag");
  });
});
