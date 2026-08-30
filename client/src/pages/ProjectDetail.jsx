import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Github, Layers, Calendar, Share2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { projectsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import { TechBadgeList } from '../components/common/TechBadge';

export const ProjectDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => projectsApi.getBySlug(slug),
  });

  const project = data?.data?.data;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="pt-36 pb-20 max-w-4xl mx-auto px-4 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="h-72 w-full bg-neutral-200 dark:bg-neutral-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pt-36 pb-20 max-w-xl mx-auto px-4 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
          Project Not Found
        </h2>
        <p className="text-neutral-500">
          The project you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  // Cover image first, then any additional screenshots, de-duplicated.
  const gallery = Array.from(
    new Set([project.coverImage, ...(project.images || [])].filter(Boolean))
  );

  return (
    <PageTransition>
      <SEO title={project.title} description={project.description} />

      <article className="relative overflow-x-clip pt-28 sm:pt-36 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
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
            <span>Back to projects</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-indigo-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>

        <header className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
              {project.category || 'Full Stack'}
            </span>
            {project.createdAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
            {project.title}
          </h1>

          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 italic font-light border-l-2 border-indigo-500 pl-4">
            {project.description}
          </p>

          {(project.liveUrl || project.repoUrl) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-all group"
                >
                  <span>View Live Site</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-medium text-sm border border-neutral-200 dark:border-neutral-800 transition-all"
                >
                  <Github className="w-4 h-4" />
                  <span>Source Code</span>
                </a>
              )}
            </div>
          )}
        </header>

        {gallery.length > 0 && (
          <div className="space-y-3">
            <motion.div
              key={activeImage}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg bg-neutral-950"
            >
              <img
                src={gallery[activeImage]}
                alt={`${project.title} — screenshot ${activeImage + 1}`}
                className="w-full h-full object-cover max-h-[520px]"
              />
            </motion.div>

            {gallery.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                {gallery.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View screenshot ${index + 1}`}
                    aria-current={index === activeImage}
                    className={`h-16 w-24 rounded-xl overflow-hidden border transition-all ${
                      index === activeImage
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {project.techStack?.length > 0 && (
          <section className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"
            />
            <div className="relative space-y-4">
              <h2 className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Layers className="h-3.5 w-3.5" />
                </span>
                <span>Technology Stack</span>
              </h2>
              {/* Logo chips, same component as the project cards and the resume,
                  so a technology looks identical wherever it appears. */}
              <TechBadgeList items={project.techStack} size="md" />
            </div>
          </section>
        )}

        {project.longDescription && (
          <div className="prose-editorial">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {project.longDescription}
            </ReactMarkdown>
          </div>
        )}

        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-white sm:flex-row sm:items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"
          />
          <div className="relative space-y-2">
            <h3 className="text-xl font-display font-bold tracking-tight sm:text-2xl">
              Interested in working together?
            </h3>
            <p className="text-sm text-neutral-300">
              I am open to consulting engagements and technical leadership roles.
            </p>
          </div>
          <Link
            to="/contact"
            className="relative inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <span>Get in touch</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </PageTransition>
  );
};
export default ProjectDetail;
