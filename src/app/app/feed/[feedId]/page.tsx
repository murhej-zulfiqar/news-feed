"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { Rss } from "lucide-react";
import { FeedItemsView } from "@/components/FeedItemsView";
import { EmptyState } from "@/components/EmptyState";
import { ItemListSkeleton } from "@/components/Skeletons";
import { FeedHealthBadge } from "@/components/FeedHealthBadge";
import { useFeedStore, getFeedHealth } from "@/lib/store/FeedStoreContext";
import { formatRelativeTime } from "@/lib/format";

function FeedContent({ feedId }: { feedId: string }) {
  const { feeds, items, isHydrated, refreshFeed, refreshingFeedIds } = useFeedStore();
  const feed = feeds.find((f) => f.id === feedId);
  const feedItems = items.filter((i) => i.feedId === feedId);

  if (isHydrated && !feed) {
    return (
      <div className="px-4 py-6 md:px-6">
        <EmptyState
          icon={Rss}
          title="Feed not found"
          description="This feed may have been removed."
          action={
            <Link
              href="/app/feeds"
              className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              Back to Manage Feeds
            </Link>
          }
        />
      </div>
    );
  }

  if (!feed) return <ItemListSkeleton />;

  const health = getFeedHealth(feed);
  const isRefreshing = refreshingFeedIds.has(feedId);

  return (
    <FeedItemsView
      key={feedId}
      heading={feed.customTitle || feed.title}
      items={feedItems}
      markAllScope={{ type: "feed", feedId }}
      headerExtra={
        <span className="flex items-center gap-2 text-xs text-(--color-text-tertiary)">
          <FeedHealthBadge status={health} detail={feed.lastError ?? undefined} />
          {feed.lastSuccessAt && <span>Updated {formatRelativeTime(feed.lastSuccessAt)}</span>}
        </span>
      }
      emptyState={
        <EmptyState
          icon={Rss}
          title="No items yet"
          description={
            feed.status === "error"
              ? `Last fetch failed: ${feed.lastError ?? "unknown error"}`
              : "This feed hasn't returned any items yet."
          }
          action={
            <button
              onClick={() => refreshFeed(feedId, { force: true })}
              disabled={isRefreshing}
              className="focus-ring rounded-(--radius-md) border border-(--color-border) px-4 py-2 text-sm font-medium hover:bg-(--color-bg-tertiary) disabled:opacity-60"
            >
              {isRefreshing ? "Retrying…" : "Retry now"}
            </button>
          }
        />
      }
    />
  );
}

export default function FeedPage({ params }: { params: Promise<{ feedId: string }> }) {
  const { feedId } = use(params);
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <FeedContent feedId={feedId} />
    </Suspense>
  );
}
