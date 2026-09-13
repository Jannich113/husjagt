import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  absoluteUrl,
  appShareCopy,
  filtersFromHunt,
  huntFromFilters,
  huntPath,
  isPrivatePreviewHost,
  isPublicShareOrigin,
  parseHuntSearch,
  viewFromHunt,
} from "./share.ts";
import { DEFAULT_FILTERS, LINK_BOUNDS } from "./types.ts";

describe("hunt URL codec", () => {
  it("omits defaults so / is the starter hunt", () => {
    const hunt = huntFromFilters(DEFAULT_FILTERS, "list");
    assert.deepEqual(hunt, {});
    assert.equal(huntPath(DEFAULT_FILTERS), "/");
  });

  it("keeps kommune, types and price on an explicit share link", () => {
    const path = huntPath(DEFAULT_FILTERS, "list", { explicit: true });
    assert.equal(path, "/?k=odense&t=villa,raekkehus,andel&p=2000000");
    const hunt = parseHuntSearch(Object.fromEntries(new URLSearchParams(path.slice(2))));
    const filters = filtersFromHunt(hunt);
    assert.equal(filters.municipality, "odense");
    assert.deepEqual(filters.types, DEFAULT_FILTERS.types);
    assert.equal(filters.priceMax, 2_000_000);
  });

  it("roundtrips advanced filters and the Lyt tab", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      municipality: "aarhus",
      types: ["condo", "cooperative"],
      priceMax: 3_000_000,
      roomsMin: 3,
      energyLabels: ["A", "B"],
      basement: true,
      city: "Aarhus C",
      zipCode: "8000",
      bounds: LINK_BOUNDS,
    };
    const hunt = huntFromFilters(filters, "listen");
    const back = filtersFromHunt(hunt);
    assert.equal(viewFromHunt(hunt), "listen");
    assert.equal(back.municipality, "aarhus");
    assert.deepEqual(back.types, ["condo", "cooperative"]);
    assert.equal(back.priceMax, 3_000_000);
    assert.equal(back.roomsMin, 3);
    assert.deepEqual(back.energyLabels, ["A", "B"]);
    assert.equal(back.basement, true);
    assert.equal(back.city, "Aarhus C");
    assert.equal(back.zipCode, "8000");
    assert.ok(back.bounds);
    assert.equal(hunt.view, "lyt");
    assert.equal(hunt.t, "lejlighed,andel");
  });

  it("accepts Danish type aliases and boolean flags from a raw URL", () => {
    const hunt = parseHuntSearch({
      k: "Odense",
      t: "rækkehus,andelsbolig,villa",
      p: "1500000",
      e: "a,b,c",
      kaelder: "1",
      view: "lyt",
    });
    const filters = filtersFromHunt(hunt);
    assert.equal(filters.municipality, "odense");
    assert.deepEqual(filters.types, ["terraced house", "cooperative", "villa"]);
    assert.equal(filters.priceMax, 1_500_000);
    assert.deepEqual(filters.energyLabels, ["A", "B", "C"]);
    assert.equal(filters.basement, true);
    assert.equal(viewFromHunt(hunt), "listen");
  });

  it("keeps hunt paths on a published origin and flags preview hosts as private", () => {
    const path = huntPath(DEFAULT_FILTERS, "list", { explicit: true });
    assert.equal(
      absoluteUrl(path, "https://example.grok.me"),
      "https://example.grok.me/?k=odense&t=villa,raekkehus,andel&p=2000000",
    );
    assert.equal(
      absoluteUrl("https://abc.grok-sandbox.com/listing/123", "https://example.grok.me"),
      "https://example.grok.me/listing/123",
    );
    assert.equal(absoluteUrl(path, ""), path);
    assert.equal(isPrivatePreviewHost("abc.grok-sandbox.com"), true);
    assert.equal(isPrivatePreviewHost("example.grok.me"), false);
    assert.equal(isPublicShareOrigin("https://abc.grok-sandbox.com"), false);
    assert.equal(isPublicShareOrigin("https://example.grok.me"), true);
  });

  it("shares the app root, not a listing or hunt", () => {
    const share = appShareCopy();
    assert.equal(share.title, "Husjagt");
    assert.equal(share.url, "/");
  });
});
