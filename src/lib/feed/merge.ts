import { createId } from "@/lib/id";
import type { FeedItem, ParsedFeedItem } from "@/lib/types";

const MAX_ITEMS_PER_FEED = 300;

/**
 * Merges freshly-parsed items into the existing store for one feed.
 * Matches by guid so re-fetches update in place (title/content edits on the
 * source) rather than duplicating, preserves local read state on matches,
 * and keeps older items the latest fetch no longer returns (bounded to
 * MAX_ITEMS_PER_FEED so a feed can't grow the store unboundedly).
 */
export function mergeFeedItems(
  existing: FeedItem[],
  feedId: string,
  parsedItems: ParsedFeedItem[],
  fetchedAt: string,
): { items: FeedItem[]; newCount: number } {
  const otherFeedsItems = existing.filter((item) => item.feedId !== feedId);
  const currentByGuid = new Map(
    existing.filter((item) => item.feedId === feedId).map((item) => [item.guid, item]),
  );

  let newCount = 0;
  const updatedForFeed: FeedItem[] = [];

  for (const parsed of parsedItems) {
    const current = currentByGuid.get(parsed.guid);
    if (current) {
      currentByGuid.delete(parsed.guid);
      updatedForFeed.push({
        ...current,
        title: parsed.title,
        link: parsed.link || current.link,
        author: parsed.author,
        publishedAt: parsed.publishedAt ?? current.publishedAt,
        summary: parsed.summary,
        contentHtml: parsed.contentHtml,
        imageUrl: parsed.imageUrl,
      });
    } else {
      newCount++;
      updatedForFeed.push({
        id: createId("item"),
        feedId,
        guid: parsed.guid,
        title: parsed.title,
        link: parsed.link,
        author: parsed.author,
        publishedAt: parsed.publishedAt,
        summary: parsed.summary,
        contentHtml: parsed.contentHtml,
        imageUrl: parsed.imageUrl,
        read: false,
        fetchedAt,
      });
    }
  }

  const feedItems = [...updatedForFeed, ...currentByGuid.values()]
    .sort((a, b) => {
      const aTime = a.publishedAt ? Date.parse(a.publishedAt) : Date.parse(a.fetchedAt);
      const bTime = b.publishedAt ? Date.parse(b.publishedAt) : Date.parse(b.fetchedAt);
      return bTime - aTime;
    })
    .slice(0, MAX_ITEMS_PER_FEED);

  return { items: [...otherFeedsItems, ...feedItems], newCount };
}
