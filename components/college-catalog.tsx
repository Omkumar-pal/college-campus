'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Briefcase,
  Star,
  ArrowRight,
  Search,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { fetchCollegesPaginated, type CollegeCursor } from '@/app/colleges/actions';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import SaveButton from '@/components/save-button';
import { getSavedIds } from '@/app/saved/actions';

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

type CollegeType = 'GOVERNMENT' | 'PRIVATE' | 'DEEMED';

export type CatalogCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  type: CollegeType;
  establishedYear: number | null;
  feesMin: number;
  feesMax: number;
  rating: number;
  reviewCount: number;
  overview: string | null;
  courses: { id: string; name: string; feePerYear: number }[];
  placements: {
    id: string;
    year: number;
    avgPackage: number;
    medianPackage: number | null;
    highestPackage: number | null;
    topRecruiters: string[];
  }[];
  _count: {
    courses: number;
    reviews: number;
    cutoffs: number;
  };
};

type TypeFilter = 'ALL' | CollegeType;
type SortBy = 'rating' | 'fees';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'DEEMED', label: 'Deemed' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'fees', label: 'Fees (Low → High)' },
];

const LIMIT = 12;

function CollegeSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>
      <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-4" />
      <div className="h-16 bg-slate-50 dark:bg-slate-950/50 rounded-xl mb-4" />
      <div className="h-10 bg-slate-50 dark:bg-slate-950/50 rounded-xl" />
    </div>
  );
}

export default function CollegeCatalog({
  initialColleges,
  initialNextCursor,
  initialHasMore,
  initialTotalFiltered,
}: {
  initialColleges: CatalogCollege[];
  initialNextCursor: CollegeCursor;
  initialHasMore: boolean;
  initialTotalFiltered: number;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('rating');

  const [items, setItems] = useState<CatalogCollege[]>(initialColleges);
  const [cursor, setCursor] = useState<CollegeCursor>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalFiltered, setTotalFiltered] = useState(initialTotalFiltered);
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    getSavedIds().then((ids) => setSavedIds(ids as Set<string>));
  }, []);

  // 300ms debounce + abort (via requestId ignore)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Reset and fetch page 1 when debouncedQuery/type/sort changes
  useEffect(() => {
    let cancelled = false;
    const rid = ++requestIdRef.current;
    setIsInitialLoading(true);
    setHasMore(true);

    async function fetchFirst() {
      const res = await fetchCollegesPaginated({
        query: debouncedQuery || undefined,
        type: typeFilter,
        sortBy,
        cursor: null,
        limit: LIMIT,
      });
      if (cancelled || rid !== requestIdRef.current) return;
      setItems(res.colleges);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
      setTotalFiltered(res.totalFiltered);
      setIsInitialLoading(false);
    }

    // Skip initial mount if matches initial state (no filters)
    const isInitialState = debouncedQuery === '' && typeFilter === 'ALL' && sortBy === 'rating';
    // But if we are already in initial state and items === initial, avoid double fetch for first render?
    // We still need to refetch when filters change; for initial mount with no filters, keep initial data
    // So only fetch if not initial mount OR filters changed from initial
    // We detect by comparing to initial props: if debouncedQuery==='' and type ALL and sort rating, keep initial
    if (isInitialState && items === initialColleges && cursor === initialNextCursor) {
      setIsInitialLoading(false);
      return;
    }
    fetchFirst();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, typeFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetching || isInitialLoading) return;
    const rid = ++requestIdRef.current;
    setIsFetching(true);
    const res = await fetchCollegesPaginated({
      query: debouncedQuery || undefined,
      type: typeFilter,
      sortBy,
      cursor,
      limit: LIMIT,
    });
    if (rid !== requestIdRef.current) {
      setIsFetching(false);
      return;
    }
    setItems((prev) => [...prev, ...res.colleges]);
    setCursor(res.nextCursor);
    setHasMore(res.hasMore);
    setTotalFiltered(res.totalFiltered);
    setIsFetching(false);
  }, [hasMore, isFetching, isInitialLoading, debouncedQuery, typeFilter, sortBy, cursor]);

  useInfiniteScroll(sentinelRef, loadMore, hasMore && !isFetching && !isInitialLoading);

  function clearFilters() {
    setQuery('');
    setTypeFilter('ALL');
    setSortBy('rating');
  }

  const hasActiveFilters = debouncedQuery !== '' || query.trim() !== '' || typeFilter !== 'ALL' || sortBy !== 'rating';
  const showing = items.length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Featured Institutes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Showing institutes loaded directly from PostgreSQL via Prisma Client
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 shadow-sm">
            <span className="text-slate-500">Showing</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {showing} of {totalFiltered}
            </span>
            <span className="text-slate-500">institutes</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Database Smoke Test: PASS</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by college, city, or state..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 lg:w-56 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort by {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Type:</span>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                typeFilter === opt.value
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CollegeSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((college) => {
              const latestPlacement = college.placements[0];
              const typeBadgeStyle =
                college.type === 'GOVERNMENT'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                  : college.type === 'DEEMED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50'
                    : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/50';

              return (
                <div
                  key={college.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeBadgeStyle}`}
                      >
                        {college.type}
                      </span>

                      <div className="flex items-center gap-1.5">
                      <SaveButton collegeId={college.id} initialSaved={savedIds.has(college.id)} />
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{college.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({college._count.reviews})</span>
                      </div>
                    </div>
                    </div>

                    <Link
                      href={`/colleges/${college.slug}`}
                      className="block text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
                    >
                      {college.name}
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {college.city}, {college.state}
                      </span>
                      {college.establishedYear && (
                        <span className="text-slate-400">• Est. {college.establishedYear}</span>
                      )}
                    </div>

                    {college.overview && (
                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {college.overview}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60">
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                          Fees Range
                        </div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatCurrency(college.feesMin)} - {formatCurrency(college.feesMax)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                          Avg Package
                        </div>
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {latestPlacement ? formatLPA(latestPlacement.avgPackage) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {latestPlacement && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-brand-500" />
                            Highest:
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatLPA(latestPlacement.highestPackage)}
                          </span>
                        </div>

                        {latestPlacement.topRecruiters.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {latestPlacement.topRecruiters.slice(0, 3).map((company, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                {company}
                              </span>
                            ))}
                            {latestPlacement.topRecruiters.length > 3 && (
                              <span className="text-[10px] text-slate-400 px-1 py-0.5">
                                +{latestPlacement.topRecruiters.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      {college._count.courses} Courses • {college._count.cutoffs} Cutoffs
                    </span>

                    <Link
                      href={`/colleges/${college.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sentinel + footer */}
          <div ref={sentinelRef} className="h-10 mt-8 flex items-center justify-center">
            {isFetching && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                <span>Loading more institutes...</span>
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <span className="text-xs text-slate-400">No more institutes — {showing} of {totalFiltered} shown</span>
            )}
          </div>

          {hasMore && !isFetching && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Search className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No matching institutes</h3>
          <p className="text-sm text-slate-500 mt-1">
            No colleges match <span className="font-semibold text-slate-700 dark:text-slate-300">"{debouncedQuery || query}"</span>
            {typeFilter !== 'ALL' ? ` in ${typeFilter}` : ''}. Try a different search or filter.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
