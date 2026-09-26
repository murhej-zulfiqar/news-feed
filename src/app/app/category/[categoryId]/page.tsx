"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { FeedItemsView } from "@/components/FeedItemsView";
import { EmptyState } from "@/components/EmptyState";
import { ItemListSkeleton } from "@/components/Skeletons";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { categoryLabel } from "@/lib/selectors";

function CategoryContent({ categoryId }: { categoryId: string }) {
  const { feeds, items, categories, isHydrated } = useFeedStore();
  const heading = categoryLabel(categories, categoryId);
  const feedIds = new Set(feeds.filter((f) => f.categoryId === categoryId).map((f) => f.id));
  const categoryItems = items.filter((i) => feedIds.has(i.feedId));

  if (isHydrated && feedIds.size === 0) {
    return (
      <div className="px-4 py-6 md:px-6">
        <EmptyState
          icon={FolderOpen}
          title={`No feeds in ${heading}`}
          description="Assign feeds to this category from Manage Feeds, or move on to another category."
          action={
            <Link
              href="/app/feeds"
              className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              Manage feeds
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <FeedItemsView
      key={categoryId}
      heading={heading}
      items={categoryItems}
      markAllScope={{ type: "category", categoryId }}
      emptyState={
        <EmptyState
          icon={FolderOpen}
          title="No items yet"
          description="Feeds in this category haven't returned any items yet."
        />
      }
    />
  );
}

export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <CategoryContent categoryId={categoryId} />
    </Suspense>
  );
}
