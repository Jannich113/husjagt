import { AtSign, ChevronDown, Hash, Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_ACCOUNTS,
  MAX_TAGS,
  SUGGESTED_ACCOUNTS,
  DEFAULT_TAGS,
  useSocialWatch,
  type WatchAddResult,
} from "@/lib/listings/social-watch";
import { cn } from "@/lib/utils";

function errorCopy(kind: "account" | "tag", reason: "invalid" | "full"): string {
  if (reason === "full") {
    return kind === "account" ? `Du kan højst følge ${MAX_ACCOUNTS} konti.` : `Du kan højst bruge ${MAX_TAGS} tags.`;
  }
  return kind === "account"
    ? "Brug et profilnavn som nyboligodense — uden mellemrum."
    : "Tags er ét ord, fx bolig eller tilsalg.";
}

function summaryLine(accounts: string[], tags: string[]): string {
  const accountPart = accounts.length ? `${accounts.length} ${accounts.length === 1 ? "konto" : "konti"}` : "ingen konti";
  const tagPart = tags.length ? tags.slice(0, 4).map((tag) => `#${tag}`).join(" ") : "ingen tags";
  return `${accountPart} · ${tagPart}`;
}

export function SocialWatchEditor({
  className,
  collapsible = false,
}: {
  className?: string;
  collapsible?: boolean;
}) {
  const hydrate = useSocialWatch((s) => s.hydrate);
  const accounts = useSocialWatch((s) => s.accounts);
  const tags = useSocialWatch((s) => s.tags);
  const addAccount = useSocialWatch((s) => s.addAccount);
  const removeAccount = useSocialWatch((s) => s.removeAccount);
  const addTag = useSocialWatch((s) => s.addTag);
  const removeTag = useSocialWatch((s) => s.removeTag);
  const resetTags = useSocialWatch((s) => s.resetTags);
  const [open, setOpen] = useState(!collapsible);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <section
      className={cn("rounded-xl border border-border bg-surface p-4 shadow-card", className)}
      aria-label="Lyt-kilder"
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 w-full items-center gap-3 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-fg">Konti og tags</p>
            <p className="mt-0.5 truncate text-sm text-muted">{summaryLine(accounts, tags)}</p>
          </div>
          <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform", open && "rotate-180")} />
        </button>
      ) : (
        <div className="mb-4">
          <p className="font-display text-xl text-fg">Konti og tags</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Fulgte profiler tjekkes altid for huse. Tags styrer jagten efter andre Instagram- og TikTok-opslag i
            kommunen.
          </p>
        </div>
      )}
      {open ? (
        <div className={cn(collapsible && "mt-4 border-t border-border pt-4")}>
          {collapsible ? (
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Fulgte profiler tjekkes altid. Tags finder flere opslag i den valgte kommune.
            </p>
          ) : null}
          <WatchList
            kind="account"
            title="Konti"
            hint="Instagram og TikTok — samme brugernavn på begge."
            prefix="@"
            placeholder="nyboligodense"
            items={accounts}
            suggestions={SUGGESTED_ACCOUNTS.filter((row) => !accounts.includes(row))}
            onAdd={addAccount}
            onRemove={removeAccount}
          />
          <div className="mt-5 border-t border-border pt-5">
            <WatchList
              kind="tag"
              title="Tags"
              hint="Kommunenavnet (#odense, …) lægges på automatisk."
              prefix="#"
              placeholder="bolig"
              items={tags}
              suggestions={DEFAULT_TAGS.filter((row) => !tags.includes(row))}
              onAdd={addTag}
              onRemove={removeTag}
              emptyAction={
                tags.length === 0 ? (
                  <button
                    type="button"
                    onClick={resetTags}
                    className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Gendan #bolig #salg #tilsalg
                  </button>
                ) : null
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function WatchList({
  kind,
  title,
  hint,
  prefix,
  placeholder,
  items,
  suggestions,
  onAdd,
  onRemove,
  emptyAction,
}: {
  kind: "account" | "tag";
  title: string;
  hint: string;
  prefix: string;
  placeholder: string;
  items: string[];
  suggestions: readonly string[];
  onAdd: (raw: string) => WatchAddResult;
  onRemove: (item: string) => void;
  emptyAction?: ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const Icon = kind === "account" ? AtSign : Hash;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const result = onAdd(draft);
    if (!result.ok) {
      setError(errorCopy(kind, result.reason));
      return;
    }
    setDraft("");
    setError(null);
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 text-sm text-faint">{hint}</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{kind === "account" ? "Tilføj konto" : "Tilføj tag"}</span>
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
            placeholder={placeholder}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 w-full rounded-lg border border-border bg-bg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <Button type="submit" size="sm" className="h-11 shrink-0 px-4">
          <Plus className="size-4" />
          Tilføj
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {items.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item}>
              <span className="inline-flex h-11 items-center gap-1 rounded-full border border-border bg-bg pl-3.5 text-sm">
                {prefix}
                {item}
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="flex size-11 items-center justify-center rounded-full text-muted hover:text-fg"
                  aria-label={`Fjern ${prefix}${item}`}
                >
                  <X className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          {kind === "account" ? "Ingen fulgte konti endnu." : "Ingen tags — Lyt søger kun på kommunenavnet."}
        </p>
      )}
      {emptyAction}
      {suggestions.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-faint">Prøv</span>
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onAdd(item)}
              className="h-11 rounded-full border border-dashed border-border-strong bg-bg px-3.5 text-sm text-muted hover:border-primary hover:text-fg"
            >
              {prefix}
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}