import { guessedPropertyType, platformLabel, type SocialListing } from "./social";
import type { Listing, ListingSource } from "./types";

export function listingFromSocial(item: SocialListing): Listing {
  const source: ListingSource =
    item.platform === "boliga" ? "boliga" : (item.platform as ListingSource);
  return {
    id: item.id,
    type: guessedPropertyType(item) ?? "villa",
    price: item.price,
    priceChange: null,
    area: null,
    lot: null,
    rooms: null,
    energy: null,
    year: null,
    expense: null,
    m2price: null,
    days: null,
    lat: null,
    lon: null,
    image: item.image,
    imageAlt: item.title,
    agency: platformLabel(item.platform),
    agencySlug: item.platform,
    street: item.street || item.title,
    city: item.city ?? "",
    zip: item.zip,
    slug: item.id,
    slugAddress: "",
    source,
    caseUrl: item.url,
  };
}
