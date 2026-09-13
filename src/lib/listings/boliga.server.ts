import { kommuneBySlug } from "./kommuner";
import { proxyFetch } from "./proxy-fetch";
import type { Listing, SearchFilters, SearchResult } from "./types";

const BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
  Origin: "https://www.boliga.dk",
  Referer: "https://www.boliga.dk/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const TO_BOLIGA: Record<string, number> = {
  villa: 1,
  "terraced house": 2,
  condo: 3,
  "holiday house": 4,
  cooperative: 5,
  farm: 6,
  "hobby farm": 6,
  "villa apartment": 9,
};

const FROM_BOLIGA: Record<number, string> = {
  1: "villa",
  2: "terraced house",
  3: "condo",
  4: "holiday house",
  5: "cooperative",
  6: "farm",
  9: "villa apartment",
};

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function readJson(url: string): Promise<unknown | null> {
  try {
    const direct = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(12_000) });
    const ctype = direct.headers.get("content-type") ?? "";
    if (direct.ok && ctype.includes("json")) return await direct.json();
  } catch {
    /* datacenter IPs often hit Cloudflare */
  }
  try {
    const text = await proxyFetch(url);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
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
  return rec && typeof rec.url === "string" ? rec.url : null;
}

function mapBoliga(raw: unknown): Listing | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = rec.id;
  if (id == null) return null;
  const propertyType = FROM_BOLIGA[Number(rec.propertyType)] ?? "villa";
  const street = str(rec.street) ?? "";
  const slug = str(rec.ouAddress) ?? "";
  const selfsale = rec.selfsale === true;
  const href = slug
    ? `https://www.boliga.dk/bolig/${id}/${slug}`
    : `https://www.boliga.dk/bolig/${id}`;
  const area = num(rec.size);
  const price = num(rec.price);
  return {
    id: `boliga-${id}`,
    type: propertyType,
    price,
    priceChange: num(rec.priceChangePercentTotal),
    area,
    lot: num(rec.lotSize),
    rooms: num(rec.rooms),
    energy: str(rec.energyClass)?.toUpperCase() ?? null,
    year: num(rec.buildYear),
    expense: num(rec.exp) ?? num(rec.net),
    m2price: num(rec.squaremeterPrice) || (price && area ? Math.round(price / area) : null),
    days: num(rec.daysForSale),
    lat: num(rec.latitude),
    lon: num(rec.longitude),
    image: firstImage(rec.images),
    imageAlt: street || null,
    agency: selfsale ? "Privat selvsalg" : str(rec.agentDisplayName) || "Boliga",
    agencySlug: selfsale ? "selvsalg" : "boliga",
    street,
    city: str(rec.city) ?? "",
    zip: num(rec.zipCode) ?? str(rec.zipCode),
    slug: slug || String(id),
    slugAddress: slug,
    source: "boliga",
    caseUrl: href,
  };
}

export async function searchBoliga(filters: SearchFilters): Promise<SearchResult> {
  const kommune = kommuneBySlug(filters.municipality);
  if (!kommune) {
    return { totalHits: 0, listings: [], live: false, source: "Boliga", sources: [] };
  }
  const types = filters.types.map((id) => TO_BOLIGA[id]).filter((n): n is number => n != null);
  const typeParam = types.length ? `&propertyType=${types.join(",")}` : "";
  const max = filters.priceMax ?? 50_000_000;
  const min = filters.priceMin ?? 0;
  const listings: Listing[] = [];
  let live = false;
  let total = 0;
  for (let page = 1; page <= 3; page += 1) {
    const url =
      `https://api.boliga.dk/api/v2/search/results?pageSize=50&municipality=${kommune.code}` +
      `&priceMin=${min}&priceMax=${max}&page=${page}&sort=price-a${typeParam}`;
    const payload = asRecord(await readJson(url));
    if (!payload) break;
    live = true;
    const meta = asRecord(payload.meta);
    total = num(meta?.totalCount) ?? total;
    const rows = asList(payload.results).map(mapBoliga).filter((row): row is Listing => row !== null);
    listings.push(...rows);
    if (rows.length < 50) break;
  }
  const wanted = new Set(filters.types);
  const filtered = wanted.size ? listings.filter((row) => wanted.has(row.type)) : listings;
  return {
    totalHits: total || filtered.length,
    listings: filtered,
    live,
    source: live ? "Boliga" : "Boliga (utilgængelig)",
    sources: live ? ["Boliga"] : [],
  };
}
