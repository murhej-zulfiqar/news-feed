"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Inbox,
  Newspaper,
  Rss,
  Settings,
  Sparkles,
} from "lucide-react";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { computeUnreadByFeed, formatCount, rollUpByCategory, sortedCategories } from "@/lib/selectors";
import { UNCATEGORIZED_ID } from "@/lib/types";

function NavLink({
  href,
  active,
  icon: Icon,
  label,
  count,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: typeof Inbox;
  label: string;
  count?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`focus-ring flex items-center justify-between gap-2 rounded-(--radius-md) px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-(--color-accent-subtle) font-medium text-(--color-accent)"
          : "text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-text-primary)"
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        <Icon size={16} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-(--radius-full) bg-(--color-bg-tertiary) px-1.5 py-0.5 text-xs text-(--color-text-secondary)">
          {formatCount(count)}
        </span>
      )}
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { feeds, categories, items } = useFeedStore();
  const pathname = usePathname();

  const unreadByFeed = computeUnreadByFeed(items);
  const unreadByCategory = rollUpByCategory(feeds, unreadByFeed);
  const totalUnread = items.reduce((sum, i) => (i.read ? sum : sum + 1), 0);
  const cats = sortedCategories(categories);
  const hasUncategorized = feeds.some((f) => f.categoryId === UNCATEGORIZED_ID);
  const errorCount = feeds.filter((f) => f.status === "error").length;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link href="/app" onClick={onNavigate} className="focus-ring flex items-center gap-2 px-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-(--radius-md) bg-(--color-accent) text-sm font-bold text-white">
          F
        </span>
        <span className="text-lg font-semibold tracking-tight">Frontpage</span>
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        <NavLink
          href="/app"
          active={pathname === "/app"}
          icon={Inbox}
          label="All Items"
          count={totalUnread}
          onNavigate={onNavigate}
        />
        <NavLink
          href="/app/digest"
          active={pathname === "/app/digest"}
          icon={Sparkles}
          label="Digest"
          onNavigate={onNavigate}
        />
      </nav>

      <nav aria-label="Categories" className="flex flex-col gap-1">
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
          Categories
        </h2>
        {cats.map((cat) => {
          const feedsInCat = feeds.filter((f) => f.categoryId === cat.id);
          if (feedsInCat.length === 0) return null;
          return (
            <div key={cat.id}>
              <NavLink
                href={`/app/category/${cat.id}`}
                active={pathname === `/app/category/${cat.id}`}
                icon={Newspaper}
                label={cat.name}
                count={unreadByCategory.get(cat.id) ?? 0}
                onNavigate={onNavigate}
              />
              <ul className="ml-4 flex flex-col gap-0.5 border-l border-(--color-border-subtle) pl-2">
                {feedsInCat.map((feed) => (
                  <li key={feed.id}>
                    <Link
                      href={`/app/feed/${feed.id}`}
                      onClick={onNavigate}
                      aria-current={pathname === `/app/feed/${feed.id}` ? "page" : undefined}
                      className={`focus-ring flex items-center justify-between gap-2 rounded-(--radius-md) px-2 py-1 text-xs ${
                        pathname === `/app/feed/${feed.id}`
                          ? "font-medium text-(--color-accent)"
                          : "text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                      }`}
                    >
                      <span className="truncate">{feed.customTitle || feed.title}</span>
                      {(unreadByFeed.get(feed.id) ?? 0) > 0 && (
                        <span>{formatCount(unreadByFeed.get(feed.id) ?? 0)}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {hasUncategorized && (
          <NavLink
            href={`/app/category/${UNCATEGORIZED_ID}`}
            active={pathname === `/app/category/${UNCATEGORIZED_ID}`}
            icon={Newspaper}
            label="Uncategorized"
            count={unreadByCategory.get(UNCATEGORIZED_ID) ?? 0}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <nav aria-label="Manage" className="mt-auto flex flex-col gap-1 border-t border-(--color-border-subtle) pt-3">
        <NavLink
          href="/app/feeds"
          active={pathname === "/app/feeds"}
          icon={Rss}
          label="Manage Feeds"
          count={errorCount}
          onNavigate={onNavigate}
        />
        <NavLink
          href="/app/categories"
          active={pathname === "/app/categories"}
          icon={FolderKanban}
          label="Categories"
          onNavigate={onNavigate}
        />
        <NavLink
          href="/app/settings"
          active={pathname === "/app/settings"}
          icon={Settings}
          label="Settings"
          onNavigate={onNavigate}
        />
      </nav>
    </div>
  );
}
