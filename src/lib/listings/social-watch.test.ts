import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCOUNT_QUERY_CAP,
  DEFAULT_TAGS,
  MAX_ACCOUNTS,
  addWatchItem,
  buildInstagramQueries,
  buildTikTokQueries,
  kommuneTag,
  normalizeHandle,
  normalizeTag,
  parseSocialWatch,
  resolveSocialWatch,
  uniqueNormalized,
} from "./social-watch.ts";

describe("normalizeHandle", () => {
  it("strips @ and lowercases", () => {
    assert.equal(normalizeHandle("@NyBoligOdense"), "nyboligodense");
  });

  it("pulls the profile out of Instagram and TikTok URLs", () => {
    assert.equal(normalizeHandle("https://www.instagram.com/homeodense/"), "homeodense");
    assert.equal(normalizeHandle("tiktok.com/@lokalbolig5xfyn/video/123"), "lokalbolig5xfyn");
  });

  it("rejects reserved paths and junk", () => {
    assert.equal(normalizeHandle("https://instagram.com/reel/abc"), null);
    assert.equal(normalizeHandle("x"), null);
    assert.equal(normalizeHandle("not a handle!!!"), null);
    assert.equal(normalizeHandle(""), null);
  });
});

describe("normalizeTag", () => {
  it("strips hash and spaces", () => {
    assert.equal(normalizeTag("#Bolig"), "bolig");
    assert.equal(normalizeTag(" til salg "), null);
    assert.equal(normalizeTag("tilsalg"), "tilsalg");
    assert.equal(normalizeTag("#rækkehus"), "rækkehus");
  });

  it("rejects short or punctuated tags", () => {
    assert.equal(normalizeTag("#a"), null);
    assert.equal(normalizeTag("bolig!"), null);
  });
});

describe("parseSocialWatch", () => {
  it("defaults tags when nothing is stored", () => {
    assert.deepEqual(parseSocialWatch(null), { accounts: [], tags: [...DEFAULT_TAGS] });
  });

  it("keeps an empty tag list the user cleared", () => {
    assert.deepEqual(parseSocialWatch(JSON.stringify({ accounts: ["homeodense"], tags: [] })), {
      accounts: ["homeodense"],
      tags: [],
    });
  });

  it("fills default tags when the key is missing on a stored object", () => {
    assert.deepEqual(parseSocialWatch(JSON.stringify({ accounts: ["@NyBoligOdense"] })), {
      accounts: ["nyboligodense"],
      tags: [...DEFAULT_TAGS],
    });
  });

  it("drops junk entries", () => {
    const parsed = parseSocialWatch(
      JSON.stringify({ accounts: ["ok", 1, "reel", "ok"], tags: ["#Bolig", "", "x"] }),
    );
    assert.deepEqual(parsed.accounts, ["ok"]);
    assert.deepEqual(parsed.tags, ["bolig"]);
  });
});

describe("addWatchItem", () => {
  it("prepends and caps", () => {
    assert.deepEqual(addWatchItem(["a", "b"], "c", 3), ["c", "a", "b"]);
    assert.deepEqual(addWatchItem(["a", "b"], "b", 3), ["b", "a"]);
    const filled = Array.from({ length: MAX_ACCOUNTS }, (_, i) => `u${i}`);
    const next = addWatchItem(filled, "fresh", MAX_ACCOUNTS);
    assert.equal(next.length, MAX_ACCOUNTS);
    assert.equal(next[0], "fresh");
  });
});

describe("video query builders", () => {
  it("always hits followed accounts, without requiring the kommune", () => {
    const tiktok = buildTikTokQueries("Odense", ["nyboligodense"], ["bolig"]);
    const ig = buildInstagramQueries("Odense", ["nyboligodense"], ["bolig"]);
    assert.ok(tiktok.some((row) => row.fromAccount && row.query.includes("site:tiktok.com/@nyboligodense")));
    assert.ok(ig.some((row) => row.fromAccount && row.query.includes("site:instagram.com/nyboligodense")));
    assert.ok(tiktok.some((row) => !row.fromAccount && row.query.includes("#bolig") && row.query.includes("#odense")));
    assert.ok(ig.some((row) => !row.fromAccount && row.query.includes("#bolig") && row.query.includes("#odense")));
  });

  it("falls back to kommune search when the tag list is empty", () => {
    const tiktok = buildTikTokQueries("Aarhus", [], []);
    assert.ok(tiktok.some((row) => row.query.includes("Aarhus hus til salg")));
    assert.equal(tiktok.every((row) => !row.fromAccount), true);
  });

  it("caps account queries", () => {
    const handles = Array.from({ length: 20 }, (_, i) => `agent${i}`);
    const queries = buildTikTokQueries("Odense", handles, ["bolig"]);
    assert.equal(queries.filter((row) => row.fromAccount).length, ACCOUNT_QUERY_CAP);
  });

  it("folds kommune names into a hashtag", () => {
    assert.equal(kommuneTag("Odense"), "odense");
    assert.equal(kommuneTag("Ærø"), "ærø");
  });
});

describe("resolveSocialWatch", () => {
  it("uses default tags when the client omits the list", () => {
    assert.deepEqual(resolveSocialWatch({ accounts: ["@HomeOdense"] }).tags, [...DEFAULT_TAGS]);
    assert.deepEqual(resolveSocialWatch({ accounts: ["@HomeOdense"] }).accounts, ["homeodense"]);
  });

  it("respects an explicit empty tag list", () => {
    assert.deepEqual(resolveSocialWatch({ accounts: [], tags: [] }).tags, []);
  });

  it("dedupes mixed input", () => {
    assert.deepEqual(
      uniqueNormalized(["#Bolig", "bolig", "x", 3], normalizeTag, 10),
      ["bolig"],
    );
  });
});
