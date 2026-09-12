'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchCollegesForCompare, searchCollegesForCompare, type CompareCollege } from '@/app/compare/actions';
import { saveComparison } from '@/app/saved/actions';
import {
  GitCompare,
  X,
  Plus,
  Star,
  MapPin,
  Loader2,
  Search,
  Bookmark,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface CollegeOption {
  slug: string;
  name: string;
  city: string;
}

function formatLPA(amount: number | null | undefined) {
  if (!amount) return '—';
  return `₹${(amount / 100000).toFixed(1)} LPA`;
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

const MAX_COLLEGES = 4;

function MetricRow({
  label,
  values,
  highlight = false,
}: {
  label: string;
  values: React.ReactNode[];
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''}>
      <td className="py-4 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800 w-40 align-top leading-relaxed">
        {label}
      </td>
      {values.map((val, i) => (
        <td key={i} className="py-4 px-5 text-sm text-slate-900 dark:text-white align-top border-r border-slate-100 dark:border-slate-800 last:border-r-0">
          {val}
        </td>
      ))}
      {Array.from({ length: MAX_COLLEGES - values.length }).map((_, i) => (
        <td key={`empty-${i}`} className="py-4 px-5 border-r border-slate-100 dark:border-slate-800 last:border-r-0" />
      ))}
    </tr>
  );
}

export default function CompareTool({ allColleges }: { allColleges: CollegeOption[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [colleges, setColleges] = useState<CompareCollege[]>([]);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CollegeOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const slugsParam = searchParams.get('slugs');
    if (slugsParam) {
      const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX_COLLEGES).filter((s) => allColleges.some((c) => c.slug === s));
      if (slugs.length >= 2) {
        setSelected(slugs);
        return;
      }
    }
    const slug = searchParams.get('college');
    if (slug && allColleges.some((c) => c.slug === slug)) {
      setSelected([slug]);
    }
  }, [searchParams, allColleges]);

  useEffect(() => {
    if (selected.length === 0) {
      setColleges([]);
      return;
    }
    startTransition(async () => {
      const data = await fetchCollegesForCompare(selected);
      setColleges(data);
    });
  }, [selected]);

  // Debounced scalable search (server) — replaces client filter
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchCollegesForCompare(query, selected, 8);
      setResults(data);
      setIsSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function addCollege(slug: string) {
    if (selected.includes(slug) || selected.length >= MAX_COLLEGES) return;
    setSelected((prev) => [...prev, slug]);
    setQuery('');
    setResults([]);
  }

  function removeCollege(slug: string) {
    setSelected((prev) => prev.filter((s) => s !== slug));
  }

  async function handleSave() {
    const res = await saveComparison(selected);
    if ((res as any)?.error) {
      if ((res as any).error === 'Login required') router.push('/auth/login?next=/compare');
      else {
        setSaveError((res as any).error);
        setTimeout(() => setSaveError(''), 3000);
      }
    } else {
      setShowSaved(true);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2800);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-brand-500" />
              Select Institutes to Compare
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose up to {MAX_COLLEGES} institutes — search by name or city</p>
          </div>
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} className="text-xs text-slate-500 hover:text-rose-500 transition-colors">
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
          {selected.map((slug) => {
            const col = allColleges.find((c) => c.slug === slug);
            if (!col) return null;
            return (
              <span key={slug} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 text-xs font-medium">
                {col.name.replace('Indian Institute of Technology', 'IIT').replace('National Institute of Technology', 'NIT')}
                <button onClick={() => removeCollege(slug)} className="hover:text-rose-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {selected.length === 0 && <span className="text-xs text-slate-400 italic self-center">No institutes selected yet</span>}
        </div>

        {selected.length < MAX_COLLEGES && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search college (e.g. iit madras)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
            {results.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                {results.map((c) => (
                  <button key={c.slug} onClick={() => addCollege(c.slug)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm flex justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.city}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length >= 2 && !isSearching && results.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">No institutes found for "{query}"</p>
            )}
          </div>
        )}

        {selected.length >= MAX_COLLEGES && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Maximum {MAX_COLLEGES} institutes can be compared at once.</p>}

        {selected.length >= 2 && (
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSave} disabled={showSaved} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showSaved ? 'bg-emerald-600 text-white shadow-md' : 'bg-brand-600 hover:bg-brand-500 text-white'} disabled:opacity-60`}>
              {showSaved ? <CheckCircle className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {showSaved ? 'Saved' : 'Save Comparison'}
            </button>
            {showSaved && (
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 animate-[pop_0.35s_ease-out]">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </span>
            )}
            {saveError && <span className="text-xs text-rose-600">{saveError}</span>}
          </div>
        )}
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-2" />
          <span className="text-sm text-slate-500">Fetching comparison data…</span>
        </div>
      )}

      {!isPending && selected.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <GitCompare className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Start comparing institutes</h3>
          <p className="text-sm text-slate-500 mt-1">Search above and add at least 2 institutes to compare.</p>
        </div>
      )}

      {!isPending && colleges.length >= 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-40" />
                {colleges.map((c) => <col key={c.id} />)}
                {Array.from({ length: MAX_COLLEGES - colleges.length }).map((_, i) => <col key={`ec-${i}`} />)}
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-5 text-left text-xs text-slate-400 font-medium border-r border-slate-100 dark:border-slate-800" />
                  {colleges.map((c) => (
                    <th key={c.id} className="py-4 px-5 text-left border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                      <div className="space-y-1">
                        <Link href={`/colleges/${c.slug}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug block">
                          {c.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {c.city}, {c.state}
                        </div>
                        <button onClick={() => removeCollege(c.slug)} className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-0.5">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </th>
                  ))}
                  {Array.from({ length: MAX_COLLEGES - colleges.length }).map((_, i) => (
                    <th key={`eh-${i}`} className="py-4 px-5 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                      <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                        <Plus className="w-5 h-5" />
                        <span className="text-[11px]">Add institute</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <td colSpan={MAX_COLLEGES + 1} className="py-2 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Overview
                  </td>
                </tr>
                <MetricRow label="Type" values={colleges.map((c) => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.type === 'GOVERNMENT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : c.type === 'DEEMED' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'}`}>{c.type}</span>)} />
                <MetricRow label="Established" values={colleges.map((c) => c.establishedYear ? <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{c.establishedYear}</span> : <span className="text-slate-400">—</span>)} />
                <MetricRow label="Student Rating" values={colleges.map((c) => <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />{c.rating.toFixed(1)}<span className="text-xs text-slate-400 font-normal">({c.reviewCount} reviews)</span></span>)} />
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <td colSpan={MAX_COLLEGES + 1} className="py-2 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Fees
                  </td>
                </tr>
                <MetricRow label="Fee Range" highlight values={colleges.map((c) => <span className="font-semibold">{formatCurrency(c.feesMin)} – {formatCurrency(c.feesMax)}</span>)} />
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <td colSpan={MAX_COLLEGES + 1} className="py-2 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Placements (Latest Batch)
                  </td>
                </tr>
                <MetricRow label="Avg Package" highlight values={colleges.map((c) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatLPA(c.latestPlacement?.avgPackage)}</span>)} />
                <MetricRow label="Highest Package" values={colleges.map((c) => <span className="font-semibold">{formatLPA(c.latestPlacement?.highestPackage)}</span>)} />
                <MetricRow label="Top Recruiters" values={colleges.map((c) => c.latestPlacement?.topRecruiters?.length ? <div className="flex flex-wrap gap-1">{c.latestPlacement.topRecruiters.slice(0, 4).map((r, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{r}</span>)}</div> : <span className="text-slate-400">—</span>)} />
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <td colSpan={MAX_COLLEGES + 1} className="py-2 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Academics
                  </td>
                </tr>
                <MetricRow label="Programs" values={colleges.map((c) => `${c.courses.length} Departments`)} />
                <MetricRow label="Total Seats" values={colleges.map((c) => <span className="font-semibold">{c.courses.reduce((sum, cr) => sum + cr.seats, 0)}</span>)} />
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <td colSpan={MAX_COLLEGES + 1} className="py-2 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Admission Cutoffs
                  </td>
                </tr>
                <MetricRow label="JEE Main General (Closing Rank)" highlight values={colleges.map((c) => c.bestCutoffGeneral ? <span className="font-bold text-brand-600 dark:text-brand-400">#{c.bestCutoffGeneral.toLocaleString('en-IN')}</span> : <span className="text-slate-400">Not listed</span>)} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
