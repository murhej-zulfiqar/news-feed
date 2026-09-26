"use client";

import { ExternalLink } from "lucide-react";
import { FeedFavicon } from "./FeedFavicon";
import { formatRelativeTime, formatFullDateTime } from "@/lib/format";
import type { Feed, FeedItem, LayoutMode } from "@/lib/types";

interface ItemRowProps {
  item: FeedItem;
  feed: Feed | undefined;
  layout: LayoutMode;
  isActive: boolean;
  onOpen: () => void;
  onToggleRead: () => void;
  onOpenOriginal: () => void;
}

function UnreadDot({ read }: { read: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${read ? "bg-transparent" : "bg-(--color-unread)"}`}
    />
  );
}

export function ItemRow({ item, feed, layout, isActive, onOpen, onToggleRead, onOpenOriginal }: ItemRowProps) {
  const sourceName = feed?.customTitle || feed?.title || "Unknown source";
  const time = formatRelativeTime(item.publishedAt ?? item.fetchedAt);
  const fullTime = formatFullDateTime(item.publishedAt ?? item.fetchedAt);
  const statusLabel = item.read ? "read" : "unread";

  if (layout === "compact") {
    return (
      <li>
        <button
          onClick={onOpen}
          aria-current={isActive ? "true" : undefined}
          className={`focus-ring flex w-full items-start gap-2 rounded-(--radius-md) px-3 py-1.5 text-left text-sm hover:bg-(--color-bg-tertiary) ${
            isActive ? "bg-(--color-accent-subtle)" : ""
          }`}
        >
          <UnreadDot read={item.read} />
          <FeedFavicon siteUrl={feed?.siteUrl ?? ""} size={14} />
          <span className={`min-w-0 flex-1 truncate ${item.read ? "text-(--color-text-secondary)" : "font-medium"}`}>
            {item.title}
          </span>
          <span className="sr-only">({statusLabel})</span>
          <span className="shrink-0 text-xs text-(--color-text-tertiary)" title={fullTime}>
            {time}
          </span>
        </button>
      </li>
    );
  }

  if (layout === "cards") {
    return (
      <li className={`rounded-(--radius-lg) border ${isActive ? "border-(--color-accent)" : "border-(--color-border)"} bg-(--color-surface) shadow-(--shadow-sm) transition-shadow hover:shadow-(--shadow-md)`}>
        <button onClick={onOpen} className="focus-ring block w-full text-left" aria-current={isActive ? "true" : undefined}>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-t-(--radius-lg) bg-(--color-bg-tertiary)">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FeedFavicon siteUrl={feed?.siteUrl ?? ""} size={28} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-(--color-text-tertiary)">
              <FeedFavicon siteUrl={feed?.siteUrl ?? ""} size={14} />
              <span className="truncate">{sourceName}</span>
              <span aria-hidden="true">·</span>
              <span title={fullTime}>{time}</span>
            </div>
            <h3 className={`flex items-start gap-1.5 text-base leading-snug ${item.read ? "text-(--color-text-secondary) font-normal" : "font-semibold"}`}>
              <UnreadDot read={item.read} />
              <span>
                {item.title}
                <span className="sr-only"> ({statusLabel})</span>
              </span>
            </h3>
            <p className="line-clamp-2 text-sm text-(--color-text-secondary)">{item.summary}</p>
          </div>
        </button>
      </li>
    );
  }

  return (
    <li className={`rounded-(--radius-md) ${isActive ? "bg-(--color-accent-subtle)" : ""}`}>
      <div className="flex items-start gap-3 px-3 py-3">
        <button
          onClick={onToggleRead}
          aria-pressed={item.read}
          aria-label={item.read ? "Mark as unread" : "Mark as read"}
          className="focus-ring mt-1.5 shrink-0 rounded-full p-0.5"
        >
          <UnreadDot read={item.read} />
        </button>
        <button onClick={onOpen} aria-current={isActive ? "true" : undefined} className="focus-ring min-w-0 flex-1 text-left">
          <div className="mb-0.5 flex items-center gap-1.5 text-xs text-(--color-text-tertiary)">
            <FeedFavicon siteUrl={feed?.siteUrl ?? ""} size={14} />
            <span className="truncate">{sourceName}</span>
            <span aria-hidden="true">·</span>
            <span title={fullTime}>{time}</span>
          </div>
          <h3 className={`text-base leading-normal ${item.read ? "text-(--color-text-secondary) font-normal" : "font-semibold text-(--color-text-primary)"}`}>
            {item.title}
            <span className="sr-only"> ({statusLabel})</span>
          </h3>
          {item.summary && <p className="mt-0.5 line-clamp-2 text-sm text-(--color-text-secondary)">{item.summary}</p>}
        </button>
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="hidden h-16 w-20 shrink-0 rounded-(--radius-md) object-cover sm:block"
          />
        )}
        <button
          onClick={onOpenOriginal}
          className="focus-ring mt-1 shrink-0 rounded-(--radius-md) p-1.5 text-(--color-text-tertiary) hover:bg-(--color-bg-tertiary) hover:text-(--color-text-primary)"
          aria-label={`Open "${item.title}" on the original site in a new tab`}
        >
          <ExternalLink size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
