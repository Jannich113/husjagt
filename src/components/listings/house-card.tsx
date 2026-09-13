import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { EnergyBadge } from "@/components/listings/energy-badge";
import { useFavorites } from "@/lib/listings/favorites";
import { formatDays, formatKr, formatM2, formatRooms, sourceLabel, typeLabel } from "@/lib/listings/format";
import type { Listing } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

export function HouseCard({
  listing,
  onOpen,
  selected = false,
  layout = "card",
}: {
  listing: Listing;
  onOpen: (listing: Listing) => void;
  selected?: boolean;
  layout?: "card" | "row";
}) {
  const saved = useFavorites((s) => s.ids.includes(listing.id));
  const toggle = useFavorites((s) => s.toggle);
  const drop = listing.priceChange != null && listing.priceChange < -0.5;
  const [broken, setBroken] = useState(false);
  const photo = listing.image && !broken;

  if (layout === "row") {
    return (
      <article
        className={cn(
          "overflow-hidden rounded-lg border bg-surface",
          selected ? "border-primary" : "border-border",
        )}
      >
        <div className="flex gap-3 p-2">
          <button type="button" onClick={() => onOpen(listing)} className="flex min-w-0 flex-1 gap-3 text-left">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-sunken">
              {photo ? (
                <img
                  src={listing.image ?? undefined}
                  alt={listing.imageAlt ?? listing.street}
                  className="size-full object-cover"
                  loading="lazy"
                  onError={() => setBroken(true)}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted">Foto</div>
              )}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="font-display text-lg font-medium tabular-nums tracking-tight">{formatKr(listing.price)}</p>
              <p className="truncate text-sm font-medium">{listing.street}</p>
              <p className="truncate text-xs text-muted">
                {listing.zip} {listing.city} · {formatM2(listing.area)}
                {listing.source !== "boligsiden" ? ` · ${sourceLabel(listing)}` : ""}
              </p>
            </div>
          </button>
          <button
            type="button"
            aria-label={saved ? "Fjern fra gemte" : "Gem bolig"}
            onClick={() => toggle(listing)}
            className={cn(
              "mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-border",
              saved ? "bg-primary text-primary-fg" : "bg-surface text-muted",
            )}
          >
            <Heart className={cn("size-5", saved && "fill-current")} />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-surface shadow-card",
        selected ? "border-primary" : "border-border",
      )}
    >
      <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative h-48 bg-sunken sm:h-52">
          {photo ? (
            <img
              src={listing.image ?? undefined}
              alt={listing.imageAlt ?? listing.street}
              className="size-full object-cover"
              loading="lazy"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted">
              Intet foto
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span className="rounded-full bg-fg/80 px-2.5 py-1 text-xs font-medium text-primary-fg">
              {typeLabel(listing.type)}
            </span>
            {listing.source !== "boligsiden" ? (
              <span className="rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-fg">
                {sourceLabel(listing)}
              </span>
            ) : null}
            {drop ? (
              <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-medium text-primary-fg">
                {Math.round(listing.priceChange ?? 0)}%
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <div className="flex items-start justify-between gap-3 p-4">
        <button type="button" onClick={() => onOpen(listing)} className="min-w-0 flex-1 text-left">
          <p className="font-display text-xl font-medium tabular-nums tracking-tight">
            {formatKr(listing.price)}
          </p>
          <p className="mt-1 truncate text-sm font-medium">{listing.street}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {listing.zip} {listing.city}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{formatM2(listing.area)}</span>
            <span>{formatRooms(listing.rooms)}</span>
            {listing.lot ? <span>Grund {formatM2(listing.lot)}</span> : null}
            <EnergyBadge label={listing.energy} />
          </div>
          <p className="mt-2 text-xs text-faint">
            {sourceLabel(listing)}
            {listing.days != null ? ` · ${formatDays(listing.days)} på markedet` : ""}
          </p>
        </button>
        <button
          type="button"
          aria-label={saved ? "Fjern fra gemte" : "Gem bolig"}
          onClick={() => toggle(listing)}
          className={cn(
            "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-border",
            saved ? "bg-primary text-primary-fg" : "bg-surface text-muted",
          )}
        >
          <Heart className={cn("size-5", saved && "fill-current")} />
        </button>
      </div>
    </article>
  );
}
