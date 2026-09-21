import { useEffect, useState, type ReactNode } from "react";
import {
  clampPair,
  filterFromSlider,
  formatDaInt,
  parseDaInt,
  sliderFromFilter,
  snap,
  type RangeBound,
} from "@/lib/listings/filter-range";
import { cn } from "@/lib/utils";

export function FilterSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-fg">{title}</h3>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-faint">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function NumberBox({
  label,
  value,
  emptyLabel,
  onCommit,
  suffix,
}: {
  label: string;
  value: number | null;
  emptyLabel: string;
  onCommit: (next: number | null) => void;
  suffix?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value == null ? "" : formatDaInt(value));
  useEffect(() => {
    if (!focused) setText(value == null ? "" : formatDaInt(value));
  }, [value, focused]);

  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      <span className="flex h-11 items-center rounded-lg border border-border bg-surface px-3 focus-within:border-primary">
        <input
          inputMode="numeric"
          value={focused ? text : value == null ? "" : formatDaInt(value)}
          placeholder={emptyLabel}
          onFocus={() => {
            setFocused(true);
            setText(value == null ? "" : formatDaInt(value));
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setFocused(false);
            onCommit(parseDaInt(text));
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
        />
        {suffix ? <span className="pl-2 text-xs text-muted">{suffix}</span> : null}
      </span>
    </label>
  );
}

function DualSlider({
  bound,
  lo,
  hi,
  onLo,
  onHi,
}: {
  bound: RangeBound;
  lo: number;
  hi: number;
  onLo: (next: number) => void;
  onHi: (next: number) => void;
}) {
  const span = bound.max - bound.min || 1;
  const left = ((lo - bound.min) / span) * 100;
  const right = ((hi - bound.min) / span) * 100;
  return (
    <div className="hunt-dual">
      <div className="hunt-dual-rail" />
      <div className="hunt-dual-fill" style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }} />
      <input
        type="range"
        min={bound.min}
        max={bound.max}
        step={bound.step}
        value={lo}
        aria-label="Minimum"
        onChange={(e) => onLo(Number(e.target.value))}
      />
      <input
        type="range"
        min={bound.min}
        max={bound.max}
        step={bound.step}
        value={hi}
        aria-label="Maksimum"
        onChange={(e) => onHi(Number(e.target.value))}
      />
    </div>
  );
}

export function BoundPair({
  minValue,
  maxValue,
  bound,
  onMin,
  onMax,
  minLabel = "Fra",
  maxLabel = "Til",
  emptyMin = "0",
  emptyMax = "Ingen grænse",
  suffix,
  formatMax,
}: {
  minValue: number | null;
  maxValue: number | null;
  bound: RangeBound;
  onMin: (next: number | null) => void;
  onMax: (next: number | null) => void;
  minLabel?: string;
  maxLabel?: string;
  emptyMin?: string;
  emptyMax?: string;
  suffix?: string;
  formatMax?: (value: number | null) => string;
}) {
  const lo = sliderFromFilter(minValue, "min", bound);
  const hi = sliderFromFilter(maxValue, "max", bound);
  const maxText = formatMax
    ? formatMax(maxValue)
    : maxValue == null
      ? emptyMax
      : `${formatDaInt(maxValue)}${suffix ? ` ${suffix}` : ""}`;
  const minText = minValue == null ? emptyMin : `${formatDaInt(minValue)}${suffix ? ` ${suffix}` : ""}`;

  function setLo(raw: number) {
    const next = snap(raw, bound);
    const pair = clampPair(next, hi, "min");
    onMin(filterFromSlider(pair.min, "min", bound));
    onMax(filterFromSlider(pair.max, "max", bound));
  }

  function setHi(raw: number) {
    const next = snap(raw, bound);
    const pair = clampPair(lo, next, "max");
    onMin(filterFromSlider(pair.min, "min", bound));
    onMax(filterFromSlider(pair.max, "max", bound));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm tabular-nums text-muted">
        {minText} – {maxText}
      </p>
      <DualSlider bound={bound} lo={lo} hi={hi} onLo={setLo} onHi={setHi} />
      <div className="flex gap-3">
        <NumberBox
          label={minLabel}
          value={minValue}
          emptyLabel={emptyMin}
          suffix={suffix}
          onCommit={(parsed) => {
            if (parsed == null) {
              onMin(null);
              return;
            }
            setLo(parsed);
          }}
        />
        <NumberBox
          label={maxLabel}
          value={maxValue}
          emptyLabel={emptyMax}
          suffix={suffix}
          onCommit={(parsed) => {
            if (parsed == null) {
              onMax(null);
              return;
            }
            setHi(parsed);
          }}
        />
      </div>
    </div>
  );
}

export function MaxRange({
  value,
  bound,
  onChange,
  label = "Maks.",
  emptyLabel = "Ingen grænse",
  suffix,
  format,
}: {
  value: number | null;
  bound: RangeBound;
  onChange: (next: number | null) => void;
  label?: string;
  emptyLabel?: string;
  suffix?: string;
  format?: (value: number | null) => string;
}) {
  const hi = sliderFromFilter(value, "max", bound);
  const span = bound.max - bound.min || 1;
  const width = ((hi - bound.min) / span) * 100;
  const summary = format
    ? format(value)
    : value == null
      ? emptyLabel
      : `${formatDaInt(value)}${suffix ? ` ${suffix}` : ""}`;

  return (
    <div className="space-y-3">
      <p className="text-sm tabular-nums text-muted">{summary}</p>
      <div className="hunt-dual">
        <div className="hunt-dual-rail" />
        <div className="hunt-dual-fill" style={{ left: 0, width: `${width}%` }} />
        <input
          className="hunt-single"
          type="range"
          min={bound.min}
          max={bound.max}
          step={bound.step}
          value={hi}
          aria-label={label}
          onChange={(e) => onChange(filterFromSlider(snap(Number(e.target.value), bound), "max", bound))}
        />
      </div>
      <NumberBox
        label={label}
        value={value}
        emptyLabel={emptyLabel}
        suffix={suffix}
        onCommit={(parsed) => {
          if (parsed == null) {
            onChange(null);
            return;
          }
          onChange(filterFromSlider(snap(parsed, bound), "max", bound));
        }}
      />
    </div>
  );
}

export function QuickPicks({
  values,
  active,
  onPick,
  format,
  noneLabel,
  noneActive,
  onNone,
}: {
  values: number[];
  active: number | null;
  onPick: (next: number) => void;
  format: (value: number) => string;
  noneLabel?: string;
  noneActive?: boolean;
  onNone?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {noneLabel && onNone ? (
        <button
          type="button"
          data-active={noneActive}
          onClick={onNone}
          className={cn(
            "h-11 rounded-full border border-border bg-surface px-3.5 text-sm text-muted",
            "data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-fg",
          )}
        >
          {noneLabel}
        </button>
      ) : null}
      {values.map((n) => (
        <button
          key={n}
          type="button"
          data-active={active === n}
          onClick={() => onPick(n)}
          className={cn(
            "h-11 rounded-full border border-border bg-surface px-3.5 text-sm text-muted",
            "data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-fg",
          )}
        >
          {format(n)}
        </button>
      ))}
    </div>
  );
}
