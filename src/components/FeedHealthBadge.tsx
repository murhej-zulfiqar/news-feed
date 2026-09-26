import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { FeedStatus } from "@/lib/types";

const CONFIG: Record<FeedStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-(--color-success)" },
  stale: { label: "Stale", icon: Clock, className: "text-(--color-warning)" },
  error: { label: "Error", icon: AlertCircle, className: "text-(--color-error)" },
  pending: { label: "Loading", icon: Loader2, className: "text-(--color-text-tertiary)" },
};

export function FeedHealthBadge({
  status,
  detail,
  size = 16,
}: {
  status: FeedStatus;
  detail?: string;
  size?: number;
}) {
  const { label, icon: Icon, className } = CONFIG[status];
  const description = detail ? `${label} — ${detail}` : label;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={description}>
      <Icon size={size} aria-hidden="true" className={status === "pending" ? "animate-spin" : undefined} />
      <span className="sr-only">Feed status: {description}</span>
    </span>
  );
}
