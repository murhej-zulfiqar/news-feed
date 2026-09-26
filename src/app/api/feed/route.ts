import { NextRequest, NextResponse } from "next/server";
import { decodeFeedBuffer } from "@/lib/feed/encoding";
import { FeedParseError, parseFeed } from "@/lib/feed/parse";
import type { FeedFetchResult } from "@/lib/types";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 10_000;
const MIN_HOST_INTERVAL_MS = 500;

// Per-instance rate limiter: keeps this server from hammering the same feed
// host on rapid "refresh all" clicks. Resets on cold start — acceptable for
// a single-user, portfolio-scale deployment.
const lastRequestAtByHost = new Map<string, number>();

async function respectHostRateLimit(hostname: string) {
  const last = lastRequestAtByHost.get(hostname) ?? 0;
  const wait = last + MIN_HOST_INTERVAL_MS - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAtByHost.set(hostname, Date.now());
}

interface FeedRequestBody {
  url: string;
  etag?: string | null;
  lastModified?: string | null;
}

export async function POST(request: NextRequest) {
  let body: FeedRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errorKind: "parse", message: "Invalid request body." } satisfies FeedFetchResult, { status: 400 });
  }

  const { url, etag, lastModified } = body;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    return NextResponse.json(
      { ok: false, errorKind: "not_found", message: "That doesn't look like a valid feed URL." } satisfies FeedFetchResult,
      { status: 200 },
    );
  }

  await respectHostRateLimit(parsedUrl.hostname);

  const headers: Record<string, string> = {
    "User-Agent": "Frontpage/1.0 (+https://github.com; personal RSS reader)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.5",
  };
  if (etag) headers["If-None-Match"] = etag;
  if (lastModified) headers["If-Modified-Since"] = lastModified;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers,
      signal: controller.signal,
      redirect: "follow",
    });

    if (response.status === 304) {
      return NextResponse.json(
        { ok: true, notModified: true, finalUrl: response.url || parsedUrl.toString() } satisfies FeedFetchResult,
      );
    }

    if (response.status === 404 || response.status === 410) {
      return NextResponse.json(
        { ok: false, errorKind: "not_found", message: `Feed returned ${response.status} — it may have moved or been removed.` } satisfies FeedFetchResult,
      );
    }

    if (response.status >= 500) {
      return NextResponse.json(
        { ok: false, errorKind: "server_error", message: `Feed server returned an error (HTTP ${response.status}).` } satisfies FeedFetchResult,
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, errorKind: "server_error", message: `Feed request failed (HTTP ${response.status}).` } satisfies FeedFetchResult,
      );
    }

    const buffer = await response.arrayBuffer();
    const xml = decodeFeedBuffer(buffer, response.headers.get("content-type"));

    let parsed;
    try {
      parsed = parseFeed(xml);
    } catch (err) {
      const message = err instanceof FeedParseError ? err.message : "Could not parse this feed's XML.";
      return NextResponse.json({ ok: false, errorKind: "parse", message } satisfies FeedFetchResult);
    }

    if (!parsed.siteUrl) {
      parsed.siteUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    }

    return NextResponse.json({
      ok: true,
      notModified: false,
      feed: parsed,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      finalUrl: response.url || parsedUrl.toString(),
    } satisfies FeedFetchResult);
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      return NextResponse.json(
        { ok: false, errorKind: "timeout", message: "Feed did not respond within 10 seconds." } satisfies FeedFetchResult,
      );
    }
    return NextResponse.json(
      { ok: false, errorKind: "network", message: "Could not reach this feed (network error)." } satisfies FeedFetchResult,
    );
  } finally {
    clearTimeout(timeout);
  }
}
