import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sessionTokenFromAuthData } from "./session-bearer.ts";

describe("session bearer", () => {
  it("reads Better Auth email sign-in token", () => {
    assert.equal(sessionTokenFromAuthData({ token: "abc", user: { id: "1" } }), "abc");
    assert.equal(sessionTokenFromAuthData({ user: { id: "1" } }), null);
    assert.equal(sessionTokenFromAuthData(null), null);
  });
});
