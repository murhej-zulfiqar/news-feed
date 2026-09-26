"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { useAnnounce } from "@/lib/store/AnnouncerContext";

export function StarterFeedsButton({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const { loadStarterFeeds } = useFeedStore();
  const announce = useAnnounce();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        await loadStarterFeeds();
        announce("Starter feeds loaded.");
        setLoading(false);
      }}
      disabled={loading}
      className={`focus-ring flex items-center gap-2 rounded-(--radius-md) px-4 py-2 text-sm font-medium disabled:opacity-60 ${
        variant === "primary"
          ? "bg-(--color-accent) text-white hover:bg-(--color-accent-hover)"
          : "border border-(--color-border) hover:bg-(--color-bg-tertiary)"
      }`}
    >
      <Sparkles size={16} aria-hidden="true" className={loading ? "animate-spin" : undefined} />
      {loading ? "Loading curated feeds…" : "Load 19 curated feeds"}
    </button>
  );
}
