import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-(--radius-lg) border border-dashed border-(--color-border) px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-(--radius-full) bg-(--color-accent-subtle) text-(--color-accent)">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-(--color-text-primary)">{title}</h2>
      <p className="max-w-sm text-sm text-(--color-text-secondary)">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
