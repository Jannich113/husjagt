import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INSTALL_DISMISS_MS, parseDismissedAt, shouldShowInstall } from "./install.ts";

describe("parseDismissedAt", () => {
  it("reads a timestamp and drops junk", () => {
    assert.equal(parseDismissedAt("1710000000000"), 1710000000000);
    assert.equal(parseDismissedAt("nope"), null);
    assert.equal(parseDismissedAt(null), null);
  });
});

describe("shouldShowInstall", () => {
  const base = {
    standalone: false,
    nativeWebView: false,
    dismissedAt: null as number | null,
    now: 1_000_000,
    hasPrompt: false,
    ios: false,
  };

  it("hides in standalone and the Android wrapper", () => {
    assert.equal(shouldShowInstall({ ...base, standalone: true, hasPrompt: true }), null);
    assert.equal(shouldShowInstall({ ...base, nativeWebView: true, hasPrompt: true }), null);
  });

  it("prefers the Chrome install prompt when available", () => {
    assert.equal(shouldShowInstall({ ...base, hasPrompt: true }), "prompt");
  });

  it("uses the iOS share hint when there is no prompt", () => {
    assert.equal(shouldShowInstall({ ...base, ios: true }), "ios");
  });

  it("falls back to a quiet Chrome hint", () => {
    assert.equal(shouldShowInstall(base), "hint");
  });

  it("respects a recent dismiss", () => {
    assert.equal(
      shouldShowInstall({ ...base, hasPrompt: true, dismissedAt: base.now - 1000 }),
      null,
    );
    assert.equal(
      shouldShowInstall({
        ...base,
        hasPrompt: true,
        dismissedAt: base.now - INSTALL_DISMISS_MS - 1,
      }),
      "prompt",
    );
  });
});
