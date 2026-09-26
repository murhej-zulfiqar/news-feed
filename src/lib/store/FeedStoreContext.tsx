"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createId } from "@/lib/id";
import { backoffDelayMs, getFeedHealth } from "@/lib/feed/health";
import { mergeFeedItems } from "@/lib/feed/merge";
import { getSampleCategories } from "@/lib/sampleFeeds";
import { loadAll, saveCategories, saveFeeds, saveItems, savePreferences } from "@/lib/storage";
import {
  DEFAULT_PREFERENCES,
  UNCATEGORIZED_ID,
  type Category,
  type Feed,
  type FeedFetchResult,
  type FeedItem,
  type FontScale,
  type LayoutMode,
  type Preferences,
} from "@/lib/types";

export type MarkAllScope =
  | { type: "all" }
  | { type: "feed"; feedId: string }
  | { type: "category"; categoryId: string };

interface FeedStoreValue {
  isHydrated: boolean;
  feeds: Feed[];
  categories: Category[];
  items: FeedItem[];
  preferences: Preferences;
  refreshingFeedIds: Set<string>;
  isRefreshingAll: boolean;
  addFeed: (url: string, categoryId?: string) => Promise<{ ok: boolean; error?: string }>;
  removeFeed: (feedId: string) => void;
  updateFeed: (feedId: string, patch: { customTitle?: string; categoryId?: string }) => void;
  refreshFeed: (feedId: string, opts?: { force?: boolean; feed?: Feed }) => Promise<void>;
  refreshAll: () => Promise<void>;
  markItemRead: (itemId: string, read: boolean) => void;
  markAllRead: (scope: MarkAllScope) => void;
  addCategory: (name: string) => Category;
  renameCategory: (categoryId: string, name: string) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  setLayout: (layout: LayoutMode) => void;
  setAutoRefreshMinutes: (minutes: number | null) => void;
  setReducedMotion: (value: boolean) => void;
  setFontScale: (scale: FontScale) => void;
  markDigestViewed: () => void;
  loadStarterFeeds: () => Promise<void>;
}

const FeedStoreContext = createContext<FeedStoreValue | null>(null);

const REFRESH_CONCURRENCY = 4;

async function runWithConcurrency(ids: string[], worker: (id: string) => Promise<void>, concurrency: number) {
  const queue = [...ids];
  async function run() {
    let next: string | undefined;
    while ((next = queue.shift())) {
      await worker(next);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) || 0 }, run));
}

export function FeedStoreProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [refreshingFeedIds, setRefreshingFeedIds] = useState<Set<string>>(new Set());
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const feedsRef = useRef<Feed[]>([]);
  const categoriesRef = useRef<Category[]>([]);
  useEffect(() => {
    feedsRef.current = feeds;
  }, [feeds]);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const refreshFeed = useCallback(async (feedId: string, opts?: { force?: boolean; feed?: Feed }) => {
    const feed = opts?.feed ?? feedsRef.current.find((f) => f.id === feedId);
    if (!feed) return;
    if (!opts?.force && feed.nextRetryAt && Date.now() < Date.parse(feed.nextRetryAt)) {
      return;
    }

    setRefreshingFeedIds((prev) => new Set(prev).add(feedId));
    const now = new Date().toISOString();

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feed.feedUrl, etag: feed.etag, lastModified: feed.lastModified }),
      });
      const result: FeedFetchResult = await res.json();

      if (!result.ok) {
        setFeeds((prev) =>
          prev.map((f) => {
            if (f.id !== feedId) return f;
            const consecutiveFailures = f.consecutiveFailures + 1;
            return {
              ...f,
              status: "error",
              lastFetchedAt: now,
              lastError: result.message,
              lastErrorKind: result.errorKind === "rate_limited" ? "network" : result.errorKind,
              consecutiveFailures,
              nextRetryAt: new Date(Date.now() + backoffDelayMs(consecutiveFailures)).toISOString(),
            };
          }),
        );
        return;
      }

      if (result.notModified) {
        setFeeds((prev) =>
          prev.map((f) =>
            f.id === feedId
              ? {
                  ...f,
                  status: "active",
                  lastFetchedAt: now,
                  lastSuccessAt: now,
                  lastError: null,
                  lastErrorKind: null,
                  consecutiveFailures: 0,
                  nextRetryAt: null,
                  feedUrl: result.finalUrl || f.feedUrl,
                }
              : f,
          ),
        );
        return;
      }

      setItems((prev) => mergeFeedItems(prev, feedId, result.feed.items, now).items);
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === feedId
            ? {
                ...f,
                title: result.feed.title || f.title,
                siteUrl: result.feed.siteUrl || f.siteUrl,
                description: result.feed.description || f.description,
                format: result.feed.format,
                status: "active",
                lastFetchedAt: now,
                lastSuccessAt: now,
                lastError: null,
                lastErrorKind: null,
                consecutiveFailures: 0,
                nextRetryAt: null,
                etag: result.etag ?? f.etag,
                lastModified: result.lastModified ?? f.lastModified,
                feedUrl: result.finalUrl || f.feedUrl,
              }
            : f,
        ),
      );
    } catch {
      setFeeds((prev) =>
        prev.map((f) => {
          if (f.id !== feedId) return f;
          const consecutiveFailures = f.consecutiveFailures + 1;
          return {
            ...f,
            status: "error",
            lastFetchedAt: now,
            lastError: "Unexpected error while fetching this feed.",
            lastErrorKind: "network",
            consecutiveFailures,
            nextRetryAt: new Date(Date.now() + backoffDelayMs(consecutiveFailures)).toISOString(),
          };
        }),
      );
    } finally {
      setRefreshingFeedIds((prev) => {
        const next = new Set(prev);
        next.delete(feedId);
        return next;
      });
    }
  }, []);

  const loadStarterFeeds = useCallback(async () => {
    const sampleCategories = getSampleCategories();
    const catIdByName = new Map(categoriesRef.current.map((c) => [c.name.toLowerCase(), c.id]));
    const newCategories: Category[] = [];
    let orderBase = categoriesRef.current.length;

    for (const cat of sampleCategories) {
      const key = cat.name.toLowerCase();
      if (!catIdByName.has(key)) {
        const id = createId("cat");
        catIdByName.set(key, id);
        newCategories.push({ id, name: cat.name, order: orderBase++ });
      }
    }
    if (newCategories.length) {
      setCategories((prev) => [...prev, ...newCategories]);
    }

    const existingUrls = new Set(feedsRef.current.map((f) => f.feedUrl));
    const newFeeds: Feed[] = [];
    for (const cat of sampleCategories) {
      const categoryId = catIdByName.get(cat.name.toLowerCase())!;
      for (const entry of cat.feeds) {
        if (existingUrls.has(entry.feedUrl)) continue;
        newFeeds.push({
          id: createId("feed"),
          feedUrl: entry.feedUrl,
          siteUrl: entry.siteUrl,
          title: entry.title,
          description: entry.description,
          format: entry.format,
          categoryId,
          status: "pending",
          lastFetchedAt: null,
          lastSuccessAt: null,
          lastError: null,
          lastErrorKind: null,
          consecutiveFailures: 0,
          etag: null,
          lastModified: null,
          nextRetryAt: null,
        });
      }
    }
    if (newFeeds.length) {
      setFeeds((prev) => [...prev, ...newFeeds]);
    }
    setPreferences((prev) => ({ ...prev, onboarded: true }));

    await runWithConcurrency(
      newFeeds.map((f) => f.id),
      (id) => {
        const feed = newFeeds.find((f) => f.id === id)!;
        return refreshFeed(id, { force: true, feed });
      },
      REFRESH_CONCURRENCY,
    );
  }, [refreshFeed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadAll();
      if (cancelled) return;
      const isFirstEverVisit =
        loaded.feeds.length === 0 && loaded.categories.length === 0 && !loaded.preferences.onboarded;

      setCategories(loaded.categories);
      setItems(loaded.items);
      setFeeds(loaded.feeds);
      setPreferences(loaded.preferences);
      setIsHydrated(true);

      if (isFirstEverVisit) {
        await loadStarterFeeds();
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHydrated) void saveFeeds(feeds);
  }, [feeds, isHydrated]);
  useEffect(() => {
    if (isHydrated) void saveCategories(categories);
  }, [categories, isHydrated]);
  useEffect(() => {
    if (isHydrated) void saveItems(items);
  }, [items, isHydrated]);
  useEffect(() => {
    if (isHydrated) void savePreferences(preferences);
  }, [preferences, isHydrated]);

  const addFeed = useCallback(async (url: string, categoryId: string = UNCATEGORIZED_ID) => {
    const trimmed = url.trim();
    if (!trimmed) return { ok: false, error: "Enter a feed URL." };
    let normalizedUrl = trimmed;
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`;

    if (feedsRef.current.some((f) => f.feedUrl === normalizedUrl)) {
      return { ok: false, error: "You're already subscribed to this feed." };
    }

    let result: FeedFetchResult;
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      result = await res.json();
    } catch {
      return { ok: false, error: "Could not reach the server to validate this feed." };
    }

    if (!result.ok) {
      return { ok: false, error: result.message };
    }
    if (result.notModified) {
      return { ok: false, error: "Unexpected response validating this feed." };
    }

    const now = new Date().toISOString();
    const feedId = createId("feed");
    const newFeed: Feed = {
      id: feedId,
      feedUrl: result.finalUrl || normalizedUrl,
      siteUrl: result.feed.siteUrl,
      title: result.feed.title,
      description: result.feed.description,
      format: result.feed.format,
      categoryId,
      status: "active",
      lastFetchedAt: now,
      lastSuccessAt: now,
      lastError: null,
      lastErrorKind: null,
      consecutiveFailures: 0,
      etag: result.etag,
      lastModified: result.lastModified,
      nextRetryAt: null,
    };

    setFeeds((prev) => [...prev, newFeed]);
    setItems((prev) => mergeFeedItems(prev, feedId, result.feed.items, now).items);
    return { ok: true };
  }, []);

  const removeFeed = useCallback((feedId: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== feedId));
    setItems((prev) => prev.filter((i) => i.feedId !== feedId));
  }, []);

  const updateFeed = useCallback((feedId: string, patch: { customTitle?: string; categoryId?: string }) => {
    setFeeds((prev) => prev.map((f) => (f.id === feedId ? { ...f, ...patch } : f)));
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      await runWithConcurrency(
        feedsRef.current.map((f) => f.id),
        (id) => refreshFeed(id),
        REFRESH_CONCURRENCY,
      );
    } finally {
      setIsRefreshingAll(false);
    }
  }, [refreshFeed]);

  const markItemRead = useCallback((itemId: string, read: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, read } : i)));
  }, []);

  const markAllRead = useCallback((scope: MarkAllScope) => {
    setItems((prev) => {
      if (scope.type === "all") {
        return prev.every((i) => i.read) ? prev : prev.map((i) => (i.read ? i : { ...i, read: true }));
      }
      if (scope.type === "feed") {
        return prev.map((i) => (i.feedId === scope.feedId && !i.read ? { ...i, read: true } : i));
      }
      const feedIds = new Set(
        feedsRef.current.filter((f) => f.categoryId === scope.categoryId).map((f) => f.id),
      );
      return prev.map((i) => (feedIds.has(i.feedId) && !i.read ? { ...i, read: true } : i));
    });
  }, []);

  const addCategory = useCallback((name: string): Category => {
    const category: Category = {
      id: createId("cat"),
      name: name.trim() || "Untitled category",
      order: categoriesRef.current.length,
    };
    setCategories((prev) => [...prev, category]);
    return category;
  }, []);

  const renameCategory = useCallback((categoryId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name: trimmed } : c)));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setFeeds((prev) => prev.map((f) => (f.categoryId === categoryId ? { ...f, categoryId: UNCATEGORIZED_ID } : f)));
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  }, []);

  const reorderCategories = useCallback((orderedIds: string[]) => {
    setCategories((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      const reordered = orderedIds.map((id, index) => {
        const existing = byId.get(id);
        return existing ? { ...existing, order: index } : null;
      });
      return reordered.filter((c): c is Category => c !== null);
    });
  }, []);

  const setLayout = useCallback((layout: LayoutMode) => {
    setPreferences((prev) => ({ ...prev, layout }));
  }, []);

  const setAutoRefreshMinutes = useCallback((minutes: number | null) => {
    setPreferences((prev) => ({ ...prev, autoRefreshMinutes: minutes }));
  }, []);

  const setReducedMotion = useCallback((value: boolean) => {
    setPreferences((prev) => ({ ...prev, reducedMotion: value }));
  }, []);

  const setFontScale = useCallback((scale: FontScale) => {
    setPreferences((prev) => ({ ...prev, fontScale: scale }));
  }, []);

  const markDigestViewed = useCallback(() => {
    setPreferences((prev) => ({ ...prev, lastDigestViewedAt: new Date().toISOString() }));
  }, []);

  // Auto-refresh: recheck feeds whose backoff/interval has elapsed.
  useEffect(() => {
    if (!isHydrated || !preferences.autoRefreshMinutes) return;
    const intervalMs = preferences.autoRefreshMinutes * 60_000;
    const id = setInterval(() => {
      void refreshAll();
    }, intervalMs);
    return () => clearInterval(id);
  }, [isHydrated, preferences.autoRefreshMinutes, refreshAll]);

  const value = useMemo<FeedStoreValue>(
    () => ({
      isHydrated,
      feeds,
      categories,
      items,
      preferences,
      refreshingFeedIds,
      isRefreshingAll,
      addFeed,
      removeFeed,
      updateFeed,
      refreshFeed,
      refreshAll,
      markItemRead,
      markAllRead,
      addCategory,
      renameCategory,
      deleteCategory,
      reorderCategories,
      setLayout,
      setAutoRefreshMinutes,
      setReducedMotion,
      setFontScale,
      markDigestViewed,
      loadStarterFeeds,
    }),
    [
      isHydrated,
      feeds,
      categories,
      items,
      preferences,
      refreshingFeedIds,
      isRefreshingAll,
      addFeed,
      removeFeed,
      updateFeed,
      refreshFeed,
      refreshAll,
      markItemRead,
      markAllRead,
      addCategory,
      renameCategory,
      deleteCategory,
      reorderCategories,
      setLayout,
      setAutoRefreshMinutes,
      setReducedMotion,
      setFontScale,
      markDigestViewed,
      loadStarterFeeds,
    ],
  );

  return <FeedStoreContext.Provider value={value}>{children}</FeedStoreContext.Provider>;
}

export function useFeedStore(): FeedStoreValue {
  const ctx = useContext(FeedStoreContext);
  if (!ctx) throw new Error("useFeedStore must be used within a FeedStoreProvider");
  return ctx;
}

export { getFeedHealth };
