import { createStore, get, set } from "idb-keyval";
import type { Category, Feed, FeedItem, Preferences } from "./types";
import { DEFAULT_PREFERENCES } from "./types";

const store = createStore("frontpage-db", "kv");

const KEYS = {
  feeds: "feeds",
  categories: "categories",
  items: "items",
  preferences: "preferences",
} as const;

export async function loadFeeds(): Promise<Feed[]> {
  return (await get(KEYS.feeds, store)) ?? [];
}

export async function saveFeeds(feeds: Feed[]): Promise<void> {
  await set(KEYS.feeds, feeds, store);
}

export async function loadCategories(): Promise<Category[]> {
  return (await get(KEYS.categories, store)) ?? [];
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await set(KEYS.categories, categories, store);
}

export async function loadItems(): Promise<FeedItem[]> {
  return (await get(KEYS.items, store)) ?? [];
}

export async function saveItems(items: FeedItem[]): Promise<void> {
  await set(KEYS.items, items, store);
}

export async function loadPreferences(): Promise<Preferences> {
  const stored = await get(KEYS.preferences, store);
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) };
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await set(KEYS.preferences, preferences, store);
}

export async function loadAll() {
  const [feeds, categories, items, preferences] = await Promise.all([
    loadFeeds(),
    loadCategories(),
    loadItems(),
    loadPreferences(),
  ]);
  return { feeds, categories, items, preferences };
}
