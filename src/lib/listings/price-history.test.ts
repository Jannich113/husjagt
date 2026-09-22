import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  askingHistoryFromChange,
  parsePriceHistory,
  priceChartLayout,
  priceHistoryLabel,
} from "./price-history.ts";

describe("price history", () => {
  it("reads a nested Boligsiden-style series", () => {
    const rows = parsePriceHistory({
      priceDevelopment: {
        development: [
          { date: "2026-01-12", price: 2_000_000 },
          { date: "2026-03-01", priceCash: 1_850_000 },
        ],
      },
    });
    assert.equal(rows.length, 2);
    assert.equal(rows[1]?.price, 1_850_000);
  });

  it("reads address sale registrations", () => {
    const rows = parsePriceHistory(
      {
        registrations: [
          { date: "2021-08-30", amount: 2_050_000, type: "sold" },
          { date: "2004-08-23", amount: 1_495_000, type: "normal" },
        ],
      },
      "sold",
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.kind, "sold");
  });

  it("rebuilds a two-point asking series from the latest % change", () => {
    const rows = askingHistoryFromChange(1_850_000, -7.5, 40);
    assert.equal(rows.length, 2);
    assert.ok(rows[0]!.price > rows[1]!.price);
    assert.equal(rows[1]!.price, 1_850_000);
  });

  it("explains when only the percentage exists and there is no series", () => {
    assert.match(priceHistoryLabel(-4.2, []) ?? "", /Ingen fuld prishistorik/);
    assert.equal(priceHistoryLabel(-4, [{ at: "a", price: 1 }, { at: "b", price: 2 }]), null);
  });

  it("lays out a chart with a line and y ticks", () => {
    const layout = priceChartLayout([
      { at: "2026-01-01", price: 2_000_000, kind: "ask" },
      { at: "2026-03-01", price: 1_850_000, kind: "ask" },
    ]);
    assert.ok(layout);
    assert.equal(layout!.dots.length, 2);
    assert.match(layout!.line, /^M/);
    assert.equal(layout!.ticksY.length, 3);
    assert.ok(layout!.dots[0]!.y < layout!.dots[1]!.y);
  });
});
