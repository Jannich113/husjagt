import type { Listing, ListingDetail } from "./types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function firstImage(node: unknown): { url: string | null; alt: string | null } {
  const rec = asRecord(node);
  const sources = rec?.imageSources;
  if (Array.isArray(sources) && sources.length > 0) {
    const first = asRecord(sources[0]);
    return { url: str(first?.url), alt: str(first?.alt) };
  }
  return { url: str(rec?.url), alt: str(rec?.alt) };
}

function collectImages(raw: UnknownRecord): string[] {
  const urls: string[] = [];
  const push = (url: string | null) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  push(firstImage(raw.image).url);
  push(firstImage(raw.defaultImage).url);
  const images = raw.images;
  if (Array.isArray(images)) {
    for (const img of images) push(firstImage(img).url);
  }
  return urls;
}

export function mapListing(raw: unknown, source: Listing["source"] = "boligsiden"): Listing | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = str(rec.caseID);
  if (!id) return null;
  const address = asRecord(rec.address) ?? {};
  const realtor = asRecord(rec.realtor) ?? {};
  const coords = asRecord(rec.coordinates) ?? asRecord(address.coordinates) ?? {};
  const img = firstImage(rec.image) ;
  const fallbackImg = firstImage(rec.defaultImage);
  const daysListed = asRecord(rec.daysListed);
  const timeOnMarket = asRecord(rec.timeOnMarket);
  const total = asRecord(timeOnMarket?.total);
  const road = str(address.roadName) ?? "";
  const house = str(address.houseNumber) ?? "";
  return {
    id,
    type: str(rec.addressType) ?? "villa",
    price: num(rec.priceCash),
    priceChange: num(rec.priceChangePercentage),
    area: num(rec.housingArea),
    lot: num(rec.lotArea),
    rooms: num(rec.numberOfRooms),
    energy: str(rec.energyLabel)?.toUpperCase() ?? null,
    year: num(rec.yearBuilt),
    expense: num(rec.monthlyExpense),
    m2price: num(rec.perAreaPrice),
    days: num(daysListed?.days) ?? num(total?.days),
    lat: num(coords.lat),
    lon: num(coords.lon),
    image: img.url ?? fallbackImg.url,
    imageAlt: img.alt ?? fallbackImg.alt,
    agency: str(realtor.name),
    agencySlug: str(realtor.slug),
    street: `${road} ${house}`.trim(),
    city: str(address.cityName) ?? "",
    zip: (num(address.zipCode) ?? str(address.zipCode)) as number | string | null,
    slug: str(rec.slug) ?? str(address.slug) ?? id,
    slugAddress: str(rec.slugAddress) ?? str(address.slugAddress) ?? "",
    source,
    caseUrl: str(rec.caseUrl),
  };
}

export function mapDetail(raw: unknown): ListingDetail | null {
  const base = mapListing(raw);
  if (!base) return null;
  const rec = asRecord(raw) ?? {};
  return {
    ...base,
    descriptionTitle: str(rec.descriptionTitle),
    descriptionBody: str(rec.descriptionBody),
    caseUrl: str(rec.caseUrl),
    bathrooms: num(rec.numberOfBathrooms),
    floors: num(rec.numberOfFloors),
    images: collectImages(rec),
  };
}

export function inBounds(
  listing: Listing,
  bounds: { minLon: number; minLat: number; maxLon: number; maxLat: number },
): boolean {
  if (listing.lat == null || listing.lon == null) return false;
  return (
    listing.lon >= bounds.minLon &&
    listing.lon <= bounds.maxLon &&
    listing.lat >= bounds.minLat &&
    listing.lat <= bounds.maxLat
  );
}
