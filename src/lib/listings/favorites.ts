import { create } from "zustand";
import type { Listing } from "./types";

const KEY = "husjagt-favorites";

type FavState = {
  ids: string[];
  items: Record<string, Listing>;
  notes: Record<string, string>;
  ready: boolean;
  hydrate: () => void;
  toggle: (listing: Listing) => void;
  has: (id: string) => boolean;
  setNote: (id: string, text: string) => void;
};

function canStore(): boolean {
  return typeof globalThis.localStorage?.getItem === "function";
}

function readStorage(): Pick<FavState, "ids" | "items" | "notes"> {
  if (!canStore()) return { ids: [], items: {}, notes: {} };
  try {
    const raw = globalThis.localStorage.getItem(KEY);
    if (!raw) return { ids: [], items: {}, notes: {} };
    const parsed = JSON.parse(raw) as { ids?: string[]; items?: Record<string, Listing>; notes?: Record<string, string> };
    return { ids: parsed.ids ?? [], items: parsed.items ?? {}, notes: parsed.notes ?? {} };
  } catch {
    return { ids: [], items: {}, notes: {} };
  }
}

function writeStorage(ids: string[], items: Record<string, Listing>, notes: Record<string, string>) {
  if (!canStore()) return;
  globalThis.localStorage.setItem(KEY, JSON.stringify({ ids, items, notes }));
}

export const useFavorites = create<FavState>((set, get) => ({
  ids: [],
  items: {},
  notes: {},
  ready: false,
  has: (id) => get().ids.includes(id),
  hydrate: () => {
    if (get().ready) return;
    const stored = readStorage();
    set({ ...stored, ready: true });
  },
  setNote: (id, text) => {
    const state = get();
    const next = text.trim();
    const notes = { ...state.notes };
    if (!next) delete notes[id];
    else notes[id] = next.slice(0, 280);
    writeStorage(state.ids, state.items, notes);
    set({ notes, ready: true });
  },
  toggle: (listing) => {
    const state = get();
    if (state.ids.includes(listing.id)) {
      const { [listing.id]: _, ...rest } = state.items;
      const { [listing.id]: _note, ...notes } = state.notes;
      const ids = state.ids.filter((id) => id !== listing.id);
      writeStorage(ids, rest, notes);
      set({ ids, items: rest, notes, ready: true });
      return;
    }
    const ids = [listing.id, ...state.ids];
    const items = { ...state.items, [listing.id]: listing };
    writeStorage(ids, items, state.notes);
    set({ ids, items, ready: true });
  },
}));
