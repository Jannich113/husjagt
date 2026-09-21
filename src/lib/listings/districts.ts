import type { GeoBounds } from "./types";
import rawDistricts from "./odense-districts.json";

export type LngLat = [number, number];

export type DistrictGeometry =
  | { type: "Polygon"; coordinates: LngLat[][] }
  | { type: "MultiPolygon"; coordinates: LngLat[][][] };

export type District = {
  id: string;
  label: string;
  city: string;
  zip: string;
  bounds: GeoBounds;
  geometry: DistrictGeometry;
};

const ODENSE: District[] = (rawDistricts as District[]).map((row) => ({
  ...row,
  geometry: row.geometry as DistrictGeometry,
}));

const ZIP_IDS: Record<string, string> = {
  "5000": "c",
  "5200": "v",
  "5210": "nv",
  "5220": "soe",
  "5230": "m",
  "5240": "noe",
  "5250": "sv",
  "5260": "s",
  "5270": "n",
  "5320": "agedrup",
  "5491": "blommenslyst",
};

export function districtIdFor(nr: string, navn: string): string {
  const known = ZIP_IDS[nr];
  if (known) return known;
  return navn
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

const liveByKommune = new Map<string, District[]>();

export function rememberDistricts(slug: string, rows: District[]): void {
  if (rows.length) liveByKommune.set(slug, rows);
}

/** Postal districts with simplified DAWA land polygons. Live DAWA rows win when loaded. */
export const KOMMUNE_DISTRICTS: Record<string, District[]> = {
  odense: ODENSE,
};

export function districtsForKommune(slug: string): District[] {
  return liveByKommune.get(slug) ?? KOMMUNE_DISTRICTS[slug] ?? [];
}

export function districtById(kommune: string, id: string): District | undefined {
  return districtsForKommune(kommune).find((row) => row.id === id);
}

function ringContains(lon: number, lat: number, ring: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const hit = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

function polygonContains(lon: number, lat: number, rings: LngLat[][]): boolean {
  if (!rings[0] || !ringContains(lon, lat, rings[0])) return false;
  for (const hole of rings.slice(1)) {
    if (ringContains(lon, lat, hole)) return false;
  }
  return true;
}

export function pointInGeometry(lon: number, lat: number, geometry: DistrictGeometry): boolean {
  if (geometry.type === "Polygon") return polygonContains(lon, lat, geometry.coordinates);
  return geometry.coordinates.some((poly) => polygonContains(lon, lat, poly));
}

export function geometryCentroid(geometry: DistrictGeometry): { lat: number; lon: number } {
  const ring = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0]?.[0];
  if (!ring?.length) return { lat: 0, lon: 0 };
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [x0, y0] = ring[j]!;
    const [x1, y1] = ring[i]!;
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const lon = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return { lat, lon };
  }
  return { lon: cx / (6 * area), lat: cy / (6 * area) };
}

export function listingInDistrict(
  listing: { city?: string | null; zip?: string | number | null; lat?: number | null; lon?: number | null },
  district: District,
): boolean {
  const zip = String(listing.zip ?? "").replace(/\D/g, "");
  if (zip && zip === district.zip) return true;
  const city = (listing.city ?? "").trim().toLowerCase();
  if (city && (city === district.city.toLowerCase() || city.includes(district.city.toLowerCase()))) {
    return true;
  }
  if (listing.lat == null || listing.lon == null) return false;
  if (pointInGeometry(listing.lon, listing.lat, district.geometry)) return true;
  return (
    listing.lon >= district.bounds.minLon &&
    listing.lon <= district.bounds.maxLon &&
    listing.lat >= district.bounds.minLat &&
    listing.lat <= district.bounds.maxLat
  );
}

export function listingInDistricts(
  listing: { city?: string | null; zip?: string | number | null; lat?: number | null; lon?: number | null },
  kommune: string,
  ids: string[],
): boolean {
  if (!ids.length) return true;
  return ids.some((id) => {
    const district = districtById(kommune, id);
    return district ? listingInDistrict(listing, district) : false;
  });
}
