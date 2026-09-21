import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRICE_BOUND,
  clampPair,
  filterFromSlider,
  parseDaInt,
  sliderFromFilter,
  snap,
} from "./filter-range.ts";

describe("filter range helpers", () => {
  it("parses Danish grouped integers", () => {
    assert.equal(parseDaInt("1.850.000"), 1_850_000);
    assert.equal(parseDaInt(" 2 000 000 "), 2_000_000);
    assert.equal(parseDaInt(""), null);
    assert.equal(parseDaInt("abc"), null);
  });

  it("maps unbounded filters to the slider ends", () => {
    assert.equal(sliderFromFilter(null, "min", PRICE_BOUND), 0);
    assert.equal(sliderFromFilter(null, "max", PRICE_BOUND), PRICE_BOUND.max);
    assert.equal(filterFromSlider(0, "min", PRICE_BOUND), null);
    assert.equal(filterFromSlider(PRICE_BOUND.max, "max", PRICE_BOUND), null);
    assert.equal(filterFromSlider(2_000_000, "max", PRICE_BOUND), 2_000_000);
  });

  it("snaps and keeps min <= max", () => {
    assert.equal(snap(1_874_000, PRICE_BOUND), 1_850_000);
    assert.deepEqual(clampPair(3, 2, "min"), { min: 3, max: 3 });
    assert.deepEqual(clampPair(3, 2, "max"), { min: 2, max: 2 });
  });
});
