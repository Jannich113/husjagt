import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Listing } from "../listings/types.ts";
import { visibleListings } from "./visible.ts";

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
    days: 20,
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
    descriptionBody: over.descriptionBody ?? null,
    ...over,
  };
}

describe("visibleListings", () => {
  const pref = house({ id: "pref", street: "Aavej 1" });
  const close = house({ id: "close", street: "Aavej 3", descriptionBody: "Have og udestue" });
  const other = house({ id: "other", street: "Skovvej 8", days: 2, descriptionBody: "Lejlighed i byen" });

  it("applies street, keywords and mest-lig sort on the current pool", () => {
    const rows = visibleListings({
      pool: [other, close, pref],
      freshOnly: false,
      firstSeenAt: {},
      streetQuery: "aavej",
      keywords: ["have"],
      keywordMode: "any",
      preference: pref,
      sortBy: "similarity",
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      ["close"],
    );
  });

  it("empty street and keywords leave the pool intact", () => {
    const pool = [other, close];
    const rows = visibleListings({
      pool,
      freshOnly: false,
      firstSeenAt: {},
      streetQuery: "",
      keywords: [],
      keywordMode: "all",
      preference: null,
      sortBy: "price",
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      ["other", "close"],
    );
  });
});
