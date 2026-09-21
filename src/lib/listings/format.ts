import { PROPERTY_TYPES, type SearchFilters } from "./types";

const num = new Intl.NumberFormat("da-DK");

export function formatKr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "Pris uoplyst";
  return `${num.format(Math.round(value))} kr`;
}

export function formatMio(value: number | null | undefined): string {
  if (value == null) return "Ingen grænse";
  if (value >= 1_000_000) {
    const mio = value / 1_000_000;
    const pretty = mio % 1 === 0 ? mio.toFixed(0) : mio.toFixed(1).replace(".", ",");
    return `${pretty} mio. kr`;
  }
  return formatKr(value);
}

export function formatM2(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${num.format(value)} m²`;
}

export function formatRooms(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${num.format(value)} vær.`;
}

export function formatDays(value: number | null | undefined): string {
  if (value == null) return "Ny";
  if (value <= 1) return "1 dag";
  return `${num.format(value)} dage`;
}

export function typeLabel(id: string): string {
  return PROPERTY_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function listingPageSlug(slug: string): string {
  return slug
    .trim()
    .replace(/-\d{8}_{2,}.*$/, "")
    .replace(/_+$/g, "");
}

export function boligsidenUrl(slug: string): string {
  const path = listingPageSlug(slug);
  return `https://www.boligsiden.dk/adresse/${path}`;
}

export function agencyChain(name: string | null): string {
  if (!name) return "Ukendt mægler";
  const lower = name.toLowerCase();
  if (lower.includes("privat") || lower.includes("selvsalg")) return "Privat selvsalg";
  if (lower.startsWith("home")) return "home";
  if (lower.startsWith("nybolig")) return "Nybolig";
  if (lower.startsWith("danbolig")) return "danbolig";
  if (lower.startsWith("edc")) return "EDC";
  if (lower.startsWith("estate")) return "Estate";
  if (lower.startsWith("lokalbolig")) return "LokalBolig";
  if (lower.startsWith("realmæglerne") || lower.startsWith("realmaeglerne")) {
    return "Realmæglerne";
  }
  return name.split(/[–-]/)[0]?.trim() || name;
}

export function sourceLabel(listing: { source: string; agency: string | null }): string {
  switch (listing.source) {
    case "boliga":
      return listing.agency?.toLowerCase().includes("privat") ? "Privat selvsalg" : listing.agency || "Boliga";
    case "guloggratis":
      return "GulogGratis";
    case "dba":
      return "DBA";
    case "facebook":
      return "Marketplace";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    default:
      return agencyChain(listing.agency);
  }
}

export function extraFilterLabels(filters: SearchFilters): string[] {
  const labels: string[] = [];
  if (filters.priceMin != null) labels.push(`min ${formatMio(filters.priceMin)}`);
  if (filters.roomsMin != null) labels.push(`${filters.roomsMin}+ vær.`);
  if (filters.roomsMax != null) labels.push(`maks. ${filters.roomsMax} vær.`);
  if (filters.areaMin != null) labels.push(`${filters.areaMin}+ m²`);
  if (filters.areaMax != null) labels.push(`maks. ${filters.areaMax} m²`);
  if (filters.lotMin != null) labels.push(`grund ${filters.lotMin}+ m²`);
  if (filters.lotMax != null) labels.push(`grund maks. ${filters.lotMax} m²`);
  if (filters.energyLabels.length) labels.push(`energi ${filters.energyLabels.join("/")}`);
  if (filters.yearFrom != null) labels.push(`efter ${filters.yearFrom}`);
  if (filters.yearTo != null) labels.push(`før ${filters.yearTo}`);
  if (filters.expenseMax != null) labels.push(`ejerudgift maks. ${num.format(filters.expenseMax)} kr`);
  if (filters.m2PriceMax != null) labels.push(`maks. ${num.format(filters.m2PriceMax)} kr/m²`);
  if (filters.daysMax != null) labels.push(`maks. ${filters.daysMax} dage`);
  if (filters.freshOnly) labels.push("kun nye");
  if (filters.zipCode) labels.push(filters.zipCode);
  if (filters.city) labels.push(filters.city);
  if (filters.basement) labels.push("kælder");
  if (filters.balcony) labels.push("altan");
  if (filters.terrace) labels.push("terrasse");
  if (filters.elevator) labels.push("elevator");
  if (filters.priceDropOnly) labels.push("prisfald");
  if (filters.districts?.length) {
    labels.push(filters.districts.length === 1 ? "1 bydel" : `${filters.districts.length} bydele`);
  }
  if (filters.boxes?.length) {
    labels.push(filters.boxes.length === 1 ? "1 kortudsnit" : `${filters.boxes.length} kortudsnit`);
  }
  return labels;
}
