import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appendSearchPage } from "./aggregate.ts";
import type { Listing, SearchResult } from "./types.ts";

function row(id: string): Listing {
  return {
    id,
    type: "villa",
    price: 1_000_000,
    priceChange: null,
    area: 100,
    lot: 400,
    rooms: 3,
    energy: "C",
    year: 1970,
    expense: 2000,
    m2price: 10000,
    days: 3,
    lat: null,
    lon: null,
    image: null,
    imageAlt: null,
    agency: null,
    agencySlug: null,
    street: id,
    city: "Odense",
    zip: 5000,
    slug: id,
    slugAddress: id,
    source: "boligsiden",
    caseUrl: null,
  };
}

function page(listings: Listing[], totalHits: number): SearchResult {
  return { listings, totalHits, live: true, source: "Boligsiden", sources: ["Boligsiden"] };
}

describe("appendSearchPage", () => {
  it("dedupes and keeps the larger total", () => {
    const merged = appendSearchPage(page([row("a"), row("b")], 80), page([row("b"), row("c")], 80));
    assert.deepEqual(
      merged.listings.map((item) => item.id).sort(),
      ["a", "b", "c"],
    );
    assert.equal(merged.totalHits, 80);
  });
});
