import { ArrowLeft, ExternalLink, Heart, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EnergyBadge } from "@/components/listings/energy-badge";
import { HighlightText } from "@/components/listings/highlight-text";
import { PhotoGallery } from "@/components/listings/photo-gallery";
import { ListingPhoto } from "@/components/listings/listing-photo";
import { ShareButton } from "@/components/listings/share-button";
import { Button } from "@/components/ui/button";
import { moduleOn } from "@/lib/hunt/modules";
import { useFavorites } from "@/lib/listings/favorites";
import { freshnessLabel, listingFreshness, useFirstSeen } from "@/lib/listings/fresh";
import {
  agencyChain,
  boligsidenUrl,
  formatDays,
  formatKr,
  formatM2,
  formatRooms,
  typeLabel,
} from "@/lib/listings/format";
import { matchedKeywords, useKeywords } from "@/lib/listings/keywords";
import { listingShareCopy } from "@/lib/listings/share";
import { getListing } from "@/lib/listings/search";
import { externalLinkProps } from "@/lib/pwa/outbound";
import type { Listing, ListingDetail } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

type House = Listing & Partial<ListingDetail>;

function listingPhotos(listing: House): string[] {
  const urls = listing.images?.filter(Boolean) ?? [];
  const cover = listing.image;
  if (cover && !urls.includes(cover)) return [cover, ...urls];
  return urls.length ? urls : cover ? [cover] : [];
}

export function HouseDetail({
  listing,
  onBack,
  embedded = false,
}: {
  listing: House;
  onBack: () => void;
  embedded?: boolean;
}) {
  const saved = useFavorites((s) => s.ids.includes(listing.id));
  const toggle = useFavorites((s) => s.toggle);
  const firstSeenAt = useFirstSeen((s) => s.seenAt[listing.id]);
  const fresh = listingFreshness(listing, firstSeenAt);
  const freshText = freshnessLabel(fresh);
  const share = useMemo(() => listingShareCopy(listing), [listing]);
  const href = listing.caseUrl || boligsidenUrl(listing.slugAddress || listing.slug);
  const seed = useMemo(() => listingPhotos(listing), [listing]);
  const [photos, setPhotos] = useState(seed);
  const keywordWords = useKeywords((s) => s.words);
  const keywordHits = moduleOn("keywords") ? matchedKeywords(listing, keywordWords) : [];

  useEffect(() => {
    setPhotos(seed);
  }, [seed]);

  useEffect(() => {
    if (!moduleOn("photoGallery")) return;
    if ((listing.images?.length ?? 0) >= 2) return;
    let alive = true;
    void getListing({ data: { id: listing.id } })
      .then((detail) => {
        if (!alive || !detail) return;
        const next = listingPhotos(detail);
        if (next.length) setPhotos(next);
      })
      .catch(() => {
        /* cover stays */
      });
    return () => {
      alive = false;
    };
  }, [listing.id, listing.images?.length]);

  return (
    <main className={cn("mx-auto bg-bg pb-16", embedded ? "max-w-none" : "min-h-dvh max-w-3xl")}>
      <div className="sticky top-0 z-20 flex items-center justify-between bg-bg/95 px-3 py-2 backdrop-blur">
        {embedded ? (
          <p className="flex items-center gap-2 px-2 text-sm text-muted">
            <span>{typeLabel(listing.type)}</span>
            {freshText ? (
              <span className="rounded-full bg-warn px-2.5 py-0.5 text-xs font-medium text-primary-fg">{freshText}</span>
            ) : null}
          </p>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="flex size-11 items-center justify-center rounded-full hover:bg-sunken"
            aria-label="Tilbage"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <ShareButton
            title={share.title}
            text={share.text}
            url={share.url}
            iconOnly
            className="size-11 px-0"
          />
          <button
            type="button"
            onClick={() => toggle(listing)}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border border-border",
              saved ? "bg-heart text-primary-fg" : "bg-surface text-muted",
            )}
            aria-label={saved ? "Fjern fra gemte" : "Gem bolig"}
          >
            <Heart className={cn("size-5", saved && "fill-current")} />
          </button>
        </div>
      </div>

      {moduleOn("photoGallery") ? (
        <PhotoGallery urls={photos} alt={listing.imageAlt ?? listing.street} />
      ) : (
        <div className="h-64 w-full bg-sunken sm:h-80">
          <ListingPhoto
            src={photos[0] ?? listing.image}
            alt={listing.imageAlt ?? listing.street}
            className="h-64 w-full object-cover sm:h-80"
          />
        </div>
      )}

      <div className="px-5 pt-5">
        {embedded ? null : (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{typeLabel(listing.type)}</span>
            {freshText ? (
              <span className="rounded-full bg-warn px-2.5 py-0.5 text-xs font-medium text-primary-fg">{freshText}</span>
            ) : null}
          </p>
        )}
        <h1 className={cn("font-display text-3xl tabular-nums", embedded ? "mt-0" : "mt-1")}>{formatKr(listing.price)}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-base">
          <MapPin className="size-4 text-muted" />
          {listing.street}
        </p>
        <p className="text-muted">
          {listing.zip} {listing.city}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Bolig" value={formatM2(listing.area)} />
          <Stat label="Værelser" value={formatRooms(listing.rooms)} />
          <Stat label="Grund" value={listing.lot ? formatM2(listing.lot) : "—"} />
          <Stat label="Byggeår" value={listing.year ? String(listing.year) : "—"} />
          <Stat label="Ejerudgift" value={listing.expense ? `${formatKr(listing.expense)}/md` : "—"} />
          <Stat label="m²-pris" value={listing.m2price ? formatKr(listing.m2price) : "—"} />
          <Stat label="Liggetid" value={formatDays(listing.days)} />
          <div className="rounded-lg border border-border bg-surface px-3 py-3">
            <dt className="text-xs uppercase tracking-wider text-muted">Energi</dt>
            <dd className="mt-1">
              <EnergyBadge label={listing.energy} />
            </dd>
          </div>
        </dl>

        {keywordHits.length ? (
          <p className="mt-3 flex flex-wrap gap-1.5">
            {keywordHits.map((word) => (
              <span key={word} className="rounded-full border border-border bg-sunken px-2.5 py-1 text-xs font-medium">
                {word}
              </span>
            ))}
          </p>
        ) : null}

        {listing.descriptionTitle || listing.descriptionBody ? (
          <section className="mt-8">
            {listing.descriptionTitle ? (
              <h2 className="font-display text-2xl">
                <HighlightText text={listing.descriptionTitle} words={keywordWords} />
              </h2>
            ) : null}
            {listing.descriptionBody ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                <HighlightText text={listing.descriptionBody} words={keywordWords} />
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-8 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Mægler</p>
          <p className="mt-1 text-lg font-medium">{listing.agency ?? "Ukendt"}</p>
          <p className="text-sm text-muted">{agencyChain(listing.agency)} · via Boligsiden</p>
        </section>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <a {...externalLinkProps(href)}>
              Se original opslag
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <ShareButton title={share.title} text={share.text} url={share.url} label="Del bolig" />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
