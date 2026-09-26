"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, FolderKanban, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { useAnnounce } from "@/lib/store/AnnouncerContext";
import { sortedCategories } from "@/lib/selectors";
import { UNCATEGORIZED_ID } from "@/lib/types";

export default function CategoriesPage() {
  const { categories, feeds, addCategory, renameCategory, deleteCategory, reorderCategories } = useFeedStore();
  const announce = useAnnounce();
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const ordered = sortedCategories(categories);
  const uncategorizedCount = feeds.filter((f) => f.categoryId === UNCATEGORIZED_ID).length;

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory(name);
    setName("");
    announce("Category created.");
  }

  function move(index: number, delta: number) {
    const next = [...ordered];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderCategories(next.map((c) => c.id));
  }

  return (
    <div className="mx-auto max-w-feed px-4 py-6 md:px-6">
      <h1 className="mb-1 text-xl font-semibold">Categories</h1>
      <p className="mb-6 text-sm text-(--color-text-secondary)">
        Organize your feeds. Deleting a category moves its feeds to Uncategorized.
      </p>

      <form onSubmit={handleCreate} className="mb-8 flex items-end gap-3 rounded-(--radius-lg) border border-(--color-border) p-4">
        <div className="flex-1">
          <label htmlFor="new-category" className="mb-1 block text-sm font-medium">
            New category name
          </label>
          <input
            id="new-category"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Newsletters"
            className="focus-ring w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-primary) px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Create
        </button>
      </form>

      {ordered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No categories yet"
          description="Create your first category above to start organizing feeds by topic."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((category, index) => {
            const count = feeds.filter((f) => f.categoryId === category.id).length;
            const isRenaming = renamingId === category.id;
            const isConfirmingDelete = confirmingDeleteId === category.id;
            return (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${category.name} up`}
                    className="focus-ring rounded-(--radius-sm) p-0.5 text-(--color-text-tertiary) hover:text-(--color-text-primary) disabled:opacity-30"
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === ordered.length - 1}
                    aria-label={`Move ${category.name} down`}
                    className="focus-ring rounded-(--radius-sm) p-0.5 text-(--color-text-tertiary) hover:text-(--color-text-primary) disabled:opacity-30"
                  >
                    <ArrowDown size={14} aria-hidden="true" />
                  </button>
                </div>

                {isRenaming ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      autoFocus
                      className="focus-ring flex-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-primary) px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => {
                        renameCategory(category.id, renameDraft);
                        setRenamingId(null);
                        announce("Category renamed.");
                      }}
                      className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="focus-ring rounded-(--radius-md) border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-bg-tertiary)"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRenamingId(category.id);
                      setRenameDraft(category.name);
                    }}
                    className="focus-ring flex-1 truncate text-left font-medium hover:underline"
                  >
                    {category.name}
                    <span className="ml-2 text-xs font-normal text-(--color-text-tertiary)">
                      {count} feed{count === 1 ? "" : "s"}
                    </span>
                  </button>
                )}

                {!isRenaming &&
                  (isConfirmingDelete ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-(--color-text-secondary)">Delete?</span>
                      <button
                        onClick={() => {
                          deleteCategory(category.id);
                          setConfirmingDeleteId(null);
                          announce("Category deleted.");
                        }}
                        className="focus-ring rounded-(--radius-md) bg-(--color-error) px-2.5 py-1 font-medium text-white hover:opacity-90"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="focus-ring rounded-(--radius-md) border border-(--color-border) px-2.5 py-1 hover:bg-(--color-bg-tertiary)"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeleteId(category.id)}
                      aria-label={`Delete ${category.name}`}
                      className="focus-ring rounded-(--radius-md) p-2 text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-error)"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}

      {uncategorizedCount > 0 && (
        <p className="mt-4 text-sm text-(--color-text-tertiary)">
          {uncategorizedCount} feed{uncategorizedCount === 1 ? "" : "s"} currently uncategorized.
        </p>
      )}
    </div>
  );
}
