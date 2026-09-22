import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { huntMapCamera, kommuneViewFromDawa, pointInBounds } from "./kommune-view.ts";

const ASSENS = {
  minLon: 9.76,
  minLat: 55.12,
  maxLon: 10.3,
  maxLat: 55.44,
};

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

describe("huntMapCamera", () => {
  it("fits the kommune when pins are missing", () => {
    const cam = huntMapCamera({
      boxes: [],
      selectedDistrictBounds: [],
      kommuneBounds: ASSENS,
      kommuneCenter: { lat: 55.27, lon: 10.07 },
      pins: [],
    });
    assert.equal(cam?.kind, "bounds");
    if (cam?.kind === "bounds") assert.equal(cam.bounds.minLon, ASSENS.minLon);
  });

  it("ignores outlier pins outside the kommune", () => {
    const cam = huntMapCamera({
      boxes: [],
      selectedDistrictBounds: [],
      kommuneBounds: ASSENS,
      kommuneCenter: { lat: 55.27, lon: 10.07 },
      pins: [
        { lat: 55.27, lon: 10.07 },
        { lat: 57.72, lon: 10.58 },
      ],
    });
    assert.equal(cam?.kind, "bounds");
    if (cam?.kind === "bounds") {
      assert.equal(cam.bounds.minLon, ASSENS.minLon);
      assert.ok(pointInBounds(55.27, 10.07, cam.bounds));
    }
  });

  it("tightens onto a cluster of pins inside the kommune", () => {
    const cam = huntMapCamera({
      boxes: [],
      selectedDistrictBounds: [],
      kommuneBounds: ASSENS,
      kommuneCenter: { lat: 55.27, lon: 10.07 },
      pins: [
        { lat: 55.26, lon: 10.05 },
        { lat: 55.28, lon: 10.09 },
      ],
    });
    assert.equal(cam?.kind, "bounds");
    if (cam?.kind === "bounds") {
      assert.ok(cam.bounds.maxLat - cam.bounds.minLat < 0.05);
    }
  });
});
