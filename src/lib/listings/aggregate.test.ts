import assert from "node:assert/strict";
import { dedupeListings, listingDedupeKey } from "./aggregate";
import type { Listing } from "./types";

function listing(partial: Partial<Listing> & Pick<Listing, "id" | "street" | "source">): Listing {
  return {
    type: "villa",
    price: 1_000_000,
    priceChange: null,
    area: 100,
    lot: null,
    rooms: 4,
    energy: null,
    year: null,
    expense: null,
    m2price: null,
    days: null,
    lat: 55.4,
    lon: 10.4,
    image: "https://example.com/a.jpg",
    imageAlt: null,
    agency: "home",
    agencySlug: "home",
    city: "Odense",
    zip: 5000,
    slug: partial.id,
    slugAddress: "",
    caseUrl: null,
    ...partial,
  };
}

assert.equal(
  listingDedupeKey(listing({ id: "1", street: "Buchwaldsgade 13B, 2. 7.", zip: 5000, source: "boliga" })),
  listingDedupeKey(listing({ id: "2", street: "Buchwaldsgade 13B", zip: 5000, source: "boligsiden" })),
);
assert.equal(
  listingDedupeKey(listing({ id: "3", street: "Skelkærvej 33, Birkum", zip: 5220, source: "boliga" })),
  listingDedupeKey(listing({ id: "4", street: "Skelkærvej 33", zip: 5220, source: "boligsiden" })),
);

const merged = dedupeListings([
  listing({ id: "boliga-1", street: "Skovs-Højrup-Vej 4", zip: 5270, source: "boliga", image: null }),
  listing({ id: "bs-1", street: "Skovs-Højrup-Vej 4", zip: 5270, source: "boligsiden" }),
  listing({ id: "gg-1", street: "Helt anden vej 9", zip: 5000, source: "guloggratis" }),
]);
assert.equal(merged.length, 2);
assert.equal(merged.find((row) => row.street.startsWith("Skovs"))?.source, "boligsiden");
assert.ok(merged.some((row) => row.source === "guloggratis"));

console.log("aggregate.test.ts ok");
