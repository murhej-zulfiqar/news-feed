"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Rss } from "lucide-react";
import { FeedRow } from "@/components/FeedRow";
import { EmptyState } from "@/components/EmptyState";
import { StarterFeedsButton } from "@/components/StarterFeedsButton";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { useAnnounce } from "@/lib/store/AnnouncerContext";
import { getFeedHealth } from "@/lib/feed/health";
import { sortedCategories } from "@/lib/selectors";
import { UNCATEGORIZED_ID } from "@/lib/types";

export default function FeedsPage() {
  const { feeds, categories, addFeed, updateFeed, removeFeed, refreshFeed, refreshingFeedIds, isHydrated } =
    useFeedStore();
  const announce = useAnnounce();
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState(UNCATEGORIZED_ID);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const tally = { active: 0, stale: 0, error: 0, pending: 0 };
    for (const feed of feeds) {
      const health = getFeedHealth(feed);
      tally[health] += 1;
    }
    return tally;
  }, [feeds]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await addFeed(url, categoryId);
    setPending(false);
    if (result.ok) {
      setUrl("");
      announce("Feed added.");
    } else {
      setError(result.error ?? "Could not add this feed.");
    }
  }

  return (
    <div className="mx-auto max-w-feed px-4 py-6 md:px-6">
      <h1 className="mb-1 text-xl font-semibold">Manage Feeds</h1>
      <p className="mb-6 text-sm text-(--color-text-secondary)">
        {feeds.length} feed{feeds.length === 1 ? "" : "s"} · {counts.active} active · {counts.stale} stale ·{" "}
        {counts.error} error{counts.error === 1 ? "" : "s"}
      </p>

      <form onSubmit={handleAdd} className="mb-8 rounded-(--radius-lg) border border-(--color-border) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="feed-url" className="mb-1 block text-sm font-medium">
              Feed URL
            </label>
            <input
              id="feed-url"
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              aria-describedby={error ? "feed-url-error" : undefined}
              aria-invalid={!!error}
              aria-required="true"
              className="focus-ring w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-primary) px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="feed-category" className="mb-1 block text-sm font-medium">
              Category
            </label>
            <select
              id="feed-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="focus-ring rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-primary) px-3 py-2 text-sm"
            >
              <option value={UNCATEGORIZED_ID}>Uncategorized</option>
              {sortedCategories(categories).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending || !isHydrated}
            className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
          >
            {pending ? "Validating…" : "Add feed"}
          </button>
        </div>
        {error && (
          <p id="feed-url-error" role="alert" className="mt-2 text-sm text-(--color-error)">
            {error}
          </p>
        )}
      </form>

      {feeds.length === 0 ? (
        <EmptyState
          icon={Rss}
          title="No feeds yet"
          description="Add a feed above using its URL, or load the curated starter set to explore Frontpage with real content."
          action={<StarterFeedsButton variant="primary" />}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {feeds.map((feed) => (
            <FeedRow
              key={feed.id}
              feed={feed}
              categories={categories}
              isRefreshing={refreshingFeedIds.has(feed.id)}
              onRefresh={() => refreshFeed(feed.id, { force: true })}
              onUpdate={(patch) => {
                updateFeed(feed.id, patch);
                announce("Feed updated.");
              }}
              onRemove={() => {
                removeFeed(feed.id);
                announce("Feed removed.");
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
