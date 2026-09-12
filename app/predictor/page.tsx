import type { Metadata } from 'next';
import { Sparkles, Layers, CheckCircle2, Target, Zap } from 'lucide-react';
import PredictorForm from '@/components/predictor-form';

export const metadata: Metadata = {
  title: 'JEE College Predictor — Find Your Best-Fit Institutes | CollegeCompass',
  description:
    'Enter your JEE Main or Advanced rank and category to instantly predict which engineering colleges you can get admission in — bucketed into Safe, Target, and Reach colleges.',
};

export default function PredictorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Page Hero */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-indigo-50/10 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Powered by Live Cutoff Data from Neon PostgreSQL
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              JEE College Predictor
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Enter your rank, exam, and category. We instantly query our live cutoff database and
              predict your admission chances across all listed institutes.
            </p>

            {/* Bucket Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Safe — Rank comfortably within cutoff
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                <Target className="w-3.5 h-3.5" />
                Target — Moderate buffer
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                <Zap className="w-3.5 h-3.5" />
                Reach — Very close to closing cutoff
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Predictor Tool */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <PredictorForm />
      </main>
    </div>
  );
}
