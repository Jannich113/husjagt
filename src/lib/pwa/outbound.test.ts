import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXTERNAL_REL, externalLinkProps } from "./outbound.ts";

describe("externalLinkProps", () => {
  it("opens a new tab without giving the portal a window.opener", () => {
    const props = externalLinkProps("https://www.boligsiden.dk/case");
    assert.equal(props.target, "_blank");
    assert.equal(props.rel, "noopener noreferrer");
    assert.equal(props.rel, EXTERNAL_REL);
    assert.equal(props.href, "https://www.boligsiden.dk/case");
  });
});
