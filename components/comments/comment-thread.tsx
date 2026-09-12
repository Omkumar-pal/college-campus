'use client';

import { useState } from 'react';
import { timeAgo } from '@/lib/utils';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { fetchReplies } from '@/app/comments/actions';

type Comment = {
  id: string;
  content: string;
  createdAt: Date | string;
  user: { name: string } | null;
  _count: { replies: number };
};

export function CommentItem({
  comment,
  collegeId,
  depth,
  onReply,
  replyTo,
  replyContent,
  setReplyContent,
  onReplySubmit,
  onCancel,
  isLoggedIn,
}: {
  comment: Comment;
  collegeId: string;
  depth: number;
  onReply: (parentId: string) => void;
  replyTo: string | null;
  replyContent: string;
  setReplyContent: (s: string) => void;
  onReplySubmit: (parentId: string) => void;
  onCancel: () => void;
  isLoggedIn: boolean;
}) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(comment._count.replies > 0);

  async function loadReplies() {
    if (!showReplies) {
      setLoading(true);
      const data = await fetchReplies(comment.id, 4);
      setReplies(data as any);
      setHasMore(data.length === 4 && comment._count.replies > 4);
      setShowReplies(true);
      setLoading(false);
    } else {
      setShowReplies(false);
    }
  }

  async function loadMore() {
    setLoading(true);
    const last = replies[replies.length - 1];
    const more = await fetchReplies(comment.id, 3, last ? new Date(last.createdAt).toISOString() : undefined);
    setReplies((prev) => [...prev, ...(more as any)]);
    if (more.length < 3) setHasMore(false);
    setLoading(false);
  }

  const indent = Math.min(depth, 6);
  return (
    <div className={`${indent > 0 ? `ml-6 sm:ml-8 pl-3 border-l border-slate-200 dark:border-slate-800` : ''} mt-4`}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-900 dark:text-white">{comment.user?.name || 'Deleted User'}</span>
          <span className="text-slate-400">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{comment.content}</p>
        <button onClick={() => onReply(comment.id)} className="text-xs text-brand-600 hover:text-brand-500 mt-2 font-medium">
          Reply
        </button>
      </div>

      {replyTo === comment.id && isLoggedIn && (
        <div className="ml-6 sm:ml-8 mt-2 flex gap-2">
          <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Reply..." className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          <button onClick={() => onReplySubmit(comment.id)} className="px-3 py-2 rounded-xl bg-brand-600 text-white text-sm">Reply</button>
          <button onClick={onCancel} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">Cancel</button>
        </div>
      )}

      {comment._count.replies > 0 && (
        <button onClick={loadReplies} className="text-xs text-slate-500 hover:text-slate-700 mt-1 flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {showReplies ? 'Hide replies' : `View ${comment._count.replies} ${comment._count.replies === 1 ? 'reply' : 'replies'}`}
          <ChevronDown className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
        </button>
      )}

      {showReplies && (
        <div className="mt-2 space-y-2">
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} collegeId={collegeId} depth={depth + 1} onReply={onReply} replyTo={replyTo} replyContent={replyContent} setReplyContent={setReplyContent} onReplySubmit={onReplySubmit} onCancel={onCancel} isLoggedIn={isLoggedIn} />
          ))}
          {hasMore && (
            <button onClick={loadMore} disabled={loading} className="text-xs text-brand-600 hover:text-brand-500 font-medium disabled:opacity-50">
              {loading ? 'Loading...' : 'View 3 more replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
