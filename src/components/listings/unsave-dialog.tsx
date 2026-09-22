import { useState } from "react";
import { createPortal } from "react-dom";
import { needsUnsaveConfirm } from "@/lib/listings/favorite-action";
import { useFavorites } from "@/lib/listings/favorites";
import type { Listing } from "@/lib/listings/types";

export function useFavoriteAction(listing: Listing) {
  const saved = useFavorites((s) => s.ids.includes(listing.id));
  const note = useFavorites((s) => s.notes[listing.id]);
  const toggle = useFavorites((s) => s.toggle);
  const [ask, setAsk] = useState(false);

  function onToggle() {
    if (needsUnsaveConfirm(saved, note)) setAsk(true);
    else toggle(listing);
  }

  return {
    saved,
    note,
    ask,
    onToggle,
    confirm: () => {
      toggle(listing);
      setAsk(false);
    },
    cancel: () => setAsk(false),
  };
}

export function UnsaveDialog({
  street,
  note,
  onCancel,
  onConfirm,
}: {
  street: string;
  note: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-fg/40 p-4 sm:items-center" role="presentation" onClick={onCancel}>
      <div
        role="dialog"
        aria-labelledby="unsave-title"
        aria-describedby="unsave-body"
        className="w-full max-w-sm rounded-2xl border border-border bg-bg p-5 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="unsave-title" className="font-display text-xl">
          Fjern fra gemte?
        </h2>
        <p id="unsave-body" className="mt-2 text-sm text-muted">
          {street} har en note. Den slettes, hvis du fjerner boligen.
        </p>
        <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-sm">{note}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-border bg-surface px-4 text-sm font-medium"
          >
            Behold
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-full bg-heart px-4 text-sm font-medium text-primary-fg"
          >
            Fjern og slet note
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
