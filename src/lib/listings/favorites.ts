import { create } from "zustand";
import type { Listing } from "./types";

const KEY = "husjagt-favorites";

type FavState = {
  ids: string[];
  items: Record<string, Listing>;
  ready: boolean;
  hydrate: () => void;
  toggle: (listing: Listing) => void;
  has: (id: string) => boolean;
};

function readStorage(): Pick<FavState, "ids" | "items"> {
  if (typeof window === "undefined") return { ids: [], items: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ids: [], items: {} };
    const parsed = JSON.parse(raw) as { ids?: string[]; items?: Record<string, Listing> };
    return { ids: parsed.ids ?? [], items: parsed.items ?? {} };
  } catch {
    return { ids: [], items: {} };
  }
}

function writeStorage(ids: string[], items: Record<string, Listing>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ ids, items }));
}

export const useFavorites = create<FavState>((set, get) => ({
  ids: [],
  items: {},
  ready: false,
  has: (id) => get().ids.includes(id),
  hydrate: () => {
    if (get().ready) return;
    const stored = readStorage();
    set({ ...stored, ready: true });
  },
  toggle: (listing) => {
    const state = get();
    if (state.ids.includes(listing.id)) {
      const { [listing.id]: _, ...rest } = state.items;
      const ids = state.ids.filter((id) => id !== listing.id);
      writeStorage(ids, rest);
      set({ ids, items: rest, ready: true });
      return;
    }
    const ids = [listing.id, ...state.ids];
    const items = { ...state.items, [listing.id]: listing };
    writeStorage(ids, items);
    set({ ids, items, ready: true });
  },
}));
