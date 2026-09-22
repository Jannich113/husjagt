import { formatKr } from "@/lib/listings/format";
import { priceHistoryLabel, type PricePoint } from "@/lib/listings/price-history";

export function PriceHistory({
  change,
  points,
}: {
  change: number | null;
  points: PricePoint[];
}) {
  const fallback = priceHistoryLabel(change, points);
  const max = Math.max(...points.map((row) => row.price), 1);
  const min = Math.min(...points.map((row) => row.price), max);
  const span = Math.max(max - min, 1);

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-muted">Pris</p>
      {points.length >= 2 ? (
        <>
          <svg viewBox="0 0 100 36" className="mt-3 h-20 w-full text-primary" preserveAspectRatio="none" aria-hidden>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              points={points
                .map((row, index) => {
                  const x = (index / (points.length - 1)) * 100;
                  const y = 32 - ((row.price - min) / span) * 28;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
          <ol className="mt-3 space-y-1.5 text-sm">
            {points.map((row) => (
              <li key={`${row.at}-${row.price}`} className="flex justify-between gap-3 tabular-nums">
                <span className="text-muted">{row.at.slice(0, 10)}</span>
                <span>{formatKr(row.price)}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {change != null && Math.abs(change) >= 0.5 ? (
            <span className="font-medium text-fg">{change > 0 ? "+" : ""}{Math.round(change)}% </span>
          ) : null}
          {fallback}
        </p>
      )}
    </section>
  );
}
