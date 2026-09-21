import type { ReactNode } from "react";

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className="h-11 min-w-11 rounded-full border border-border bg-surface px-3.5 text-sm text-muted data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-fg"
    >
      {children}
    </button>
  );
}
