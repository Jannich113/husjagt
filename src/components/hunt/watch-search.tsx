import { Bell } from "lucide-react";
import { useKonto } from "@/lib/account/use-konto";
import { moduleOn } from "@/lib/hunt/modules";
import { placeLabel } from "@/lib/listings/place";
import {
  searchFingerprint,
  useSearchAlerts,
} from "@/lib/listings/search-alerts";
import type { SearchFilters } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

export function WatchSearchButton({
  filters,
  ids,
  onOpenWatched,
}: {
  filters: SearchFilters;
  ids: string[];
  onOpenWatched: () => void;
}) {
  const enabled = useSearchAlerts((s) => s.enabled);
  const watched = useSearchAlerts((s) => s.filters);
  const newCount = useSearchAlerts((s) => s.newIds.length);
  const watch = useSearchAlerts((s) => s.watch);
  const unwatch = useSearchAlerts((s) => s.unwatch);
  const clearNew = useSearchAlerts((s) => s.clearNew);
  const notify = useSearchAlerts((s) => s.notify);
  const setNotify = useSearchAlerts((s) => s.setNotify);
  const { signedIn, requireKonto } = useKonto();
  if (!moduleOn("searchAlerts")) return null;

  const same = Boolean(watched && searchFingerprint(watched) === searchFingerprint(filters));
  const label = !enabled ? "Overvåg" : same ? "Overvåger" : "Anden søgning";

  async function enablePush() {
    if (typeof Notification === "undefined") return;
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setNotify(permission === "granted");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!signedIn) {
            requireKonto("overvaag");
            return;
          }
          if (!enabled) {
            watch(filters, ids);
            void enablePush();
            return;
          }
          if (same) {
            unwatch();
            return;
          }
          onOpenWatched();
        }}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
          enabled && same ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg",
        )}
        title={
          enabled && watched
            ? `Overvåger ${placeLabel(watched)}`
            : "Få besked når nye boliger matcher filtrene"
        }
      >
        <Bell className="size-3.5" />
        {label}
      </button>
      {newCount > 0 ? (
        <button
          type="button"
          onClick={() => {
            if (!same) onOpenWatched();
            else clearNew();
          }}
          className="h-8 rounded-full bg-warn px-3 text-xs font-medium text-primary-fg"
        >
          {newCount} nye
        </button>
      ) : null}
      {enabled && same && typeof Notification !== "undefined" && !notify ? (
        <button type="button" onClick={() => void enablePush()} className="h-8 text-xs text-muted">
          Notifikationer
        </button>
      ) : null}
    </div>
  );
}
