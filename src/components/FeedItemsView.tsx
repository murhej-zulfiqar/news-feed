"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { ItemRow } from "./ItemRow";
import { ReaderPane } from "./ReaderPane";
import { LayoutSwitcher } from "./LayoutSwitcher";
import { ItemListSkeleton } from "./Skeletons";
import { useFeedStore, type MarkAllScope } from "@/lib/store/FeedStoreContext";
import { useAnnounce } from "@/lib/store/AnnouncerContext";
import type { FeedItem } from "@/lib/types";

const PAGE_SIZE = 40;

interface FeedItemsViewProps {
  heading: string;
  items: FeedItem[];
  emptyState: ReactNode;
  markAllScope?: MarkAllScope;
  headerExtra?: ReactNode;
}

export function FeedItemsView({ heading, items, emptyState, markAllScope, headerExtra }: FeedItemsViewProps) {
  const { feeds, preferences, markItemRead, markAllRead, isHydrated } = useFeedStore();
  const announce = useAnnounce();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const feedById = useMemo(() => new Map(feeds.map((f) => [f.id, f])), [feeds]);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const at = a.publishedAt ? Date.parse(a.publishedAt) : Date.parse(a.fetchedAt);
        const bt = b.publishedAt ? Date.parse(b.publishedAt) : Date.parse(b.fetchedAt);
        return bt - at;
      }),
    [items],
  );

  const visibleItems = sorted.slice(0, visibleCount);
  const selectedId = searchParams.get("item");
  const selectedIndex = selectedId ? sorted.findIndex((i) => i.id === selectedId) : -1;
  const selectedItem = selectedIndex >= 0 ? sorted[selectedIndex] : null;

  const setSelected = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("item", id);
      else params.delete("item");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const openItem = useCallback(
    (item: FeedItem) => {
      if (!item.read) markItemRead(item.id, true);
      setSelected(item.id);
    },
    [markItemRead, setSelected],
  );

  const openOriginal = useCallback(
    (item: FeedItem) => {
      if (!item.read) markItemRead(item.id, true);
      window.open(item.link, "_blank", "noopener,noreferrer");
    },
    [markItemRead],
  );

  const goRelative = useCallback(
    (delta: number) => {
      if (selectedIndex < 0) return;
      const next = sorted[selectedIndex + delta];
      if (next) openItem(next);
    },
    [selectedIndex, sorted, openItem],
  );

  if (!isHydrated) {
    return <ItemListSkeleton />;
  }

  if (sorted.length === 0) {
    return <div className="px-4 py-6 md:px-6">{emptyState}</div>;
  }

  const effectiveLayout = selectedItem ? "compact" : preferences.layout;

  return (
    <div className="flex h-full min-h-0">
      <div
        className={`flex min-h-0 min-w-0 flex-col ${
          selectedItem ? "hidden md:flex md:w-[26rem] md:shrink-0 md:border-r md:border-(--color-border)" : "flex-1"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--color-border) px-4 py-3 md:px-6">
          <h1 className="text-xl font-semibold">{heading}</h1>
          <div className="flex items-center gap-2">
            {headerExtra}
            <LayoutSwitcher />
            {markAllScope && (
              <button
                onClick={() => {
                  markAllRead(markAllScope);
                  announce(`Marked all items in ${heading} as read.`);
                }}
                className="focus-ring flex items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) px-2.5 py-1.5 text-sm text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)"
              >
                <CheckCheck size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul
            className={
              effectiveLayout === "cards"
                ? "grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:px-6 lg:grid-cols-3"
                : "flex flex-col gap-0.5 p-2 md:px-4"
            }
          >
            {visibleItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                feed={feedById.get(item.feedId)}
                layout={effectiveLayout}
                isActive={item.id === selectedId}
                onOpen={() => openItem(item)}
                onToggleRead={() => markItemRead(item.id, !item.read)}
                onOpenOriginal={() => openOriginal(item)}
              />
            ))}
          </ul>
          {visibleCount < sorted.length && (
            <div className="flex justify-center p-4">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="focus-ring rounded-(--radius-md) border border-(--color-border) px-4 py-2 text-sm font-medium hover:bg-(--color-bg-tertiary)"
              >
                Load more ({sorted.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="min-h-0 min-w-0 flex-1">
          <ReaderPane
            item={selectedItem}
            feed={feedById.get(selectedItem.feedId)}
            onClose={() => setSelected(null)}
            onNext={() => goRelative(1)}
            onPrev={() => goRelative(-1)}
            hasNext={selectedIndex >= 0 && selectedIndex < sorted.length - 1}
            hasPrev={selectedIndex > 0}
          />
        </div>
      )}
    </div>
  );
}
