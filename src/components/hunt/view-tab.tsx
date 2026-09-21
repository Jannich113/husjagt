import type { ReactNode } from "react";

export function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm " +
        (active ? "bg-primary text-primary-fg" : "text-muted")
      }
    >
      {icon}
      {label}
    </button>
  );
}
