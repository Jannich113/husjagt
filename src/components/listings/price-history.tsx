import { useState } from "react";
import { formatKr } from "@/lib/listings/format";
import {
  askingHistoryFromChange,
  formatChartDate,
  historySummary,
  priceChartLayout,
  type PricePoint,
} from "@/lib/listings/price-history";
import { cn } from "@/lib/utils";

export function PriceHistory({
  price,
  change,
  days,
  points,
}: {
  price: number | null;
  change: number | null;
  days: number | null;
  points: PricePoint[];
}) {
  const series = points.length ? points : askingHistoryFromChange(price, change, days);
  const layout = priceChartLayout(series);
  const summary = historySummary(series, change);
  const [active, setActive] = useState(series.length - 1);
  const selected = series[Math.max(0, Math.min(active, series.length - 1))];

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Prishistorik</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{formatKr(selected?.price ?? price)}</p>
          {summary ? <p className="mt-1 text-sm text-muted">{summary}</p> : null}
        </div>
        {selected ? (
          <p className="text-right text-xs text-muted">
            {selected.kind === "sold" ? "Solgt" : "Udbud"}
            <br />
            {formatChartDate(selected.at)}
          </p>
        ) : null}
      </div>

      {layout ? (
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="mt-3 w-full"
          role="img"
          aria-label="Prisudvikling"
        >
          {layout.ticksY.map((tick) => (
            <g key={tick.label}>
              <line
                x1={layout.pad.l}
                x2={layout.width - layout.pad.r}
                y1={tick.pos}
                y2={tick.pos}
                className="stroke-border"
                strokeWidth="1"
              />
              <text x={4} y={tick.pos + 3} className="fill-muted text-[9px]">
                {tick.label}
              </text>
            </g>
          ))}
          <path d={layout.area} className="fill-primary/15" />
          <path d={layout.line} className="fill-none stroke-primary" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          {layout.dots.map((dot, index) => (
            <g key={`${dot.at}-${dot.price}-${index}`}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={index === active ? 5.5 : 3.5}
                className={cn(dot.kind === "sold" ? "fill-warn" : "fill-primary", index === active && "stroke-bg")}
                strokeWidth={index === active ? 2 : 0}
                onPointerDown={() => setActive(index)}
              />
            </g>
          ))}
          {layout.ticksX.map((tick) => (
            <text key={`${tick.pos}-${tick.label}`} x={tick.pos} y={layout.height - 8} textAnchor="middle" className="fill-muted text-[9px]">
              {tick.label}
            </text>
          ))}
        </svg>
      ) : (
        <p className="mt-2 text-sm text-muted">{summary}</p>
      )}

      {series.length > 1 ? (
        <ol className="mt-3 divide-y divide-border text-sm">
          {[...series].reverse().map((row, index) => {
            const realIndex = series.length - 1 - index;
            return (
              <li key={`${row.at}-${row.price}-${row.kind ?? "ask"}`}>
                <button
                  type="button"
                  onClick={() => setActive(realIndex)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 py-2 text-left tabular-nums",
                    realIndex === active ? "text-fg" : "text-muted",
                  )}
                >
                  <span>
                    {formatChartDate(row.at)}
                    <span className="ml-2 text-xs">{row.kind === "sold" ? "solgt" : "udbud"}</span>
                  </span>
                  <span>{formatKr(row.price)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
