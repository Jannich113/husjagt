import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FILTERS, type Listing, type SearchFilters, type SearchResult } from "../listings/types.ts";
import { createHuntServices, EMPTY_SEARCH, type HuntServices } from "./ports.ts";
import { runGetListing, runHuntSearch } from "./run-search.ts";

function house(partial: Partial<Listing> & Pick<Listing, "id" | "street" | "source">): Listing {
  return {
    type: "villa",
    price: 1_200_000,
    priceChange: null,
    area: 110,
    lot: 400,
    rooms: 4,
    energy: "C",
    year: 1978,
    expense: 2500,
    m2price: 10_000,
    days: 4,
    lat: 56.15,
    lon: 10.2,
    image: null,
    imageAlt: null,
    agency: "home",
    agencySlug: "home",
    city: "Aarhus C",
    zip: 8000,
    slug: partial.id,
    slugAddress: "",
    caseUrl: null,
    ...partial,
  };
}

function result(listings: Listing[], source: string): SearchResult {
  return { totalHits: listings.length, listings, live: true, source, sources: [source] };
}

function kernel(overrides: Partial<HuntServices> = {}): HuntServices {
  return createHuntServices(
    {
      catalogs: [],
      classifieds: null,
      places: {
        districts: async () => [],
        suggestPlaces: async () => [],
        suggestPostnumre: async () => [],
      },
      social: { listen: async () => ({ listings: [], found: 0, live: false, sources: [] }) },
      snapshot: () => EMPTY_SEARCH,
    },
    overrides,
  );
}

const aarhus: SearchFilters = { ...DEFAULT_FILTERS, municipality: "aarhus", city: "Aarhus C" };

describe("hunt DI kernel", () => {
  it("merges injected catalogs and skips a null classifieds port", async () => {
    const a = house({ id: "a", street: "Nørre Allé 1", source: "boligsiden" });
    const b = house({ id: "b", street: "Nørre Allé 1", source: "boliga", image: "https://cdn.example/b.jpg" });
    const services = kernel({
      catalogs: [
        { id: "boligsiden", timeoutMs: 50, search: async () => result([a], "Boligsiden") },
        { id: "boliga", timeoutMs: 50, search: async () => result([b], "Boliga") },
      ],
    });
    const out = await runHuntSearch(services, aarhus);
    assert.equal(out.listings.length, 1);
    assert.ok(out.sources.includes("Boligsiden"));
    assert.ok(out.sources.includes("Boliga"));
  });

  it("does not call a catalog that was never injected", async () => {
    const called: string[] = [];
    const services = kernel({
      catalogs: [
        {
          id: "boligsiden",
          timeoutMs: 50,
          search: async () => {
            called.push("boligsiden");
            return result([house({ id: "1", street: "Banegårdspladsen 1", source: "boligsiden" })], "Boligsiden");
          },
        },
      ],
    });
    await runHuntSearch(services, aarhus);
    assert.deepEqual(called, ["boligsiden"]);
  });

  it("uses getById from the first catalog that has the listing", async () => {
    const listing = house({ id: "case-9", street: "Vesterbro Torv 1", source: "boligsiden" });
    const services = kernel({
      catalogs: [
        { id: "boliga", timeoutMs: 50, search: async () => EMPTY_SEARCH },
        {
          id: "boligsiden",
          timeoutMs: 50,
          search: async () => EMPTY_SEARCH,
          getById: async (id) => (id === "case-9" ? { ...listing, descriptionTitle: "Villa", descriptionBody: "", bathrooms: 1, floors: 1, images: [] } : null),
        },
      ],
    });
    const hit = await runGetListing(services, "case-9");
    assert.equal(hit?.street, "Vesterbro Torv 1");
  });

  it("lets tests replace places without touching DAWA", async () => {
    const seen: string[] = [];
    const services = kernel({
      catalogs: [
        {
          id: "boligsiden",
          timeoutMs: 50,
          search: async () => result([house({ id: "1", street: "Åboulevarden 2", source: "boligsiden" })], "Boligsiden"),
        },
      ],
      places: {
        districts: async (slug) => {
          seen.push(slug);
          return [];
        },
        remember: (slug) => seen.push(`remember:${slug}`),
        suggestPlaces: async () => [],
        suggestPostnumre: async () => [],
      },
    });
    await runHuntSearch(services, aarhus);
    assert.deepEqual(seen, ["aarhus"]);
  });

  it("keeps catalog totalHits and skips classifieds on later pages", async () => {
    let classifiedCalls = 0;
    const page1 = house({ id: "p1", street: "Åboulevarden 1", source: "boligsiden" });
    const services = kernel({
      catalogs: [
        {
          id: "boligsiden",
          timeoutMs: 50,
          search: async () => ({ totalHits: 214, listings: [page1], live: true, source: "Boligsiden", sources: ["Boligsiden"] }),
        },
      ],
      classifieds: {
        timeoutMs: 50,
        search: async () => {
          classifiedCalls += 1;
          return [];
        },
      },
    });
    const first = await runHuntSearch(services, aarhus);
    assert.equal(first.totalHits, 214);
    assert.equal(classifiedCalls, 1);
    await runHuntSearch(services, { ...aarhus, page: 2 });
    assert.equal(classifiedCalls, 1);
  });
});
