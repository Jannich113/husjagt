import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isEmbeddedFrame, isInstalledApp, isIosSafari, isNativeWebView, isStandaloneDisplay } from "./display-mode.ts";

describe("isStandaloneDisplay", () => {
  it("reads display-mode media and iOS navigator.standalone", () => {
    assert.equal(isStandaloneDisplay(undefined), false);
    assert.equal(
      isStandaloneDisplay({
        matchMedia: () => ({ matches: true }),
        navigator: {},
      } as unknown as Window),
      true,
    );
    assert.equal(
      isStandaloneDisplay({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      } as unknown as Window),
      true,
    );
    assert.equal(
      isStandaloneDisplay({
        matchMedia: () => ({ matches: false }),
        navigator: {},
      } as unknown as Window),
      false,
    );
  });
});

describe("isIosSafari", () => {
  it("detects iPhone Safari but not Chrome on iOS or Android", () => {
    assert.equal(
      isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"),
      true,
    );
    assert.equal(
      isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1"),
      false,
    );
    assert.equal(isIosSafari("Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile Safari/537.36"), false);
  });
});

describe("isNativeWebView", () => {
  it("matches the Android wrapper UA", () => {
    assert.equal(isNativeWebView("Mozilla/5.0 HusjagtApp/1.0"), true);
    assert.equal(isNativeWebView("Mozilla/5.0 Chrome/120"), false);
  });
});

describe("isInstalledApp", () => {
  it("treats display-mode standalone as first-class, UA only as leftover APK", () => {
    const standalone = {
      matchMedia: () => ({ matches: true }),
      navigator: {},
    } as unknown as Window;
    const browser = {
      matchMedia: () => ({ matches: false }),
      navigator: {},
    } as unknown as Window;
    assert.equal(isInstalledApp(standalone, "Mozilla/5.0 Chrome/120"), true);
    assert.equal(isInstalledApp(browser, "Mozilla/5.0 HusjagtApp/1.0"), true);
    assert.equal(isInstalledApp(browser, "Mozilla/5.0 Chrome/120"), false);
    assert.equal(isInstalledApp(undefined, "Mozilla/5.0 Chrome/120"), false);
  });
});

describe("isEmbeddedFrame", () => {
  it("is true when self !== top", () => {
    const top = {} as Window;
    assert.equal(isEmbeddedFrame({ self: top, top } as unknown as Window), false);
    assert.equal(isEmbeddedFrame({ self: {}, top } as unknown as Window), true);
  });
});

