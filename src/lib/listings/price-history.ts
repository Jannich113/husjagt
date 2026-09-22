export type PricePoint = {
  at: string;
  price: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function when(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return null;
}

function pointFrom(row: unknown): PricePoint | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const price = num(rec.price ?? rec.priceCash ?? rec.amount ?? rec.value);
  const at = when(rec.date ?? rec.at ?? rec.changedAt ?? rec.registered ?? rec.time ?? rec.from);
  if (price == null || price <= 0 || !at) return null;
  return { at, price };
}

export function parsePriceHistory(raw: unknown): PricePoint[] {
  const rec = asRecord(raw);
  if (!rec) return [];
  const buckets = [rec.priceHistory, rec.priceDevelopment, rec.historicalPrices, rec.priceChanges, rec.reductions];
  const out: PricePoint[] = [];
  const seen = new Set<string>();
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    for (const row of bucket) {
      const point = pointFrom(row);
      if (!point) continue;
      const key = `${point.at}|${point.price}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(point);
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export function priceHistoryLabel(change: number | null, points: PricePoint[]): string | null {
  if (points.length >= 2) return null;
  if (change == null || Math.abs(change) < 0.05) return "Boligsiden giver ikke en prisserie — kun den aktuelle pris.";
  const pct = `${change > 0 ? "+" : ""}${Math.round(change)}%`;
  return `Seneste ændring ${pct}. Ingen fuld prishistorik fra Boligsiden.`;
}
