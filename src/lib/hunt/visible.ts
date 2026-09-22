import { listingFreshness } from "../listings/fresh";
import { filterByKeywords, type KeywordMode } from "../listings/keywords";
import { sortListings } from "../listings/sort";
import { filterByStreetQuery } from "../listings/street-query";
import type { Listing, SortKey } from "../listings/types";

export function visibleListings({
  pool,
  freshOnly,
  firstSeenAt,
  streetQuery,
  keywords,
  keywordMode,
  sortBy,
  sortAscending,
  hiddenIds = [],
  showHidden = false,
}: {
  pool: Listing[];
  freshOnly: boolean;
  firstSeenAt: Record<string, number | undefined>;
  streetQuery: string;
  keywords: string[];
  keywordMode: KeywordMode;
  sortBy: SortKey;
  sortAscending: boolean;
  hiddenIds?: string[];
  showHidden?: boolean;
}): Listing[] {
  let rows = pool;
  if (hiddenIds.length && !showHidden) {
    const hidden = new Set(hiddenIds);
    rows = rows.filter((row) => !hidden.has(row.id));
  }
  if (freshOnly) {
    rows = rows.filter((row) => listingFreshness(row, firstSeenAt[row.id]) != null);
  }
  rows = filterByStreetQuery(rows, streetQuery);
  rows = filterByKeywords(rows, keywords, keywordMode);
  return sortListings(rows, { sortBy, sortAscending });
}