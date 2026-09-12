'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';
import { fetchSavedCollegesPaginated, type SavedCursor } from '@/app/saved/actions';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type Item = { collegeId: string; college: { slug: string; name: string; city: string; state: string }; createdAt: Date | string };

export default function SavedCollegesGrid({
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
    const res = await fetchSavedCollegesPaginated({ cursor, limit: 12 });
    setItems((prev) => [...prev, ...(res.items as Item[])]);
    setCursor(res.nextCursor);
    setHasMore(res.hasMore);
    setIsFetching(false);
  }, [cursor, hasMore, isFetching]);

  useInfiniteScroll(sentinelRef, loadMore, hasMore && !isFetching);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Building2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">No saved colleges yet. Browse and heart them.</p>
        <Link href="/#colleges" className="inline-block mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium">Browse colleges</Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((s) => (
          <Link key={s.collegeId} href={`/colleges/${s.college.slug}`} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 transition-colors">
            <div className="font-semibold text-slate-900 dark:text-white">{s.college.name}</div>
            <div className="text-xs text-slate-500">{s.college.city}, {s.college.state}</div>
            <div className="text-[11px] text-slate-400 mt-1">Saved {new Date(s.createdAt).toLocaleDateString('en-IN')}</div>
          </Link>
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
