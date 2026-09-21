import { kommuneByCode, kommuneByName, kommuneBySlug, searchKommuner } from "./kommuner";
import type { SearchFilters } from "./types";

export type HuntPlace = {
  id: string;
  kind: "kommune" | "postnr";
  label: string;
  detail: string;
  municipality: string;
  zip: string | null;
  city: string | null;
};

export function pickKommuneFromDawa(
  kommuner: Array<{ kode?: string; navn?: string }>,
  placeName: string,
) {
  if (!kommuner.length) return undefined;
  const needle = placeName.trim().toLowerCase();
  const exact = kommuner.find((row) => (row.navn ?? "").toLowerCase() === needle);
  if (exact) return exact;
  if (kommuner.length > 1 && needle !== "københavn") {
    const notCph = kommuner.find((row) => Number(String(row.kode ?? "").replace(/\D/g, "")) !== 101);
    if (notCph) return notCph;
  }
  return kommuner[0];
}

export function kommuneSlugFromDawa(row: { kode?: string; navn?: string } | undefined): string | null {
  if (!row) return null;
  if (row.kode) {
    const byCode = kommuneByCode(row.kode);
    if (byCode) return byCode.slug;
  }
  if (row.navn) {
    const byName = kommuneByName(row.navn);
    if (byName) return byName.slug;
  }
  return null;
}

export function applyPlace(filters: SearchFilters, place: HuntPlace): SearchFilters {
  return {
    ...filters,
    municipality: place.municipality,
    zipCode: place.zip,
    city: place.kind === "postnr" ? place.city : null,
    districts: [],
    boxes: [],
    page: 1,
  };
}

export function placeLabel(filters: SearchFilters): string {
  const city = filters.city?.trim();
  if (city) return city;
  if (filters.zipCode) return filters.zipCode;
  return kommuneBySlug(filters.municipality)?.name ?? "Danmark";
}

export function localPlaceHits(query: string): HuntPlace[] {
  return searchKommuner(query, 8).map((k) => ({
    id: `kommune:${k.slug}`,
    kind: "kommune" as const,
    label: k.name,
    detail: "Kommune",
    municipality: k.slug,
    zip: null,
    city: null,
  }));
}
