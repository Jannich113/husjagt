import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyPlace, localPlaceHits, pickKommuneFromDawa, placeLabel } from "./place.ts";
import { placesFromPostnumre, placesFromKommunerAutocomplete } from "./dawa.ts";
import { kommuneByCode, kommuneByName, slugifyKommuneName } from "./kommuner.ts";
import { DEFAULT_FILTERS } from "./types.ts";
import { sourceEnabled } from "./sources.ts";
import { moduleOn } from "../hunt/modules.ts";

describe("nationwide place picking", () => {
  it("maps DAWA kommune names onto our slugs", () => {
    assert.equal(slugifyKommuneName("København"), "koebenhavn");
    assert.equal(kommuneByName("Aarhus")?.slug, "aarhus");
    assert.equal(kommuneByCode("0751")?.slug, "aarhus");
    assert.equal(kommuneByCode(157)?.slug, "gentofte");
  });

  it("picks Gentofte for Hellerup when København is also listed", () => {
    const picked = pickKommuneFromDawa(
      [
        { kode: "0101", navn: "København" },
        { kode: "0157", navn: "Gentofte" },
      ],
      "Hellerup",
    );
    assert.equal(picked?.navn, "Gentofte");
  });

  it("applies a city onto filters and clears Odense leftovers", () => {
    const next = applyPlace(
      { ...DEFAULT_FILTERS, districts: ["c"], boxes: [{ minLon: 1, minLat: 2, maxLon: 3, maxLat: 4 }] },
      {
        id: "postnr:2900:gentofte",
        kind: "postnr",
        label: "2900 Hellerup",
        detail: "Gentofte Kommune",
        municipality: "gentofte",
        zip: "2900",
        city: "Hellerup",
      },
    );
    assert.equal(next.municipality, "gentofte");
    assert.equal(next.zipCode, "2900");
    assert.equal(next.city, "Hellerup");
    assert.equal(next.districts.length, 0);
    assert.equal(next.boxes.length, 0);
    assert.equal(placeLabel(next), "Hellerup");
  });

  it("parses DAWA hits for Aarhus kommune and 8000 Aarhus C", () => {
    const kommuner = placesFromKommunerAutocomplete([
      { tekst: "0751 Aarhus", kommune: { kode: "0751", navn: "Aarhus" } },
    ]);
    assert.equal(kommuner[0]?.municipality, "aarhus");
    const posts = placesFromPostnumre([
      {
        nr: "8000",
        navn: "Aarhus C",
        kommuner: [{ kode: "0751", navn: "Aarhus" }],
      },
    ]);
    assert.equal(posts[0]?.municipality, "aarhus");
    assert.equal(posts[0]?.zip, "8000");
    assert.equal(posts[0]?.city, "Aarhus C");
  });

  it("finds Svendborg locally without waiting for DAWA", () => {
    const hits = localPlaceHits("svend");
    assert.ok(hits.some((row) => row.municipality === "svendborg"));
  });

  it("keeps listing sources and hunt modules as switches", () => {
    assert.equal(sourceEnabled("boligsiden"), true);
    assert.equal(moduleOn("placePicker"), true);
    assert.equal(moduleOn("listen"), true);
  });

  it("sends Boligsiden the Danish kommune name as slug", () => {
    assert.equal((kommuneByName("Assens")?.name ?? "").toLowerCase(), "assens");
    assert.equal((kommuneByName("København")?.name ?? "").toLowerCase(), "københavn");
    assert.equal((kommuneByName("Allerød")?.name ?? "").toLowerCase(), "allerød");
  });
});
