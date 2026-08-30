import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Calendar, Share2, Check, Eye, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { blogApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';

export const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['blogPost', slug],
    queryFn: () => blogApi.getBySlug(slug),
  });

  const post = data?.data?.data;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="pt-36 pb-20 max-w-3xl mx-auto px-4 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="h-64 w-full bg-neutral-200 dark:bg-neutral-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pt-36 pb-20 max-w-xl mx-auto px-4 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">Article Not Found</h2>
        <p className="text-neutral-500">The article you are looking for does not exist or has been unpublished.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <SEO title={post.title} description={post.excerpt} />

      <article className="relative overflow-x-clip pt-28 sm:pt-36 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Anchors the top of the page, matching the other public routes. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] overflow-hidden"
        >
          <div className="absolute -top-32 left-0 h-[24rem] w-[24rem] rounded-full bg-indigo-500/[0.10] blur-3xl sm:left-10" />
          <div className="absolute -top-20 right-0 h-[18rem] w-[18rem] rounded-full bg-violet-500/[0.08] blur-3xl" />
        </div>

        <div className="relative flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to articles</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-indigo-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>

        <header className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime || 5} min read
            </span>
            {post.views > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {post.views} views
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags?.map((t) => (
              <span key={t} className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        </header>

        {post.coverImage && (
          <div className="rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg bg-neutral-950 max-h-[440px]">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.excerpt && (
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 italic font-light border-l-2 border-indigo-500 pl-4 my-6">
            {post.excerpt}
          </p>
        )}

        <div className="prose-editorial">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="relative flex flex-col items-start justify-between gap-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900/60 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-sm font-bold text-white">
              AS
            </span>
            <div>
              <h4 className="text-sm font-display font-bold text-neutral-900 dark:text-white">
                Amar Singh
              </h4>
              <p className="text-xs text-neutral-500">
                Full-Stack Software Engineer &amp; Technical Author
              </p>
            </div>
          </div>
          <Link
            to="/blog"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 font-mono text-xs text-neutral-600 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>More Articles</span>
          </Link>
        </div>
      </article>
    </PageTransition>
  );
};
export default BlogPost;

