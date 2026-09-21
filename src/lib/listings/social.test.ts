import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS } from "./types.ts";
import {
  displayedListenListings,
  guessedPropertyType,
  instagramMedia,
  instagramPermalink,
  instagramPostCode,
  keepListenListing,
  listenCountDetail,
  listenCountLabel,
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

  it("hides kolonihave unless that type is selected", () => {
    const item = video({
      id: "gg-koloni",
      title: "Kolonihave i H/F Egebæk, Odense C",
      text: "Kolonihave til salg i Odense C.",
      price: 175_000,
      platform: "guloggratis",
      url: "https://www.guloggratis.dk/annonce/kolonihave-i-h-f-egebaek",
      video: null,
    });
    assert.equal(guessedPropertyType(item), "full year allotment garden");
    assert.equal(socialMatchesFilters(item, DEFAULT_FILTERS), false);
    assert.equal(
      socialMatchesFilters(item, { ...DEFAULT_FILTERS, types: ["full year allotment garden"] }),
      true,
    );
    assert.equal(keepListenListing(item, DEFAULT_FILTERS), false);
    assert.equal(
      keepListenListing(item, { ...DEFAULT_FILTERS, types: ["full year allotment garden"] }),
      true,
    );
  });

  it("drops classifieds that are not a house or apartment", () => {
    const bike = video({
      id: "gg-cykel",
      title: "Cykler til salg i Odense",
      text: "Damecykel og herrecykel. Afhentes i Odense C.",
      price: 2_500,
      platform: "guloggratis",
      url: "https://www.guloggratis.dk/annonce/cykler-odense",
      video: null,
    });
    const plot = video({
      id: "gg-grund",
      title: "Byggegrund i Odense N",
      text: "Grundstykke til salg.",
      price: 400_000,
      platform: "dba",
      url: "https://www.dba.dk/byggegrund",
      video: null,
    });
    assert.equal(keepListenListing(bike, DEFAULT_FILTERS), false);
    assert.equal(keepListenListing(plot, DEFAULT_FILTERS), false);
    assert.equal(socialMatchesFilters(bike, DEFAULT_FILTERS), false);
  });

  it("injects only local videos that match the hunt", () => {
    const merged = withLocalVideos({ listings: [], found: 0, live: false, sources: [] }, DEFAULT_FILTERS);
    assert.ok(merged.listings.every((item) => socialMatchesFilters(item, DEFAULT_FILTERS)));
    assert.ok(merged.listings.every((item) => item.price == null || item.price <= 2_000_000));
    const unfiltered = localVideoListings("odense");
    assert.ok(unfiltered.length > merged.listings.length);
    assert.ok((merged.all?.length ?? 0) >= merged.listings.length);
    assert.ok(merged.found >= merged.listings.length);
  });
});

describe("Lyt counts", () => {
  it("says matched of found when filters hide some opslag", () => {
    assert.equal(listenCountLabel(3, 11), "3 af 11 opslag");
    assert.equal(listenCountLabel(3, 3), "3 opslag");
    assert.equal(listenCountLabel(0, 0), "0 opslag");
  });

  it("explains found vs filters in Danish", () => {
    assert.equal(listenCountDetail(3, 11, "Odense"), "11 opslag i Odense. 3 matcher filtrene.");
    assert.equal(listenCountDetail(0, 11, "Odense"), "11 opslag i Odense. Ingen matcher dine filtre.");
    assert.equal(listenCountDetail(4, 4, "Odense"), "4 opslag i Odense.");
  });

  it("show-all swaps to the unfiltered pool", () => {
    const cheap = video({ id: "ig-cheap", title: "Villa i Odense", price: 1_500_000 });
    const dear = video({ id: "ig-dear", title: "Dyr villa i Odense", price: 4_500_000 });
    const result = {
      listings: [cheap],
      all: [cheap, dear],
      found: 2,
      live: true,
      sources: ["Instagram"],
    };
    assert.equal(displayedListenListings(result, false).length, 1);
    assert.equal(displayedListenListings(result, true).length, 2);
  });
});

describe("Instagram and TikTok deep-links", () => {
  it("parses /reel, /reels, /p and /{user}/reel shortcodes", () => {
    assert.deepEqual(instagramMedia("https://www.instagram.com/reel/DXY7FIYEq9I/"), {
      user: null,
      code: "DXY7FIYEq9I",
      reel: true,
    });
    assert.deepEqual(instagramMedia("https://www.instagram.com/reels/DXY7FIYEq9I/?hl=da"), {
      user: null,
      code: "DXY7FIYEq9I",
      reel: true,
    });
    assert.deepEqual(instagramMedia("https://www.instagram.com/nyboligodense/reel/DXY7FIYEq9I/"), {
      user: "nyboligodense",
      code: "DXY7FIYEq9I",
      reel: true,
    });
    assert.equal(instagramPostCode("https://www.instagram.com/p/AbCdef123XY/"), "AbCdef123XY");
    assert.equal(instagramPostCode("https://www.instagram.com/homeodense/"), null);
  });

  it("opens Reels as /{user}/reel/{code}/ not /p or the /reels feed", () => {
    const rows = (
      snapshot as { listings: Array<{ id: string; platform: string; url: string; author?: string | null }> }
    ).listings.filter((row) => row.platform === "instagram");
    assert.ok(rows.length > 0, "expected Instagram rows in social snapshot");

    for (const row of rows) {
      const item = video({
        id: row.id,
        title: row.id,
        price: 1_000_000,
        url: row.url,
        platform: "instagram",
        author: row.author ?? "nyboligodense",
      });
      const storedCode = instagramPostCode(row.url);
      assert.ok(storedCode, `stored URL must be a post/reel permalink: ${row.url}`);

      const opened = openedSocialUrl(item);
      const user = (row.author ?? "nyboligodense").replace(/^@/, "");
      assert.equal(opened, `https://www.instagram.com/${user}/reel/${storedCode}/`);
      assert.equal(instagramPostCode(opened), storedCode);
      assert.doesNotMatch(opened, /instagram\.com\/p\//i);
      assert.doesNotMatch(opened, /instagram\.com\/reels\//i);
    }
  });

  it("opens photo posts on /p/{code}/", () => {
    const item = video({
      id: "ig-photo",
      title: "Andelsbolig i Odense C",
      price: 590_000,
      platform: "instagram",
      kind: "photo",
      author: null,
      url: "https://www.instagram.com/p/AbCdef123XY/",
      video: null,
    });
    assert.equal(openedSocialUrl(item), "https://www.instagram.com/p/AbCdef123XY/");
    assert.equal(
      instagramPermalink({
        url: "https://www.instagram.com/p/AbCdef123XY/",
        author: "homeodense",
        kind: "photo",
      }),
      "https://www.instagram.com/homeodense/p/AbCdef123XY/",
    );
  });

  it("pins TikTok to the video, not For You", () => {
    const item = video({
      id: "tt-demo",
      title: "TikTok villa",
      price: 1_000_000,
      platform: "tiktok",
      url: "https://www.tiktok.com/@agency/video/1234567890123456789",
      video: "/reels/demo.mp4",
    });
    assert.equal(
      openedSocialUrl(item),
      "https://www.tiktok.com/@agency/video/1234567890123456789?is_from_webapp=1&sender_device=pc",
    );
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
