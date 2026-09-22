import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  saved,
  listen,
  flush = false,
  filteredOut = false,
  onShowAll,
  onAdjustFilters,
  found = 0,
  liveFailed = false,
}: {
  saved: boolean;
  listen: boolean;
  flush?: boolean;
  filteredOut?: boolean;
  onShowAll?: () => void;
  onAdjustFilters?: () => void;
  found?: number;
  liveFailed?: boolean;
}) {
  return (
    <div
      className={cn(
        "my-8 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center",
        flush ? "mx-0" : "mx-4 md:mx-6",
      )}
    >
      <p className="font-display text-2xl">
        {saved
          ? "Ingen gemte boliger endnu"
          : listen
            ? filteredOut
              ? "Ingen opslag matcher filtrene"
              : "Ingen sociale opslag i området"
            : liveFailed
              ? "Kunne ikke hente boliger"
            : "Ingen boliger matcher"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        {saved
          ? "Tryk på hjertet på et hus for at lægge det her."
          : listen
            ? filteredOut
              ? "Der er opslag i området, men pris, type eller andre filtre gemmer dem. Prøv at hæve maksprisen."
              : "Lyt kigger fulgte Instagram- og TikTok-konti, dine tags, plus GulogGratis, DBA og privat selvsalg."
            : liveFailed
              ? "Søgningen i denne kommune svarede ikke. Prøv igen om et øjeblik, eller åbn filtrene."
            : "Prøv at hæve maksprisen, ryd bydele og kortudsnit, eller vælg en anden by."}
      </p>
      {!saved && (!listen || filteredOut) ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {listen && onShowAll ? <Button onClick={onShowAll}>Vis alle {found}</Button> : null}
          <Button
            variant={listen && onShowAll ? "outline" : "primary"}
            onClick={() => {
              onAdjustFilters?.();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Justér filtre
          </Button>
        </div>
      ) : null}
    </div>
  );
}
