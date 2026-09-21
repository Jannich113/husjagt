import { listingFreshness } from "../listings/fresh";
import { filterByKeywords, type KeywordMode } from "../listings/keywords";
import { filterByStreetQuery } from "../listings/street-query";
import type { Listing } from "../listings/types";

export function visibleListings({
  pool,
  freshOnly,
  firstSeenAt,
  streetQuery,
  keywords,
  keywordMode,
}: {
  pool: Listing[];
  freshOnly: boolean;
  firstSeenAt: Record<string, number | undefined>;
  streetQuery: string;
  keywords: string[];
  keywordMode: KeywordMode;
}): Listing[] {
  let rows = pool;
  if (freshOnly) {
    rows = rows.filter((row) => listingFreshness(row, firstSeenAt[row.id]) != null);
  }
  rows = filterByStreetQuery(rows, streetQuery);
  rows = filterByKeywords(rows, keywords, keywordMode);
  return rows;
}
