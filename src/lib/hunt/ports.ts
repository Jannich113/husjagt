import type { District } from "@/lib/listings/districts";
import type { DawaPostHint } from "@/lib/listings/dawa";
import type { HuntPlace } from "@/lib/listings/place";
import type { HuntSourceId } from "@/lib/listings/sources";
import type { SocialListenResult, SocialListing } from "@/lib/listings/social";
import type { ListingDetail, SearchFilters, SearchResult } from "@/lib/listings/types";

/** One listing backend. Swap the impl in tests or behind a future HTTP worker. */
export type ListingCatalogPort = {
  id: HuntSourceId;
  timeoutMs: number;
  search: (filters: SearchFilters) => Promise<SearchResult>;
  getById?: (id: string) => Promise<ListingDetail | null>;
};

export type ClassifiedsPort = {
  timeoutMs: number;
  search: (filters: SearchFilters) => Promise<SocialListing[]>;
};

export type PlacesPort = {
  districts: (municipality: string) => Promise<District[]>;
  remember?: (municipality: string, rows: District[]) => void;
  suggestPlaces: (query: string) => Promise<HuntPlace[]>;
  suggestPostnumre: (query: string, municipality?: string) => Promise<DawaPostHint[]>;
};

export type SocialListenPort = {
  listen: (
    filters: SearchFilters,
    watch: { accounts?: string[] | null; tags?: string[] | null },
  ) => Promise<SocialListenResult>;
};

/** Composition root. Inject fakes in tests; liveHuntServices() in production. */
export type HuntServices = {
  catalogs: ListingCatalogPort[];
  classifieds: ClassifiedsPort | null;
  places: PlacesPort;
  social: SocialListenPort;
  snapshot: (filters: SearchFilters) => SearchResult;
};

export const EMPTY_SEARCH: SearchResult = {
  totalHits: 0,
  listings: [],
  live: false,
  source: "",
  sources: [],
};

export function createHuntServices(base: HuntServices, overrides: Partial<HuntServices> = {}): HuntServices {
  return {
    catalogs: overrides.catalogs ?? base.catalogs,
    classifieds: overrides.classifieds === undefined ? base.classifieds : overrides.classifieds,
    places: overrides.places ?? base.places,
    social: overrides.social ?? base.social,
    snapshot: overrides.snapshot ?? base.snapshot,
  };
}
