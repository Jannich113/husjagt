import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortListings } from "./sort.ts";
import type { Listing } from "./types.ts";

function row(partial: Partial<Listing> & { id: string; street: string }): Listing {
  return {
    type: "villa",
    price: null,
    priceChange: null,
    area: null,
    lot: null,
    rooms: null,
    energy: null,
    year: null,
    expense: null,
    m2price: null,
    days: null,
    lat: null,
    lon: null,
    image: null,
    imageAlt: null,
    agency: null,
    agencySlug: null,
    city: "Odense",
    zip: 5000,
    slug: partial.id,
    slugAddress: partial.street,
    source: "boligsiden",
    caseUrl: null,
    ...partial,
  };
}

describe("sortListings", () => {
  const rows = [
    row({ id: "a", street: "A", price: 1_000_000, days: 20, expense: 4_000, lot: 400, m2price: 20_000 }),
    row({ id: "b", street: "B", price: 3_000_000, days: 2, expense: 2_000, lot: 900, m2price: 12_000 }),
    row({ id: "c", street: "C", price: 2_000_000, days: 8, expense: 3_000, lot: 600, m2price: 15_000 }),
  ];

  it("sorts price high to low", () => {
    const ordered = sortListings(rows, { sortBy: "price", sortAscending: false }).map((item) => item.id);
    assert.deepEqual(ordered, ["b", "c", "a"]);
  });

  it("sorts newest first by days on market", () => {
    const ordered = sortListings(rows, { sortBy: "daysListed", sortAscending: true }).map((item) => item.id);
    assert.deepEqual(ordered, ["b", "c", "a"]);
  });

  it("sorts largest lot first", () => {
    const ordered = sortListings(rows, { sortBy: "lotArea", sortAscending: false }).map((item) => item.id);
    assert.deepEqual(ordered, ["b", "c", "a"]);
  });
});
