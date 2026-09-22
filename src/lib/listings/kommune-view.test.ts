import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { kommuneViewFromDawa } from "./kommune-view.ts";

describe("kommuneViewFromDawa", () => {
  it("reads Assens visueltcenter and bbox from DAWA", () => {
    const view = kommuneViewFromDawa("assens", {
      kode: "0420",
      navn: "Assens",
      visueltcenter: [10.07, 55.27],
      bbox: [9.8, 55.1, 10.35, 55.45],
    });
    assert.equal(view?.lat, 55.27);
    assert.equal(view?.lon, 10.07);
    assert.equal(view?.bounds?.minLon, 9.8);
    assert.equal(view?.bounds?.maxLat, 55.45);
  });

  it("rejects payloads without a center", () => {
    assert.equal(kommuneViewFromDawa("assens", { navn: "Assens" }), null);
  });
});
