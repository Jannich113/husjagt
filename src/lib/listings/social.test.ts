import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS } from "./types.ts";
import {
  guessedPropertyType,
  localVideoListings,
  socialMatchesFilters,
  withLocalVideos,
  type SocialListing,
} from "./social.ts";

function video(partial: Partial<SocialListing> & Pick<SocialListing, "id" | "title" | "price">): SocialListing {
  return {
    platform: "instagram",
    text: "",
    url: `https://example.com/${partial.id}`,
    city: "Odense N",
    zip: "5270",
    street: null,
    image: null,
    video: "/reels/demo.mp4",
    author: "nyboligodense",
    kind: "video",
    postedAt: null,
    ...partial,
  };
}

describe("social video hunt filters", () => {
  it("keeps playable Odense videos within max price and type", () => {
    const item = video({
      id: "ig-brolandvej-83",
      title: "Étplansvilla på lukket vænge — Brolandvej 83",
      text: "Indflytningsklar étplansvilla på 105 m² med 3 værelser",
      price: 1_995_000,
      street: "Brolandvej 83",
    });
    assert.equal(guessedPropertyType(item), "villa");
    assert.equal(socialMatchesFilters(item, DEFAULT_FILTERS), true);
  });

  it("drops videos over priceMax", () => {
    const item = video({
      id: "ig-udsigten-6",
      title: "Villa med udestue og have i Næsby",
      price: 2_295_000,
    });
    assert.equal(socialMatchesFilters(item, DEFAULT_FILTERS), false);
    assert.equal(
      socialMatchesFilters(item, { ...DEFAULT_FILTERS, priceMax: 3_000_000 }),
      true,
    );
  });

  it("drops villas when the hunt is only andelsbolig", () => {
    const item = video({
      id: "ig-villa",
      title: "Villa i Odense N",
      price: 1_500_000,
    });
    assert.equal(
      socialMatchesFilters(item, { ...DEFAULT_FILTERS, types: ["cooperative"] }),
      false,
    );
  });

  it("injects only local videos that match the hunt", () => {
    const merged = withLocalVideos({ listings: [], live: false, sources: [] }, DEFAULT_FILTERS);
    assert.ok(merged.listings.every((item) => socialMatchesFilters(item, DEFAULT_FILTERS)));
    assert.ok(merged.listings.every((item) => item.price == null || item.price <= 2_000_000));
    const unfiltered = localVideoListings("odense");
    assert.ok(unfiltered.length > merged.listings.length);
  });
});
