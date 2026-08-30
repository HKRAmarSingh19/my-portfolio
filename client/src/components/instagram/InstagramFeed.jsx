import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Play, Clapperboard, Images, ExternalLink } from 'lucide-react';
import { instagramApi } from '../../api/client';

/**
 * Resolve a stable cover image for a feed card. Carousels live in `children`
 * (which may also hold the "golden" rendering when media_type is CAROUSEL);
 * videos expose `thumbnail_url`; photos just use `media_url`.
 */
const coverFor = (post) =>
  post.thumbnailUrl ||
  post.mediaUrl ||
  post.children?.[0]?.mediaUrl ||
  '';

const isVideo = (post) =>
  post.mediaType === 'VIDEO' || post.mediaType === 'REELS';

const isCarousel = (post) => post.mediaType === 'CAROUSEL_ALBUM';

// IG timestamps arrive ISO strings through the API — format them for the strip.
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
 * The Instagram feed section: a responsive grid of the account's posts, each
 * linking out to the original Instagram post. Mounted inside the Gallery page
 * behind an "Instagram" tab — deliberately NOT a full page wrapper (no
 * PageTransition/SEO/PageHeader), because Gallery already provides those.
 *
 * Reads the feed through the public `instagramApi.getAll` (posts) and
 * `instagramApi.getMeta` (handle/count) endpoints.
 */
const InstagramFeed = () => {
  const postsQuery = useQuery({
    queryKey: ['instagram'],
    queryFn: () => instagramApi.getAll({}),
    staleTime: 60_000,
  });
  const metaQuery = useQuery({
    queryKey: ['instagramMeta'],
    queryFn: () => instagramApi.getMeta(),
    staleTime: 60_000,
  });

  const posts = postsQuery.data?.data?.data || [];
  const meta = metaQuery.data?.data?.data || {};
  const isLoading = postsQuery.isLoading || metaQuery.isLoading;

  const handle = meta.username?.replace(/^@/, '');

  return (
    <div className="space-y-6">
      {/* Meta strip: handle + post count + link out to the real profile. */}
      {!isLoading && posts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-[11px] text-neutral-400">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            {handle ? ` · @${handle}` : ''}
          </span>
          <a
            href={`https://www.instagram.com/${handle || ''}`.replace(/\/+$/, '')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            View profile
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
            <Images className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            No Instagram posts yet
          </h3>
          <p className="mx-auto max-w-sm text-sm text-neutral-500">
            The feed is connected but nothing has been synced. An admin needs to
            run a sync from the Instagram page under /admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {posts.map((post, index) => {
            const src = coverFor(post);
            const video = isVideo(post);
            const carousel = isCarousel(post);
            return (
              <motion.a
                key={post._id || post.igId}
                href={post.permalink || '#'}
                target={post.permalink ? '_blank' : undefined}
                rel={post.permalink ? 'noreferrer' : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
                className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100 dark:bg-neutral-900 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lift"
              >
                {src ? (
                  <img
                    src={src}
                    alt={post.caption || 'Instagram post'}
                    loading="lazy"
                    className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-300 dark:text-neutral-600">
                    <Images className="h-8 w-8" />
                  </div>
                )}

                {/* Type badges (top-left) */}
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                  {video && (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur">
                      <Play className="h-3.5 w-3.5 fill-white" />
                    </span>
                  )}
                  {carousel && (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur">
                      <Clapperboard className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                {/* Caption + date strip on hover */}
                <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-3 pt-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="line-clamp-2 text-[12px] leading-snug text-white">
                    {post.caption || 'Instagram post'}
                  </p>
                  {post.timestamp && (
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-white/70">
                      {formatDate(post.timestamp)}
                    </span>
                  )}
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstagramFeed;
