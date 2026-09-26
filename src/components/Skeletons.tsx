export function ItemListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-2 px-3 py-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 rounded-(--radius-md) px-3 py-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--color-bg-tertiary)" />
          <div className="flex-1">
            <div className="mb-2 h-3 w-32 animate-pulse rounded bg-(--color-bg-tertiary)" />
            <div className="mb-1.5 h-4 w-3/4 animate-pulse rounded bg-(--color-bg-tertiary)" />
            <div className="h-3 w-full animate-pulse rounded bg-(--color-bg-tertiary)" />
          </div>
        </li>
      ))}
    </ul>
  );
}
