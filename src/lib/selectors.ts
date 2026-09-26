import type { Category, Feed, FeedItem } from "./types";
import { UNCATEGORIZED_ID } from "./types";

export function computeUnreadByFeed(items: FeedItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    if (item.read) continue;
    map.set(item.feedId, (map.get(item.feedId) ?? 0) + 1);
  }
  return map;
}

export function computeCountByFeed(items: FeedItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.feedId, (map.get(item.feedId) ?? 0) + 1);
  }
  return map;
}

export function rollUpByCategory(feeds: Feed[], countByFeed: Map<string, number>): Map<string, number> {
  const map = new Map<string, number>();
  for (const feed of feeds) {
    const count = countByFeed.get(feed.id) ?? 0;
    if (!count) continue;
    map.set(feed.categoryId, (map.get(feed.categoryId) ?? 0) + count);
  }
  return map;
}

export function sortedCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

export function categoryLabel(categories: Category[], id: string): string {
  if (id === UNCATEGORIZED_ID) return "Uncategorized";
  return categories.find((c) => c.id === id)?.name ?? "Uncategorized";
}

export function formatCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}
