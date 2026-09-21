import { ExternalLink, Play } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { formatKr } from "@/lib/listings/format";
import {
  isPlayableVideo,
  openedSocialUrl,
  platformLabel,
  type SocialListing,
} from "@/lib/listings/social";
import { externalLinkProps } from "@/lib/pwa/outbound";
import { cn } from "@/lib/utils";

export function VideoRail({
  listings,
  onOpenAll,
  onSelect,
}: {
  listings: SocialListing[];
  onOpenAll: () => void;
  onSelect: (id: string) => void;
}) {
  const playable = listings.filter(isPlayableVideo);
  if (!playable.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Instagram & TikTok</p>
          <p className="mt-0.5 text-sm text-muted">Boliger i videoformat</p>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="h-11 shrink-0 rounded-full px-3 text-sm font-medium text-primary"
        >
          Se alle
        </button>
      </div>
      <ReelPills listings={playable} onSelect={onSelect} />
    </section>
  );
}

export function ReelFeed({
  listings,
  startId,
}: {
  listings: SocialListing[];
  startId?: string | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startId) return;
    const node = rootRef.current?.querySelector(`#reel-${CSS.escape(startId)}`);
    node?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [startId, listings]);

  if (!listings.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Video</p>
          <p className="mt-0.5 text-sm text-muted">Hver reel for sig — tryk for at åbne den</p>
        </div>
        <p className="text-xs tabular-nums text-faint">{listings.length}</p>
      </div>
      <ReelPills listings={listings} activeId={startId} rootRef={rootRef} />
    </section>
  );
}

function ReelPills({
  listings,
  activeId,
  onSelect,
  rootRef,
}: {
  listings: SocialListing[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  rootRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={rootRef} className="flex flex-wrap gap-2" aria-label="Reels">
      {listings.map((listing) => (
        <ReelPill
          key={listing.id}
          listing={listing}
          active={listing.id === activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function ReelPill({
  listing,
  active,
  onSelect,
}: {
  listing: SocialListing;
  active?: boolean;
  onSelect?: (id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const place = listing.street || listing.city || listing.title;
  const price = listing.price != null ? formatKr(listing.price) : null;

  useEffect(() => {
    const node = rootRef.current;
    const el = videoRef.current;
    if (!node || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.45 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [listing.video]);

  const className = cn(
    "relative w-[9.25rem] shrink-0 overflow-hidden rounded-[1.85rem] text-left shadow-card ring-2",
    active ? "ring-primary" : "ring-transparent hover:ring-border",
  );

  const inner = (
    <>
      <span className="relative block aspect-[9/16] bg-sunken">
        {listing.video ? (
          <video
            ref={videoRef}
            src={listing.video}
            poster={listing.image ?? undefined}
            className="absolute inset-0 size-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : listing.image ? (
          <img src={listing.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-fg text-primary-fg">
            <Play className="ml-px size-7 fill-current" />
          </span>
        )}
      </span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg via-fg/75 to-transparent px-2.5 pb-2.5 pt-10 text-primary-fg">
        <span className="block text-[10px] font-medium uppercase tracking-wider text-primary-fg/70">
          {platformLabel(listing.platform)}
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium leading-tight">{place}</span>
        {price ? <span className="mt-0.5 block truncate text-[11px] tabular-nums text-primary-fg/80">{price}</span> : null}
      </span>
      {!onSelect ? (
        <ExternalLink className="absolute right-2 top-2 size-3.5 text-primary-fg/85" />
      ) : (
        <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-fg/50 text-primary-fg">
          <Play className="ml-px size-3 fill-current" />
        </span>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button
        id={`reel-${listing.id}`}
        ref={rootRef as RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => onSelect(listing.id)}
        className={className}
      >
        {inner}
      </button>
    );
  }

  return (
    <a
      id={`reel-${listing.id}`}
      ref={rootRef as RefObject<HTMLAnchorElement>}
      {...externalLinkProps(openedSocialUrl(listing))}
      className={className}
    >
      {inner}
    </a>
  );
}
