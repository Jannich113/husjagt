import { create } from "zustand";
import type { Listing } from "./types";

export const PREFERENCE_KEY = "husjagt-preference";
export const SIMILAR_TAG_MIN = 40;

export type PreferenceState = {
  listing: Listing | null;
  ready: boolean;
  hydrate: () => void;
  setListing: (listing: Listing) => void;
  clear: () => void;
};

function relDelta(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return Math.abs(a - b) / Math.abs(b);
}

/** 0–100. Hard hunt filters stay outside — only rank inside the current result set. */
export function similarScore(listing: Listing, pref: Listing): number {
  if (listing.id === pref.id) return 100;
  let score = 0;
  if (listing.type && listing.type === pref.type) score += 28;

  const price = relDelta(listing.price, pref.price);
  if (price != null) {
    if (price <= 0.1) score += 22;
    else if (price <= 0.2) score += 16;
    else if (price <= 0.35) score += 8;
  }

  if (listing.rooms != null && pref.rooms != null) {
    const d = Math.abs(listing.rooms - pref.rooms);
    if (d === 0) score += 16;
    else if (d === 1) score += 8;
  }

  const area = relDelta(listing.area, pref.area);
  if (area != null) {
    if (area <= 0.1) score += 16;
    else if (area <= 0.25) score += 8;
  }

  const zipA = String(listing.zip ?? "").replace(/\D/g, "");
  const zipB = String(pref.zip ?? "").replace(/\D/g, "");
  if (zipA && zipA === zipB) score += 10;
  else if (listing.city && pref.city && listing.city.toLocaleLowerCase("da") === pref.city.toLocaleLowerCase("da")) {
    score += 6;
  }

  const eA = listing.energy?.trim().toUpperCase()[0];
  const eB = pref.energy?.trim().toUpperCase()[0];
  if (eA && eA === eB) score += 8;

  return score;
}

export function isSimilarListing(listing: Listing, pref: Listing | null, min = SIMILAR_TAG_MIN): boolean {
  if (!pref || listing.id === pref.id) return false;
  return similarScore(listing, pref) >= min;
}

export function rankBySimilarity(listings: Listing[], pref: Listing | null): Listing[] {
  if (!pref) return listings;
  return [...listings].sort((a, b) => {
    const d = similarScore(b, pref) - similarScore(a, pref);
    if (d) return d;
    return (a.street || "").localeCompare(b.street || "", "da");
  });
}

function readStorage(): Listing | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFERENCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Listing;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(listing: Listing | null) {
  if (typeof window === "undefined") return;
  if (!listing) {
    window.localStorage.removeItem(PREFERENCE_KEY);
    return;
  }
  window.localStorage.setItem(PREFERENCE_KEY, JSON.stringify(listing));
}

export const usePreference = create<PreferenceState>((set, get) => ({
  listing: null,
  ready: false,
  hydrate: () => {
    if (get().ready) return;
    set({ listing: readStorage(), ready: true });
  },
  setListing: (listing) => {
    writeStorage(listing);
    set({ listing, ready: true });
  },
  clear: () => {
    writeStorage(null);
    set({ listing: null, ready: true });
  },
}));
