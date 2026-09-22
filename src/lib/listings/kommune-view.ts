import type { GeoBounds } from "./types";

export type KommuneView = {
  slug: string;
  lat: number;
  lon: number;
  bounds: GeoBounds | null;
};

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
  return { slug, lon: center[0], lat: center[1], bounds };
}
