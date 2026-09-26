"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { FeedFavicon } from "./FeedFavicon";
import { FeedHealthBadge } from "./FeedHealthBadge";
import { getFeedHealth } from "@/lib/feed/health";
import { formatRelativeTime } from "@/lib/format";
import { sortedCategories } from "@/lib/selectors";
import { UNCATEGORIZED_ID, type Category, type Feed } from "@/lib/types";

export function FeedRow({
  feed,
  categories,
  isRefreshing,
  onRefresh,
  onUpdate,
  onRemove,
}: {
  feed: Feed;
  categories: Category[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onUpdate: (patch: { customTitle?: string; categoryId?: string }) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [titleDraft, setTitleDraft] = useState(feed.customTitle ?? feed.title);
  const [categoryDraft, setCategoryDraft] = useState(feed.categoryId);

  const health = getFeedHealth(feed);
  const displayTitle = feed.customTitle || feed.title;

  if (isEditing) {
    return (
      <li className="rounded-(--radius-lg) border border-(--color-accent) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor={`title-${feed.id}`} className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              id={`title-${feed.id}`}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="focus-ring w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-primary) px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={`category-${feed.id}`} className="mb-1 block text-sm font-medium">
              Category
            </label>
            <select
              id={`category-${feed.id}`}
              value={categoryDraft}
              onChange={(e) => setCategoryDraft(e.target.value)}
              className="focus-ring rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-primary) px-3 py-2 text-sm"
            >
              <option value={UNCATEGORIZED_ID}>Uncategorized</option>
              {sortedCategories(categories).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onUpdate({ customTitle: titleDraft.trim() || undefined, categoryId: categoryDraft });
                setIsEditing(false);
              }}
              className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-3 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="focus-ring rounded-(--radius-md) border border-(--color-border) px-3 py-2 text-sm hover:bg-(--color-bg-tertiary)"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3">
      <FeedFavicon siteUrl={feed.siteUrl} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/app/feed/${feed.id}`} className="focus-ring truncate font-medium hover:underline">
            {displayTitle}
          </Link>
          <FeedHealthBadge status={health} detail={feed.lastError ?? undefined} size={14} />
        </div>
        <p className="truncate text-xs text-(--color-text-tertiary)">
          {feed.feedUrl} · {feed.lastSuccessAt ? `Updated ${formatRelativeTime(feed.lastSuccessAt)}` : "Never fetched"}
        </p>
      </div>

      {isConfirmingDelete ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-(--color-text-secondary)">Remove this feed?</span>
          <button
            onClick={onRemove}
            className="focus-ring rounded-(--radius-md) bg-(--color-error) px-2.5 py-1 font-medium text-white hover:opacity-90"
          >
            Remove
          </button>
          <button
            onClick={() => setIsConfirmingDelete(false)}
            className="focus-ring rounded-(--radius-md) border border-(--color-border) px-2.5 py-1 hover:bg-(--color-bg-tertiary)"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label={`Refresh ${displayTitle}`}
            className="focus-ring rounded-(--radius-md) p-2 text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) disabled:opacity-50"
          >
            <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? "animate-spin" : undefined} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${displayTitle}`}
            className="focus-ring rounded-(--radius-md) p-2 text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            onClick={() => setIsConfirmingDelete(true)}
            aria-label={`Remove ${displayTitle}`}
            className="focus-ring rounded-(--radius-md) p-2 text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-error)"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}
