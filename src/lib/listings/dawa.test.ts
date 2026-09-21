import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { districtsFromGeoJson, parsePostHints, simplifyRing } from "./dawa.ts";
import { districtIdFor } from "./districts.ts";

describe("DAWA helpers", () => {
  it("keeps Odense C as id c so bydel=c still works", () => {
    assert.equal(districtIdFor("5000", "Odense C"), "c");
    assert.equal(districtIdFor("5270", "Odense N"), "n");
    assert.equal(districtIdFor("8000", "Aarhus C"), "aarhus-c");
  });

  it("simplifies a ring without losing the closed shape", () => {
    const ring: [number, number][] = [
      [10, 55],
      [10.0001, 55.00002],
      [10.2, 55],
      [10.2, 55.2],
      [10, 55.2],
      [10, 55],
    ];
    const simp = simplifyRing(ring, 0.01);
    assert.ok(simp.length >= 4);
    assert.equal(simp[0]![0], simp.at(-1)![0]);
  });

  it("parses DAWA geojson into districts", () => {
    const rows = districtsFromGeoJson({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { nr: "8000", navn: "Aarhus C" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [10.15, 56.14],
              [10.25, 56.14],
              [10.25, 56.18],
              [10.15, 56.18],
              [10.15, 56.14],
            ]],
          },
        },
        {
          type: "Feature",
          properties: { nr: "5000", navn: "Odense C", stormodtager: true },
          geometry: { type: "Polygon", coordinates: [[[10, 55], [10.1, 55], [10.1, 55.1], [10, 55]]] },
        },
      ],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, "aarhus-c");
    assert.equal(rows[0]?.zip, "8000");
    assert.equal(rows[0]?.geometry.type, "Polygon");
  });

  it("parses autocomplete hints", () => {
    const rows = parsePostHints([
      { tekst: "5000 Odense C", postnummer: { nr: "5000", navn: "Odense C" } },
      { tekst: "junk" },
    ]);
    assert.deepEqual(rows, [{ nr: "5000", navn: "Odense C", tekst: "5000 Odense C" }]);
  });
});
