import type { ReactNode } from "react";

export function ViewTab({
  active,
  href,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  href?: string;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  const className =
    "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm " +
    (active ? "bg-primary text-primary-fg" : "text-muted");
  if (!href) {
    return (
      <button type="button" onClick={onClick} className={className} aria-current={active ? "page" : undefined}>
        {icon}
        {label}
      </button>
    );
  }
  return (
    <a
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        onClick();
      }}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {icon}
      {label}
    </a>
  );
}
