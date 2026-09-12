import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Star,
  ArrowLeft,
  Share2,
  GitCompare,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import CollegeDetailTabs from '@/components/college-detail-tabs';
import { getSession } from '@/lib/session';
import SaveButton from '@/components/save-button';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const colleges = await prisma.college.findMany({
    select: { slug: true },
  });
  return colleges.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const college = await prisma.college.findUnique({
    where: { slug },
    select: { name: true, city: true, state: true, overview: true },
  });

  if (!college) {
    return {
      title: 'College Not Found | CollegeCompass',
    };
  }

  return {
    title: `${college.name} (${college.city}) — Cutoffs, Placements & Fees | CollegeCompass`,
    description:
      college.overview ||
      `Explore academic programs, NIRF metrics, JEE cutoffs, and verified placement records for ${college.name}.`,
  };
}

export default async function CollegeDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const college = await prisma.college.findUnique({
    where: { slug },
    include: {
      courses: {
        orderBy: { feePerYear: 'desc' },
      },
      placements: {
        orderBy: { year: 'desc' },
      },
      reviews: {
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      cutoffs: {
        include: {
          course: {
            select: { name: true },
          },
        },
        orderBy: [{ examName: 'asc' }, { category: 'asc' }, { cutoffRank: 'asc' }],
      },
    },
  });

  if (!college) {
    notFound();
  }

  const session = await getSession();

  const typeBadgeStyle =
    college.type === 'GOVERNMENT'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
      : college.type === 'DEEMED'
      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50'
      : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/50';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Breadcrumbs & Hero Header */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb row */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Colleges
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white truncate max-w-xs">{college.name}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </Link>
          </div>

          {/* College Hero Info */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${typeBadgeStyle}`}>
                  {college.type} INSTITUTE
                </span>

                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{college.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({college.reviews.length} reviews)</span>
                </div>

                {college.establishedYear && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Est. {college.establishedYear}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {college.name}
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>
                  {college.city}, {college.state}, {college.country}
                </span>
              </div>
            </div>

            {/* Actions: Compare, Save */}
            <div className="flex items-center gap-3 self-start">
              <SaveButton collegeId={college.id} />
              <Link
                href={`/compare?college=${college.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-brand-700 dark:text-brand-300 font-medium text-sm border border-indigo-200 dark:border-indigo-800/60 shadow-sm transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <CollegeDetailTabs college={college} isLoggedIn={!!session} />
      </main>
    </div>
  );
}
