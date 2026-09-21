import snapshot from "./social-snapshot.json";

import { ALLOTMENT_TYPE, isKolonihaveText, KOLONIHAVE_RE, type SearchFilters } from "./types";

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
  all?: SocialListing[];
  found: number;
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

const DWELLING_RE =
  /andelsbolig|andelslejlighed|villa|rækkehus|raekkehus|parcelhus|ejerlejlighed|villalejlighed|(?<![a-zæøå])lejlighed|sommerhus|fritidshus|kolonihave(?:hus)?|byhus|helårshus|helarshus|hus til salg|bolig til salg/i;

const LISTEN_SKIP_RE =
  /\b(søges|soeges|købes|koebes|udlejes|tilleje|til leje|dukkehus|modelhus|barbie|souvenir|platte|camping(?:vogn)?|autocamper|båd|jolle|trailer|anhænger|personbil|varebil|motorcykel|knallert|cykel|møbler|sofa|drivhus|redskabsskur|havehus|container|byggegrund|grundstykke|erhvervslokale|lager|kontor|butik|maskine)\b/i;

export function listingBlob(item: Pick<SocialListing, "title" | "text" | "url" | "street" | "city">): string {
  return `${item.title} ${item.text} ${item.url} ${item.street ?? ""} ${item.city ?? ""}`;
}

export function looksLikeDwelling(blob: string): boolean {
  return DWELLING_RE.test(blob);
}

/** Houses/apartments only. Kolonihave stays out unless that type is selected. */
export function keepListenListing(item: SocialListing, filters: SearchFilters): boolean {
  const blob = listingBlob(item);
  if (LISTEN_SKIP_RE.test(blob)) return false;
  if (isKolonihaveText(blob) && filters.types.length && !filters.types.includes(ALLOTMENT_TYPE)) {
    return false;
  }
  if (item.platform === "boliga") return true;
  return looksLikeDwelling(blob);
}

const TYPE_HINTS: [string, RegExp][] = [
  ["cooperative", /\bandels(?:bolig|lejlighed)?\b/i],
  ["terraced house", /\brækkehus|\braekkehus/i],
  ["villa apartment", /\bvillalejlighed/i],
  ["condo", /\bejerlejlighed|(?<!andels)lejlighed\b/i],
  [ALLOTMENT_TYPE, KOLONIHAVE_RE],
  ["holiday house", /\bsommerhus|\bfritidshus/i],
  ["hobby farm", /\bhobbyejendom/i],
  ["farm", /\blandejendom|\blandbrug/i],
  ["villa", /villa|parcelhus|\bhus\b/i],
];

export function guessedPropertyType(item: SocialListing): string | null {
  const blob = `${item.title} ${item.text} ${item.street ?? ""} ${item.url}`;
  if (isKolonihaveText(blob)) return ALLOTMENT_TYPE;
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
  if (!keepListenListing(item, filters)) return false;
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

/** “3 af 11 opslag” when hunt filters hide some of what Lyt found in the area. */
export function listenCountLabel(matched: number, found: number): string {
  const inArea = Math.max(found, matched);
  if (inArea <= 0) return "0 opslag";
  if (matched === inArea) return `${matched} opslag`;
  return `${matched} af ${inArea} opslag`;
}

export function listenCountDetail(matched: number, found: number, areaName: string): string {
  const inArea = Math.max(found, matched);
  if (inArea <= 0) return `Ingen opslag i ${areaName} endnu.`;
  if (matched === inArea) return `${inArea} opslag i ${areaName}.`;
  if (matched === 0) {
    return `${inArea} opslag i ${areaName}. Ingen matcher dine filtre.`;
  }
  return `${inArea} opslag i ${areaName}. ${matched} matcher filtrene.`;
}

export function listenPool(result: SocialListenResult): SocialListing[] {
  const pool = result.all ?? [];
  return pool.length ? pool : result.listings ?? [];
}

export function displayedListenListings(result: SocialListenResult, showAll: boolean): SocialListing[] {
  return showAll ? listenPool(result) : result.listings;
}

const IG_PATH_RESERVED = new Set([
  "reel",
  "reels",
  "p",
  "stories",
  "explore",
  "accounts",
  "tv",
  "share",
  "tags",
  "tag",
  "direct",
  "live",
]);
/** `/reel/CODE`, `/reels/CODE`, `/p/CODE`, or `/{user}/reel/CODE`. */
const IG_MEDIA_RE =
  /instagram\.com\/(?:([A-Za-z0-9._]{2,30})\/)?(reel|reels|p)\/([A-Za-z0-9_-]+)/i;
const TIKTOK_VIDEO_RE = /tiktok\.com\/@([\w.]+)\/video\/(\d+)/i;

export type InstagramMedia = {
  user: string | null;
  code: string;
  reel: boolean;
};

export function instagramMedia(url: string): InstagramMedia | null {
  const match = url.match(IG_MEDIA_RE);
  const kind = match?.[2]?.toLowerCase();
  const code = match?.[3];
  if (!kind || !code) return null;
  const rawUser = match[1]?.toLowerCase() ?? null;
  const user = rawUser && !IG_PATH_RESERVED.has(rawUser) ? rawUser : null;
  return { user, code, reel: kind === "reel" || kind === "reels" };
}

/** Shortcode from a scraped Instagram post/reel URL, or null for profile/explore/other. */
export function instagramPostCode(url: string): string | null {
  return instagramMedia(url)?.code ?? null;
}

export function isInstagramReelUrl(url: string, kind?: SocialKind): boolean {
  const media = instagramMedia(url);
  if (media) return media.reel;
  return kind === "video";
}

function instagramHandle(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim().replace(/^@+/, "").toLowerCase();
  if (!value || IG_PATH_RESERVED.has(value) || !/^[a-z0-9._]{2,30}$/.test(value)) return null;
  return value;
}

/** Canonical web permalink. Reels use `/{user}/reel/{code}/` so Instagram does not open the Reels feed. */
export function instagramPermalink(item: Pick<SocialListing, "url" | "author" | "kind">): string | null {
  const media = instagramMedia(item.url);
  if (!media) return null;
  const reel = media.reel || item.kind === "video";
  const user = instagramHandle(media.user) ?? instagramHandle(item.author);
  const path = reel ? "reel" : "p";
  if (user) return `https://www.instagram.com/${user}/${path}/${media.code}/`;
  return `https://www.instagram.com/${path}/${media.code}/`;
}

export function tiktokVideoParts(url: string): { author: string; id: string } | null {
  const match = url.match(TIKTOK_VIDEO_RE);
  if (!match?.[1] || !match[2]) return null;
  return { author: match[1], id: match[2] };
}

/**
 * URL opened when tapping "Åbn på …".
 * Instagram Reels: `https://www.instagram.com/{user}/reel/{code}/` (never `/reels/` or `/p/` for videos).
 * TikTok: web-share video URL so the app does not open For You.
 */
export function openedSocialUrl(item: SocialListing): string {
  if (item.platform === "instagram") {
    return instagramPermalink(item) ?? item.url;
  }
  if (item.platform === "tiktok") {
    const parts = tiktokVideoParts(item.url);
    if (parts) {
      return `https://www.tiktok.com/@${parts.author}/video/${parts.id}?is_from_webapp=1&sender_device=pc`;
    }
  }
  return item.url;
}

export function videoEmbedUrl(item: SocialListing): string | null {
  if (item.platform === "instagram") {
    const media = instagramMedia(item.url);
    if (!media) return null;
    const path = media.reel || item.kind === "video" ? "reel" : "p";
    return `https://www.instagram.com/${path}/${media.code}/embed`;
  }
  if (item.platform === "tiktok") {
    const id = tiktokVideoParts(item.url)?.id;
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
  const local = localVideoListings(filters.municipality);
  const incoming = result.all ?? [];
  const seed = incoming.length ? incoming : result.listings ?? [];
  const seen = new Set<string>();
  const pool: SocialListing[] = [];
  for (const item of [...local, ...seed]) {
    if (!item || seen.has(item.id) || seen.has(item.url)) continue;
    seen.add(item.id);
    seen.add(item.url);
    pool.push(item);
  }
  const scoped = pool.filter((item) => keepListenListing(item, filters));
  const listings = filterSocialListings(scoped, filters);
  const sources = Array.from(
    new Set([
      ...(scoped.some((item) => item.platform === "instagram") ? ["Instagram"] : []),
      ...(scoped.some((item) => item.platform === "tiktok") ? ["TikTok"] : []),
      ...result.sources,
    ]),
  );
  return {
    ...result,
    all: scoped,
    listings,
    found: scoped.length,
    sources,
  };
}
