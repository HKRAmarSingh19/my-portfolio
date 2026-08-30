import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Trash2, Linkedin as LinkedinIcon, ExternalLink, FileText, Check } from 'lucide-react';
import { linkedInApi } from '../../api/client';
import SEO from '../../components/common/SEO';

/**
 * Format a Date/ISO into a readable local string for the "last updated" label.
 */
const fmtWhen = (iso) => {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  return d.toLocaleString();
};

export const ManageLinkedIn = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const [url, setUrl] = useState('');
  const [commentary, setCommentary] = useState('');

  const postsQuery = useQuery({
    queryKey: ['adminLinkedIn'],
    queryFn: () => linkedInApi.getAll({ limit: 200 }),
  });
  const metaQuery = useQuery({
    queryKey: ['adminLinkedInMeta'],
    queryFn: () => linkedInApi.getMeta(),
  });

  const posts = postsQuery.data?.data?.data || [];
  const meta = metaQuery.data?.data?.data || {};

  const showFeedback = (msg, tone = 'ok') => {
    setFeedback({ msg, tone });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Invalidate both the admin list/key and the public feed keys so an add /
  // delete is reflected everywhere at once.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminLinkedIn'] });
    queryClient.invalidateQueries({ queryKey: ['adminLinkedInMeta'] });
    queryClient.invalidateQueries({ queryKey: ['linkedIn'] });
    queryClient.invalidateQueries({ queryKey: ['linkedInMeta'] });
  };

  const addMutation = useMutation({
    mutationFn: () => linkedInApi.create({ url, commentary }),
    onSuccess: (res) => {
      invalidate();
      setUrl('');
      setCommentary('');
      showFeedback(res?.data?.message || 'LinkedIn post added.');
    },
    onError: (err) => {
      showFeedback(
        err?.response?.data?.message || err?.message || 'Could not add the post.',
        'error'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => linkedInApi.delete(id),
    onSuccess: () => {
      invalidate();
      showFeedback('LinkedIn post removed from the feed.');
    },
    onError: (err) => {
      showFeedback(err?.response?.data?.message || err?.message || 'Could not remove post.', 'error');
    },
  });

  const handleDelete = (post) => {
    const label = (post.commentary || post.permalink || 'this post').slice(0, 60);
    if (window.confirm(`Remove "${label}" from the feed? (The post stays on LinkedIn.)`)) {
      deleteMutation.mutate(post._id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    addMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <SEO title="Manage LinkedIn | Admin" />

      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
          Content Management
        </span>
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
          Manage LinkedIn Feed
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Paste a LinkedIn post URL to add it to the feed. Cards link out to the
          real post — nothing is fetched automatically.
        </p>
      </div>

      {/* Add a post — URL required, caption optional. */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5 space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
          <Link2 className="w-4 h-4 text-indigo-400" />
          Add a LinkedIn post
        </div>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste the post URL, e.g. https://www.linkedin.com/posts/..."
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition"
        />
        <textarea
          value={commentary}
          onChange={(e) => setCommentary(e.target.value)}
          rows={2}
          placeholder="Optional short caption shown on the card"
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
        />
        <button
          type="submit"
          disabled={!url.trim() || addMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-white"
        >
          {addMutation.isPending ? (
            'Adding…'
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Add to feed</span>
            </>
          )}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Posts</div>
          <div className="mt-1 text-2xl font-sans font-bold text-white">{meta.totalPosts ?? posts.length ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Account</div>
          <div className="mt-1 text-sm font-semibold text-white truncate">
            {meta.vanityName ? `linkedin.com/in/${meta.vanityName}` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Last updated</div>
          <div className="mt-1 text-sm font-semibold text-white">{fmtWhen(meta.lastSyncedAt)}</div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono ${
            feedback.tone === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {postsQuery.isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">
            Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No posts added yet. Paste a LinkedIn post URL above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Post</th>
                  <th className="p-4">Added</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 max-w-md">
                      <div className="text-white text-sm line-clamp-2">
                        {post.commentary || post.permalink || '—'}
                      </div>
                      {post.permalink && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <LinkedinIcon className="w-3.5 h-3.5" />
                          <span className="truncate">{post.permalink}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono text-neutral-400">
                      {fmtWhen(post.publishedAt) || fmtWhen(post.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {post.permalink && (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Open on LinkedIn"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove from feed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLinkedIn;
