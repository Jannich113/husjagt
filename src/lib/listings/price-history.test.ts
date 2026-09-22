import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePriceHistory, priceHistoryLabel } from "./price-history.ts";

describe("price history", () => {
  it("reads a Boligsiden-style series", () => {
    const rows = parsePriceHistory({
      priceDevelopment: [
        { date: "2026-01-12", price: 2_000_000 },
        { date: "2026-03-01", priceCash: 1_850_000 },
      ],
    });
    assert.equal(rows.length, 2);
    assert.equal(rows[1]?.price, 1_850_000);
  });

  it("explains when only the percentage exists", () => {
    assert.match(priceHistoryLabel(-4.2, []) ?? "", /Ingen fuld prishistorik/);
    assert.equal(priceHistoryLabel(-4, [{ at: "a", price: 1 }, { at: "b", price: 2 }]), null);
  });
});
