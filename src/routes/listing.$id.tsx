import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HouseDetail } from "@/components/listings/house-detail";
import { getListing } from "@/lib/listings/search";
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
