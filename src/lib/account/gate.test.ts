import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseKontoNeed } from "./gate.ts";

describe("konto gate", () => {
  it("only accepts known reasons", () => {
    assert.equal(parseKontoNeed("notes"), "notes");
    assert.equal(parseKontoNeed("overvaag"), "overvaag");
    assert.equal(parseKontoNeed("konti"), "konti");
    assert.equal(parseKontoNeed("hunt"), undefined);
  });
});
