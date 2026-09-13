import assert from "node:assert/strict";
import { deviceFromSize, sizeClassFromWidth } from "./layout";

assert.equal(sizeClassFromWidth(390), "compact");
assert.equal(sizeClassFromWidth(719), "compact");
assert.equal(sizeClassFromWidth(720), "medium");
assert.equal(sizeClassFromWidth(900), "medium");
assert.equal(sizeClassFromWidth(1199), "medium");
assert.equal(sizeClassFromWidth(1200), "expanded");
assert.equal(sizeClassFromWidth(1440), "expanded");

assert.equal(deviceFromSize("compact"), "phone");
assert.equal(deviceFromSize("medium"), "tablet");
assert.equal(deviceFromSize("expanded"), "laptop");

console.log("layout.test.ts ok");
