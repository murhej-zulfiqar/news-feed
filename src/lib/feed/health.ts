import type { Feed, FeedStatus } from "@/lib/types";

const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 30 * 60_000;

/** Display status derived from stored state — "stale" isn't persisted, it's
 * computed from lastSuccessAt so it never goes out of sync. */
export function getFeedHealth(feed: Feed, now: number = Date.now()): FeedStatus {
  if (feed.status === "error") return "error";
  if (feed.status === "pending") return "pending";
  if (feed.lastSuccessAt) {
    const age = now - new Date(feed.lastSuccessAt).getTime();
    if (age > STALE_THRESHOLD_MS) return "stale";
  }
  return "active";
}

export function backoffDelayMs(consecutiveFailures: number): number {
  const capped = Math.min(Math.max(consecutiveFailures, 1), 6);
  return Math.min(BASE_BACKOFF_MS * 2 ** (capped - 1), MAX_BACKOFF_MS);
}
