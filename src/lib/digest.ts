import { categoryLabel, sortedCategories } from "./selectors";
import { UNCATEGORIZED_ID, type Category, type Feed, type FeedItem } from "./types";

export interface DigestGroup {
  categoryId: string;
  categoryName: string;
  items: FeedItem[];
  totalCount: number;
}

const MAX_PER_CATEGORY = 6;
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

function itemTime(item: FeedItem): number {
  return item.publishedAt ? Date.parse(item.publishedAt) : Date.parse(item.fetchedAt);
}

/** Visit-based "what did I miss?" digest: unread items published or fetched
 * since the last time the user opened this view (or the last 24h on first
 * visit), grouped by category and capped so a quiet week and a firehose day
 * both render as a scannable list rather than a wall of items. */
export function buildDigest(
  feeds: Feed[],
  categories: Category[],
  items: FeedItem[],
  since: string | null,
): DigestGroup[] {
  const sinceTime = since ? Date.parse(since) : Date.now() - DEFAULT_WINDOW_MS;
  const feedCategory = new Map(feeds.map((f) => [f.id, f.categoryId]));

  const byCategory = new Map<string, FeedItem[]>();
  for (const item of items) {
    if (item.read) continue;
    if (itemTime(item) < sinceTime) continue;
    const catId = feedCategory.get(item.feedId) ?? UNCATEGORIZED_ID;
    const list = byCategory.get(catId) ?? [];
    list.push(item);
    byCategory.set(catId, list);
  }

  const orderedCatIds = [...sortedCategories(categories).map((c) => c.id), UNCATEGORIZED_ID];
  const groups: DigestGroup[] = [];

  for (const catId of orderedCatIds) {
    const list = byCategory.get(catId);
    if (!list || list.length === 0) continue;
    const sorted = [...list].sort((a, b) => itemTime(b) - itemTime(a));
    groups.push({
      categoryId: catId,
      categoryName: categoryLabel(categories, catId),
      items: sorted.slice(0, MAX_PER_CATEGORY),
      totalCount: sorted.length,
    });
  }

  return groups;
}
