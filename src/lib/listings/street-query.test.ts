import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterByStreetQuery, matchesStreetQuery, normalizeStreetQuery } from "./street-query.ts";

const house = {
  street: "Roskildevej 42",
  city: "Odense C",
  zip: 5000,
  slugAddress: "roskildevej-42-5000-odense-c",
};

describe("street query", () => {
  it("empty query keeps every listing", () => {
    assert.equal(normalizeStreetQuery("  "), "");
    assert.equal(matchesStreetQuery(house, ""), true);
    assert.equal(filterByStreetQuery([house], "   ").length, 1);
  });

  it("matches street, zip and city case-insensitively", () => {
    assert.equal(matchesStreetQuery(house, "roskilde"), true);
    assert.equal(matchesStreetQuery(house, "ROSKILDEVEJ 42"), true);
    assert.equal(matchesStreetQuery(house, "5000"), true);
    assert.equal(matchesStreetQuery(house, "odense c"), true);
    assert.equal(matchesStreetQuery(house, "Åsumvej"), false);
  });
});
