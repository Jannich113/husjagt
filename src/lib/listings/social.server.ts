import snapshot from "./social-snapshot.json";
import { kommuneBySlug } from "./kommuner";
import { proxyFetch } from "./proxy-fetch";
import type { SearchFilters } from "./types";
import { ALLOTMENT_TYPE } from "./types";
import { isVideoPlatform, keepListenListing, socialMatchesFilters, type SocialListing, type SocialListenResult, type SocialPlatform } from "./social";
import {
  buildInstagramQueries,
  buildTikTokQueries,
  resolveSocialWatch,
  type SocialVideoQuery,
} from "./social-watch";

const BROWSER_HEADERS = {
  Accept: "text/html,application/json,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const HOUSE_RE =
  /andelsbolig|andelslejlighed|villa|rækkehus|raekkehus|parcelhus|ejerlejlighed|villalejlighed|(?<![a-zæøå])lejlighed|sommerhus|fritidshus|kolonihave(?:hus)?|byhus|helårshus|helarshus|hus til salg|bolig til salg/i;
const MIN_PRICE = 50_000;

const zipCache = new Map<number, string[]>();

type JsonLd = Record<string, unknown>;

function asRecord(value: unknown): JsonLd | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonLd) : null;
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

async function fetchText(url: string, html = false): Promise<string | null> {
  try {
    const direct = await fetch(url, {
      headers: { ...BROWSER_HEADERS, Referer: new URL(url).origin + "/" },
      signal: AbortSignal.timeout(12_000),
    });
    if (direct.ok) return await direct.text();
  } catch {
    /* datacenter IPs often hit Cloudflare */
  }
  try {
    return await proxyFetch(url, html);
  } catch {
    return null;
  }
}

async function fetchJson(url: string): Promise<unknown | null> {
  const text = await fetchText(url, false);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function kommuneZips(code: number): Promise<string[]> {
  const hit = zipCache.get(code);
  if (hit) return hit;
  try {
    const padded = String(code).padStart(4, "0");
    const payload = await fetchJson(
      `https://api.dataforsyningen.dk/postnumre?kommunekode=${padded}`,
    );
    const zips = asList(payload)
      .map((row) => {
        const rec = asRecord(row);
        const nr = rec?.nr;
        return typeof nr === "string" || typeof nr === "number" ? String(nr) : "";
      })
      .filter((zip) => zip.length === 4);
    zipCache.set(code, zips);
    return zips;
  } catch {
    zipCache.set(code, []);
    return [];
  }
}

function areaTokens(name: string, slug: string, zips: string[]): string[] {
  const tokens = new Set<string>([name.toLowerCase(), slug.toLowerCase()]);
  const unfolded = slug
    .toLowerCase()
    .replaceAll("oe", "ø")
    .replaceAll("aa", "å")
    .replaceAll("ae", "æ");
  tokens.add(unfolded);
  if (name.toLowerCase() === "københavn") {
    tokens.add("kbh");
    tokens.add("copenhagen");
  }
  for (const zip of zips) tokens.add(zip);
  return [...tokens].filter(Boolean);
}

function blobMatches(blob: string, tokens: string[]): boolean {
  const lower = blob.toLowerCase();
  return tokens.some((token) => {
    if (/^\d{4}$/.test(token)) return new RegExp(`\\b${token}\\b`).test(lower);
    return token.length >= 3 && lower.includes(token);
  });
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d+\.\d{1,2}$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function firstImage(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstImage(item);
      if (found) return found;
    }
  }
  const rec = asRecord(value);
  if (rec?.url && typeof rec.url === "string") return rec.url;
  return null;
}

function jsonLdProducts(html: string): JsonLd[] {
  const out: JsonLd[] = [];
  const blocks = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of blocks) {
    try {
      const parsed: unknown = JSON.parse(block[1] ?? "");
      for (const node of asList(parsed)) {
        const rec = asRecord(node);
        if (!rec) continue;
        if (rec["@type"] === "Product") out.push(rec);
        if (rec["@type"] === "ItemList") {
          for (const el of asList(rec.itemListElement)) {
            const row = asRecord(el);
            const item = asRecord(row?.item) ?? row;
            if (item?.["@type"] === "Product" || item?.name) out.push(item ?? {});
          }
        }
      }
    } catch {
      /* ignore broken ld+json */
    }
  }
  return out;
}

function placeFromText(title: string, text: string, areaName: string): {
  city: string | null;
  zip: string | null;
  street: string | null;
} {
  const blob = `${title} ${text}`;
  const zipMatch = blob.match(/\b([1-9]\d{3})\b/);
  const escaped = areaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cityMatch = blob.match(
    new RegExp(`(${escaped}(?:\\s+(?:NV|SV|SØ|NØ|C|N|S|V|K))?)`, "i"),
  );
  const streetMatch = blob.match(
    /\b([A-ZÆØÅ][a-zæøå]+(?:gade|vej|alle|allé|plads|torv|vænget|parken|stræde)\s*\d*[A-Za-z]?)/,
  );
  return {
    city: cityMatch?.[1] ?? null,
    zip: zipMatch?.[1] ?? null,
    street: streetMatch?.[1] ?? null,
  };
}

function emptyMedia(): Pick<SocialListing, "video" | "author" | "kind"> {
  return { video: null, author: null, kind: "photo" };
}

function productToListing(
  product: JsonLd,
  platform: SocialPlatform,
  areaName: string,
): SocialListing | null {
  const offers = asRecord(product.offers) ?? {};
  const url =
    (typeof product.url === "string" && product.url) ||
    (typeof offers.url === "string" && offers.url) ||
    "";
  const title = typeof product.name === "string" ? product.name.replace(/\s+/g, " ").trim() : "";
  if (!title || !url) return null;
  const text = typeof product.description === "string" ? product.description.trim() : "";
  const price = parsePrice(offers.price);
  const idMatch = url.match(/\/annonce\/([0-9a-f-]{8,})/i) || url.match(/\/item\/(\d+)/i);
  const id = `${platform}-${idMatch?.[1] ?? title.slice(0, 24)}`;
  const place = placeFromText(title, text, areaName);
  return {
    id,
    platform,
    title,
    text,
    url,
    price,
    city: place.city,
    zip: place.zip,
    street: place.street,
    image: firstImage(product.image),
    postedAt: null,
    ...emptyMedia(),
  };
}

function inListenScope(
  item: SocialListing,
  tokens: string[],
  filters: SearchFilters,
  requireArea = true,
): boolean {
  if (!keepListenListing(item, filters)) return false;
  const blob = `${item.title} ${item.text} ${item.url} ${item.city ?? ""} ${item.zip ?? ""}`;
  if (requireArea && !blobMatches(blob, tokens)) return false;
  return true;
}

async function listenGulogGratis(name: string, tokens: string[], filters: SearchFilters): Promise<SocialListing[]> {
  const q = encodeURIComponent(name);
  const wantKoloni = !filters.types.length || filters.types.includes(ALLOTMENT_TYPE);
  const urls = [
    `https://www.guloggratis.dk/s/q-andelsbolig+${q}`,
    ...(wantKoloni ? [`https://www.guloggratis.dk/s/q-kolonihave+${q}`] : []),
    `https://www.guloggratis.dk/s/q-${q}+%22hus+til+salg%22`,
    `https://www.guloggratis.dk/s/q-${q}+sælges`,
    `https://www.guloggratis.dk/s/q-andelslejlighed+${q}`,
    `https://www.guloggratis.dk/s/q-rækkehus+${q}`,
    "https://www.guloggratis.dk/kategori/diverse/ejendomme/felter/produkttype/andelsboliger",
    "https://www.guloggratis.dk/kategori/diverse/ejendomme/felter/produkttype/huse",
  ];
  const pages = await Promise.all(urls.map((url) => fetchText(url, true)));
  const listings: SocialListing[] = [];
  const seen = new Set<string>();
  for (const html of pages) {
    if (!html) continue;
    for (const product of jsonLdProducts(html)) {
      const item = productToListing(product, "guloggratis", name);
      if (!item || seen.has(item.id) || seen.has(item.url)) continue;
      if (!inListenScope(item, tokens, filters)) continue;
      seen.add(item.id);
      seen.add(item.url);
      listings.push(item);
    }
  }
  return listings;
}

function decodeB64Json(raw: string): unknown | null {
  try {
    const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function listenDba(name: string, tokens: string[], filters: SearchFilters): Promise<SocialListing[]> {
  const wantKoloni = !filters.types.length || filters.types.includes(ALLOTMENT_TYPE);
  const q = encodeURIComponent(
    wantKoloni
      ? `${name} andelsbolig OR kolonihave OR "hus til salg"`
      : `${name} andelsbolig OR "hus til salg"`,
  );
  const html = await fetchText(`https://www.dba.dk/soeg/?soeg=${q}`, true);
  if (!html) return [];
  const listings: SocialListing[] = [];
  const scripts = html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const script of scripts) {
    const raw = (script[1] ?? "").trim();
    const parsed = raw.startsWith("{") || raw.startsWith("[") ? (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return decodeB64Json(raw);
      }
    })() : decodeB64Json(raw);
    const root = asRecord(parsed);
    const queries = asList(root?.queries);
    for (const query of queries) {
      const data = asRecord(asRecord(query)?.state)?.data;
      const docs = asList(asRecord(data)?.docs);
      for (const doc of docs) {
        const rec = asRecord(doc);
        if (!rec) continue;
        const title = typeof rec.heading === "string" ? rec.heading : "";
        const loc = typeof rec.location === "string" ? rec.location : "";
        const canonical = typeof rec.canonical_url === "string" ? rec.canonical_url : "";
        const adId = rec.ad_id ?? rec.id;
        const url =
          canonical ||
          (adId != null ? `https://www.dba.dk/recommerce/forsale/item/${adId}` : "");
        const price = parsePrice(asRecord(rec.price)?.amount);
        const image = firstImage(rec.image) ?? firstImage(rec.image_urls);
        if (!title || !url) continue;
        const place = placeFromText(title, loc, name);
        const item: SocialListing = {
          id: `dba-${String(adId ?? title.slice(0, 24))}`,
          platform: "dba",
          title,
          text: loc,
          url,
          price,
          city: place.city || loc || null,
          zip: place.zip,
          street: place.street,
          image,
          postedAt: typeof rec.timestamp === "number" ? new Date(rec.timestamp).toISOString() : null,
          ...emptyMedia(),
        };
        if (inListenScope(item, tokens, filters)) listings.push(item);
      }
    }
  }
  return listings;
}

async function listenBoligaSelfsale(
  kommuneCode: number,
  tokens: string[],
  filters: SearchFilters,
): Promise<SocialListing[]> {
  const max = 8_000_000;
  const listings: SocialListing[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const url =
      `https://api.boliga.dk/api/v2/search/results?pageSize=50&municipality=${kommuneCode}` +
      `&priceMax=${max}&page=${page}&sort=daysOnSale-a`;
    const payload = asRecord(await fetchJson(url));
    const results = asList(payload?.results);
    if (!results.length) break;
    for (const row of results) {
      const rec = asRecord(row);
      if (!rec?.selfsale) continue;
      const id = rec.id;
      const street = typeof rec.street === "string" ? rec.street : "";
      const city = typeof rec.city === "string" ? rec.city : "";
      const slug = typeof rec.ouAddress === "string" ? rec.ouAddress : "";
      const item: SocialListing = {
        id: `boliga-${String(id ?? street)}`,
        platform: "boliga",
        title: street || "Privat bolig",
        text: "Privat selvsalg — uden mægler.",
        url: slug
          ? `https://www.boliga.dk/bolig/${id}/${slug}`
          : `https://www.boliga.dk/bolig/${id}`,
        price: parsePrice(rec.price),
        city: city || null,
        zip: rec.zipCode != null ? String(rec.zipCode) : null,
        street: street || null,
        image: firstImage(asList(rec.images)[0]),
        postedAt: typeof rec.createdDate === "string" ? rec.createdDate : null,
        ...emptyMedia(),
      };
      if (inListenScope(item, tokens, filters)) listings.push(item);
    }
  }
  return listings;
}

function unwrapDuckHref(href: string): string {
  try {
    const url = new URL(href);
    const target = url.searchParams.get("uddg") ?? url.searchParams.get("u");
    if (target) return target;
  } catch {
    /* keep original */
  }
  return href;
}

function collectUrls(html: string, pattern: RegExp): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(pattern)) {
    const raw = unwrapDuckHref(match[0] ?? "");
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    found.push(raw);
  }
  return found;
}

async function tiktokOEmbed(url: string): Promise<{ title: string; author: string; image: string | null } | null> {
  const payload = asRecord(
    await fetchJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`),
  );
  if (!payload) return null;
  const title = typeof payload.title === "string" ? payload.title.replace(/\s+/g, " ").trim() : "";
  const author = typeof payload.author_name === "string" ? payload.author_name : "";
  const image = typeof payload.thumbnail_url === "string" ? payload.thumbnail_url : null;
  if (!title && !author) return null;
  return { title: title || "Hus på TikTok", author, image };
}

async function searchVideoUrls(
  queries: SocialVideoQuery[],
  pattern: RegExp,
  limit: number,
): Promise<{ url: string; fromAccount: boolean; account: string | null }[]> {
  const pages = await Promise.all(
    queries.map(async (row) => ({
      row,
      html: await fetchText(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(row.query)}`, true),
    })),
  );
  const found: { url: string; fromAccount: boolean; account: string | null }[] = [];
  const seen = new Map<string, number>();
  function push(url: string, fromAccount: boolean, account: string | null) {
    const existing = seen.get(url);
    if (existing != null) {
      if (fromAccount && !found[existing]?.fromAccount) {
        found[existing] = { url, fromAccount: true, account };
      }
      return;
    }
    if (found.length >= limit) return;
    seen.set(url, found.length);
    found.push({ url, fromAccount, account });
  }
  for (const { row, html } of pages) {
    if (!html) continue;
    for (const url of collectUrls(html, pattern)) push(url, row.fromAccount, row.account);
  }
  return found;
}

const TIKTOK_VIDEO_RE = /https?:\/\/(?:www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/gi;

async function tiktokTagHits(
  tags: string[],
  limit: number,
): Promise<{ url: string; fromAccount: boolean; account: string | null; tag: string }[]> {
  const pages = await Promise.all(
    tags.slice(0, 4).map(async (tag) => ({
      tag,
      html: await fetchText(`https://www.tiktok.com/tag/${encodeURIComponent(tag)}`, true),
    })),
  );
  const found: { url: string; fromAccount: boolean; account: string | null; tag: string }[] = [];
  const seen = new Set<string>();
  for (const { tag, html } of pages) {
    if (!html) continue;
    for (const raw of collectUrls(html, TIKTOK_VIDEO_RE)) {
      const url = raw.startsWith("http") ? raw : `https://www.${raw.replace(/^www\./, "")}`;
      if (seen.has(url) || found.length >= limit) continue;
      seen.add(url);
      const account = url.match(/tiktok\.com\/@([\w.]+)/i)?.[1] ?? null;
      found.push({ url, fromAccount: false, account, tag });
    }
  }
  return found;
}

function captionPrice(text: string): number | null {
  const priced = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d{6,})\s*(?:kr|,-)?/i);
  const n = priced ? parsePrice(priced[1]) : parsePrice(text);
  return n != null && n >= MIN_PRICE ? n : null;
}

async function listenTikTok(
  name: string,
  tokens: string[],
  filters: SearchFilters,
  watch: { accounts: string[]; tags: string[] },
): Promise<SocialListing[]> {
  const kommuneSlug = name.toLowerCase().replace(/\s+/g, "");
  const tagHits = await tiktokTagHits([kommuneSlug, ...watch.tags].filter(Boolean), 16);
  const searchHits = await searchVideoUrls(
    buildTikTokQueries(name, watch.accounts, watch.tags),
    TIKTOK_VIDEO_RE,
    16,
  );
  const seen = new Set<string>();
  const hits: {
    url: string;
    fromAccount: boolean;
    account: string | null;
    fromTag?: boolean;
    tag?: string;
  }[] = [];
  for (const hit of [
    ...searchHits,
    ...tagHits.map((row) => ({ ...row, fromTag: true as const })),
  ]) {
    if (seen.has(hit.url) || hits.length >= 16) continue;
    seen.add(hit.url);
    hits.push(hit);
  }
  if (!hits.length) return [];
  const metas = await Promise.all(hits.map((hit) => tiktokOEmbed(hit.url)));
  const listings: SocialListing[] = [];
  hits.forEach((hit, index) => {
    const meta = metas[index];
    const title = meta?.title || "Hus til salg på TikTok";
    if (hit.fromTag && !HOUSE_RE.test(`${title} ${meta?.author ?? ""}`)) return;
    const handle = hit.url.match(/tiktok\.com\/@([\w.]+)/i)?.[1] ?? hit.account ?? meta?.author ?? "";
    const place = placeFromText(title, `${name} ${handle}`, name);
    const item: SocialListing = {
      id: `tiktok-${hit.url.match(/video\/(\d+)/)?.[1] ?? title.slice(0, 16)}`,
      platform: "tiktok",
      title,
      text: handle ? `TikTok-video · @${handle}` : "TikTok-video",
      url: hit.url.startsWith("http") ? hit.url : `https://www.${hit.url}`,
      price: captionPrice(title),
      city: place.city,
      zip: place.zip,
      street: place.street,
      image: meta?.image ?? null,
      video: null,
      author: handle || meta?.author || null,
      kind: "video",
      postedAt: null,
    };
    const areaImplied = hit.fromTag && hit.tag === kommuneSlug;
    const requireArea = !hit.fromAccount && !areaImplied;
    if (inListenScope(item, tokens, filters, requireArea)) {
      listings.push(item);
    }
  });
  return listings;
}

async function listenInstagram(
  name: string,
  tokens: string[],
  filters: SearchFilters,
  watch: { accounts: string[]; tags: string[] },
): Promise<SocialListing[]> {
  const hits = await searchVideoUrls(
    buildInstagramQueries(name, watch.accounts, watch.tags),
    /https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:reel|reels|p)\/[A-Za-z0-9_-]+/gi,
    16,
  );
  const listings: SocialListing[] = [];
  for (const hit of hits) {
    if (!hit.fromAccount) continue;
    const code = hit.url.match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i)?.[1] ?? "";
    const handle = hit.account;
    const canonical = code
      ? handle
        ? `https://www.instagram.com/${handle}/reel/${code}/`
        : `https://www.instagram.com/reel/${code}/`
      : hit.url;
    const title = "Hus til salg på Instagram";
    const place = placeFromText(title, `${name} villa tilsalg`, name);
    const item: SocialListing = {
      id: `instagram-${code || hit.url.slice(-12)}`,
      platform: "instagram",
      title,
      text: handle ? `Instagram Reel · @${handle}` : `Instagram Reel · ${name}`,
      url: canonical,
      price: null,
      city: place.city,
      zip: place.zip,
      street: place.street,
      image: null,
      video: null,
      author: handle,
      kind: "video",
      postedAt: null,
    };
    const requireArea = !hit.fromAccount;
    if (inListenScope(item, tokens, filters, requireArea)) {
      listings.push(item);
    }
  }
  return listings;
}

function snapshotListings(municipality: string): SocialListing[] {
  const file = snapshot as { municipality?: string; listings?: Array<Partial<SocialListing> & { id: string }> };
  const rows = file.listings ?? [];
  if (file.municipality && file.municipality !== municipality) return [];
  return rows.map((row) => {
    const platform = (row.platform ?? "guloggratis") as SocialPlatform;
    return {
      id: row.id,
      platform,
      title: row.title ?? "Opslag",
      text: row.text ?? "",
      url: row.url ?? "",
      price: row.price ?? null,
      city: row.city ?? null,
      zip: row.zip ?? null,
      street: row.street ?? null,
      image: row.image ?? null,
      video: row.video ?? null,
      author: row.author ?? null,
      kind: isVideoPlatform(platform) || row.kind === "video" ? "video" : "photo",
      postedAt: row.postedAt ?? null,
    };
  });
}

function sortListings(listings: SocialListing[]): SocialListing[] {
  return [...listings].sort((a, b) => {
    const av = a.video ? 0 : a.kind === "video" ? 1 : 2;
    const bv = b.video ? 0 : b.kind === "video" ? 1 : 2;
    if (av !== bv) return av - bv;
    const ap = a.price ?? Number.POSITIVE_INFINITY;
    const bp = b.price ?? Number.POSITIVE_INFINITY;
    return ap - bp;
  });
}

function richness(item: SocialListing): number {
  return (
    (item.video ? 4 : 0) +
    (item.image ? 2 : 0) +
    (item.price != null ? 1 : 0) +
    (item.title.length > 24 ? 1 : 0) +
    (item.author ? 1 : 0)
  );
}

function uniqueListings(listings: SocialListing[]): SocialListing[] {
  const ranked = [...listings].sort((a, b) => richness(b) - richness(a));
  const seen = new Set<string>();
  return ranked.filter((item) => {
    if (seen.has(item.id) || seen.has(item.url)) return false;
    seen.add(item.id);
    seen.add(item.url);
    return true;
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

function sourceNames(listings: SocialListing[]): string[] {
  const names: string[] = [];
  if (listings.some((item) => item.platform === "instagram")) names.push("Instagram");
  if (listings.some((item) => item.platform === "tiktok")) names.push("TikTok");
  if (listings.some((item) => item.platform === "guloggratis")) names.push("GulogGratis");
  if (listings.some((item) => item.platform === "dba")) names.push("DBA");
  if (listings.some((item) => item.platform === "boliga")) names.push("Boliga selvsalg");
  return names;
}

export async function listenPrivateAds(filters: SearchFilters): Promise<SocialListing[]> {
  const kommune = kommuneBySlug(filters.municipality);
  const name = kommune?.name ?? filters.municipality;
  const zips = kommune ? await kommuneZips(kommune.code) : [];
  const tokens = areaTokens(name, filters.municipality, zips);
  const extraCity = filters.city?.trim();
  if (extraCity) tokens.push(extraCity.toLowerCase());
  const settled = await Promise.allSettled([
    listenGulogGratis(name, tokens, filters),
    listenDba(name, tokens, filters),
  ]);
  const listings: SocialListing[] = [];
  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;
    listings.push(...result.value);
  });
  return uniqueListings(listings);
}

export async function listenSocial(
  filters: SearchFilters,
  watch: { accounts?: string[] | null; tags?: string[] | null } = {},
): Promise<SocialListenResult> {
  const kommune = kommuneBySlug(filters.municipality);
  const name = kommune?.name ?? filters.municipality;
  const zips = kommune ? await kommuneZips(kommune.code) : [];
  const tokens = areaTokens(name, filters.municipality, zips);
  const extraCity = filters.city?.trim();
  if (extraCity) tokens.push(extraCity.toLowerCase());
  const lists = resolveSocialWatch(watch);

  const settled = await Promise.allSettled([
    listenGulogGratis(name, tokens, filters),
    listenDba(name, tokens, filters),
    kommune ? listenBoligaSelfsale(kommune.code, tokens, filters) : Promise.resolve([]),
    withTimeout(listenTikTok(name, tokens, filters, lists), 18000, []),
    withTimeout(listenInstagram(name, tokens, filters, lists), 12000, []),
  ]);

  const listings: SocialListing[] = [];
  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;
    listings.push(...result.value);
  });

  const extras = snapshotListings(filters.municipality).filter((item) =>
    inListenScope(item, tokens, filters),
  );
  const unique = uniqueListings([...listings, ...extras]).filter((item) =>
    keepListenListing(item, filters),
  );
  const live = listings.length > 0;
  const ranked = sortListings(unique);
  const matched = unique.filter((item) => socialMatchesFilters(item, filters));

  return {
    listings: sortListings(matched).slice(0, 48),
    all: ranked.slice(0, 48),
    found: unique.length,
    live,
    sources: live ? sourceNames(unique) : extras.length ? ["Gemt Odense-lyt", ...sourceNames(extras)] : [],
  };
}
