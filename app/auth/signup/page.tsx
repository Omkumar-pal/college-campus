import Link from 'next/link';
import { signup } from '../actions';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
        <p className="text-sm text-slate-500 mt-1">Save colleges, comparisons and join discussions</p>

        <form action={signup} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Name</label>
            <input name="name" type="text" required placeholder="Aarav Sharma" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email</label>
            <input name="email" type="email" required placeholder="you@example.com" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
            <input name="password" type="password" required placeholder="••••••••" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
            Sign up
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account? <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
