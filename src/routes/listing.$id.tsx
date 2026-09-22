import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HouseDetail } from "@/components/listings/house-detail";
import { useFirstSeen } from "@/lib/listings/fresh";
import { useHidden } from "@/lib/listings/hidden";
import { getListing } from "@/lib/listings/search";
import { useSeen } from "@/lib/listings/seen";
import { listingShareCopy, recalledHunt } from "@/lib/listings/share";

export const Route = createFileRoute("/listing/$id")({
  loader: ({ params }) => getListing({ data: { id: params.id } }),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Boligen blev ikke fundet · Husjagt" }] };
    }
    const share = listingShareCopy(loaderData);
    return {
      meta: [
        { title: `${share.title} · Husjagt` },
        { name: "description", content: share.description },
      ],
    };
  },
  component: ListingPage,
});

function ListingPage() {
  const listing = Route.useLoaderData();
  const navigate = useNavigate();
  const hydrateSeen = useSeen((s) => s.hydrate);
  const hydrateHidden = useHidden((s) => s.hydrate);
  const markSeen = useSeen((s) => s.mark);
  const hydrateFirstSeen = useFirstSeen((s) => s.hydrate);
  const rememberFirstSeen = useFirstSeen((s) => s.remember);

  useEffect(() => {
    hydrateSeen();
    hydrateHidden();
    hydrateFirstSeen();
    if (listing?.id) markSeen(listing.id);
    if (listing?.id && listing.days == null) rememberFirstSeen([listing.id]);
  }, [hydrateSeen, hydrateHidden, hydrateFirstSeen, rememberFirstSeen, markSeen, listing?.id, listing?.days]);

  function goBack() {
    void navigate({ to: "/", search: recalledHunt() });
  }

  if (!listing) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="font-display text-3xl">Boligen blev ikke fundet</h1>
        <button
          type="button"
          onClick={goBack}
          className="mt-6 inline-flex text-sm text-primary underline"
        >
          Tilbage til listen
        </button>
      </main>
    );
  }

  return <HouseDetail listing={listing} onBack={goBack} />;
}
