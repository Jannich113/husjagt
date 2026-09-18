import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  absoluteUrl,
  appShareCopy,
  filtersFromHunt,
  huntFromFilters,
  huntPath,
  huntShareCopy,
  isPrivatePreviewHost,
  isPublicShareOrigin,
  listingShareCopy,
  parseHuntSearch,
  shareLink,
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

  it("roundtrips kun-nye", () => {
    const hunt = huntFromFilters({ ...DEFAULT_FILTERS, freshOnly: true }, "list");
    assert.equal(hunt.ny, 1);
    assert.equal(filtersFromHunt(hunt).freshOnly, true);
    assert.equal(filtersFromHunt({}).freshOnly, false);
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

  it("builds a hunt share and a listing share", () => {
    const hunt = huntShareCopy({ ...DEFAULT_FILTERS, municipality: "odense" }, "list");
    assert.match(hunt.title, /Odense/);
    assert.match(hunt.url, /k=odense/);
    const listing = listingShareCopy({
      id: "bs-1",
      type: "villa",
      price: 1_850_000,
      priceChange: null,
      area: 120,
      lot: null,
      rooms: 4,
      energy: null,
      year: null,
      expense: null,
      m2price: null,
      days: null,
      lat: 55.4,
      lon: 10.4,
      image: null,
      imageAlt: null,
      agency: "home",
      agencySlug: "home",
      city: "Odense",
      zip: 5000,
      street: "Buchwaldsgade 13B",
      slug: "bs-1",
      slugAddress: "",
      caseUrl: null,
      source: "boligsiden",
    });
    assert.equal(listing.title, "Buchwaldsgade 13B, Odense");
    assert.match(listing.url, /\/listing\/bs-1$/);
  });
});

describe("shareLink", () => {
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;

  function stubNavigator(value: unknown) {
    Object.defineProperty(globalThis, "navigator", { value, configurable: true, writable: true });
  }

  function stubWindow(value: unknown) {
    Object.defineProperty(globalThis, "window", { value, configurable: true, writable: true });
  }

  function restore() {
    stubNavigator(originalNavigator);
    stubWindow(originalWindow);
  }

  it("uses Web Share even if the leftover Android bridge is present", async () => {
    const shared: unknown[] = [];
    let nativeCalls = 0;
    stubNavigator({
      share: async (payload: unknown) => {
        shared.push(payload);
      },
    });
    stubWindow({
      location: { origin: "https://husjagt.grok.me" },
      HusjagtNative: {
        share() {
          nativeCalls += 1;
        },
      },
    });
    try {
      const result = await shareLink({ title: "Husjagt i Odense", text: "villa", url: "/?k=odense" });
      assert.equal(result, "shared");
      assert.equal(shared.length, 1);
      assert.equal(nativeCalls, 0);
    } finally {
      restore();
    }
  });

  it("falls back to clipboard when Web Share is missing", async () => {
    const written: string[] = [];
    stubNavigator({
      clipboard: {
        writeText: async (text: string) => {
          written.push(text);
        },
      },
    });
    stubWindow({ location: { origin: "https://husjagt.grok.me" } });
    try {
      const result = await shareLink({ title: "Husjagt", text: "x", url: "/listing/abc" });
      assert.equal(result, "copied");
      assert.equal(written.length, 1);
      assert.match(written[0] ?? "", /listing\/abc/);
    } finally {
      restore();
    }
  });

  it("uses the Android share sheet only when Web Share is absent", async () => {
    let nativeCalls = 0;
    stubNavigator({});
    stubWindow({
      location: { origin: "https://husjagt.grok.me" },
      HusjagtNative: {
        share() {
          nativeCalls += 1;
        },
      },
    });
    try {
      const result = await shareLink({ title: "T", text: "x", url: "/" });
      assert.equal(result, "shared");
      assert.equal(nativeCalls, 1);
    } finally {
      restore();
    }
  });

  it("treats a cancelled Web Share as failed, not copied", async () => {
    stubNavigator({
      share: async () => {
        const err = new Error("Share canceled");
        err.name = "AbortError";
        throw err;
      },
      clipboard: {
        writeText: async () => {
          throw new Error("should not copy");
        },
      },
    });
    stubWindow({ location: { origin: "https://husjagt.grok.me" } });
    try {
      const result = await shareLink({ title: "T", text: "x", url: "/" });
      assert.equal(result, "failed");
    } finally {
      restore();
    }
  });
});
