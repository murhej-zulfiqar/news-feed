"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCheck, Sparkles } from "lucide-react";
import { ItemRow } from "@/components/ItemRow";
import { ReaderPane } from "@/components/ReaderPane";
import { EmptyState } from "@/components/EmptyState";
import { ItemListSkeleton } from "@/components/Skeletons";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { useAnnounce } from "@/lib/store/AnnouncerContext";
import { buildDigest } from "@/lib/digest";
import { formatRelativeTime } from "@/lib/format";
import type { FeedItem } from "@/lib/types";

function DigestContent() {
  const { feeds, categories, items, preferences, markDigestViewed, markItemRead, isHydrated } = useFeedStore();
  const announce = useAnnounce();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const feedById = useMemo(() => new Map(feeds.map((f) => [f.id, f])), [feeds]);
  const groups = useMemo(
    () => buildDigest(feeds, categories, items, preferences.lastDigestViewedAt),
    [feeds, categories, items, preferences.lastDigestViewedAt],
  );
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const selectedId = searchParams.get("item");
  const selectedIndex = selectedId ? flatItems.findIndex((i) => i.id === selectedId) : -1;
  const selectedItem = selectedIndex >= 0 ? flatItems[selectedIndex] : null;

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

  const goRelative = useCallback(
    (delta: number) => {
      if (selectedIndex < 0) return;
      const next = flatItems[selectedIndex + delta];
      if (next) openItem(next);
    },
    [selectedIndex, flatItems, openItem],
  );

  if (!isHydrated) return <ItemListSkeleton />;

  const totalNew = flatItems.length;

  return (
    <div className="flex h-full min-h-0">
      <div
        className={`flex min-h-0 min-w-0 flex-col ${
          selectedItem ? "hidden md:flex md:w-[26rem] md:shrink-0 md:border-r md:border-(--color-border)" : "flex-1"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-(--color-border) px-4 py-3 md:px-6">
          <div>
            <h1 className="text-xl font-semibold">Digest</h1>
            <p className="text-xs text-(--color-text-tertiary)">
              {totalNew === 0
                ? "You're all caught up"
                : `${totalNew} new item${totalNew === 1 ? "" : "s"}${
                    preferences.lastDigestViewedAt
                      ? ` since ${formatRelativeTime(preferences.lastDigestViewedAt)}`
                      : " in the last 24 hours"
                  }`}
            </p>
          </div>
          {totalNew > 0 && (
            <button
              onClick={() => {
                flatItems.forEach((i) => markItemRead(i.id, true));
                markDigestViewed();
                announce("Digest cleared.");
              }}
              className="focus-ring flex items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) px-2.5 py-1.5 text-sm text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)"
            >
              <CheckCheck size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Clear digest</span>
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-6">
          {totalNew === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Nothing new to report"
              description="Check back after your feeds refresh, or browse All Items to catch up on older content."
            />
          ) : (
            groups.map((group) => (
              <section key={group.categoryId} className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
                    {group.categoryName}
                  </h2>
                  {group.totalCount > group.items.length && (
                    <Link
                      href={`/app/category/${group.categoryId}`}
                      className="focus-ring text-xs text-(--color-accent) hover:underline"
                    >
                      See all {group.totalCount}
                    </Link>
                  )}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      feed={feedById.get(item.feedId)}
                      layout="standard"
                      isActive={item.id === selectedId}
                      onOpen={() => openItem(item)}
                      onToggleRead={() => markItemRead(item.id, !item.read)}
                      onOpenOriginal={() => {
                        if (!item.read) markItemRead(item.id, true);
                        window.open(item.link, "_blank", "noopener,noreferrer");
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))
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
            hasNext={selectedIndex >= 0 && selectedIndex < flatItems.length - 1}
            hasPrev={selectedIndex > 0}
          />
        </div>
      )}
    </div>
  );
}

export default function DigestPage() {
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <DigestContent />
    </Suspense>
  );
}
