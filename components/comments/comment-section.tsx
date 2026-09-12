'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { fetchRootComments, createComment } from '@/app/comments/actions';
import { CommentItem } from './comment-thread';

type Comment = {
  id: string;
  content: string;
  createdAt: Date | string;
  user: { name: string } | null;
  _count: { replies: number };
};

export default function CommentSection({ collegeId, collegeSlug, isLoggedIn }: { collegeId: string; collegeSlug: string; isLoggedIn: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchRootComments(collegeId, debouncedQuery || undefined, 20).then((data) => setComments(data as any));
  }, [collegeId, debouncedQuery]);

  async function handleRootSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const fd = new FormData();
    fd.set('collegeId', collegeId);
    fd.set('content', content);
    const res = await createComment(fd);
    setLoading(false);
    if (res?.error) alert(res.error);
    else {
      setContent('');
      const updated = await fetchRootComments(collegeId, debouncedQuery || undefined, 20);
      setComments(updated as any);
    }
  }

  async function handleReplySubmit(parentId: string) {
    if (!replyContent.trim()) return;
    const fd = new FormData();
    fd.set('collegeId', collegeId);
    fd.set('parentId', parentId);
    fd.set('content', replyContent);
    const res = await createComment(fd);
    if (res?.error) alert(res.error);
    else {
      setReplyContent('');
      setReplyTo(null);
      // simple refresh
      const updated = await fetchRootComments(collegeId, debouncedQuery || undefined, 20);
      setComments(updated as any);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Comments</h3>
        <p className="text-xs text-slate-500 mt-1">General discussion — ask a question, reply to any comment. Nested replies with View more (3-4).</p>

        {/* Search roots only per spec */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions (semantic, roots only)..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </div>

        {/* Root composer */}
        {isLoggedIn ? (
          <form onSubmit={handleRootSubmit} className="mt-4 flex gap-2">
            <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a comment on this college..." className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold disabled:opacity-50">
              Post
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Please <a href="/auth/login" className="text-brand-600 hover:underline">login</a> to comment.</p>
        )}
      </div>

      <div className="space-y-2">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            collegeId={collegeId}
            depth={0}
            onReply={setReplyTo}
            replyTo={replyTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            onReplySubmit={handleReplySubmit}
            onCancel={() => setReplyTo(null)}
            isLoggedIn={isLoggedIn}
          />
        ))}
        {comments.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No questions yet. Be first to ask.</p>}
      </div>
    </div>
  );
}
