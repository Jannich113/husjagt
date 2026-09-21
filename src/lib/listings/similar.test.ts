import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSimilarListing, rankBySimilarity, similarScore } from "./similar.ts";
import type { Listing } from "./types.ts";

function house(over: Partial<Listing> & Pick<Listing, "id" | "street">): Listing {
  return {
    type: "villa",
    price: 1_800_000,
    priceChange: null,
    area: 120,
    lot: 600,
    rooms: 4,
    energy: "C",
    year: 1974,
    expense: 2200,
    m2price: 15000,
    days: 12,
    lat: 55.4,
    lon: 10.4,
    image: null,
    imageAlt: null,
    agency: null,
    agencySlug: null,
    city: "Odense C",
    zip: 5000,
    slug: over.id,
    slugAddress: over.street,
    source: "boligsiden",
    caseUrl: null,
    ...over,
  };
}

const pref = house({ id: "pref", street: "Aavej 1" });

describe("similar ranking", () => {
  it("scores the preference house highest and tags close neighbours", () => {
    const close = house({ id: "close", street: "Aavej 3", price: 1_850_000, rooms: 4, area: 118 });
    const far = house({
      id: "far",
      street: "Anden 9",
      type: "condo",
      price: 4_500_000,
      rooms: 1,
      area: 40,
      zip: 8000,
      city: "Aarhus C",
      energy: "G",
    });
    assert.equal(similarScore(pref, pref), 100);
    assert.ok(similarScore(close, pref) >= 40);
    assert.ok(similarScore(far, pref) < 40);
    assert.equal(isSimilarListing(close, pref), true);
    assert.equal(isSimilarListing(pref, pref), false);
    assert.deepEqual(
      rankBySimilarity([far, close, pref], pref).map((row) => row.id),
      ["pref", "close", "far"],
    );
  });

  it("does not rank when no preference is set", () => {
    const rows = [house({ id: "b", street: "B" }), house({ id: "a", street: "A" })];
    assert.equal(rankBySimilarity(rows, null), rows);
  });
});
