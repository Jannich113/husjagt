import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addSeenId, parseSeenIds, SEEN_MAX } from "./seen.ts";

describe("parseSeenIds", () => {
  it("reads a bare id array", () => {
    assert.deepEqual(parseSeenIds(JSON.stringify(["a", "b"])), ["a", "b"]);
  });

  it("reads { ids } and drops junk", () => {
    assert.deepEqual(parseSeenIds(JSON.stringify({ ids: ["x", 1, "", "x", "y"] })), ["x", "y"]);
  });

  it("returns empty on bad json", () => {
    assert.deepEqual(parseSeenIds("not-json"), []);
    assert.deepEqual(parseSeenIds(null), []);
  });
});

describe("addSeenId", () => {
  it("prepends a new id", () => {
    assert.deepEqual(addSeenId(["a"], "b"), ["b", "a"]);
  });

  it("is a no-op when already first", () => {
    const ids = ["a", "b"];
    assert.equal(addSeenId(ids, "a"), ids);
  });

  it("moves an existing id to the front", () => {
    assert.deepEqual(addSeenId(["a", "b", "c"], "c"), ["c", "a", "b"]);
  });

  it("caps growth", () => {
    const filled = Array.from({ length: SEEN_MAX }, (_, i) => `id-${i}`);
    const next = addSeenId(filled, "fresh");
    assert.equal(next.length, SEEN_MAX);
    assert.equal(next[0], "fresh");
    assert.equal(next.at(-1), `id-${SEEN_MAX - 2}`);
  });
});

console.log("seen.test.ts ok");
