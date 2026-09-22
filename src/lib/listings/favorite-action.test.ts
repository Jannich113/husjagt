import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { needsUnsaveConfirm } from "./favorite-action.ts";

describe("needsUnsaveConfirm", () => {
  it("asks only when a saved house still has a note", () => {
    assert.equal(needsUnsaveConfirm(true, "visning torsdag"), true);
    assert.equal(needsUnsaveConfirm(true, "  "), false);
    assert.equal(needsUnsaveConfirm(true, ""), false);
    assert.equal(needsUnsaveConfirm(false, "visning"), false);
  });
});
