import { createFileRoute } from "@tanstack/react-router";
import { HuntApp } from "@/components/hunt";
import { searchHousesFast } from "@/lib/listings/search";
import {
  filtersFromHunt,
  huntDocumentTitle,
  huntShareCopy,
  parseHuntSearch,
  type HuntSearch,
} from "@/lib/listings/share";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HuntSearch => parseHuntSearch(search),
  loaderDeps: ({ search }: { search: HuntSearch }) => search,
  loader: ({ deps }) => searchHousesFast({ data: filtersFromHunt(deps ?? {}) }),
  head: ({ match }) => {
    const filters = filtersFromHunt(match.search);
    const share = huntShareCopy(filters);
    return {
      meta: [
        { title: huntDocumentTitle(filters) },
        { name: "description", content: share.text },
      ],
    };
  },
  component: Home,
});

function Home() {
  const hunt = Route.useSearch() ?? {};
  const initial = Route.useLoaderData();
  return <HuntApp hunt={hunt} initial={initial} />;
}
