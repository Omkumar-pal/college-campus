import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
  Building2,
  GraduationCap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import CollegeCatalog from '@/components/college-catalog';
import { fetchCollegesPaginated } from '@/app/colleges/actions';

// Force dynamic rendering to ensure fresh database queries
export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatLPA(amount: number | null | undefined): string {
  if (!amount) return 'N/A';
  return `₹${(amount / 100000).toFixed(1)} LPA`;
}

export default async function HomePage() {
  const startTime = Date.now();

  // Fetch initial page via cursor pagination + aggregates
  const [initialPage, totalCourses, totalCutoffs, placementStats] = await Promise.all([
    fetchCollegesPaginated({ sortBy: 'rating', limit: 12 }),
    prisma.course.count(),
    prisma.cutoffData.count(),
    prisma.placement.aggregate({
      _avg: { avgPackage: true },
      _max: { highestPackage: true },
    }),
  ]);
  const colleges = initialPage.colleges;

  const queryDuration = Date.now() - startTime;
  const avgPackageOverall = placementStats._avg.avgPackage ?? 0;
  const highestPackageOverall = placementStats._max.highestPackage ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.07] dark:opacity-[0.15] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Next.js App Router + Neon PostgreSQL + Prisma ORM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Explore Top Engineering Colleges & Predict Cutoffs
            </h1>

            <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Accurate JEE Main & Advanced cutoffs, placement packages, course fees, and verified student reviews—backed by real-time relational data.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#colleges"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Browse {initialPage.totalFiltered} Colleges</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium shadow-sm">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Neon PostgreSQL Live: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{queryDuration}ms</span></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Building2 className="w-4 h-4 text-brand-500" />
                <span>Colleges</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {initialPage.totalFiltered}
              </div>
              <div className="text-xs text-slate-500">Government & Private</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <GraduationCap className="w-4 h-4 text-violet-500" />
                <span>Programs & Courses</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {totalCourses}
              </div>
              <div className="text-xs text-slate-500">B.Tech, Dual & M.Tech</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Cutoff Datapoints</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {totalCutoffs}
              </div>
              <div className="text-xs text-slate-500">JEE Adv & Main Ranks</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Top Package Record</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {formatLPA(highestPackageOverall)}
              </div>
              <div className="text-xs text-slate-500">Avg {formatLPA(avgPackageOverall)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* College Directory Section — Cursor-based infinite scroll (scalable) */}
      <section id="colleges" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CollegeCatalog
          initialColleges={initialPage.colleges}
          initialNextCursor={initialPage.nextCursor}
          initialHasMore={initialPage.hasMore}
          initialTotalFiltered={initialPage.totalFiltered}
        />
      </section>
    </div>
  );
}
