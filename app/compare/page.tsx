import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GitCompare, Loader2 } from 'lucide-react';
import prisma from '@/lib/prisma';
import CompareTool from '@/components/compare-tool';

export const metadata: Metadata = {
  title: 'Compare Engineering Colleges — Side-by-Side | CollegeCompass',
  description:
    'Compare up to 4 engineering institutes side-by-side across fees, placement packages, admission cutoffs, courses, and student ratings.',
};

export default async function ComparePage() {
  // Fetch all college slugs + names for the selector (lightweight query)
  const allColleges = await prisma.college.findMany({
    select: { slug: true, name: true, city: true },
    orderBy: [{ rating: 'desc' }, { name: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Page Hero */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-indigo-50/10 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-5">
              <GitCompare className="w-3.5 h-3.5 text-indigo-500" />
              Side-by-Side Comparison
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Compare Engineering Colleges
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Select up to 4 institutes to compare fees, placement packages, cutoff ranks, courses, and ratings in a single view.
            </p>
          </div>
        </div>
      </section>

      {/* Compare Tool */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-2" />
            <span className="text-sm text-slate-500">Loading…</span>
          </div>
        }>
          <CompareTool allColleges={allColleges} />
        </Suspense>
      </main>
    </div>
  );
}
