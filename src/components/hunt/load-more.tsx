import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadMore({
  shown,
  total,
  hasMore,
  busy,
  onMore,
}: {
  shown: number;
  total: number;
  hasMore: boolean;
  busy: boolean;
  onMore: () => void;
}) {
  if (!hasMore && shown >= total) return null;
  return (
    <div className="mt-3 space-y-2 pb-4 text-center">
      <p className="text-xs tabular-nums text-muted">
        Viser {shown}
        {total > shown ? ` af ${total}` : ""} boliger
      </p>
      {hasMore ? (
        <Button variant="outline" className="w-full" disabled={busy} onClick={onMore}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Indlæs flere
        </Button>
      ) : null}
    </div>
  );
}
