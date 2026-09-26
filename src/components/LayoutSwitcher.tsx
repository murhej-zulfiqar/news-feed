"use client";

import { LayoutGrid, List, Rows3 } from "lucide-react";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import type { LayoutMode } from "@/lib/types";

const OPTIONS: { value: LayoutMode; label: string; icon: typeof List }[] = [
  { value: "compact", label: "Compact list", icon: Rows3 },
  { value: "standard", label: "Standard list", icon: List },
  { value: "cards", label: "Card grid", icon: LayoutGrid },
];

export function LayoutSwitcher() {
  const { preferences, setLayout } = useFeedStore();
  return (
    <div role="group" aria-label="Layout" className="flex items-center gap-0.5 rounded-(--radius-md) border border-(--color-border) p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setLayout(value)}
          aria-pressed={preferences.layout === value}
          title={label}
          className={`focus-ring rounded-(--radius-sm) p-1.5 ${
            preferences.layout === value
              ? "bg-(--color-accent-subtle) text-(--color-accent)"
              : "text-(--color-text-tertiary) hover:text-(--color-text-primary)"
          }`}
        >
          <Icon size={16} aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
