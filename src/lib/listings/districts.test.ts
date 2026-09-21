import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listingInDistricts, districtsForKommune, pointInGeometry, geometryCentroid } from "./districts.ts";
import { inAnyBox, normalizeBox, toggleBox } from "./map-listing.ts";
import { LINK_BOUNDS, type Listing } from "./types.ts";
import { filtersFromHunt, huntFromFilters, parseHuntSearch } from "./share.ts";
import { DEFAULT_FILTERS } from "./types.ts";

function house(partial: Partial<Listing> & Pick<Listing, "id">): Listing {
  return {
    type: "villa",
    price: 1_000_000,
    priceChange: null,
    area: 100,
    lot: null,
    rooms: 3,
    energy: "C",
    year: 1970,
    expense: null,
    m2price: null,
    days: 10,
    lat: 55.4,
    lon: 10.39,
    image: null,
    imageAlt: null,
    agency: null,
    agencySlug: null,
    street: "Testvej 1",
    city: "Odense C",
    zip: 5000,
    slug: partial.id,
    slugAddress: "",
    source: "boligsiden",
    caseUrl: null,
    ...partial,
  };
}

describe("map boxes and districts", () => {
  it("lists Odense bydele", () => {
    const rows = districtsForKommune("odense");
    assert.ok(rows.some((row) => row.id === "c" && row.zip === "5000"));
    assert.ok(rows.some((row) => row.id === "n"));
    assert.equal(districtsForKommune("aarhus").length, 0);
    const centrum = rows.find((row) => row.id === "c");
    assert.equal(centrum?.geometry.type, "Polygon");
    assert.ok((centrum?.geometry.coordinates[0]?.length ?? 0) > 8);
  });

  it("renders a real polygon around Odense C, not a rectangle", () => {
    const centrum = districtsForKommune("odense").find((row) => row.id === "c")!;
    const mid = geometryCentroid(centrum.geometry);
    assert.equal(pointInGeometry(mid.lon, mid.lat, centrum.geometry), true);
    assert.equal(pointInGeometry(10.39, 55.4, centrum.geometry), true);
    assert.equal(pointInGeometry(10.25, 55.42, centrum.geometry), false);
    const north = districtsForKommune("odense").find((row) => row.id === "n")!;
    assert.equal(pointInGeometry(10.39, 55.43, north.geometry), true);
    assert.equal(pointInGeometry(10.39, 55.43, centrum.geometry), false);
  });

  it("matches a listing to Odense C by zip or city", () => {
    const item = house({ id: "1", city: "Odense C", zip: 5000, lat: 55.4, lon: 10.39 });
    assert.equal(listingInDistricts(item, "odense", ["c"]), true);
    assert.equal(listingInDistricts(item, "odense", ["n"]), false);
    assert.equal(listingInDistricts(item, "odense", ["c", "n"]), true);
  });

  it("keeps the original snippet as a toggleable box", () => {
    const once = toggleBox([], LINK_BOUNDS);
    assert.equal(once.length, 1);
    assert.equal(toggleBox(once, LINK_BOUNDS).length, 0);
  });

  it("drops boxes that are too small", () => {
    assert.equal(
      normalizeBox({ minLon: 10.1, minLat: 55.1, maxLon: 10.1001, maxLat: 55.1001 }),
      null,
    );
  });

  it("filters pins to drawn boxes", () => {
    const inside = house({ id: "in", lat: 55.337, lon: 10.345 });
    const outside = house({ id: "out", lat: 55.45, lon: 10.5 });
    assert.equal(inAnyBox(inside, [LINK_BOUNDS]), true);
    assert.equal(inAnyBox(outside, [LINK_BOUNDS]), false);
    assert.equal(inAnyBox(outside, []), true);
  });

  it("roundtrips several boxes and bydele on the hunt URL", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      boxes: [LINK_BOUNDS, { minLon: 10.3, minLat: 55.39, maxLon: 10.4, maxLat: 55.42 }],
      districts: ["c", "n"],
    };
    const hunt = huntFromFilters(filters, "map");
    assert.match(hunt.kort ?? "", /\|/);
    assert.equal(hunt.bydel, "c,n");
    assert.equal(hunt.view, "kort");
    const back = filtersFromHunt(parseHuntSearch({ kort: hunt.kort, bydel: hunt.bydel, view: "kort" }));
    assert.equal(back.boxes.length, 2);
    assert.deepEqual(back.districts, ["c", "n"]);
  });

  it("still reads a single legacy kort= box", () => {
    const back = filtersFromHunt(parseHuntSearch({ kort: "10.34226,55.33393,10.34872,55.34033" }));
    assert.equal(back.boxes.length, 1);
    assert.ok(back.boxes[0] && back.boxes[0].minLon < back.boxes[0].maxLon);
  });
});
