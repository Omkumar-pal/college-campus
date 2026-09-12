import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, GitCompare } from 'lucide-react';
import { fetchSavedCollegesPaginated, fetchSavedComparisonsPaginated } from './actions';
import SavedCollegesGrid from '@/components/saved-colleges-grid';
import SavedComparisonsList from '@/components/saved-comparisons-list';

export const dynamic = 'force-dynamic';

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/auth/login?next=/saved');

  const params = await searchParams;
  const tab = params.tab === 'comparisons' ? 'comparisons' : 'colleges';

  // 2 cheap counts + 1 paginated fetch for active tab (Option A — keep header counts)
  const [collegeCount, comparisonCount, initial] = await Promise.all([
    prisma.savedCollege.count({ where: { userId: session.userId } }),
    prisma.savedComparison.count({ where: { userId: session.userId } }),
    tab === 'colleges'
      ? fetchSavedCollegesPaginated({ cursor: null, limit: 12 })
      : fetchSavedComparisonsPaginated({ cursor: null, limit: 10 }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved</h1>
        <p className="text-sm text-slate-500 mt-1">Hi {session.name} — {collegeCount} colleges, {comparisonCount} comparisons</p>

        <div className="mt-6 flex gap-2">
          <Link href="/saved?tab=colleges" className={`px-4 py-2 rounded-xl text-sm font-semibold border ${tab === 'colleges' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
            <span className="inline-flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Colleges ({collegeCount})</span>
          </Link>
          <Link href="/saved?tab=comparisons" className={`px-4 py-2 rounded-xl text-sm font-semibold border ${tab === 'comparisons' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
            <span className="inline-flex items-center gap-1.5"><GitCompare className="w-4 h-4" /> Comparisons ({comparisonCount})</span>
          </Link>
        </div>

        <div className="mt-6">
          {tab === 'colleges' ? (
            <SavedCollegesGrid initialItems={initial.items as any} initialNextCursor={initial.nextCursor} initialHasMore={initial.hasMore} initialTotal={initial.total} />
          ) : (
            <SavedComparisonsList initialItems={initial.items as any} initialNextCursor={initial.nextCursor} initialHasMore={initial.hasMore} initialTotal={initial.total} />
          )}
        </div>
      </div>
    </div>
  );
}
