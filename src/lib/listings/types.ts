export const PROPERTY_TYPES = [
  { id: "villa", label: "Villa" },
  { id: "terraced house", label: "Rækkehus" },
  { id: "cooperative", label: "Andelsbolig" },
  { id: "condo", label: "Ejerlejlighed" },
  { id: "villa apartment", label: "Villalejlighed" },
  { id: "holiday house", label: "Fritidshus" },
  { id: "full year allotment garden", label: "Kolonihave" },
  { id: "farm", label: "Landejendom" },
  { id: "hobby farm", label: "Hobbyejendom" },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]["id"];

export const ALLOTMENT_TYPE = "full year allotment garden";
export const KOLONIHAVE_RE = /\bkolonihave(?:hus)?\b|\bhaveforening\b|\bh\/f\b/i;

export function isKolonihaveText(...parts: Array<string | null | undefined>): boolean {
  return KOLONIHAVE_RE.test(parts.filter(Boolean).join(" "));
}

export function listingAllowedByTypes(
  listing: { type: string; street?: string | null; city?: string | null },
  types: string[],
): boolean {
  if (!types.length) return true;
  if (isKolonihaveText(listing.type, listing.street, listing.city) && !types.includes(ALLOTMENT_TYPE)) {
    return false;
  }
  return types.includes(listing.type);
}

export type GeoBounds = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

export const SORT_OPTIONS = [
  { id: "price", label: "Pris, lav → høj", ascending: true },
  { id: "price", label: "Pris, høj → lav", ascending: false },
  { id: "daysListed", label: "Nyeste først", ascending: true },
  { id: "timeOnMarket", label: "Kortest liggetid", ascending: true },
  { id: "perAreaPrice", label: "Lavest m²-pris", ascending: true },
  { id: "monthlyExpense", label: "Lavest ejerudgift", ascending: true },
  { id: "lotArea", label: "Størst grund", ascending: false },
] as const;

export type SortKey =
  | "price"
  | "daysListed"
  | "timeOnMarket"
  | "perAreaPrice"
  | "monthlyExpense"
  | "lotArea"
  | "housingArea";

export const ENERGY_LABELS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type EnergyLabel = (typeof ENERGY_LABELS)[number];

export type SearchFilters = {
  municipality: string;
  types: string[];
  priceMin: number | null;
  priceMax: number | null;
  roomsMin: number | null;
  roomsMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  lotMin: number | null;
  lotMax: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  energyLabels: string[];
  expenseMax: number | null;
  m2PriceMax: number | null;
  daysMax: number | null;
  zipCode: string | null;
  city: string | null;
  basement: boolean;
  balcony: boolean;
  terrace: boolean;
  elevator: boolean;
  priceDropOnly: boolean;
  freshOnly: boolean;
  sortBy: SortKey;
  sortAscending: boolean;
  page: number;
  perPage: number;
  boxes: GeoBounds[];
  districts: string[];
};

/** Defaults match the Boligsiden search you shared (Odense, villa/rækkehus/andel, max 2 mio). */
export const DEFAULT_FILTERS: SearchFilters = {
  municipality: "odense",
  types: ["villa", "terraced house", "cooperative"],
  priceMin: null,
  priceMax: 2_000_000,
  roomsMin: null,
  roomsMax: null,
  areaMin: null,
  areaMax: null,
  lotMin: null,
  lotMax: null,
  yearFrom: null,
  yearTo: null,
  energyLabels: [],
  expenseMax: null,
  m2PriceMax: null,
  daysMax: null,
  zipCode: null,
  city: null,
  basement: false,
  balcony: false,
  terrace: false,
  elevator: false,
  priceDropOnly: false,
  freshOnly: false,
  sortBy: "price",
  sortAscending: true,
  page: 1,
  perPage: 50,
  boxes: [],
  districts: [],
};

/** Tight map snippet from the original Boligsiden URL. */
export const LINK_BOUNDS: GeoBounds = {
  minLon: 10.342263,
  minLat: 55.333931,
  maxLon: 10.348721,
  maxLat: 55.34033,
};

export function energyBand(label: string | null | undefined): EnergyLabel | null {
  if (!label) return null;
  const letter = label.trim().toUpperCase()[0];
  return ENERGY_LABELS.includes(letter as EnergyLabel) ? (letter as EnergyLabel) : null;
}

export function usesClientOnlyFilters(filters: SearchFilters): boolean {
  return Boolean(
    filters.priceDropOnly ||
      filters.freshOnly ||
      (filters.boxes?.length ?? 0) > 0 ||
      (filters.districts?.length ?? 0) > 0 ||
      filters.m2PriceMax != null,
  );
}

export function advancedFilterCount(filters: SearchFilters): number {
  let n = 0;
  if (filters.priceMin != null) n += 1;
  if (filters.areaMax != null) n += 1;
  if (filters.roomsMax != null) n += 1;
  if (filters.energyLabels.length) n += 1;
  if (filters.yearFrom != null) n += 1;
  if (filters.yearTo != null) n += 1;
  if (filters.lotMin != null) n += 1;
  if (filters.lotMax != null) n += 1;
  if (filters.expenseMax != null) n += 1;
  if (filters.m2PriceMax != null) n += 1;
  if (filters.daysMax != null) n += 1;
  if (filters.zipCode) n += 1;
  if (filters.city) n += 1;
  if (filters.basement) n += 1;
  if (filters.balcony) n += 1;
  if (filters.terrace) n += 1;
  if (filters.elevator) n += 1;
  if (filters.priceDropOnly) n += 1;
  if (filters.freshOnly) n += 1;
  if (filters.boxes?.length) n += 1;
  if (filters.districts?.length) n += 1;
  if (filters.sortBy !== "price" || !filters.sortAscending) n += 1;
  return n;
}

export type ListingSource =
  | "boligsiden"
  | "boliga"
  | "guloggratis"
  | "dba"
  | "facebook"
  | "instagram"
  | "tiktok";

export type Listing = {
  id: string;
  type: string;
  price: number | null;
  priceChange: number | null;
  area: number | null;
  lot: number | null;
  rooms: number | null;
  energy: string | null;
  year: number | null;
  expense: number | null;
  m2price: number | null;
  days: number | null;
  lat: number | null;
  lon: number | null;
  image: string | null;
  imageAlt: string | null;
  agency: string | null;
  agencySlug: string | null;
  street: string;
  city: string;
  zip: number | string | null;
  slug: string;
  slugAddress: string;
  source: ListingSource;
  caseUrl: string | null;
};

export type ListingDetail = Listing & {
  descriptionTitle: string | null;
  descriptionBody: string | null;
  bathrooms: number | null;
  floors: number | null;
  images: string[];
};

export type SearchResult = {
  totalHits: number;
  listings: Listing[];
  live: boolean;
  source: string;
  sources: string[];
};
