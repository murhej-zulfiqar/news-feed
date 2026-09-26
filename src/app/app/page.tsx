"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { FeedItemsView } from "@/components/FeedItemsView";
import { EmptyState } from "@/components/EmptyState";
import { ItemListSkeleton } from "@/components/Skeletons";
import { StarterFeedsButton } from "@/components/StarterFeedsButton";
import { useFeedStore } from "@/lib/store/FeedStoreContext";

function AllItemsContent() {
  const { items, feeds, isHydrated } = useFeedStore();

  if (isHydrated && feeds.length === 0) {
    return (
      <div className="px-4 py-6 md:px-6">
        <EmptyState
          icon={Inbox}
          title="Your dashboard is empty"
          description="Add your first RSS or Atom feed, or load the curated starter set to see Frontpage populated with real content."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/app/feeds"
                className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
              >
                Add a feed
              </Link>
              <StarterFeedsButton />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <FeedItemsView
      heading="All Items"
      items={items}
      markAllScope={{ type: "all" }}
      emptyState={
        <EmptyState
          icon={Inbox}
          title="No items yet"
          description="Your feeds haven't returned any items yet. Give refresh a moment, or check Manage Feeds for errors."
        />
      }
    />
  );
}

export default function AllItemsPage() {
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <AllItemsContent />
    </Suspense>
  );
}
