import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Linkedin, ExternalLink, ArrowUpRight } from 'lucide-react';
import { linkedInApi } from '../../api/client';

/**
 * Resolve the initial shown in the avatar tile (from vanity name or username).
 */
const initialFor = (post) => {
  const from = post.username || '';
  const c = (from[0] || 'A')?.toUpperCase?.();
  return c;
};

// LinkedIn timestamps are ISO strings through our API — format them for the strip.
const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * The LinkedIn feed section: a grid of text-forward post cards, each linking out
 * to the original LinkedIn post. Mounted inside the Gallery page behind a
 * "LinkedIn" tab — NOT a full page wrapper (no PageTransition/SEO/PageHeader),
 * because Gallery already provides those.
 *
 * Reads the feed through the public `linkedInApi.getAll` (posts) and
 * `linkedInApi.getMeta` (handle/count).
 */
const LinkedInFeed = () => {
  const postsQuery = useQuery({
    queryKey: ['linkedIn'],
    queryFn: () => linkedInApi.getAll({}),
    staleTime: 60_000,
  });
  const metaQuery = useQuery({
    queryKey: ['linkedInMeta'],
    queryFn: () => linkedInApi.getMeta(),
    staleTime: 60_000,
  });

  const posts = postsQuery.data?.data?.data || [];
  const meta = metaQuery.data?.data?.data || {};
  const isLoading = postsQuery.isLoading || metaQuery.isLoading;

  const vanityName = meta.vanityName;
  const handle = meta.username || vanityName;

  return (
    <div className="space-y-6">
      {/* Meta strip: handle + post count + link out to the real profile. */}
      {!isLoading && posts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-[11px] text-neutral-400">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            {handle ? ` · ${handle}` : ''}
          </span>
          {vanityName && (
            <a
              href={`https://www.linkedin.com/in/${encodeURIComponent(vanityName)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              View profile
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0A66C2]/90 text-white shadow-glow">
            <Linkedin className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            No LinkedIn posts yet
          </h3>
          <p className="mx-auto max-w-sm text-sm text-neutral-500">
            The feed is connected but nothing has been synced. An admin needs to
            run a sync from the LinkedIn page under /admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <motion.a
              key={post._id || post.liId}
              href={post.permalink || '#'}
              target={post.permalink ? '_blank' : undefined}
              rel={post.permalink ? 'noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lift"
            >
              {/* Best-effort cover when a thumbnail resolved ('' means text-only). */}
              {post.contentUrl && (
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-100 dark:bg-neutral-900">
                  <img
                    src={post.contentUrl}
                    alt=""
                    loading="lazy"
                    className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-4">
                {/* Author row: initial avatar + network mark. */}
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0A66C2] text-sm font-semibold text-white">
                    {initialFor(post)}
                  </span>
                  <span className="grid h-6 w-6 place-items-center rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                    <Linkedin className="h-3.5 w-3.5" />
                  </span>
                </div>

                {/* Headline (when the post carries one from its og:title). */}
                {post.title && (
                  <h4 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900 dark:text-white">
                    {post.title}
                  </h4>
                )}

                {/* Caption body — the fetched/added description, clamped. */}
                <p className="mt-1.5 line-clamp-4 flex-1 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {post.commentary || 'LinkedIn post'}
                </p>

                {/* Footer: date + type chip + View post link. */}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                    {formatDate(post.publishedAt) || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                    View post
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkedInFeed;
