import type { Listing, SearchFilters, SortKey } from "./types";

export function listingSortValue(listing: Listing, key: SortKey): number {
  switch (key) {
    case "daysListed":
    case "timeOnMarket":
      return listing.days ?? Number.POSITIVE_INFINITY;
    case "perAreaPrice":
      if (listing.m2price != null) return listing.m2price;
      if (listing.price != null && listing.area) return listing.price / listing.area;
      return Number.POSITIVE_INFINITY;
    case "monthlyExpense":
      return listing.expense ?? Number.POSITIVE_INFINITY;
    case "lotArea":
      return listing.lot ?? Number.NEGATIVE_INFINITY;
    case "housingArea":
      return listing.area ?? Number.NEGATIVE_INFINITY;
    case "price":
    default:
      return listing.price ?? Number.POSITIVE_INFINITY;
  }
}

export function sortListings(
  listings: Listing[],
  filters: Pick<SearchFilters, "sortBy" | "sortAscending">,
): Listing[] {
  const dir = filters.sortAscending ? 1 : -1;
  return [...listings].sort((a, b) => {
    const av = listingSortValue(a, filters.sortBy);
    const bv = listingSortValue(b, filters.sortBy);
    if (av !== bv) return (av - bv) * dir;
    return (a.street || "").localeCompare(b.street || "", "da");
  });
}
