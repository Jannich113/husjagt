/** Case-insensitive street / address match on the current result set. */

export function normalizeStreetQuery(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ");
}

export function listingAddressHaystack(listing: {
  street?: string | null;
  city?: string | null;
  zip?: number | string | null;
  slugAddress?: string | null;
}): string {
  return [listing.street, listing.zip, listing.city, listing.slugAddress]
    .filter((part) => part != null && String(part).trim())
    .join(" ")
    .toLocaleLowerCase("da");
}

export function matchesStreetQuery(
  listing: {
    street?: string | null;
    city?: string | null;
    zip?: number | string | null;
    slugAddress?: string | null;
  },
  query: string,
): boolean {
  const needle = normalizeStreetQuery(query).toLocaleLowerCase("da");
  if (!needle) return true;
  return listingAddressHaystack(listing).includes(needle);
}

export function filterByStreetQuery<T extends Parameters<typeof matchesStreetQuery>[0]>(
  listings: T[],
  query: string,
): T[] {
  const needle = normalizeStreetQuery(query);
  if (!needle) return listings;
  return listings.filter((row) => matchesStreetQuery(row, needle));
}
