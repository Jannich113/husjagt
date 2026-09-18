import snapshot from "./social-snapshot.json";

import type { SearchFilters } from "./types";

export const SOCIAL_PLATFORMS = [
  { id: "guloggratis", label: "GulogGratis" },
  { id: "facebook", label: "Marketplace" },
  { id: "dba", label: "DBA" },
  { id: "boliga", label: "Privat selvsalg" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "x", label: "X" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];

export type SocialKind = "photo" | "video";

export type SocialListing = {
  id: string;
  platform: SocialPlatform;
  title: string;
  text: string;
  url: string;
  price: number | null;
  city: string | null;
  zip: string | null;
  street: string | null;
  image: string | null;
  video: string | null;
  author: string | null;
  kind: SocialKind;
  postedAt: string | null;
};

export type SocialListenResult = {
  listings: SocialListing[];
  live: boolean;
  sources: string[];
};

export function platformLabel(id: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function isVideoPlatform(id: SocialPlatform): boolean {
  return id === "instagram" || id === "tiktok";
}

export function isVideoPost(item: SocialListing): boolean {
  return item.kind === "video" || isVideoPlatform(item.platform);
}

export function isPlayableVideo(item: SocialListing): boolean {
  return isVideoPost(item) && Boolean(item.video);
}

const TYPE_HINTS: [string, RegExp][] = [
  ["cooperative", /\bandels(?:bolig|lejlighed)?\b/i],
  ["terraced house", /\brækkehus|\braekkehus/i],
  ["villa apartment", /\bvillalejlighed/i],
  ["condo", /\bejerlejlighed|(?<!andels)lejlighed\b/i],
  ["holiday house", /\bsommerhus|\bfritidshus|\bkolonihave/i],
  ["hobby farm", /\bhobbyejendom/i],
  ["farm", /\blandejendom|\blandbrug/i],
  ["villa", /villa|parcelhus|\bhus\b/i],
];

export function guessedPropertyType(item: SocialListing): string | null {
  const blob = `${item.title} ${item.text}`;
  for (const [id, re] of TYPE_HINTS) {
    if (re.test(blob)) return id;
  }
  return null;
}

function parseFirstNumber(blob: string, re: RegExp): number | null {
  const match = blob.match(re);
  if (!match) return null;
  const raw = match[1] ?? match[2];
  if (!raw) return null;
  const n = Number(raw.replace(/\./g, ""));
  return Number.isFinite(n) ? n : null;
}

export function socialMatchesFilters(item: SocialListing, filters: SearchFilters): boolean {
  if (item.price != null) {
    if (item.price < 50_000) return false;
    if (filters.priceMax != null && item.price > filters.priceMax) return false;
    if (filters.priceMin != null && item.price < filters.priceMin) return false;
  }

  if (filters.types.length) {
    const guessed = guessedPropertyType(item);
    if (guessed && !filters.types.includes(guessed)) return false;
  }

  const blob = `${item.title} ${item.text}`;
  const rooms = parseFirstNumber(blob, /(\d+)\s*vær/i);
  if (filters.roomsMin != null && rooms != null && rooms < filters.roomsMin) return false;
  if (filters.roomsMax != null && rooms != null && rooms > filters.roomsMax) return false;

  const area = parseFirstNumber(blob, /(\d{2,4})\s*m²/);
  if (filters.areaMin != null && area != null && area < filters.areaMin) return false;
  if (filters.areaMax != null && area != null && area > filters.areaMax) return false;

  const energy = blob.match(/energimærke\s*([A-G])/i)?.[1]?.toUpperCase();
  if (filters.energyLabels.length && energy && !filters.energyLabels.includes(energy)) return false;

  const city = filters.city?.trim().toLowerCase();
  if (city && !`${item.city ?? ""} ${blob}`.toLowerCase().includes(city)) return false;

  const zip = filters.zipCode?.replace(/\D/g, "");
  if (zip && zip.length === 4 && item.zip !== zip && !blob.includes(zip) && item.zip !== zip) {
    return false;
  }

  return true;
}

export function filterSocialListings(listings: SocialListing[], filters: SearchFilters): SocialListing[] {
  return listings.filter((item) => socialMatchesFilters(item, filters));
}

const IG_POST_CODE_RE = /instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i;

/** Shortcode from a scraped Instagram post/reel URL, or null for profile/explore/other. */
export function instagramPostCode(url: string): string | null {
  return url.match(IG_POST_CODE_RE)?.[1] ?? null;
}

/**
 * URL opened when tapping "Åbn på …" for a social listing.
 * Instagram `/reel/{code}/` deep-links often land on the Reels feed (neighbouring
 * clip); map to the post permalink `/p/{code}/` derived from the stored scrape URL.
 * TikTok and other platforms keep their stored URL unchanged.
 */
export function openedSocialUrl(item: SocialListing): string {
  if (item.platform === "instagram") {
    const code = instagramPostCode(item.url);
    if (code) return `https://www.instagram.com/p/${code}/`;
  }
  return item.url;
}

export function videoEmbedUrl(item: SocialListing): string | null {
  if (item.platform === "instagram") {
    const code = instagramPostCode(item.url);
    // Prefer /p/ embed so the iframe matches the opened deep-link shortcode.
    return code ? `https://www.instagram.com/p/${code}/embed` : null;
  }
  if (item.platform === "tiktok") {
    const id = item.url.match(/\/video\/(\d+)/)?.[1];
    return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
  }
  return null;
}

export function localVideoListings(municipality: string): SocialListing[] {
  const file = snapshot as { municipality?: string; listings?: Array<Partial<SocialListing> & { id: string }> };
  if (file.municipality && file.municipality !== municipality) return [];
  return (file.listings ?? [])
    .map((row) => {
      const platform = (row.platform ?? "instagram") as SocialPlatform;
      const item: SocialListing = {
        id: row.id,
        platform,
        title: row.title ?? "Opslag",
        text: row.text ?? "",
        url: row.url ?? "",
        price: row.price ?? null,
        city: row.city ?? null,
        zip: row.zip ?? null,
        street: row.street ?? null,
        image: row.image ?? null,
        video: row.video ?? null,
        author: row.author ?? null,
        kind: isVideoPlatform(platform) || row.kind === "video" ? "video" : "photo",
        postedAt: row.postedAt ?? null,
      };
      return item;
    })
    .filter(isPlayableVideo);
}

export function withLocalVideos(result: SocialListenResult, filters: SearchFilters): SocialListenResult {
  const local = localVideoListings(filters.municipality).filter((item) => socialMatchesFilters(item, filters));
  const filtered = filterSocialListings(result.listings, filters);
  const seen = new Set<string>();
  for (const item of filtered) {
    seen.add(item.id);
    seen.add(item.url);
  }
  const extra = local.filter((item) => !seen.has(item.id) && !seen.has(item.url));
  const listings = extra.length ? [...extra, ...filtered] : filtered;
  const sources = Array.from(
    new Set([
      ...(listings.some((item) => item.platform === "instagram") ? ["Instagram"] : []),
      ...(listings.some((item) => item.platform === "tiktok") ? ["TikTok"] : []),
      ...result.sources,
    ]),
  );
  return { ...result, listings, sources };
}
