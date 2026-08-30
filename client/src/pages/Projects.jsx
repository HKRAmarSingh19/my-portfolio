import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Github,
  Star,
  X,
  FolderGit2,
} from 'lucide-react';
import { projectsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import { TechBadge, TechBadgeList } from '../components/common/TechBadge';

/**
 * Gradients for projects with no cover image. Picked by a hash of the title so a
 * given project always gets the same one, and all of them sit in the site's
 * indigo→violet→blue band.
 */
const PLACEHOLDER_GRADIENTS = [
  'from-indigo-500 via-indigo-600 to-violet-700',
  'from-violet-500 via-purple-600 to-indigo-700',
  'from-blue-500 via-indigo-600 to-violet-700',
  'from-sky-500 via-blue-600 to-indigo-700',
  'from-fuchsia-500 via-violet-600 to-indigo-700',
];

const gradientFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return PLACEHOLDER_GRADIENTS[hash % PLACEHOLDER_GRADIENTS.length];
};

export const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTech, setSelectedTech] = useState('');

  // Fetch the full set once, then facet/filter on the client. Portfolio
  // collections are small, filtering stays instant, and the category/tech
  // pills keep showing every option instead of collapsing to the active filter.
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll({}),
  });

  const projects = data?.data?.data || [];

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))).sort(),
    [projects]
  );

  const techStacks = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.techStack || []))).sort(),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      if (selectedCategory && project.category !== selectedCategory) return false;
      if (selectedTech && !(project.techStack || []).includes(selectedTech)) return false;
      if (!term) return true;

      return (
        project.title?.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term) ||
        (project.techStack || []).some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [projects, searchQuery, selectedCategory, selectedTech]);

  const hasActiveFilters = Boolean(searchQuery || selectedCategory || selectedTech);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTech('');
  };

  const countFor = (category) => projects.filter((p) => p.category === category).length;

  return (
    <PageTransition>
      <SEO
        title="Selected Work & Engineering Projects"
        description="Full-stack case studies spanning MERN applications, API architecture, and interface systems."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <PageHeader
            eyebrow="Selected Work"
            eyebrowIcon={FolderGit2}
            title="Projects & Case Studies"
            lead="A record of systems I have designed and shipped — from database modelling and API architecture through to the interface layer."
          />

          <div className="space-y-5 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, description, or technology..."
                aria-label="Search projects"
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

            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                    selectedCategory === ''
                      ? 'bg-indigo-600 font-semibold text-white'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  All Work
                  <span className="ml-1.5 opacity-60">{projects.length}</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === category ? '' : category)
                    }
                    className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-600 font-semibold text-white'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    {category}
                    <span className="ml-1.5 opacity-60">{countFor(category)}</span>
                  </button>
                ))}
              </div>
            )}

            {techStacks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Stack
                </span>
                {/* Logo chips double as filters — the marks make the row scannable
                    in a way a list of grey words never was. */}
                {techStacks.map((tech) => (
                  <TechBadge
                    key={tech}
                    as="button"
                    name={tech}
                    size="sm"
                    interactive
                    active={selectedTech === tech}
                    onClick={() => setSelectedTech(selectedTech === tech ? '' : tech)}
                    aria-pressed={selectedTech === tech}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[11px] text-neutral-400">
                {hasActiveFilters
                  ? `${filteredProjects.length} of ${projects.length} projects`
                  : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-neutral-500 transition-colors hover:text-indigo-500"
                >
                  <X className="h-3 w-3" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-80 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900"
                />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 py-20 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                No projects found
              </h3>
              <p className="mx-auto max-w-sm text-sm text-neutral-500">
                {projects.length === 0
                  ? 'No projects have been published yet. Check back shortly.'
                  : 'Try a different keyword or clear the active filters.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, index) => {
                const to = `/projects/${project.slug || project._id}`;
                const gradient = gradientFor(project.title || project._id || '');

                return (
                  <motion.article
                    key={project._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06 }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lift"
                  >
                    <Link to={to} className="relative block h-44 overflow-hidden">
                      {project.coverImage ? (
                        <>
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            loading="lazy"
                            className="h-full w-full bg-neutral-100 object-cover transition-transform duration-500 group-hover:scale-105 dark:bg-neutral-950"
                          />
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          />
                        </>
                      ) : (
                        /* Generated cover so a project without a screenshot still
                           reads as a card rather than a bare block of text. */
                        <div
                          className={`relative grid h-full w-full place-items-center bg-gradient-to-br ${gradient}`}
                        >
                          <div aria-hidden="true" className="absolute inset-0 bg-grid-light opacity-60" />
                          <div aria-hidden="true" className="absolute inset-0 grain opacity-30" />
                          <span className="relative select-none font-display text-5xl font-bold text-white/90 transition-transform duration-500 group-hover:scale-110">
                            {(project.title || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {project.featured && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-neutral-950/80 px-2 py-0.5 font-mono text-[10px] text-indigo-300 backdrop-blur">
                          <Star className="h-2.5 w-2.5 fill-indigo-300" />
                          Featured
                        </span>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {project.category || 'Full Stack'}
                          </span>
                          <div className="flex items-center gap-2">
                            {project.repoUrl && (
                              <a
                                href={project.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-400 transition-colors hover:text-indigo-500"
                                aria-label={`${project.title} source repository`}
                              >
                                <Github className="h-4 w-4" />
                              </a>
                            )}
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-400 transition-colors hover:text-indigo-500"
                                aria-label={`${project.title} live demo`}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <Link to={to}>
                          <h2 className="text-xl font-display font-bold leading-snug text-neutral-900 transition-colors group-hover:text-indigo-500 dark:text-white">
                            {project.title}
                          </h2>
                        </Link>

                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {project.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <TechBadgeList items={project.techStack || []} limit={4} />

                        <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
                          <Link
                            to={to}
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-indigo-600 transition-transform group-hover:translate-x-1 dark:text-indigo-400"
                          >
                            <span>Read case study</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
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
export default Projects;
