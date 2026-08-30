import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2, Instagram as InstagramIcon, Images, ExternalLink, Check } from 'lucide-react';
import { instagramApi } from '../../api/client';
import SEO from '../../components/common/SEO';

/**
 * Format a Date/ISO into a readable local string for the "last synced" label.
 */
const fmtWhen = (iso) => {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  return d.toLocaleString();
};

// Resolve the cover for the row thumbnail (carousels live in children).
const coverFor = (post) =>
  post.thumbnailUrl || post.mediaUrl || post.children?.[0]?.mediaUrl || '';

const isUnconfigured = (meta) => meta?.configured === false;

export const ManageInstagram = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);

  const postsQuery = useQuery({
    queryKey: ['adminInstagram'],
    queryFn: () => instagramApi.getAll({ limit: 200 }),
  });
  const metaQuery = useQuery({
    queryKey: ['adminInstagramMeta'],
    queryFn: () => instagramApi.getMeta(),
  });

  const posts = postsQuery.data?.data?.data || [];
  const meta = metaQuery.data?.data?.data || {};

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Invalidate both the admin list/key and the public feed keys so a sync /
  // delete is reflected everywhere at once.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminInstagram'] });
    queryClient.invalidateQueries({ queryKey: ['adminInstagramMeta'] });
    queryClient.invalidateQueries({ queryKey: ['instagram'] });
    queryClient.invalidateQueries({ queryKey: ['instagramMeta'] });
  };

  const syncMutation = useMutation({
    mutationFn: () => instagramApi.sync(),
    onSuccess: (res) => {
      invalidate();
      const msg =
        res?.data?.message ||
        `Synced ${res?.data?.data?.synced ?? 0} posts (${res?.data?.data?.total ?? 0} stored).`;
      showFeedback(msg);
    },
    onError: (err) => {
      showFeedback(
        err?.response?.data?.message || err?.message || 'Sync failed.'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instagramApi.delete(id),
    onSuccess: () => {
      invalidate();
      showFeedback('Instagram post removed from the feed.');
    },
    onError: (err) => {
      showFeedback(err?.response?.data?.message || err?.message || 'Could not remove post.');
    },
  });

  const handleDelete = (post) => {
    const label = (post.caption || post.igId || 'this post').slice(0, 60);
    if (window.confirm(`Remove "${label}" from the feed? (The post stays on Instagram.)`)) {
      deleteMutation.mutate(post._id);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Manage Instagram | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Content Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Manage Instagram Feed
          </h1>
        </div>

        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending || isUnconfigured(meta)}
          title={
            isUnconfigured(meta)
              ? 'Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in server/.env to enable syncing.'
              : 'Fetch the latest posts from Instagram'
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-white"
        >
          <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          <span>{syncMutation.isPending ? 'Syncing…' : 'Sync Now'}</span>
        </button>
      </div>

      {!isUnconfigured(meta) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Posts</div>
            <div className="mt-1 text-2xl font-sans font-bold text-white">
              {meta.totalPosts ?? postsQuery.data?.data?.data?.length ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Account</div>
            <div className="mt-1 text-sm font-semibold text-white truncate">
              {meta.username ? `@${meta.username.replace(/^@/, '')}` : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Last synced</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {fmtWhen(meta.lastSyncedAt)}
            </div>
            {meta.syncStatus === 'error' && meta.lastError && (
              <div className="mt-1 text-[11px] font-mono text-red-400 line-clamp-2">
                {meta.lastError}
              </div>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      {isUnconfigured(meta) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
            <InstagramIcon className="w-4 h-4" />
            Instagram sync is not configured
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Set <code className="font-mono">INSTAGRAM_ACCESS_TOKEN</code> and{' '}
            <code className="font-mono">INSTAGRAM_USER_ID</code> in{' '}
            <code className="font-mono">server/.env</code> (after switching your
            Instagram account to professional and creating a Meta app), then
            restart the server and hit "Sync Now". Until then the public feed
            stays empty — the rest of the site is unaffected.
          </p>
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {postsQuery.isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">
            Loading feed...
          </div>
        ) : isUnconfigured(meta) ? null : posts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <Images className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No posts synced yet. Hit "Sync Now" to pull your feed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Media</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Caption</th>
                  <th className="p-4">Published</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {posts.map((post) => {
                  const src = coverFor(post);
                  const label = (post.caption || '').slice(0, 80);
                  return (
                    <tr key={post._id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="p-4">
                        {src ? (
                          <img
                            src={src}
                            alt={label || 'Instagram post'}
                            loading="lazy"
                            className="h-14 w-14 rounded-lg object-cover bg-neutral-800"
                          />
                        ) : (
                          <span className="grid h-14 w-14 place-items-center rounded-lg bg-neutral-800 text-neutral-600">
                            <InstagramIcon className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 font-mono">
                          {post.mediaType || 'IMAGE'}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="text-white text-sm line-clamp-2">{label || '—'}</div>
                      </td>
                      <td className="p-4 font-mono text-neutral-400">
                        {fmtWhen(post.timestamp)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.permalink && (
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Open on Instagram"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInstagram;
