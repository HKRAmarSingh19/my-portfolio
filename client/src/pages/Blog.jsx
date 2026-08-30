import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Clock, Calendar, ArrowRight, Eye, X, PenLine } from 'lucide-react';
import { blogApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

export const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blog', searchQuery, selectedTag],
    queryFn: () =>
      blogApi.getAll({
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
        publishedOnly: 'true',
      }),
  });

  const posts = data?.data?.data || [];

  // The tag list is derived from the current response, so it narrows as filters
  // apply. Memoised only to keep the render cheap on re-typing.
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags || []))),
    [posts]
  );

  return (
    <PageTransition>
      <SEO
        title="Engineering Blog & Technical Insights"
        description="Articles on modern full-stack development, software architecture, and minimal design systems."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <PageHeader
            eyebrow="Engineering Journal"
            eyebrowIcon={PenLine}
            title="Writing on Architecture, Systems & UI"
            lead="Thoughts on web performance, clean abstractions, MERN patterns, and intentional software craftsmanship."
          />

          <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, topic, or keyword..."
                aria-label="Search articles"
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-3 pl-10 pr-10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-indigo-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                    selectedTag === ''
                      ? 'bg-indigo-600 font-semibold text-white'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  All Topics
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                      selectedTag === tag
                        ? 'bg-indigo-600 font-semibold text-white'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 py-20 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                No articles found
              </h3>
              <p className="mx-auto max-w-sm text-sm text-neutral-500">
                Try searching with another keyword or removing your topic filter.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post, index) => {
                const to = `/blog/${post.slug || post._id}`;

                return (
                  <motion.article
                    key={post._id || index}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lift"
                  >
                    {/* Accent rail on the left edge, revealed on hover — cheaper
                        visually than a border colour change on the whole card. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-indigo-500 to-violet-500 transition-transform duration-300 group-hover:scale-y-100"
                    />

                    <div className="flex gap-5 p-6 sm:p-8">
                      {/* Article index, monospaced so the column stays aligned. */}
                      <span
                        aria-hidden="true"
                        className="hidden shrink-0 select-none pt-0.5 font-mono text-xs text-neutral-300 dark:text-neutral-700 sm:block"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-col justify-between gap-2 font-mono text-xs text-neutral-400 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(post.publishedAt)}</span>
                            <span className="text-neutral-300 dark:text-neutral-700">•</span>
                            <Clock className="h-3.5 w-3.5" />
                            <span>{post.readingTime || 5} min read</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {post.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-600 dark:text-indigo-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Link to={to}>
                          <h2 className="text-xl sm:text-2xl font-display font-bold leading-snug text-neutral-900 transition-colors group-hover:text-indigo-500 dark:text-white">
                            {post.title}
                          </h2>
                        </Link>

                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {post.excerpt}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
                          <Link
                            to={to}
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-indigo-600 transition-transform group-hover:translate-x-1 dark:text-indigo-400"
                          >
                            <span>Read complete article</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>

                          {post.views > 0 && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-neutral-400">
                              <Eye className="h-3 w-3" />
                              {post.views}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};
export default Blog;
