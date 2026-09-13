import { listingFromSocial } from "./listing-from-social";
import type { Listing, SearchFilters, SearchResult } from "./types";
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

function sortListings(listings: Listing[], filters: SearchFilters): Listing[] {
  const dir = filters.sortAscending ? 1 : -1;
  return [...listings].sort((a, b) => {
    const av = a.price ?? Number.POSITIVE_INFINITY;
    const bp = b.price ?? Number.POSITIVE_INFINITY;
    if (av !== bp) return (av - bp) * (filters.sortBy === "price" ? dir : 1);
    return (a.street || "").localeCompare(b.street || "", "da");
  });
}

export function mergeSearchResults(
  filters: SearchFilters,
  parts: SearchResult[],
  classifieds: SocialListing[] = [],
): SearchResult {
  const extras = classifieds.map(listingFromSocial);
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
  return {
    totalHits: sorted.length,
    listings: sorted,
    live,
    source: sources.length ? sources.join(" · ") : "Ingen kilder",
    sources,
  };
}
