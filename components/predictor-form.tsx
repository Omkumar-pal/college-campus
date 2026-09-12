'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { predictColleges, type PredictorResult } from '@/app/predictor/actions';
import {
  Sparkles,
  Search,
  Building2,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  Target,
  Zap,
  Loader2,
  TrendingUp,
  Filter,
} from 'lucide-react';

const EXAMS = [
  { value: 'JEE Main', label: 'JEE Main' },
  { value: 'JEE Advanced', label: 'JEE Advanced' },
];

const CATEGORIES = [
  { value: 'GENERAL', label: 'General (UR)' },
  { value: 'EWS', label: 'EWS' },
  { value: 'OBC', label: 'OBC-NCL' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
];

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

const bucketConfig = {
  safe: {
    label: 'High Chance',
    sublabel: 'Your rank is comfortably within the cutoff',
    icon: CheckCircle2,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-200 dark:border-emerald-800/50',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  target: {
    label: 'Moderate Chance',
    sublabel: 'Good fit — apply with a strong SOP',
    icon: Target,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
    borderClass: 'border-amber-200 dark:border-amber-800/50',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  reach: {
    label: 'Reach / Dream',
    sublabel: 'Competitive — rank is near the closing cutoff',
    icon: Zap,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/50',
    borderClass: 'border-rose-200 dark:border-rose-800/50',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
};

export default function PredictorForm() {
  const [rank, setRank] = useState('');
  const [exam, setExam] = useState('JEE Main');
  const [category, setCategory] = useState('GENERAL');
  const [results, setResults] = useState<PredictorResult[] | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [activeBucket, setActiveBucket] = useState<'all' | 'safe' | 'target' | 'reach'>('all');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rankNum = parseInt(rank, 10);
    if (!rank || isNaN(rankNum) || rankNum <= 0) {
      setError('Please enter a valid rank (positive number).');
      return;
    }
    setError('');
    setActiveBucket('all');

    startTransition(async () => {
      const data = await predictColleges(rankNum, exam, category);
      setResults(data);
    });
  }

  const safe = results?.filter((r) => r.bucket === 'safe') ?? [];
  const target = results?.filter((r) => r.bucket === 'target') ?? [];
  const reach = results?.filter((r) => r.bucket === 'reach') ?? [];

  const displayed =
    activeBucket === 'all' ? results ?? [] :
    activeBucket === 'safe' ? safe :
    activeBucket === 'target' ? target :
    reach;

  return (
    <div className="space-y-8">
      {/* Input Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-500" />
          Enter Your Details
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          We query live cutoff data from our database to predict your admission chances.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rank Input */}
          <div className="space-y-1.5">
            <label htmlFor="rank-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Your JEE Rank
            </label>
            <input
              id="rank-input"
              type="number"
              min="1"
              max="1500000"
              placeholder="e.g. 5000"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm transition-all"
            />
          </div>

          {/* Exam Select */}
          <div className="space-y-1.5">
            <label htmlFor="exam-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Entrance Exam
            </label>
            <select
              id="exam-select"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm transition-all"
            >
              {EXAMS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5">
            <label htmlFor="category-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Category
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-transparent uppercase tracking-wider select-none">
              Predict
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Predicting…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Colleges</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        )}
      </div>

      {/* Results */}
      {results !== null && !isPending && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-3 gap-4">
            {(['safe', 'target', 'reach'] as const).map((b) => {
              const cfg = bucketConfig[b];
              const count = b === 'safe' ? safe.length : b === 'target' ? target.length : reach.length;
              const Icon = cfg.icon;
              return (
                <button
                  key={b}
                  onClick={() => setActiveBucket(activeBucket === b ? 'all' : b)}
                  className={`relative p-4 rounded-2xl border text-left transition-all hover:shadow-md ${cfg.bgClass} ${cfg.borderClass} ${
                    activeBucket === b ? 'ring-2 ring-brand-500/50 shadow-md' : ''
                  }`}
                >
                  <div className={`flex items-center gap-2 text-sm font-bold ${cfg.colorClass}`}>
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {cfg.sublabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filter pills */}
          {results.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Showing:</span>
              {(['all', 'safe', 'target', 'reach'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBucket(b)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                    activeBucket === b
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-500'
                  }`}
                >
                  {b === 'all' ? `All (${results.length})` : b === 'safe' ? `Safe (${safe.length})` : b === 'target' ? `Target (${target.length})` : `Reach (${reach.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Results cards */}
          {displayed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayed.map((result, idx) => {
                const cfg = bucketConfig[result.bucket];
                const Icon = cfg.icon;
                return (
                  <Link
                    key={`${result.college.id}-${idx}`}
                    href={`/colleges/${result.college.slug}`}
                    className="group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all duration-200"
                  >
                    {/* Bucket Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>

                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Cutoff: <span className="font-bold text-slate-900 dark:text-white">#{result.cutoffRank.toLocaleString('en-IN')}</span>
                      </span>
                    </div>

                    {/* College Info */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                        {result.college.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                        {result.course.name}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {result.college.city}, {result.college.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {result.college.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Fees: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(result.college.feesMin)} – {formatCurrency(result.college.feesMax)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No colleges found for this filter
              </h3>
              <p className="text-sm text-slate-500 mt-1">Try switching to "All" or selecting a different bucket.</p>
            </div>
          )}

          {results.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <TrendingUp className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No matching colleges found
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Your rank may be above the closing cutoff for all listed institutes in our database.
                Try a different exam or category.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
