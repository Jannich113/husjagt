import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FIRST_SEEN_MAX,
  freshnessFromAge,
  freshnessFromDays,
  freshnessLabel,
  listingFreshness,
  parseFirstSeen,
  rememberFirstSeen,
} from "./fresh.ts";

const DAY = 24 * 60 * 60 * 1000;

describe("freshnessFromDays", () => {
  it("treats 0–1 days as today", () => {
    assert.equal(freshnessFromDays(0), "today");
    assert.equal(freshnessFromDays(1), "today");
  });

  it("treats 2–7 days as this week", () => {
    assert.equal(freshnessFromDays(2), "week");
    assert.equal(freshnessFromDays(7), "week");
  });

  it("drops older and junk", () => {
    assert.equal(freshnessFromDays(8), null);
    assert.equal(freshnessFromDays(null), null);
    assert.equal(freshnessFromDays(-1), null);
  });
});

describe("listingFreshness", () => {
  it("prefers portal days over first-seen", () => {
    assert.equal(listingFreshness({ id: "a", days: 40 }, Date.now()), null);
    assert.equal(listingFreshness({ id: "a", days: 1 }, 0), "today");
  });

  it("falls back to first-seen when the portal has no date", () => {
    const now = Date.now();
    assert.equal(listingFreshness({ id: "a", days: null }, now, now), "today");
    assert.equal(listingFreshness({ id: "a", days: null }, now - 3 * DAY, now), "week");
    assert.equal(listingFreshness({ id: "a", days: null }, now - 8 * DAY, now), null);
  });

  it("treats a never-seen undated listing as new", () => {
    assert.equal(listingFreshness({ id: "a", days: null }, null), "today");
  });
});

describe("freshnessLabel", () => {
  it("uses Danish copy", () => {
    assert.equal(freshnessLabel("today"), "Ny i dag");
    assert.equal(freshnessLabel("today", true), "I dag");
    assert.equal(freshnessLabel("week"), "Ny uge");
    assert.equal(freshnessLabel(null), null);
  });
});

describe("parseFirstSeen / rememberFirstSeen", () => {
  it("reads a timestamp map and drops junk", () => {
    assert.deepEqual(parseFirstSeen(JSON.stringify({ a: 1, b: "no", c: 2 })), { a: 1, c: 2 });
    assert.deepEqual(parseFirstSeen("nope"), {});
    assert.deepEqual(parseFirstSeen(null), {});
  });

  it("records new ids and prunes stale ones", () => {
    const now = 1_000_000_000_000;
    const stale = now - 20 * DAY;
    const next = rememberFirstSeen({ old: stale, keep: now - DAY }, ["fresh", "keep"], now);
    assert.equal(next.fresh, now);
    assert.equal(next.keep, now - DAY);
    assert.equal(next.old, undefined);
  });

  it("is a no-op when nothing changes", () => {
    const now = 1_000_000_000_000;
    const map = { a: now };
    assert.equal(rememberFirstSeen(map, ["a"], now), map);
  });

  it("caps growth", () => {
    const now = 1_000_000_000_000;
    const filled: Record<string, number> = {};
    for (let i = 0; i < FIRST_SEEN_MAX; i += 1) filled[`id-${i}`] = now - i;
    const next = rememberFirstSeen(filled, ["fresh"], now);
    assert.equal(Object.keys(next).length, FIRST_SEEN_MAX);
    assert.equal(next.fresh, now);
  });
});

describe("freshnessFromAge", () => {
  it("mirrors the day windows", () => {
    assert.equal(freshnessFromAge(0), "today");
    assert.equal(freshnessFromAge(DAY), "today");
    assert.equal(freshnessFromAge(DAY + 1), "week");
    assert.equal(freshnessFromAge(7 * DAY), "week");
    assert.equal(freshnessFromAge(7 * DAY + 1), null);
  });
});

console.log("fresh.test.ts ok");
