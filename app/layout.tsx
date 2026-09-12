import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Compass, GitCompare, Sparkles, Building2, Bookmark, LogOut } from 'lucide-react';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'CollegeCompass | India College Discovery & Predictor Platform',
  description:
    'Discover top engineering institutes, predict cutoff chances for JEE Main and Advanced, and compare colleges side-by-side.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white"
        suppressHydrationWarning
      >
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <span>
                College<span className="text-brand-600 dark:text-brand-400">Compass</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Colleges</span>
              </Link>
              <Link
                href="/predictor"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Predictor</span>
              </Link>
              <Link
                href="/compare"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <GitCompare className="w-4 h-4 text-indigo-500" />
                <span>Compare</span>
              </Link>
              {session ? (
                <>
                  <Link
                    href="/saved"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Saved</span>
                  </Link>
                  <form action={async () => { 'use server'; const { logout } = await import('@/app/auth/actions'); await logout(); }}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span>{session.name}</span>
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            CollegeCompass MVP • Built with Next.js, Prisma ORM, PostgreSQL & Tailwind CSS
          </div>
        </footer>
      </body>
    </html>
  );
}
