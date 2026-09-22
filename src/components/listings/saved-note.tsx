import { useEffect, useState } from "react";
import { moduleOn } from "@/lib/hunt/modules";
import { useFavorites } from "@/lib/listings/favorites";

export function SavedNote({ id, saved }: { id: string; saved: boolean }) {
  const stored = useFavorites((s) => s.notes[id] ?? "");
  const setNote = useFavorites((s) => s.setNote);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    setDraft(stored);
  }, [stored, id]);

  if (!moduleOn("notes") || !saved) return null;

  return (
    <label className="mt-6 block">
      <span className="text-xs uppercase tracking-wider text-muted">Note</span>
      <textarea
        value={draft}
        maxLength={280}
        rows={3}
        placeholder="Visning, for mørkt, ring til mægler…"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => setNote(id, draft)}
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
