import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Noget gik galt. Prøv igen.";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-fg">
      <TriangleAlert className="size-10 text-danger" aria-hidden="true" />
      <h1 className="font-display text-2xl">Kunne ikke vise siden</h1>
      <p className="max-w-md text-sm text-muted">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-fg"
        >
          Prøv igen
        </button>
        <a
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-border bg-surface px-5 text-sm font-medium"
        >
          Til forsiden
        </a>
      </div>
    </main>
  );
}
