import { useState } from "react";
import { ReelFeed } from "@/components/listings/reel-feed";
import { SocialCard } from "@/components/listings/social-card";
import { SocialWatchEditor } from "@/components/listings/social-watch";
import { moduleOn } from "@/lib/hunt/modules";
import { isPlayableVideo, isVideoPost, listenCountDetail, type SocialListenResult } from "@/lib/listings/social";
import { EmptyState } from "./empty-state";
import { ViewTab } from "./view-tab";

type ListenTab = "all" | "video" | "posts";

export function ListenAllButton({
  showAll,
  matched,
  found,
  onToggle,
}: {
  showAll: boolean;
  matched: number;
  found: number;
  onToggle: () => void;
}) {
  if (found <= matched) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg"
    >
      {showAll ? `Kun matcher (${matched})` : `Vis alle ${found}`}
    </button>
  );
}

export function ListenView({
  kommuneName,
  result,
  matched,
  found,
  showAll,
  onShowAll,
  startId,
}: {
  kommuneName: string;
  result: SocialListenResult;
  matched: number;
  found: number;
  showAll: boolean;
  onShowAll: () => void;
  startId?: string | null;
}) {
  const [tab, setTab] = useState<ListenTab>("all");
  const playable = result.listings.filter(isPlayableVideo);
  const linkedVideos = result.listings.filter((item) => isVideoPost(item) && !item.video);
  const posts = result.listings.filter((item) => !isVideoPost(item));
  const editor = moduleOn("socialWatch") ? <SocialWatchEditor className="mb-5" /> : null;
  const inArea = Math.max(found, result.listings.length);
  const countLine = listenCountDetail(matched, inArea, kommuneName);
  const allToggle = (
    <ListenAllButton showAll={showAll} matched={matched} found={inArea} onToggle={onShowAll} />
  );

  if (!result.listings.length) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6">
        {editor}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="text-sm leading-relaxed text-muted">{countLine}</p>
          {allToggle}
        </div>
        <EmptyState saved={false} listen flush filteredOut={inArea > 0} onShowAll={inArea > 0 ? onShowAll : undefined} found={inArea} />
      </div>
    );
  }

  const showVideo = tab !== "posts" && (playable.length > 0 || linkedVideos.length > 0);
  const showPosts = tab !== "video" && posts.length > 0;
  const videoCount = playable.length + linkedVideos.length;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6">
      {editor}
      <div className="mb-4 flex max-w-2xl flex-wrap items-center gap-2">
        <p className="text-sm leading-relaxed text-muted">
          {countLine} Fulgte konti tjekkes altid. Tags plus {kommuneName} finder flere Instagram- og TikTok-opslag, sammen
          med GulogGratis, DBA og selvsalg.
        </p>
        {allToggle}
      </div>
      <div className="mb-5 flex overflow-x-auto rounded-full border border-border bg-surface p-1">
        <ViewTab active={tab === "all"} onClick={() => setTab("all")} icon={null} label="Alle" />
        <ViewTab active={tab === "video"} onClick={() => setTab("video")} icon={null} label={`Video ${videoCount}`} />
        <ViewTab active={tab === "posts"} onClick={() => setTab("posts")} icon={null} label={`Opslag ${posts.length}`} />
      </div>
      {showVideo ? <ReelFeed listings={[...playable, ...linkedVideos]} startId={startId} /> : null}
      {showPosts ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((listing) => (
            <SocialCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
      {tab === "video" && !playable.length && !linkedVideos.length ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center text-sm text-muted">
          Ingen Instagram- eller TikTok-videoer i den valgte kommune endnu.
        </p>
      ) : null}
    </div>
  );
}
