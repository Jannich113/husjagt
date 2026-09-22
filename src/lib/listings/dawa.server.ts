import { kommuneBySlug } from "./kommuner";
import { rememberDistricts, type District } from "./districts";
import {
  DAWA,
  districtsFromGeoJson,
  mergePlaceHits,
  parsePostHints,
  placesFromKommunerAutocomplete,
  placesFromPostnumre,
  type DawaPostHint,
} from "./dawa";
import { kommuneViewFromDawa, type KommuneView } from "./kommune-view";
import { localPlaceHits, type HuntPlace } from "./place";

const districtCache = new Map<string, District[]>();
const hintCache = new Map<string, DawaPostHint[]>();
const viewCache = new Map<string, KommuneView | null>();

async function dawaJson(path: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${DAWA}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchKommuneDistricts(slug: string): Promise<District[]> {
  const hit = districtCache.get(slug);
  if (hit) return hit;
  const kommune = kommuneBySlug(slug);
  if (!kommune) {
    districtCache.set(slug, []);
    return [];
  }
  const code = String(kommune.code).padStart(4, "0");
  const payload = await dawaJson(`/postnumre?kommunekode=${code}&format=geojson&landpostnumre`);
  const rows = districtsFromGeoJson(payload);
  districtCache.set(slug, rows);
  rememberDistricts(slug, rows);
  return rows;
}

export async function fetchKommuneView(slug: string): Promise<KommuneView | null> {
  if (viewCache.has(slug)) return viewCache.get(slug) ?? null;
  const kommune = kommuneBySlug(slug);
  if (!kommune) {
    viewCache.set(slug, null);
    return null;
  }
  const code = String(kommune.code).padStart(4, "0");
  const payload = await dawaJson(`/kommuner/${code}`);
  const view = kommuneViewFromDawa(slug, payload);
  viewCache.set(slug, view);
  return view;
}

export async function suggestPostnumre(query: string, slug?: string): Promise<DawaPostHint[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const key = `${slug ?? ""}:${q.toLowerCase()}`;
  const cached = hintCache.get(key);
  if (cached) return cached;
  const kommune = slug ? kommuneBySlug(slug) : undefined;
  const params = new URLSearchParams({ q, per_side: "12" });
  if (kommune) params.set("kommunekode", String(kommune.code).padStart(4, "0"));
  const payload = await dawaJson(`/postnumre/autocomplete?${params.toString()}`);
  const rows = parsePostHints(payload);
  hintCache.set(key, rows);
  return rows;
}

const placeCache = new Map<string, HuntPlace[]>();

export async function suggestPlaces(query: string): Promise<HuntPlace[]> {
  const q = query.trim();
  const local = localPlaceHits(q);
  if (q.length < 2) return local;
  const cached = placeCache.get(q.toLowerCase());
  if (cached) return mergePlaceHits(local, cached);
  const [kommuner, posts] = await Promise.all([
    dawaJson(`/kommuner/autocomplete?q=${encodeURIComponent(q)}&per_side=8`),
    dawaJson(`/postnumre?q=${encodeURIComponent(q)}`),
  ]);
  const remote = [...placesFromKommunerAutocomplete(kommuner), ...placesFromPostnumre(posts)];
  placeCache.set(q.toLowerCase(), remote);
  return mergePlaceHits(local, remote);
}
