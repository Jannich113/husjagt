import type { District, DistrictGeometry, LngLat } from "./districts";
import { districtIdFor } from "./districts";
import type { HuntPlace } from "./place";
import { kommuneSlugFromDawa, pickKommuneFromDawa } from "./place";
import type { KommuneView } from "./kommune-view";
import type { GeoBounds } from "./types";

export const DAWA = "https://api.dataforsyningen.dk";

export type DawaPostHint = {
  nr: string;
  navn: string;
  tekst: string;
};

type GeoJson = {
  type?: string;
  features?: Array<{
    type?: string;
    properties?: Record<string, unknown> | null;
    geometry?: { type?: string; coordinates?: unknown } | null;
  }>;
};

function asLngLat(value: unknown): LngLat | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lon = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

function perpDist(point: LngLat, start: LngLat, end: LngLat): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const mag = Math.hypot(dx, dy) || 1e-12;
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (mag * mag)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

export function simplifyRing(ring: LngLat[], epsilon: number): LngLat[] {
  if (ring.length < 3) return ring;
  const closed = ring[0]![0] === ring.at(-1)?.[0] && ring[0]![1] === ring.at(-1)?.[1];
  const pts = closed ? ring.slice(0, -1) : ring.slice();
  const rdp = (values: LngLat[], eps: number): LngLat[] => {
    if (values.length < 3) return values;
    const start = values[0]!;
    const end = values.at(-1)!;
    let maxd = -1;
    let idx = 0;
    for (let i = 1; i < values.length - 1; i += 1) {
      const d = perpDist(values[i]!, start, end);
      if (d > maxd) {
        maxd = d;
        idx = i;
      }
    }
    if (maxd > eps) {
      const left = rdp(values.slice(0, idx + 1), eps);
      const right = rdp(values.slice(idx), eps);
      return [...left.slice(0, -1), ...right];
    }
    return [start, end];
  };
  let eps = epsilon;
  let simp = rdp([...pts, pts[0]!], eps);
  while (simp.length > 80 && eps < 0.012) {
    eps *= 1.4;
    simp = rdp([...pts, pts[0]!], eps);
  }
  if (simp[0]![0] !== simp.at(-1)?.[0] || simp[0]![1] !== simp.at(-1)?.[1]) simp.push(simp[0]!);
  return simp.map(([lon, lat]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))] as LngLat);
}

function simplifyPolygon(rings: unknown, epsilon: number): LngLat[][] | null {
  if (!Array.isArray(rings) || !rings[0]) return null;
  const out: LngLat[][] = [];
  rings.forEach((ring, index) => {
    if (!Array.isArray(ring)) return;
    const pts = ring.map(asLngLat).filter((p): p is LngLat => p !== null);
    if (index > 0 && pts.length < 20) return;
    const simp = simplifyRing(pts, epsilon);
    if (simp.length >= 4) out.push(simp);
  });
  return out.length ? out : null;
}

export function simplifyGeometry(raw: { type?: string; coordinates?: unknown }, epsilon = 0.0012): DistrictGeometry | null {
  const kind = raw.type;
  const coords = raw.coordinates;
  if (kind === "Polygon") {
    const rings = simplifyPolygon(coords, epsilon);
    return rings ? { type: "Polygon", coordinates: rings } : null;
  }
  if (kind === "MultiPolygon" && Array.isArray(coords)) {
    const polys = coords
      .map((poly) => simplifyPolygon(poly, epsilon))
      .filter((row): row is LngLat[][] => Boolean(row));
    if (!polys.length) return null;
    if (polys.length === 1) return { type: "Polygon", coordinates: polys[0]! };
    return { type: "MultiPolygon", coordinates: polys };
  }
  return null;
}

function boundsOf(geometry: DistrictGeometry): GeoBounds {
  const lons: number[] = [];
  const lats: number[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value) && typeof value[0] === "number") {
      lons.push(value[0] as number);
      lats.push(value[1] as number);
      return;
    }
    if (Array.isArray(value)) value.forEach(walk);
  };
  walk(geometry.coordinates);
  return {
    minLon: Math.min(...lons),
    minLat: Math.min(...lats),
    maxLon: Math.max(...lons),
    maxLat: Math.max(...lats),
  };
}

export function districtsFromGeoJson(payload: unknown): District[] {
  const file = payload && typeof payload === "object" ? (payload as GeoJson) : null;
  const features = file?.features ?? [];
  const rows: District[] = [];
  const seen = new Set<string>();
  for (const feature of features) {
    const props = feature.properties ?? {};
    const nr = String(props.nr ?? "").replace(/\D/g, "");
    const navn = typeof props.navn === "string" ? props.navn.trim() : "";
    if (nr.length !== 4 || !navn) continue;
    if (props.stormodtager === true) continue;
    if (!feature.geometry) continue;
    const geometry = simplifyGeometry(feature.geometry);
    if (!geometry) continue;
    const id = districtIdFor(nr, navn);
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      label: navn,
      city: navn,
      zip: nr,
      bounds: boundsOf(geometry),
      geometry,
    });
  }
  return rows.sort((a, b) => a.zip.localeCompare(b.zip, "da"));
}

export function kommuneViewFromGeoJson(slug: string, payload: unknown): KommuneView | null {
  if (!payload || typeof payload !== "object") return null;
  const rec = payload as Record<string, unknown>;
  const feature =
    rec.type === "Feature"
      ? rec
      : Array.isArray(rec.features)
        ? (rec.features[0] as Record<string, unknown> | undefined)
        : rec;
  if (!feature) return null;
  const props = (feature.properties as Record<string, unknown> | undefined) ?? rec;
  const geomRaw = (feature.geometry as { type?: string; coordinates?: unknown } | undefined) ?? undefined;
  const geometry = geomRaw ? simplifyGeometry(geomRaw, 0.0018) : null;
  const bbox = Array.isArray(feature.bbox) ? feature.bbox : rec.bbox;
  let bounds: GeoBounds | null = null;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    const minLon = Number(bbox[0]);
    const minLat = Number(bbox[1]);
    const maxLon = Number(bbox[2]);
    const maxLat = Number(bbox[3]);
    if ([minLon, minLat, maxLon, maxLat].every(Number.isFinite)) {
      bounds = { minLon, minLat, maxLon, maxLat };
    }
  } else if (geometry) {
    bounds = boundsOf(geometry);
  }
  const vc = Array.isArray(props.visueltcenter) ? props.visueltcenter : rec.visueltcenter;
  const center = asLngLat(vc);
  const lat = center ? center[1] : bounds ? (bounds.minLat + bounds.maxLat) / 2 : NaN;
  const lon = center ? center[0] : bounds ? (bounds.minLon + bounds.maxLon) / 2 : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { slug, lat, lon, bounds, geometry };
}

export function parsePostHints(payload: unknown): DawaPostHint[] {
  if (!Array.isArray(payload)) return [];
  const rows: DawaPostHint[] = [];
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const nested = rec.postnummer && typeof rec.postnummer === "object" ? (rec.postnummer as Record<string, unknown>) : rec;
    const nr = String(nested.nr ?? "").replace(/\D/g, "");
    const navn = typeof nested.navn === "string" ? nested.navn.trim() : "";
    const tekst = typeof rec.tekst === "string" ? rec.tekst : `${nr} ${navn}`.trim();
    if (nr.length === 4 && navn) rows.push({ nr, navn, tekst });
  }
  return rows.slice(0, 12);
}

function asKommuner(value: unknown): Array<{ kode?: string; navn?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter((row) => row && typeof row === "object") as Array<{ kode?: string; navn?: string }>;
}

export function placesFromKommunerAutocomplete(payload: unknown): HuntPlace[] {
  if (!Array.isArray(payload)) return [];
  const rows: HuntPlace[] = [];
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const nested = rec.kommune && typeof rec.kommune === "object" ? (rec.kommune as Record<string, unknown>) : rec;
    const navn = typeof nested.navn === "string" ? nested.navn.trim() : "";
    const kode = typeof nested.kode === "string" || typeof nested.kode === "number" ? String(nested.kode) : "";
    const slug = kommuneSlugFromDawa({ kode, navn });
    if (!slug || !navn) continue;
    rows.push({
      id: `kommune:${slug}`,
      kind: "kommune",
      label: navn,
      detail: "Kommune",
      municipality: slug,
      zip: null,
      city: null,
    });
  }
  return rows;
}

export function placesFromPostnumre(payload: unknown): HuntPlace[] {
  const list = Array.isArray(payload) ? payload : [];
  const rows: HuntPlace[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const nested = rec.postnummer && typeof rec.postnummer === "object" ? (rec.postnummer as Record<string, unknown>) : rec;
    const nr = String(nested.nr ?? rec.nr ?? "").replace(/\D/g, "");
    const navn = typeof nested.navn === "string" ? nested.navn.trim() : typeof rec.navn === "string" ? rec.navn.trim() : "";
    if (nr.length !== 4 || !navn) continue;
    if (nested.stormodtager === true || rec.stormodtager === true) continue;
    const picked = pickKommuneFromDawa(asKommuner(nested.kommuner ?? rec.kommuner), navn);
    const slug = kommuneSlugFromDawa(picked);
    if (!slug) continue;
    rows.push({
      id: `postnr:${nr}:${slug}`,
      kind: "postnr",
      label: `${nr} ${navn}`,
      detail: picked?.navn ? `${picked.navn} Kommune` : "Postnr",
      municipality: slug,
      zip: nr,
      city: navn,
    });
  }
  return rows.slice(0, 12);
}

export function mergePlaceHits(local: HuntPlace[], remote: HuntPlace[]): HuntPlace[] {
  const seen = new Set<string>();
  const out: HuntPlace[] = [];
  for (const row of [...local, ...remote]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out.slice(0, 16);
}
