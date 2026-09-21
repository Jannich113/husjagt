import { listingFreshness } from "../listings/fresh";
import { filterByKeywords, type KeywordMode } from "../listings/keywords";
import { rankBySimilarity } from "../listings/similar";
import { filterByStreetQuery } from "../listings/street-query";
import type { Listing, SearchFilters } from "../listings/types";

export function visibleListings({
  pool,
  freshOnly,
  firstSeenAt,
  streetQuery,
  keywords,
  keywordMode,
  preference,
  sortBy,
}: {
  pool: Listing[];
  freshOnly: boolean;
  firstSeenAt: Record<string, number | undefined>;
  streetQuery: string;
  keywords: string[];
  keywordMode: KeywordMode;
  preference: Listing | null;
  sortBy: SearchFilters["sortBy"];
}): Listing[] {
  let rows = pool;
  if (freshOnly) {
    rows = rows.filter((row) => listingFreshness(row, firstSeenAt[row.id]) != null);
  }
  rows = filterByStreetQuery(rows, streetQuery);
  rows = filterByKeywords(rows, keywords, keywordMode);
  if (sortBy === "similarity") rows = rankBySimilarity(rows, preference);
  return rows;
}
