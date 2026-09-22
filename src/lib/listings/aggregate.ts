import { listingFromSocial } from "./listing-from-social";
import { sortListings } from "./sort";
import type { Listing, SearchFilters, SearchResult } from "./types";
import { listingAllowedByTypes } from "./types";
import type { SocialListing } from "./social";

const SOURCE_RANK: Record<string, number> = {
  boligsiden: 4,
  boliga: 3,
  guloggratis: 2,
  dba: 2,
  facebook: 1,
};

export function listingDedupeKey(listing: Listing): string {
  const street = listing.street
    .toLowerCase()
    .split(",")[0]
    .replace(/[^a-z0-9æøå]+/gi, " ")
    .trim();
  const zip = String(listing.zip ?? "").replace(/\D/g, "");
  return `${street}|${zip}`;
}

function richness(listing: Listing): number {
  return (
    (listing.image ? 2 : 0) +
    (listing.rooms != null ? 1 : 0) +
    (listing.area != null ? 1 : 0) +
    (listing.lat != null ? 1 : 0)
  );
}

export function dedupeListings(listings: Listing[]): Listing[] {
  const best = new Map<string, Listing>();
  for (const listing of listings) {
    const key = listingDedupeKey(listing);
    if (!key.startsWith("|") && key !== "|") {
      const current = best.get(key);
      if (!current) {
        best.set(key, listing);
        continue;
      }
      const rank = SOURCE_RANK[listing.source] ?? 0;
      const other = SOURCE_RANK[current.source] ?? 0;
      if (rank > other || (rank === other && richness(listing) > richness(current))) {
        best.set(key, listing);
      }
      continue;
    }
    best.set(listing.id, listing);
  }
  return [...best.values()];
}

export function mergeSearchResults(
  filters: SearchFilters,
  parts: SearchResult[],
  classifieds: SocialListing[] = [],
): SearchResult {
  const extras = classifieds
    .map(listingFromSocial)
    .filter((row) => listingAllowedByTypes(row, filters.types));
  const merged = dedupeListings([...parts.flatMap((part) => part.listings), ...extras]);
  const sorted = sortListings(merged, filters);
  const sources = [
    ...new Set(
      [
        ...parts.flatMap((part) => part.sources ?? (part.live ? [part.source] : [])),
        ...extras.map((row) =>
          row.source === "guloggratis" ? "GulogGratis" : row.source === "dba" ? "DBA" : row.agency || row.source,
        ),
      ].filter(Boolean),
    ),
  ];
  const live = parts.some((part) => part.live) || extras.length > 0;
  const catalogHits = parts.reduce((sum, part) => Math.max(sum, part.totalHits), 0);
  return {
    totalHits: Math.max(sorted.length, catalogHits),
    listings: sorted,
    live,
    source: sources.length ? sources.join(" · ") : "Ingen kilder",
    sources,
  };
}

export function appendSearchPage(current: SearchResult, extra: SearchResult): SearchResult {
  const listings = dedupeListings([...current.listings, ...extra.listings]);
  return {
    ...current,
    listings,
    totalHits: Math.max(current.totalHits, extra.totalHits, listings.length),
    live: current.live || extra.live,
    sources: [...new Set([...current.sources, ...extra.sources])],
  };
}
