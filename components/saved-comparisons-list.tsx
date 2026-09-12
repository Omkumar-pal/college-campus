'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { GitCompare, Trash2, Loader2 } from 'lucide-react';
import { fetchSavedComparisonsPaginated, deleteSavedComparison, type SavedCursor } from '@/app/saved/actions';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type Item = { id: string; createdAt: Date | string; colleges: { college: { slug: string; name: string; city: string } }[] };

export default function SavedComparisonsList({
  initialItems,
  initialNextCursor,
  initialHasMore,
  initialTotal,
}: {
  initialItems: Item[];
  initialNextCursor: SavedCursor;
  initialHasMore: boolean;
  initialTotal: number;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [cursor, setCursor] = useState<SavedCursor>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total] = useState(initialTotal);
  const [isFetching, setIsFetching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetching) return;
    setIsFetching(true);
    const res = await fetchSavedComparisonsPaginated({ cursor, limit: 10 });
    setItems((prev) => [...prev, ...(res.items as Item[])]);
    setCursor(res.nextCursor);
    setHasMore(res.hasMore);
    setIsFetching(false);
  }, [cursor, hasMore, isFetching]);

  useInfiniteScroll(sentinelRef, loadMore, hasMore && !isFetching);

  async function handleDelete(id: string) {
    await deleteSavedComparison(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <GitCompare className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">No saved comparisons yet. Compare 2-4 colleges and save.</p>
        <Link href="/compare" className="inline-block mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium">Go to Compare</Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((sc) => (
          <div key={sc.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {sc.colleges.map((c) => (
                <span key={c.college.slug} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {c.college.name} ({c.college.city})
                </span>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-2">Saved {new Date(sc.createdAt).toLocaleDateString('en-IN')}</div>
            <div className="mt-3 flex gap-2">
              <Link href={`/compare?slugs=${sc.colleges.map((c) => c.college.slug).join(',')}`} className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold">
                View Comparison
              </Link>
              <button onClick={() => handleDelete(sc.id)} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-rose-600 inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-10 mt-6 flex items-center justify-center">
        {isFetching && <span className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-brand-500" /> Loading more...</span>}
        {!hasMore && items.length > 0 && <span className="text-xs text-slate-400">Showing {items.length} of {total}</span>}
      </div>
      {hasMore && !isFetching && (
        <div className="flex justify-center mt-2">
          <button onClick={loadMore} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-brand-500">
            Load more
          </button>
        </div>
      )}
    </>
  );
}
