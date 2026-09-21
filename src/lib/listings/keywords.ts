import { create } from "zustand";

export const KEYWORDS_KEY = "husjagt-keywords";
export const MAX_KEYWORDS = 20;
export const MIN_KEYWORD_LEN = 2;

export type KeywordMode = "any" | "all";

export type KeywordState = {
  words: string[];
  mode: KeywordMode;
  ready: boolean;
  hydrate: () => void;
  add: (raw: string) => boolean;
  remove: (word: string) => void;
  setMode: (mode: KeywordMode) => void;
  clear: () => void;
};

export function normalizeKeyword(raw: string): string | null {
  const value = raw.trim().toLocaleLowerCase("da").replace(/^#+/, "").replace(/\s+/g, " ");
  if (value.length < MIN_KEYWORD_LEN || value.length > 40) return null;
  return value;
}

export function listingKeywordHaystack(listing: {
  descriptionTitle?: string | null;
  descriptionBody?: string | null;
  street?: string | null;
  city?: string | null;
  imageAlt?: string | null;
  type?: string | null;
}): string {
  return [
    listing.descriptionTitle,
    listing.descriptionBody,
    listing.street,
    listing.city,
    listing.imageAlt,
    listing.type,
  ]
    .filter((part) => part != null && String(part).trim())
    .join("\n")
    .toLocaleLowerCase("da");
}

export function matchedKeywords(
  listing: Parameters<typeof listingKeywordHaystack>[0],
  words: string[],
): string[] {
  if (!words.length) return [];
  const hay = listingKeywordHaystack(listing);
  return words.filter((word) => hay.includes(word.toLocaleLowerCase("da")));
}

export function listingHitsKeywords(
  listing: Parameters<typeof listingKeywordHaystack>[0],
  words: string[],
  mode: KeywordMode,
): boolean {
  if (!words.length) return true;
  const hits = matchedKeywords(listing, words);
  return mode === "all" ? hits.length === words.length : hits.length > 0;
}

export function filterByKeywords<T extends Parameters<typeof listingKeywordHaystack>[0]>(
  listings: T[],
  words: string[],
  mode: KeywordMode,
): T[] {
  if (!words.length) return listings;
  return listings.filter((row) => listingHitsKeywords(row, words, mode));
}

/** Split `text` into plain / mark segments for highlighting. */
export function highlightSegments(
  text: string,
  words: string[],
): Array<{ text: string; hit: boolean }> {
  if (!text || !words.length) return [{ text, hit: false }];
  const unique = [...new Set(words.map((w) => w.trim()).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!unique.length) return [{ text, hit: false }];
  const escaped = unique.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const out: Array<{ text: string; hit: boolean }> = [];
  let last = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > last) out.push({ text: text.slice(last, start), hit: false });
    out.push({ text: match[0], hit: true });
    last = start + match[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out.length ? out : [{ text, hit: false }];
}

function readStorage(): Pick<KeywordState, "words" | "mode"> {
  if (typeof window === "undefined") return { words: [], mode: "any" };
  try {
    const raw = window.localStorage.getItem(KEYWORDS_KEY);
    if (!raw) return { words: [], mode: "any" };
    const parsed = JSON.parse(raw) as { words?: unknown; mode?: unknown };
    const words = Array.isArray(parsed.words)
      ? parsed.words
          .map((row) => (typeof row === "string" ? normalizeKeyword(row) : null))
          .filter((row): row is string => Boolean(row))
          .slice(0, MAX_KEYWORDS)
      : [];
    const mode: KeywordMode = parsed.mode === "all" ? "all" : "any";
    return { words: [...new Set(words)], mode };
  } catch {
    return { words: [], mode: "any" };
  }
}

function writeStorage(words: string[], mode: KeywordMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYWORDS_KEY, JSON.stringify({ words, mode }));
}

export const useKeywords = create<KeywordState>((set, get) => ({
  words: [],
  mode: "any",
  ready: false,
  hydrate: () => {
    if (get().ready) return;
    set({ ...readStorage(), ready: true });
  },
  add: (raw) => {
    const word = normalizeKeyword(raw);
    if (!word) return false;
    const state = get();
    if (state.words.includes(word) || state.words.length >= MAX_KEYWORDS) return false;
    const words = [...state.words, word];
    writeStorage(words, state.mode);
    set({ words, ready: true });
    return true;
  },
  remove: (word) => {
    const state = get();
    const words = state.words.filter((row) => row !== word);
    writeStorage(words, state.mode);
    set({ words, ready: true });
  },
  setMode: (mode) => {
    const state = get();
    writeStorage(state.words, mode);
    set({ mode, ready: true });
  },
  clear: () => {
    writeStorage([], get().mode);
    set({ words: [], ready: true });
  },
}));
