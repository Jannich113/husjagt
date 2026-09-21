import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listingImageFallbacks } from "./listing-image.ts";

describe("listingImageFallbacks", () => {
  it("returns nothing when there is no photo", () => {
    assert.deepEqual(listingImageFallbacks(null), []);
    assert.deepEqual(listingImageFallbacks(""), []);
  });

  it("tries jpg and other Boligsiden sizes after the stored webp", () => {
    const url =
      "https://images.boligsiden.dk/images/case/abc/600x400/def.webp";
    const next = listingImageFallbacks(url);
    assert.equal(next[0], url);
    assert.ok(next.includes("https://images.boligsiden.dk/images/case/abc/600x400/def.jpg"));
    assert.ok(next.includes("https://images.boligsiden.dk/images/case/abc/300x200/def.webp"));
    assert.ok(next.includes("https://images.boligsiden.dk/images/case/abc/1200x800/def.webp"));
  });
});
