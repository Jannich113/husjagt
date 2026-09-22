export type PriceKind = "ask" | "sold";

export type PricePoint = {
  at: string;
  price: number;
  kind?: PriceKind;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function isoDay(value: Date | string | number): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    return isoDay(new Date(ms));
  }
  if (typeof value === "string" && value.trim()) {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }
  return null;
}

function when(value: unknown): string | null {
  if (value instanceof Date) return isoDay(value);
  if (typeof value === "string" || typeof value === "number") return isoDay(value);
  return null;
}

function daysAgo(days: number | null): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(0, Math.round(days ?? 0)));
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function pointFrom(row: unknown, fallbackKind?: PriceKind): PricePoint | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const price = num(rec.price ?? rec.priceCash ?? rec.amount ?? rec.value ?? rec.salePrice);
  const at = when(rec.date ?? rec.at ?? rec.changedAt ?? rec.registered ?? rec.time ?? rec.from ?? rec.soldDate);
  if (price == null || price <= 0 || !at) return null;
  const type = String(rec.type ?? rec.kind ?? fallbackKind ?? "ask").toLowerCase();
  const kind: PriceKind = type.includes("sold") || type.includes("sale") || type === "normal" ? "sold" : (fallbackKind ?? "ask");
  return { at, price, kind };
}

function arraysFrom(rec: Record<string, unknown>): unknown[] {
  const buckets: unknown[] = [];
  const push = (value: unknown) => {
    if (Array.isArray(value)) buckets.push(...value);
    const nested = asRecord(value);
    if (!nested) return;
    for (const key of ["development", "items", "history", "changes", "data", "registrations", "cases"]) {
      if (Array.isArray(nested[key])) buckets.push(...(nested[key] as unknown[]));
    }
  };
  for (const key of [
    "priceHistory",
    "priceDevelopment",
    "historicalPrices",
    "priceChanges",
    "reductions",
    "registrations",
    "saleHistory",
    "sales",
  ]) {
    push(rec[key]);
  }
  return buckets;
}

export function uniquePoints(points: PricePoint[]): PricePoint[] {
  const seen = new Set<string>();
  const out: PricePoint[] = [];
  for (const point of points) {
    const key = `${point.at}|${point.price}|${point.kind ?? "ask"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(point);
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.price - b.price);
}

export function parsePriceHistory(raw: unknown, fallbackKind?: PriceKind): PricePoint[] {
  const rec = asRecord(raw);
  if (!rec) return [];
  return uniquePoints(arraysFrom(rec).map((row) => pointFrom(row, fallbackKind)).filter((row): row is PricePoint => Boolean(row)));
}

export function askingHistoryFromChange(
  price: number | null,
  change: number | null,
  days: number | null,
): PricePoint[] {
  if (price == null || price <= 0) return [];
  const now = { at: today(), price, kind: "ask" as const };
  if (change == null || Math.abs(change) < 0.5) return [now];
  const original = Math.round(price / (1 + change / 100));
  if (!Number.isFinite(original) || original <= 0 || original === price) return [now];
  return uniquePoints([
    { at: daysAgo(days), price: original, kind: "ask" },
    now,
  ]);
}

export function mergeHistory(...groups: Array<PricePoint[] | undefined>): PricePoint[] {
  return uniquePoints(groups.flatMap((group) => group ?? []));
}

export function priceHistoryLabel(change: number | null, points: PricePoint[]): string | null {
  if (points.length >= 2) return null;
  if (change == null || Math.abs(change) < 0.05) return "Boligsiden giver ikke en prisserie — kun den aktuelle pris.";
  const pct = `${change > 0 ? "+" : ""}${Math.round(change)}%`;
  return `Seneste ændring ${pct}. Ingen fuld prishistorik fra Boligsiden.`;
}

export function historySummary(points: PricePoint[], change?: number | null): string | null {
  const asks = points.filter((row) => row.kind !== "sold");
  const series = asks.length >= 2 ? asks : points;
  if (series.length < 2) return priceHistoryLabel(change ?? null, points);
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const delta = last.price - first.price;
  const pct = first.price ? (delta / first.price) * 100 : 0;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${Math.round(pct)}% siden ${formatChartDate(first.at)}`;
}

const daDate = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" });
const daShort = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short" });

export function formatChartDate(iso: string, withYear = true): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return (withYear ? daDate : daShort).format(t).replace(".", "");
}

export function formatAxisKr(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const mio = value / 1_000_000;
    const pretty = mio >= 10 ? mio.toFixed(0) : mio.toFixed(1).replace(".", ",");
    return `${pretty} mio`;
  }
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)} t`;
  return String(Math.round(value));
}

export type ChartDot = PricePoint & { x: number; y: number };
export type ChartTick = { pos: number; label: string };

export type PriceChartLayout = {
  width: number;
  height: number;
  pad: { l: number; r: number; t: number; b: number };
  dots: ChartDot[];
  line: string;
  area: string;
  ticksY: ChartTick[];
  ticksX: ChartTick[];
  min: number;
  max: number;
};

export function priceChartLayout(points: PricePoint[], width = 320, height = 168): PriceChartLayout | null {
  if (points.length < 1) return null;
  const pad = { l: 46, r: 14, t: 18, b: 30 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const times = points.map((row) => Date.parse(row.at) || 0);
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = Math.max(tMax - tMin, 1);
  const prices = points.map((row) => row.price);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const padY = Math.max((pMax - pMin) * 0.12, pMax * 0.02, 1);
  const min = Math.max(0, pMin - padY);
  const max = pMax + padY;
  const span = Math.max(max - min, 1);
  const xAt = (time: number, index: number) =>
    pad.l + (tMax === tMin ? (points.length === 1 ? 0.5 : index / Math.max(points.length - 1, 1)) : (time - tMin) / tSpan) * innerW;
  const yAt = (price: number) => pad.t + (1 - (price - min) / span) * innerH;
  const dots: ChartDot[] = points.map((row, index) => ({
    ...row,
    x: xAt(times[index]!, index),
    y: yAt(row.price),
  }));
  const line = dots.map((dot, index) => `${index === 0 ? "M" : "L"}${dot.x.toFixed(1)} ${dot.y.toFixed(1)}`).join(" ");
  const last = dots[dots.length - 1]!;
  const first = dots[0]!;
  const area = `${line} L${last.x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} L${first.x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`;
  const ticksY: ChartTick[] = [min, (min + max) / 2, max].map((value) => ({
    pos: yAt(value),
    label: formatAxisKr(value),
  }));
  const ticksX: ChartTick[] =
    dots.length === 1
      ? [{ pos: first.x, label: formatChartDate(first.at, false) }]
      : [
          { pos: first.x, label: formatChartDate(first.at, false) },
          { pos: last.x, label: formatChartDate(last.at, false) },
        ];
  return { width, height, pad, dots, line, area, ticksY, ticksX, min, max };
}
