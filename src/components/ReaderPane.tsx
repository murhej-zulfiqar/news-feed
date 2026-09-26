"use client";

import { useMemo } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { FeedFavicon } from "./FeedFavicon";
import { sanitizeFeedHtml } from "@/lib/sanitize";
import { formatFullDateTime } from "@/lib/format";
import type { Feed, FeedItem } from "@/lib/types";

interface ReaderPaneProps {
  item: FeedItem;
  feed: Feed | undefined;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function ReaderPane({ item, feed, onClose, onNext, onPrev, hasNext, hasPrev }: ReaderPaneProps) {
  const cleanHtml = useMemo(() => (item.contentHtml ? sanitizeFeedHtml(item.contentHtml) : ""), [item.contentHtml]);
  const sourceName = feed?.customTitle || feed?.title || "Unknown source";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-(--color-border) px-4 py-2.5">
        <button
          onClick={onClose}
          className="focus-ring flex items-center gap-1.5 rounded-(--radius-md) px-2 py-1.5 text-sm text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous item"
            className="focus-ring rounded-(--radius-md) p-1.5 text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) disabled:opacity-30"
          >
            <ChevronUp size={18} aria-hidden="true" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next item"
            className="focus-ring rounded-(--radius-md) p-1.5 text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) disabled:opacity-30"
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <article className="mx-auto min-h-0 w-full max-w-content flex-1 overflow-y-auto px-6 py-8">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            <FeedFavicon siteUrl={feed?.siteUrl ?? ""} size={18} />
            <span className="font-medium text-(--color-text-primary)">{sourceName}</span>
          </div>
          <h1 className="text-2xl font-semibold leading-snug text-(--color-text-primary)">{item.title}</h1>
          <p className="mt-2 text-sm text-(--color-text-tertiary)">
            {item.author ? `${item.author} · ` : ""}
            {formatFullDateTime(item.publishedAt)}
          </p>
        </header>

        {cleanHtml ? (
          <div className="reader-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
        ) : (
          <div className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-secondary) p-6">
            <p className="text-(--color-text-secondary)">
              This feed only publishes a summary for this item — the full article lives on the original site.
            </p>
            <p className="reader-content mt-3">{item.summary}</p>
          </div>
        )}

        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-8 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-border) px-4 py-2 text-sm font-medium hover:bg-(--color-bg-tertiary)"
        >
          Read on {sourceName}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </article>
    </div>
  );
}
