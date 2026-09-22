import { EyeOff, Heart, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { EnergyBadge } from "@/components/listings/energy-badge";
import { ListingPhoto } from "@/components/listings/listing-photo";
import { useFavorites } from "@/lib/listings/favorites";
import { useHidden } from "@/lib/listings/hidden";
import { formatDays, formatKr, formatM2, formatRooms, sourceLabel, typeLabel } from "@/lib/listings/format";
import { freshnessLabel, listingFreshness, useFirstSeen } from "@/lib/listings/fresh";
import { matchedKeywords, useKeywords } from "@/lib/listings/keywords";
import { moduleOn } from "@/lib/hunt/modules";
import { useSeen } from "@/lib/listings/seen";
import type { Listing } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

function NewBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full bg-good font-medium text-primary-fg",
        compact ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      )}
      title="Ikke åbnet endnu"
    >
      Ny
    </span>
  );
}

function FreshBadge({ kind, compact = false }: { kind: "today" | "week"; compact?: boolean }) {
  const label = freshnessLabel(kind, compact);
  return (
    <span
      className={cn(
        "rounded-full bg-warn font-medium text-primary-fg",
        compact ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      )}
      title={kind === "today" ? "Kom på markedet i dag" : "Kom på markedet inden for 7 dage"}
    >
      {label}
    </span>
  );
}

function LikedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-heart-ring bg-heart text-primary-fg",
        compact ? "size-6" : "size-8",
      )}
      title="Gemt"
      aria-label="Gemt"
    >
      <Heart className={cn("fill-current", compact ? "size-3" : "size-4")} aria-hidden />
    </span>
  );
}

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
  const hidden = useHidden((s) => s.ids.includes(listing.id));
  const hide = useHidden((s) => s.hide);
  const unhide = useHidden((s) => s.unhide);
  const unseen = useSeen((s) => s.ready && !s.ids.includes(listing.id));
  const firstSeenAt = useFirstSeen((s) => s.seenAt[listing.id]);
  const fresh = listingFreshness(listing, firstSeenAt);
  const unread = unseen && !fresh;
  const drop = listing.priceChange != null && listing.priceChange < -0.5;
  const keywordWords = useKeywords((s) => s.words);
  const keywordHits = moduleOn("keywords") ? matchedKeywords(listing, keywordWords) : [];

  if (layout === "row") {
    return (
      <article
        className={cn(
          "overflow-hidden rounded-lg border bg-surface",
          selected ? "border-primary" : fresh ? "border-warn" : "border-border",
        )}
      >
        <div className="flex gap-3 p-2">
          <button type="button" onClick={() => onOpen(listing)} className="flex min-w-0 flex-1 gap-3 text-left">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-sunken">
              <ListingPhoto
                src={listing.image}
                alt={listing.imageAlt ?? listing.street}
                className="size-full object-cover"
                placeholder="Foto"
              />
              {fresh ? (
                <span className="absolute left-1 top-1">
                  <FreshBadge kind={fresh} compact />
                </span>
              ) : unread ? (
                <span className="absolute left-1 top-1">
                  <NewBadge compact />
                </span>
              ) : null}
              {saved ? (
                <span className="absolute right-1 top-1">
                  <LikedBadge compact />
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="font-display text-lg font-medium tabular-nums tracking-tight">{formatKr(listing.price)}</p>
              <p className="truncate text-sm font-medium">{listing.street}</p>
              <p className="truncate text-xs text-muted">
                {listing.zip} {listing.city} · {formatM2(listing.area)}
                {listing.source !== "boligsiden" ? ` · ${sourceLabel(listing)}` : ""}
              </p>
              {keywordHits.length ? (
                <p className="mt-1 flex flex-wrap gap-1">
                  {keywordHits.slice(0, 3).map((word) => (
                    <MetaPill key={word}>{word}</MetaPill>
                  ))}
                </p>
              ) : null}
            </div>
          </button>
          <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-label={saved ? "Fjern fra gemte" : "Gem bolig"}
            onClick={() => toggle(listing)}
            className={cn(
              "mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-border",
              saved ? "bg-heart text-primary-fg" : "bg-surface text-muted",
            )}
          >
            <Heart className={cn("size-5", saved && "fill-current")} />
          </button>
          {moduleOn("dismiss") ? (
            <button
              type="button"
              aria-label={hidden ? "Gendan bolig" : "Skjul bolig"}
              onClick={() => (hidden ? unhide(listing.id) : hide(listing.id))}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border border-border",
                hidden ? "bg-sunken text-fg" : "bg-surface text-muted",
              )}
            >
              <EyeOff className="size-5" />
            </button>
          ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-surface shadow-card",
        selected ? "border-primary" : fresh ? "border-warn" : "border-border",
      )}
    >
      <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative h-48 bg-sunken sm:h-52">
          <ListingPhoto
            src={listing.image}
            alt={listing.imageAlt ?? listing.street}
            className="size-full object-cover"
          />
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {fresh ? <FreshBadge kind={fresh} /> : unread ? <NewBadge /> : null}
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
          {saved ? (
            <span className="absolute right-3 top-3">
              <LikedBadge />
            </span>
          ) : null}
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
          {keywordHits.length ? (
            <p className="mt-2 flex flex-wrap gap-1">
              {keywordHits.slice(0, 4).map((word) => (
                <MetaPill key={word}>{word}</MetaPill>
              ))}
            </p>
          ) : null}
        </button>
        <button
          type="button"
          aria-label={saved ? "Fjern fra gemte" : "Gem bolig"}
          onClick={() => toggle(listing)}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border border-border",
            saved ? "bg-heart text-primary-fg" : "bg-surface text-muted",
          )}
        >
          <Heart className={cn("size-5", saved && "fill-current")} />
        </button>
        {moduleOn("dismiss") ? (
          <button
            type="button"
            aria-label={hidden ? "Gendan bolig" : "Skjul bolig"}
            onClick={() => (hidden ? unhide(listing.id) : hide(listing.id))}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full border border-border",
              hidden ? "bg-sunken text-fg" : "bg-surface text-muted",
            )}
          >
            <EyeOff className="size-5" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-sunken px-2 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}
