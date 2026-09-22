import snapshot from "./snapshot.json";
import { mapDetail, mapListing, inAnyBox } from "./map-listing";
import { mergeHistory, parsePriceHistory } from "./price-history";
import { listingInDistricts } from "./districts";
import { kommuneBySlug } from "./kommuner";
import { proxyFetch } from "./proxy-fetch";
import {
  energyBand,
  listingAllowedByTypes,
  usesClientOnlyFilters,
  type Listing,
  type ListingDetail,
  type SearchFilters,
  type SearchResult,
} from "./types";

const BOLIGSIDEN = "https://api.boligsiden.dk";
const BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
  Origin: "https://www.boligsiden.dk",
  Referer: "https://www.boligsiden.dk/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

function snapshotListings(): Listing[] {
  const file = snapshot as { listings?: Array<Partial<Listing> & { id: string }> };
  return (file.listings ?? []).map((row) => ({
    id: row.id,
    type: row.type ?? "villa",
    price: row.price ?? null,
    priceChange: row.priceChange ?? null,
    area: row.area ?? null,
    lot: row.lot ?? null,
    rooms: row.rooms ?? null,
    energy: row.energy ?? null,
    year: row.year ?? null,
    expense: row.expense ?? null,
    m2price: row.m2price ?? null,
    days: row.days ?? null,
    lat: row.lat ?? null,
    lon: row.lon ?? null,
    image: row.image ?? null,
    imageAlt: row.imageAlt ?? null,
    agency: row.agency ?? null,
    agencySlug: row.agencySlug ?? null,
    street: row.street ?? "",
    city: row.city ?? "",
    zip: row.zip ?? null,
    slug: row.slug ?? row.id,
    slugAddress: row.slugAddress ?? "",
    source: "boligsiden",
    caseUrl: null,
  }));
}

function zipDigits(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 4 ? digits : null;
}

function buildSearchUrl(filters: SearchFilters): string {
  const url = new URL(`${BOLIGSIDEN}/search/list/cases`);
  if (filters.types.length) url.searchParams.set("addressTypes", filters.types.join(","));
  if (filters.municipality) {
    const kommune = kommuneBySlug(filters.municipality);
    url.searchParams.set("municipalities", (kommune?.name ?? filters.municipality).toLowerCase());
  }
  if (filters.priceMin != null) url.searchParams.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) url.searchParams.set("priceMax", String(filters.priceMax));
  if (filters.roomsMin != null) url.searchParams.set("numberOfRoomsMin", String(filters.roomsMin));
  if (filters.roomsMax != null) url.searchParams.set("numberOfRoomsMax", String(filters.roomsMax));
  if (filters.areaMin != null) url.searchParams.set("areaMin", String(filters.areaMin));
  if (filters.areaMax != null) url.searchParams.set("areaMax", String(filters.areaMax));
  if (filters.lotMin != null) url.searchParams.set("lotAreaMin", String(filters.lotMin));
  if (filters.lotMax != null) url.searchParams.set("lotAreaMax", String(filters.lotMax));
  if (filters.yearFrom != null) url.searchParams.set("yearBuiltFrom", String(filters.yearFrom));
  if (filters.yearTo != null) url.searchParams.set("yearBuiltTo", String(filters.yearTo));
  if (filters.energyLabels.length) {
    url.searchParams.set("energyLabels", filters.energyLabels.map((l) => l.toUpperCase()).join(","));
  }
  if (filters.expenseMax != null) url.searchParams.set("monthlyExpenseMax", String(filters.expenseMax));
  if (filters.daysMax != null) url.searchParams.set("daysListedMax", String(filters.daysMax));
  else if (filters.freshOnly) url.searchParams.set("daysListedMax", "7");
  const zip = zipDigits(filters.zipCode);
  if (zip) url.searchParams.set("zipCodes", zip);
  const city = filters.city?.trim();
  if (city) url.searchParams.set("cities", city);
  if (filters.basement) url.searchParams.set("basementAreaMin", "1");
  if (filters.balcony) url.searchParams.set("balcony", "true");
  if (filters.terrace) url.searchParams.set("terrace", "true");
  if (filters.elevator) url.searchParams.set("elevator", "true");
  const sortBy = filters.sortBy === "housingArea" ? "price" : filters.sortBy;
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("sortAscending", String(filters.sortAscending));
  url.searchParams.set("per_page", String(filters.perPage));
  url.searchParams.set("page", String(filters.page));
  return url.toString();
}

async function readJson(url: string): Promise<unknown | null> {
  try {
    const direct = await fetch(url, { headers: BROWSER_HEADERS });
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

export function applyLocalFilters(listings: Listing[], filters: SearchFilters): Listing[] {
  const zip = zipDigits(filters.zipCode);
  const city = filters.city?.trim().toLowerCase() ?? "";
  const energyWanted = new Set(filters.energyLabels.map((l) => l.toUpperCase()));
  return listings.filter((item) => {
    if (!listingAllowedByTypes(item, filters.types)) return false;
    if (filters.priceMax != null && item.price != null && item.price > filters.priceMax) return false;
    if (filters.priceMin != null && item.price != null && item.price < filters.priceMin) return false;
    if (filters.roomsMin != null && (item.rooms == null || item.rooms < filters.roomsMin)) return false;
    if (filters.roomsMax != null && (item.rooms == null || item.rooms > filters.roomsMax)) return false;
    if (filters.areaMin != null && (item.area == null || item.area < filters.areaMin)) return false;
    if (filters.areaMax != null && (item.area == null || item.area > filters.areaMax)) return false;
    if (filters.lotMin != null && (item.lot == null || item.lot < filters.lotMin)) return false;
    if (filters.lotMax != null && (item.lot == null || item.lot > filters.lotMax)) return false;
    if (filters.yearFrom != null && (item.year == null || item.year < filters.yearFrom)) return false;
    if (filters.yearTo != null && (item.year == null || item.year > filters.yearTo)) return false;
    if (filters.expenseMax != null && (item.expense == null || item.expense > filters.expenseMax)) {
      return false;
    }
    if (filters.m2PriceMax != null && (item.m2price == null || item.m2price > filters.m2PriceMax)) {
      return false;
    }
    if (filters.freshOnly) {
      if (item.days != null && item.days > 7) return false;
    } else if (filters.daysMax != null && (item.days == null || item.days > filters.daysMax)) {
      return false;
    }
    if (energyWanted.size) {
      const band = energyBand(item.energy);
      if (!band || !energyWanted.has(band)) return false;
    }
    if (zip && zipDigits(item.zip) !== zip) return false;
    if (city && !item.city.toLowerCase().includes(city)) return false;
    if (filters.priceDropOnly && !(item.priceChange != null && item.priceChange < -0.5)) return false;
    const boxes = filters.boxes ?? [];
    const districts = filters.districts ?? [];
    if (boxes.length && !inAnyBox(item, boxes)) return false;
    if (districts.length && !listingInDistricts(item, filters.municipality, districts)) {
      return false;
    }
    return true;
  });
}

export function snapshotSearch(filters: SearchFilters): SearchResult {
  if (filters.municipality && filters.municipality !== "odense") {
    return {
      totalHits: 0,
      listings: [],
      live: false,
      source: "Ingen gemt kopi for denne by — henter live",
      sources: [],
    };
  }
  const all = applyLocalFilters(snapshotListings(), filters);
  const start = (filters.page - 1) * filters.perPage;
  return {
    totalHits: all.length,
    listings: all.slice(start, start + filters.perPage),
    live: false,
    source: "Gemt Odense-udsnit",
    sources: ["Boligsiden"],
  };
}

function catalogTotal(rec: Record<string, unknown> | null, fallback: number): number {
  if (!rec) return fallback;
  for (const key of ["totalHits", "total", "hits", "count", "numberOfHits", "resultCount"]) {
    const value = rec[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= fallback) return value;
  }
  const pagination = rec.pagination;
  if (pagination && typeof pagination === "object") {
    return catalogTotal(pagination as Record<string, unknown>, fallback);
  }
  return fallback;
}

export async function searchBoligsiden(filters: SearchFilters): Promise<SearchResult> {
  const payload = await readJson(buildSearchUrl(filters));
  const rec = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const cases = Array.isArray(rec?.cases) ? rec.cases : [];
  let listings = cases
    .map((row) => mapListing(row))
    .filter((row): row is Listing => row !== null);

  listings = applyLocalFilters(listings, {
    ...filters,
    basement: false,
    balcony: false,
    terrace: false,
    elevator: false,
  }).slice(0, filters.perPage);

  if (listings.length > 0 || catalogTotal(rec, 0) > 0) {
    const apiHits = catalogTotal(rec, listings.length);
    return {
      totalHits: usesClientOnlyFilters(filters) ? listings.length : apiHits,
      listings,
      live: true,
      source: "Boligsiden (live, alle mæglerkæder)",
      sources: ["Boligsiden"],
    };
  }

  const fallback = filters.municipality === "odense" ? applyLocalFilters(snapshotListings(), filters) : [];
  const start = (filters.page - 1) * filters.perPage;
  return {
    totalHits: fallback.length,
    listings: fallback.slice(start, start + filters.perPage),
    live: false,
    source:
      filters.municipality === "odense"
        ? "Gemt Odense-udsnit (live-kilden er midlertidigt spærret)"
        : "Ingen boliger lige nu — prøv igen om et øjeblik",
    sources: fallback.length ? ["Boligsiden"] : [],
  };
}

export async function getBoligsidenCase(id: string): Promise<ListingDetail | null> {
  const payload = await readJson(`${BOLIGSIDEN}/cases/${encodeURIComponent(id)}`);
  const detail = mapDetail(payload);
  if (detail) {
    const sales = await loadAddressSales(detail.addressId);
    return { ...detail, priceHistory: mergeHistory(detail.priceHistory, sales) };
  }

  const snap = snapshotListings().find((row) => row.id === id);
  if (!snap) return null;
  return {
    ...snap,
    descriptionTitle: null,
    descriptionBody: null,
    bathrooms: null,
    floors: null,
    images: snap.image ? [snap.image] : [],
    priceHistory: [],
  };
}

async function loadAddressSales(addressId: string | null | undefined) {
  if (!addressId) return [];
  const payload = await readJson(`${BOLIGSIDEN}/addresses/${encodeURIComponent(addressId)}`);
  return parsePriceHistory(payload, "sold");
}
