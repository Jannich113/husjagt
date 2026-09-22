import { useEffect, useState } from "react";
import { useKonto } from "@/lib/account/use-konto";
import { moduleOn } from "@/lib/hunt/modules";
import { useFavorites } from "@/lib/listings/favorites";

export function SavedNote({ id, saved }: { id: string; saved: boolean }) {
  const stored = useFavorites((s) => s.notes[id] ?? "");
  const setNote = useFavorites((s) => s.setNote);
  const [draft, setDraft] = useState(stored);
  const { signedIn, requireKonto } = useKonto();

  useEffect(() => {
    setDraft(stored);
  }, [stored, id]);

  if (!moduleOn("notes") || !saved) return null;

  if (!signedIn) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface px-3 py-3">
        <p className="text-xs uppercase tracking-wider text-muted">Note</p>
        <p className="mt-1 text-sm text-muted">Noter gemmes kun, hvis du har en konto.</p>
        <button
          type="button"
          onClick={() => requireKonto("notes")}
          className="mt-2 h-10 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg"
        >
          Opret konto
        </button>
      </div>
    );
  }

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
