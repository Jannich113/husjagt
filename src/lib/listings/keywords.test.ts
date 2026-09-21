import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterByKeywords,
  highlightSegments,
  listingHitsKeywords,
  matchedKeywords,
  normalizeKeyword,
} from "./keywords.ts";

const listing = {
  descriptionTitle: "Villa med udestue",
  descriptionBody: "Dejlig have og kælder. Nybyg i 2019.",
  street: "Bakkevej 1",
  city: "Odense M",
  imageAlt: "Køkken",
  type: "villa",
};

describe("keywords", () => {
  it("normalizes and rejects short tokens", () => {
    assert.equal(normalizeKeyword("  Have "), "have");
    assert.equal(normalizeKeyword("#Udestue"), "udestue");
    assert.equal(normalizeKeyword("x"), null);
  });

  it("any/all filtering and empty list is a no-op", () => {
    assert.deepEqual(matchedKeywords(listing, ["have", "elevator"]), ["have"]);
    assert.equal(listingHitsKeywords(listing, ["have", "kælder"], "all"), true);
    assert.equal(listingHitsKeywords(listing, ["have", "elevator"], "all"), false);
    assert.equal(listingHitsKeywords(listing, ["have", "elevator"], "any"), true);
    assert.equal(filterByKeywords([listing], [], "any").length, 1);
  });

  it("highlights matches without dropping the rest of the text", () => {
    const parts = highlightSegments("Villa med have og kælder", ["have", "kælder"]);
    assert.deepEqual(
      parts.filter((p) => p.hit).map((p) => p.text.toLowerCase()),
      ["have", "kælder"],
    );
    assert.equal(parts.map((p) => p.text).join(""), "Villa med have og kælder");
  });
});
