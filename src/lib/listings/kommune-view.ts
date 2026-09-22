import type { DistrictGeometry } from "./districts";
import type { GeoBounds } from "./types";

export type KommuneView = {
  slug: string;
  lat: number;
  lon: number;
  bounds: GeoBounds | null;
  geometry: DistrictGeometry | null;
};

export type MapCamera =
  | { kind: "bounds"; bounds: GeoBounds; maxZoom: number }
  | { kind: "point"; lat: number; lon: number; zoom: number };

function pair(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const a = Number(value[0]);
  const b = Number(value[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return [a, b];
}

/** Parse DAWA `/kommuner/{kode}` (visueltcenter + bbox) into a map focus. */
export function kommuneViewFromDawa(slug: string, payload: unknown): KommuneView | null {
  if (!payload || typeof payload !== "object") return null;
  const rec = payload as Record<string, unknown>;
  const center = pair(rec.visueltcenter);
  if (!center) return null;
  const bbox = rec.bbox;
  let bounds: GeoBounds | null = null;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    const minLon = Number(bbox[0]);
    const minLat = Number(bbox[1]);
    const maxLon = Number(bbox[2]);
    const maxLat = Number(bbox[3]);
    if ([minLon, minLat, maxLon, maxLat].every(Number.isFinite)) {
      bounds = { minLon, minLat, maxLon, maxLat };
    }
  }
  return { slug, lon: center[0], lat: center[1], bounds, geometry: null };
}

export function unionGeoBounds(boxes: GeoBounds[]): GeoBounds | null {
  if (!boxes.length) return null;
  const first = boxes[0]!;
  const out = { ...first };
  for (const box of boxes.slice(1)) {
    out.minLon = Math.min(out.minLon, box.minLon);
    out.minLat = Math.min(out.minLat, box.minLat);
    out.maxLon = Math.max(out.maxLon, box.maxLon);
    out.maxLat = Math.max(out.maxLat, box.maxLat);
  }
  return out;
}

export function pointInBounds(lat: number, lon: number, box: GeoBounds, pad = 0): boolean {
  return lat >= box.minLat - pad && lat <= box.maxLat + pad && lon >= box.minLon - pad && lon <= box.maxLon + pad;
}

function boundsFromPins(pins: Array<{ lat: number; lon: number }>): GeoBounds | null {
  if (!pins.length) return null;
  let minLat = pins[0]!.lat;
  let maxLat = pins[0]!.lat;
  let minLon = pins[0]!.lon;
  let maxLon = pins[0]!.lon;
  for (const pin of pins.slice(1)) {
    minLat = Math.min(minLat, pin.lat);
    maxLat = Math.max(maxLat, pin.lat);
    minLon = Math.min(minLon, pin.lon);
    maxLon = Math.max(maxLon, pin.lon);
  }
  return { minLat, maxLat, minLon, maxLon };
}

/** Camera for the selected kommune — never leave the map at Denmark-level zoom. */
export function huntMapCamera(input: {
  boxes: GeoBounds[];
  selectedDistrictBounds: GeoBounds[];
  kommuneBounds: GeoBounds | null;
  kommuneCenter: { lat: number; lon: number } | null;
  pins: Array<{ lat: number; lon: number }>;
}): MapCamera | null {
  const drawn = unionGeoBounds(input.boxes);
  if (drawn) return { kind: "bounds", bounds: drawn, maxZoom: 14 };

  const districts = unionGeoBounds(input.selectedDistrictBounds);
  if (districts) return { kind: "bounds", bounds: districts, maxZoom: 14 };

  const region = input.kommuneBounds;
  const inside = region ? input.pins.filter((pin) => pointInBounds(pin.lat, pin.lon, region, 0.02)) : input.pins;
  if (inside.length >= 2) {
    const cluster = boundsFromPins(inside);
    if (cluster) return { kind: "bounds", bounds: cluster, maxZoom: 13 };
  }
  if (region) return { kind: "bounds", bounds: region, maxZoom: 12 };
  if (inside.length === 1) return { kind: "point", lat: inside[0]!.lat, lon: inside[0]!.lon, zoom: 13 };
  if (input.kommuneCenter) {
    return { kind: "point", lat: input.kommuneCenter.lat, lon: input.kommuneCenter.lon, zoom: 11 };
  }
  return null;
}
