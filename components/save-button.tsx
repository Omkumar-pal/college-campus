'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleSavedCollege } from '@/app/saved/actions';

export default function SaveButton({ collegeId, initialSaved }: { collegeId: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle() {
    startTransition(async () => {
      const res = await toggleSavedCollege(collegeId);
      if ((res as any)?.error) {
        router.push('/auth/login');
        return;
      }
      setSaved((res as any).saved);
    });
  }

  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${saved ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-rose-300'}`}
    >
      <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
