import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectImages, mapDetail } from "./map-listing.ts";

describe("listing photos", () => {
  it("keeps the cover first and drops blank duplicates", () => {
    const urls = collectImages({
      image: { url: "https://cdn.example/cover.webp" },
      images: [
        { url: "https://cdn.example/cover.webp" },
        { url: "" },
        { url: "https://cdn.example/two.webp" },
        { url: "https://cdn.example/two.webp" },
      ],
    });
    assert.deepEqual(urls, ["https://cdn.example/cover.webp", "https://cdn.example/two.webp"]);
  });

  it("prefers 600x400 from imageSources and still maps a case", () => {
    const detail = mapDetail({
      caseID: "abc",
      addressType: "villa",
      priceCash: 1,
      image: {
        imageSources: [
          { url: "https://images.boligsiden.dk/images/case/abc/300x200/a.webp" },
          { url: "https://images.boligsiden.dk/images/case/abc/600x400/a.webp" },
        ],
      },
      images: [
        {
          imageSources: [{ url: "https://images.boligsiden.dk/images/case/abc/600x400/b.webp" }],
        },
      ],
      address: { roadName: "Nørregade", houseNumber: "1", cityName: "Billund", zipCode: 7190 },
    });
    assert.ok(detail);
    assert.equal(detail!.images[0], "https://images.boligsiden.dk/images/case/abc/600x400/a.webp");
    assert.equal(detail!.images[1], "https://images.boligsiden.dk/images/case/abc/600x400/b.webp");
  });
});
