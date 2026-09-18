import { create } from "zustand";

export const SOCIAL_WATCH_KEY = "husjagt-social-watch";
export const MAX_ACCOUNTS = 30;
export const MAX_TAGS = 40;
export const ACCOUNT_QUERY_CAP = 8;
export const DEFAULT_TAGS = ["bolig", "salg", "tilsalg"] as const;
export const SUGGESTED_ACCOUNTS = ["nyboligodense", "homeodense", "lokalbolig5xfyn"] as const;

const HANDLE_RE = /^[a-z0-9._]{2,30}$/;
const TAG_RE = /^[a-z0-9æøåéü_]{2,32}$/;
const RESERVED_HANDLES = new Set([
  "reel",
  "reels",
  "p",
  "stories",
  "explore",
  "accounts",
  "direct",
  "tv",
  "live",
  "tag",
  "tags",
  "video",
  "videos",
]);
const HOUSE_TERMS = '(hus OR villa OR bolig OR tilsalg OR "til salg")';

export type SocialWatchLists = {
  accounts: string[];
  tags: string[];
};

export type SocialVideoQuery = {
  query: string;
  fromAccount: boolean;
  account: string | null;
};

export type WatchAddResult =
  | { ok: true; value: string }
  | { ok: false; reason: "invalid" | "full" };

export function normalizeHandle(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  const urlLike =
    /^(https?:\/\/)?(www\.)?(instagram\.com|tiktok\.com)\//i.test(value) ||
    value.includes("instagram.com/") ||
    value.includes("tiktok.com/");
  if (urlLike) {
    try {
      const href = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
      const url = new URL(href);
      const parts = url.pathname.split("/").filter(Boolean);
      value = parts[0] ?? "";
    } catch {
      /* keep trimmed value */
    }
  }

  value = (value.replace(/^@+/, "").split(/[/?#]/)[0] ?? "").trim().toLowerCase();
  if (!HANDLE_RE.test(value) || RESERVED_HANDLES.has(value)) return null;
  return value;
}

export function normalizeTag(raw: string): string | null {
  const value = raw.trim().replace(/^#+/, "").trim().toLowerCase();
  if (/\s/.test(value) || !TAG_RE.test(value)) return null;
  return value;
}

export function uniqueNormalized(
  values: unknown,
  normalize: (raw: string) => string | null,
  max: number,
): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of values) {
    if (typeof row !== "string") continue;
    const item = normalize(row);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

export function addWatchItem(list: string[], item: string, max: number): string[] {
  if (!item) return list;
  const next = list.filter((row) => row !== item);
  return [item, ...next].slice(0, max);
}

export function parseSocialWatch(raw: string | null): SocialWatchLists {
  if (!raw) return { accounts: [], tags: [...DEFAULT_TAGS] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { accounts: [], tags: [...DEFAULT_TAGS] };
    }
    const rec = parsed as { accounts?: unknown; tags?: unknown };
    return {
      accounts: uniqueNormalized(rec.accounts, normalizeHandle, MAX_ACCOUNTS),
      tags: rec.tags === undefined ? [...DEFAULT_TAGS] : uniqueNormalized(rec.tags, normalizeTag, MAX_TAGS),
    };
  } catch {
    return { accounts: [], tags: [...DEFAULT_TAGS] };
  }
}

export function kommuneTag(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

export function resolveSocialWatch(watch: {
  accounts?: string[] | null;
  tags?: string[] | null;
}): SocialWatchLists {
  return {
    accounts: uniqueNormalized(watch.accounts ?? [], normalizeHandle, MAX_ACCOUNTS),
    tags: watch.tags == null ? [...DEFAULT_TAGS] : uniqueNormalized(watch.tags, normalizeTag, MAX_TAGS),
  };
}

export function buildTikTokQueries(
  kommuneName: string,
  accounts: string[],
  tags: string[],
): SocialVideoQuery[] {
  const out: SocialVideoQuery[] = [];
  for (const handle of accounts.slice(0, ACCOUNT_QUERY_CAP)) {
    out.push({
      query: `site:tiktok.com/@${handle} ${HOUSE_TERMS}`,
      fromAccount: true,
      account: handle,
    });
  }
  const area = kommuneTag(kommuneName);
  if (tags.length) {
    const hashes = tags.map((tag) => `#${tag}`);
    out.push({
      query: `${hashes.join(" ")} #${area} site:tiktok.com`,
      fromAccount: false,
      account: null,
    });
    out.push({
      query: `${hashes.slice(0, 2).join(" ")} ${kommuneName} hus til salg site:tiktok.com`,
      fromAccount: false,
      account: null,
    });
  } else {
    out.push({
      query: `${kommuneName} hus til salg site:tiktok.com`,
      fromAccount: false,
      account: null,
    });
    out.push({
      query: `${kommuneName} villa tilsalg site:tiktok.com/@`,
      fromAccount: false,
      account: null,
    });
  }
  return out;
}

export function buildInstagramQueries(
  kommuneName: string,
  accounts: string[],
  tags: string[],
): SocialVideoQuery[] {
  const out: SocialVideoQuery[] = [];
  for (const handle of accounts.slice(0, ACCOUNT_QUERY_CAP)) {
    out.push({
      query: `site:instagram.com/${handle} (reel OR reels) ${HOUSE_TERMS}`,
      fromAccount: true,
      account: handle,
    });
  }
  const area = kommuneTag(kommuneName);
  if (tags.length) {
    const hashes = tags.map((tag) => `#${tag}`);
    out.push({
      query: `${hashes.join(" ")} #${area} site:instagram.com/reel`,
      fromAccount: false,
      account: null,
    });
    out.push({
      query: `${hashes.slice(0, 2).join(" ")} ${kommuneName} hus til salg site:instagram.com/reel`,
      fromAccount: false,
      account: null,
    });
  } else {
    out.push({
      query: `${kommuneName} villa til salg site:instagram.com/reel`,
      fromAccount: false,
      account: null,
    });
    out.push({
      query: `${kommuneName} hus til salg site:instagram.com/reel`,
      fromAccount: false,
      account: null,
    });
  }
  return out;
}

function readStorage(): SocialWatchLists {
  if (typeof window === "undefined") return { accounts: [], tags: [...DEFAULT_TAGS] };
  try {
    return parseSocialWatch(window.localStorage.getItem(SOCIAL_WATCH_KEY));
  } catch {
    return { accounts: [], tags: [...DEFAULT_TAGS] };
  }
}

function writeStorage(lists: SocialWatchLists) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOCIAL_WATCH_KEY, JSON.stringify(lists));
}

type SocialWatchState = SocialWatchLists & {
  ready: boolean;
  hydrate: () => void;
  addAccount: (raw: string) => WatchAddResult;
  removeAccount: (handle: string) => void;
  addTag: (raw: string) => WatchAddResult;
  removeTag: (tag: string) => void;
  resetTags: () => void;
};

function addTo(
  list: string[],
  raw: string,
  normalize: (value: string) => string | null,
  max: number,
): WatchAddResult & { list?: string[] } {
  const value = normalize(raw);
  if (!value) return { ok: false, reason: "invalid" };
  if (!list.includes(value) && list.length >= max) return { ok: false, reason: "full" };
  return { ok: true, value, list: addWatchItem(list, value, max) };
}

export const useSocialWatch = create<SocialWatchState>((set, get) => ({
  accounts: [],
  tags: [...DEFAULT_TAGS],
  ready: false,
  hydrate: () => {
    if (get().ready) return;
    set({ ...readStorage(), ready: true });
  },
  addAccount: (raw) => {
    const state = get();
    const current = state.ready ? state.accounts : readStorage().accounts;
    const tags = state.ready ? state.tags : readStorage().tags;
    const result = addTo(current, raw, normalizeHandle, MAX_ACCOUNTS);
    if (!result.ok || !result.list) return result;
    const lists = { accounts: result.list, tags };
    writeStorage(lists);
    set({ ...lists, ready: true });
    return { ok: true, value: result.value };
  },
  removeAccount: (handle) => {
    const state = get();
    const lists = {
      accounts: state.accounts.filter((row) => row !== handle),
      tags: state.tags,
    };
    writeStorage(lists);
    set({ ...lists, ready: true });
  },
  addTag: (raw) => {
    const state = get();
    const current = state.ready ? state.tags : readStorage().tags;
    const accounts = state.ready ? state.accounts : readStorage().accounts;
    const result = addTo(current, raw, normalizeTag, MAX_TAGS);
    if (!result.ok || !result.list) return result;
    const lists = { accounts, tags: result.list };
    writeStorage(lists);
    set({ ...lists, ready: true });
    return { ok: true, value: result.value };
  },
  removeTag: (tag) => {
    const state = get();
    const lists = {
      accounts: state.accounts,
      tags: state.tags.filter((row) => row !== tag),
    };
    writeStorage(lists);
    set({ ...lists, ready: true });
  },
  resetTags: () => {
    const state = get();
    const lists = { accounts: state.accounts, tags: [...DEFAULT_TAGS] };
    writeStorage(lists);
    set({ ...lists, ready: true });
  },
}));
