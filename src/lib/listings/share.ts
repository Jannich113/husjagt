import { extraFilterLabels, formatKr, formatMio, typeLabel } from "./format";
import { kommuneBySlug } from "./kommuner";
import {
  DEFAULT_FILTERS,
  type GeoBounds,
  type Listing,
  type SearchFilters,
} from "./types";

export type HuntView = "list" | "map" | "listen" | "saved";

/** Compact query keys so a hunt is a readable URL. */
export type HuntSearch = {
  k?: string;
  t?: string;
  p?: number;
  pmin?: number;
  rooms?: number;
  roomsmax?: number;
  m2?: number;
  m2max?: number;
  lot?: number;
  lotmax?: number;
  year?: number;
  yearto?: number;
  e?: string;
  udgift?: number;
  m2pris?: number;
  dage?: number;
  zip?: string;
  by?: string;
  kaelder?: number;
  altan?: number;
  terrasse?: number;
  elevator?: number;
  fald?: number;
  sort?: string;
  desc?: number;
  kort?: string;
  view?: string;
};

const TYPE_SLUG: Record<string, string> = {
  villa: "villa",
  "terraced house": "raekkehus",
  cooperative: "andel",
  condo: "lejlighed",
  "villa apartment": "villalejlighed",
  "holiday house": "fritid",
  farm: "land",
  "hobby farm": "hobby",
};

const SLUG_TYPE: Record<string, string> = {
  villa: "villa",
  raekkehus: "terraced house",
  rækkehus: "terraced house",
  "terraced-house": "terraced house",
  "terraced house": "terraced house",
  andel: "cooperative",
  andelsbolig: "cooperative",
  cooperative: "cooperative",
  lejlighed: "condo",
  ejerlejlighed: "condo",
  condo: "condo",
  villalejlighed: "villa apartment",
  "villa-apartment": "villa apartment",
  "villa apartment": "villa apartment",
  fritid: "holiday house",
  fritidshus: "holiday house",
  "holiday-house": "holiday house",
  "holiday house": "holiday house",
  land: "farm",
  landejendom: "farm",
  farm: "farm",
  hobby: "hobby farm",
  hobbyejendom: "hobby farm",
  "hobby-farm": "hobby farm",
  "hobby farm": "hobby farm",
};

const VIEW_OUT: Record<HuntView, string | undefined> = {
  list: undefined,
  map: "kort",
  listen: "lyt",
  saved: "gemte",
};

const VIEW_IN: Record<string, HuntView> = {
  list: "list",
  liste: "list",
  map: "map",
  kort: "map",
  listen: "listen",
  lyt: "listen",
  saved: "saved",
  gemte: "saved",
};

const LAST_HUNT_KEY = "husjagt:last-hunt";

const SORT_KEYS = new Set([
  "price",
  "daysListed",
  "timeOnMarket",
  "perAreaPrice",
  "monthlyExpense",
  "lotArea",
  "housingArea",
]);

export function parseHuntSearch(raw: Record<string, unknown> | null | undefined): HuntSearch {
  const out: HuntSearch = {};
  if (!raw || typeof raw !== "object") return out;
  const k = asString(raw.k) ?? asString(raw.kommune);
  if (k) out.k = k.toLowerCase();
  const t = asString(raw.t) ?? asString(raw.types);
  if (t) out.t = t;
  assignNum(out, "p", raw.p ?? raw.priceMax);
  assignNum(out, "pmin", raw.pmin ?? raw.priceMin);
  assignNum(out, "rooms", raw.rooms ?? raw.roomsMin);
  assignNum(out, "roomsmax", raw.roomsmax ?? raw.roomsMax);
  assignNum(out, "m2", raw.m2 ?? raw.areaMin);
  assignNum(out, "m2max", raw.m2max ?? raw.areaMax);
  assignNum(out, "lot", raw.lot ?? raw.lotMin);
  assignNum(out, "lotmax", raw.lotmax ?? raw.lotMax);
  assignNum(out, "year", raw.year ?? raw.yearFrom);
  assignNum(out, "yearto", raw.yearto ?? raw.yearTo);
  const energy = asString(raw.e) ?? asString(raw.energy);
  if (energy) out.e = energy.toUpperCase();
  assignNum(out, "udgift", raw.udgift ?? raw.expenseMax);
  assignNum(out, "m2pris", raw.m2pris ?? raw.m2PriceMax);
  assignNum(out, "dage", raw.dage ?? raw.daysMax);
  const zip = asString(raw.zip);
  if (zip) out.zip = zip.replace(/\D/g, "").slice(0, 4);
  const city = asString(raw.by) ?? asString(raw.city);
  if (city) out.by = city;
  if (asFlag(raw.kaelder) || asFlag(raw.basement)) out.kaelder = 1;
  if (asFlag(raw.altan) || asFlag(raw.balcony)) out.altan = 1;
  if (asFlag(raw.terrasse) || asFlag(raw.terrace)) out.terrasse = 1;
  if (asFlag(raw.elevator)) out.elevator = 1;
  if (asFlag(raw.fald) || asFlag(raw.priceDropOnly)) out.fald = 1;
  const sort = asString(raw.sort);
  if (sort && SORT_KEYS.has(sort)) out.sort = sort;
  if (asFlag(raw.desc) || raw.asc === 0 || raw.asc === "0" || raw.asc === false) {
    out.desc = 1;
  }
  const bounds = asString(raw.kort) ?? asString(raw.bounds);
  if (bounds) out.kort = bounds;
  const view = asString(raw.view);
  if (view && VIEW_IN[view]) out.view = VIEW_OUT[VIEW_IN[view]] ?? view;
  return out;
}

export function filtersFromHunt(hunt: HuntSearch | null | undefined): SearchFilters {
  const src = hunt ?? {};
  const types = parseTypes(src.t);
  return {
    ...DEFAULT_FILTERS,
    municipality: src.k || DEFAULT_FILTERS.municipality,
    types: types.length ? types : DEFAULT_FILTERS.types,
    priceMax: src.p ?? DEFAULT_FILTERS.priceMax,
    priceMin: src.pmin ?? null,
    roomsMin: src.rooms ?? null,
    roomsMax: src.roomsmax ?? null,
    areaMin: src.m2 ?? null,
    areaMax: src.m2max ?? null,
    lotMin: src.lot ?? null,
    lotMax: src.lotmax ?? null,
    yearFrom: src.year ?? null,
    yearTo: src.yearto ?? null,
    energyLabels: parseEnergy(src.e),
    expenseMax: src.udgift ?? null,
    m2PriceMax: src.m2pris ?? null,
    daysMax: src.dage ?? null,
    zipCode: src.zip && src.zip.length === 4 ? src.zip : null,
    city: src.by?.trim() || null,
    basement: src.kaelder === 1,
    balcony: src.altan === 1,
    terrace: src.terrasse === 1,
    elevator: src.elevator === 1,
    priceDropOnly: src.fald === 1,
    sortBy: src.sort && SORT_KEYS.has(src.sort) ? (src.sort as SearchFilters["sortBy"]) : "price",
    sortAscending: src.desc !== 1,
    bounds: parseBounds(src.kort),
  };
}

export function viewFromHunt(hunt: HuntSearch | null | undefined): HuntView {
  const key = (hunt?.view ?? "").toLowerCase();
  return VIEW_IN[key] ?? "list";
}

export function huntFromFilters(
  filters: SearchFilters,
  view: HuntView = "list",
  opts: { explicit?: boolean } = {},
): HuntSearch {
  const out: HuntSearch = {};
  const explicit = opts.explicit === true;
  if (explicit || filters.municipality !== DEFAULT_FILTERS.municipality) {
    out.k = filters.municipality;
  }
  if (explicit || !sameSet(filters.types, DEFAULT_FILTERS.types)) {
    out.t = filters.types.map((id) => TYPE_SLUG[id] ?? id.replace(/\s+/g, "-")).join(",");
  }
  if (explicit || filters.priceMax !== DEFAULT_FILTERS.priceMax) {
    if (filters.priceMax != null) out.p = filters.priceMax;
  }
  if (filters.priceMin != null) out.pmin = filters.priceMin;
  if (filters.roomsMin != null) out.rooms = filters.roomsMin;
  if (filters.roomsMax != null) out.roomsmax = filters.roomsMax;
  if (filters.areaMin != null) out.m2 = filters.areaMin;
  if (filters.areaMax != null) out.m2max = filters.areaMax;
  if (filters.lotMin != null) out.lot = filters.lotMin;
  if (filters.lotMax != null) out.lotmax = filters.lotMax;
  if (filters.yearFrom != null) out.year = filters.yearFrom;
  if (filters.yearTo != null) out.yearto = filters.yearTo;
  if (filters.energyLabels.length) out.e = filters.energyLabels.join(",");
  if (filters.expenseMax != null) out.udgift = filters.expenseMax;
  if (filters.m2PriceMax != null) out.m2pris = filters.m2PriceMax;
  if (filters.daysMax != null) out.dage = filters.daysMax;
  if (filters.zipCode) out.zip = filters.zipCode;
  if (filters.city) out.by = filters.city;
  if (filters.basement) out.kaelder = 1;
  if (filters.balcony) out.altan = 1;
  if (filters.terrace) out.terrasse = 1;
  if (filters.elevator) out.elevator = 1;
  if (filters.priceDropOnly) out.fald = 1;
  if (filters.sortBy !== "price") out.sort = filters.sortBy;
  if (!filters.sortAscending) out.desc = 1;
  if (filters.bounds) out.kort = encodeBounds(filters.bounds);
  const viewSlug = VIEW_OUT[view];
  if (viewSlug) out.view = viewSlug;
  return out;
}

export function huntPath(
  filters: SearchFilters,
  view: HuntView = "list",
  opts: { explicit?: boolean } = {},
): string {
  const hunt = huntFromFilters(filters, view, opts);
  const parts: string[] = [];
  for (const [key, value] of Object.entries(hunt)) {
    if (value == null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeQueryValue(String(value))}`);
  }
  return parts.length ? `/?${parts.join("&")}` : "/";
}

function encodeQueryValue(value: string): string {
  return encodeURIComponent(value).replace(/%2C/gi, ",");
}

function isPublicGrokHost(host: string): boolean {
  const name = host.toLowerCase().split(":")[0] ?? "";
  if (!name.endsWith(".grok.me")) return false;
  if (name === "og.grok.me" || name.endsWith(".og.grok.me")) return false;
  return true;
}

export function isPrivatePreviewHost(host: string): boolean {
  const name = host.toLowerCase().split(":")[0] ?? "";
  if (!name) return true;
  if (name === "localhost" || name === "127.0.0.1" || name === "[::1]") return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(name)) return true;
  if (name === "grok-sandbox.com" || name.endsWith(".grok-sandbox.com")) return true;
  if (name.includes(".preview.")) return true;
  return false;
}

function envPublicHostname(): string | null {
  try {
    const raw = (import.meta as { env?: { VITE_PUBLIC_HOSTNAME?: string } }).env?.VITE_PUBLIC_HOSTNAME;
    const host = String(raw ?? "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.toLowerCase();
    return host && isPublicGrokHost(host) ? host : null;
  } catch {
    return null;
  }
}

/** Live origin, or the published grok.me host when the deployer injects it. */
export function shareOrigin(): string {
  const fromEnv = envPublicHostname();
  if (fromEnv) return `https://${fromEnv}`;
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function isPublicShareOrigin(origin = shareOrigin()): boolean {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    if (isPrivatePreviewHost(host)) return false;
    if (envPublicHostname()) return true;
    return isPublicGrokHost(host) || host.includes(".");
  } catch {
    return false;
  }
}

export function absoluteUrl(path: string, origin = shareOrigin()): string {
  if (!path) return origin ? `${origin}/` : "/";
  if (!origin) {
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith("/") ? path : `/${path}`;
  }
  try {
    if (/^https?:\/\//i.test(path)) {
      const parsed = new URL(path);
      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, origin).href;
    }
    return new URL(path, origin).href;
  } catch {
    return path;
  }
}

export function appShareCopy() {
  return {
    title: "Husjagt",
    text: "Huse til salg i Danmark — Boligsiden, private opslag, Instagram og TikTok.",
    url: absoluteUrl("/"),
  };
}

export function huntShareCopy(filters: SearchFilters, view: HuntView = "list") {
  const kommune = kommuneBySlug(filters.municipality)?.name ?? "Danmark";
  const types = filters.types.map(typeLabel).join(", ");
  const extras = extraFilterLabels(filters);
  const bits = [
    types,
    filters.priceMax != null ? `max ${formatMio(filters.priceMax)}` : null,
    ...extras,
  ].filter((bit): bit is string => Boolean(bit));
  const viewBit =
    view === "listen" ? "Sociale opslag" : view === "map" ? "Kort" : view === "saved" ? "Gemte boliger" : null;
  return {
    title: `Husjagt i ${kommune}`,
    text: [viewBit, ...bits].filter(Boolean).join(" · "),
    url: absoluteUrl(huntPath(filters, view, { explicit: true })),
  };
}

export function listingShareCopy(listing: Listing) {
  const place = [listing.street, listing.zip, listing.city].filter(Boolean).join(", ");
  return {
    title: `${listing.street}, ${listing.city}`,
    text: `${formatKr(listing.price)} · ${typeLabel(listing.type)} · Husjagt`,
    url: absoluteUrl(`/listing/${encodeURIComponent(listing.id)}`),
    description: `${place} · ${formatKr(listing.price)}`,
  };
}

export function huntDocumentTitle(filters: SearchFilters): string {
  const kommune = kommuneBySlug(filters.municipality)?.name ?? "Danmark";
  return `Husjagt · ${kommune}`;
}

export function rememberHunt(hunt: HuntSearch) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LAST_HUNT_KEY, JSON.stringify(hunt));
  } catch {
    /* ignore quota */
  }
}

export function recalledHunt(): HuntSearch {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(LAST_HUNT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parseHuntSearch(parsed);
  } catch {
    return {};
  }
}

export type ShareResult = "shared" | "copied" | "failed";

type NativeShare = {
  share?: (title: string, text: string, url: string) => void;
};

declare global {
  interface Window {
    HusjagtNative?: NativeShare;
  }
}

export async function shareLink(payload: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareResult> {
  const url = absoluteUrl(payload.url);
  try {
    if (typeof window !== "undefined" && typeof window.HusjagtNative?.share === "function") {
      window.HusjagtNative.share(payload.title, payload.text, url);
      return "shared";
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url,
      });
      return "shared";
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "failed";
  }
  const copied = await copyText(url);
  return copied ? "copied" : "failed";
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  if (typeof document === "undefined") return false;
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  } catch {
    return false;
  }
}

function parseTypes(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const key = part.trim().toLowerCase();
    if (!key) continue;
    const id = SLUG_TYPE[key];
    if (id) seen.add(id);
  }
  return [...seen];
}

function parseEnergy(raw: string | undefined): string[] {
  if (!raw) return [];
  const letters = raw
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((letter) => /^[A-G]$/.test(letter));
  return [...new Set(letters)];
}

function parseBounds(raw: string | undefined): GeoBounds | null {
  if (!raw) return null;
  const parts = raw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [minLon, minLat, maxLon, maxLat] = parts as [number, number, number, number];
  if (minLon >= maxLon || minLat >= maxLat) return null;
  return { minLon, minLat, maxLon, maxLat };
}

function encodeBounds(bounds: GeoBounds): string {
  return [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat]
    .map((n) => n.toFixed(5))
    .join(",");
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((item) => set.has(item));
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    const joined = value.filter((part) => part != null && part !== "").join(",");
    return joined || undefined;
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function assignNum<K extends keyof HuntSearch>(out: HuntSearch, key: K, value: unknown) {
  const n = asNumber(value);
  if (n != null) (out[key] as number) = n;
}
