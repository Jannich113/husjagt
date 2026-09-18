import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS } from "./types.ts";
import {
  guessedPropertyType,
  instagramPostCode,
  localVideoListings,
  openedSocialUrl,
  socialMatchesFilters,
  withLocalVideos,
  type SocialListing,
} from "./social.ts";
import snapshot from "./social-snapshot.json" with { type: "json" };

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

describe("Instagram reel deep-link mapping", () => {
  it("maps listing id → stored reel URL → opened post URL (same shortcode)", () => {
    const rows = (snapshot as { listings: Array<{ id: string; platform: string; url: string }> }).listings.filter(
      (row) => row.platform === "instagram",
    );
    assert.ok(rows.length > 0, "expected Instagram rows in social snapshot");

    for (const row of rows) {
      const item = video({
        id: row.id,
        title: row.id,
        price: 1_000_000,
        url: row.url,
        platform: "instagram",
      });
      const storedCode = instagramPostCode(row.url);
      assert.ok(storedCode, `stored URL must be a post/reel permalink: ${row.url}`);
      assert.match(row.url, /instagram\.com\/(?:reel|reels|p)\//i);
      assert.doesNotMatch(row.url, /instagram\.com\/(?:explore|reels\/?$|[^/]+\/?$)/i);

      const opened = openedSocialUrl(item);
      assert.equal(opened, `https://www.instagram.com/p/${storedCode}/`);
      assert.equal(instagramPostCode(opened), storedCode);
      assert.doesNotMatch(opened, /\/(?:explore|reels)\b/i);
      assert.doesNotMatch(opened, /instagram\.com\/(?!p\/)[^/]+\/?$/i);
    }
  });

  it("does not rewrite TikTok deep-links", () => {
    const item = video({
      id: "tt-demo",
      title: "TikTok villa",
      price: 1_000_000,
      platform: "tiktok",
      url: "https://www.tiktok.com/@agency/video/1234567890123456789",
      video: "/reels/demo.mp4",
    });
    assert.equal(openedSocialUrl(item), item.url);
  });

  it("falls back to stored URL when Instagram URL has no post shortcode", () => {
    const item = video({
      id: "ig-profile",
      title: "Profile only",
      price: 1_000_000,
      url: "https://www.instagram.com/homeodense/",
    });
    assert.equal(instagramPostCode(item.url), null);
    assert.equal(openedSocialUrl(item), item.url);
  });
});
