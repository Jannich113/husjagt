export type RangeBound = { min: number; max: number; step: number };

export const PRICE_BOUND: RangeBound = { min: 0, max: 15_000_000, step: 50_000 };
export const AREA_BOUND: RangeBound = { min: 0, max: 400, step: 5 };
export const ROOM_BOUND: RangeBound = { min: 0, max: 10, step: 1 };
export const LOT_BOUND: RangeBound = { min: 0, max: 3_000, step: 25 };
export const YEAR_BOUND: RangeBound = { min: 1850, max: new Date().getFullYear(), step: 1 };
export const EXPENSE_BOUND: RangeBound = { min: 0, max: 15_000, step: 100 };
export const M2_PRICE_BOUND: RangeBound = { min: 0, max: 50_000, step: 500 };
export const DAYS_BOUND: RangeBound = { min: 0, max: 365, step: 1 };

export function parseDaInt(raw: string): number | null {
  const compact = raw.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", "");
  if (!compact) return null;
  if (!/^\d+$/.test(compact)) return null;
  const n = Number(compact);
  return Number.isFinite(n) ? n : null;
}

export function formatDaInt(value: number): string {
  return new Intl.NumberFormat("da-DK").format(Math.round(value));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function snap(value: number, bound: RangeBound): number {
  const snapped = bound.min + Math.round((value - bound.min) / bound.step) * bound.step;
  return clamp(snapped, bound.min, bound.max);
}

export function sliderFromFilter(
  value: number | null | undefined,
  mode: "min" | "max",
  bound: RangeBound,
): number {
  if (value == null) return mode === "min" ? bound.min : bound.max;
  return clamp(value, bound.min, bound.max);
}

export function filterFromSlider(value: number, mode: "min" | "max", bound: RangeBound): number | null {
  if (mode === "min") return value <= bound.min ? null : value;
  return value >= bound.max ? null : value;
}

export function clampPair(
  minValue: number,
  maxValue: number,
  changed: "min" | "max",
): { min: number; max: number } {
  if (changed === "min" && minValue > maxValue) return { min: minValue, max: minValue };
  if (changed === "max" && maxValue < minValue) return { min: maxValue, max: maxValue };
  return { min: minValue, max: maxValue };
}
