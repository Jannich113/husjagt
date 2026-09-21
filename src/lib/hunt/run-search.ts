import { mergeSearchResults } from "@/lib/listings/aggregate";
import { applyLocalFilters } from "@/lib/listings/boligsiden.server";
import type { SearchFilters, SearchResult } from "@/lib/listings/types";
import { EMPTY_SEARCH, type HuntServices } from "./ports";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

/** Fan-out to injected catalogs / classifieds / places, then merge. */
export async function runHuntSearch(services: HuntServices, filters: SearchFilters): Promise<SearchResult> {
  const catalogJobs = services.catalogs.map((catalog) =>
    withTimeout(
      catalog.search(filters).catch(() => ({ ...EMPTY_SEARCH, source: catalog.id, sources: [] })),
      catalog.timeoutMs,
      { ...EMPTY_SEARCH, source: catalog.id, sources: [] },
    ),
  );
  const classifiedsJob = services.classifieds
    ? withTimeout(services.classifieds.search(filters).catch(() => []), services.classifieds.timeoutMs, [])
    : Promise.resolve([]);
  const districtsJob = withTimeout(services.places.districts(filters.municipality).catch(() => []), 4000, []);

  const [parts, classifieds, districts] = await Promise.all([
    Promise.all(catalogJobs),
    classifiedsJob,
    districtsJob,
  ]);
  if (districts.length) services.places.remember?.(filters.municipality, districts);
  const merged = mergeSearchResults(filters, parts, classifieds);
  const listings = applyLocalFilters(merged.listings, filters);
  return { ...merged, listings, totalHits: listings.length };
}

export async function runGetListing(services: HuntServices, id: string) {
  for (const catalog of services.catalogs) {
    if (!catalog.getById) continue;
    const hit = await catalog.getById(id);
    if (hit) return hit;
  }
  return null;
}
