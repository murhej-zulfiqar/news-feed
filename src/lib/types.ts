export type FeedFormat = "rss2" | "atom" | "rdf" | "unknown";

export type FeedStatus = "pending" | "active" | "stale" | "error";

export interface Category {
  id: string;
  name: string;
  order: number;
}

export const UNCATEGORIZED_ID = "uncategorized";

export interface Feed {
  id: string;
  feedUrl: string;
  siteUrl: string;
  title: string;
  customTitle?: string;
  description: string;
  format: FeedFormat;
  categoryId: string;
  status: FeedStatus;
  lastFetchedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorKind: "timeout" | "not_found" | "server_error" | "network" | "parse" | null;
  consecutiveFailures: number;
  etag: string | null;
  lastModified: string | null;
  nextRetryAt: string | null;
}

export interface FeedItem {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  link: string;
  author: string | null;
  publishedAt: string | null;
  summary: string;
  contentHtml: string | null;
  imageUrl: string | null;
  read: boolean;
  fetchedAt: string;
}

export type LayoutMode = "compact" | "standard" | "cards";

export type FontScale = "sm" | "md" | "lg";

export interface Preferences {
  layout: LayoutMode;
  autoRefreshMinutes: number | null;
  lastDigestViewedAt: string | null;
  onboarded: boolean;
  reducedMotion: boolean;
  fontScale: FontScale;
}

export const DEFAULT_PREFERENCES: Preferences = {
  layout: "standard",
  autoRefreshMinutes: null,
  lastDigestViewedAt: null,
  onboarded: false,
  reducedMotion: false,
  fontScale: "md",
};

export interface ParsedFeedItem {
  guid: string;
  title: string;
  link: string;
  author: string | null;
  publishedAt: string | null;
  summary: string;
  contentHtml: string | null;
  imageUrl: string | null;
}

export interface ParsedFeed {
  title: string;
  siteUrl: string;
  description: string;
  format: FeedFormat;
  items: ParsedFeedItem[];
}

export interface FeedFetchSuccess {
  ok: true;
  notModified: false;
  feed: ParsedFeed;
  etag: string | null;
  lastModified: string | null;
  finalUrl: string;
}

export interface FeedFetchNotModified {
  ok: true;
  notModified: true;
  finalUrl: string;
}

export interface FeedFetchError {
  ok: false;
  errorKind: "timeout" | "not_found" | "server_error" | "network" | "parse" | "rate_limited";
  message: string;
}

export type FeedFetchResult = FeedFetchSuccess | FeedFetchNotModified | FeedFetchError;
