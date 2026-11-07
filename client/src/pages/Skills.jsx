
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Layout,
  Server,
  Database,
  Cloud,
  Code2,
  Wrench,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';

import { skillsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import PageHeroBand from '../components/common/PageHeroBand';
import Counter from '../components/common/Counter';
import { TechBadge } from '../components/common/TechBadge';

// Category ordering
const CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps & Cloud',
  'Languages',
  'Tools & Workflow',
];

// Category metadata
const CATEGORY_META = {
  Frontend: {
    icon: Layout,
    blurb: 'Interface architecture, design systems, and motion.',
    accent: 'from-indigo-500 to-blue-500',
  },
  Backend: {
    icon: Server,
    blurb: 'APIs, authentication, and service design.',
    accent: 'from-violet-500 to-indigo-500',
  },
  Database: {
    icon: Database,
    blurb: 'Data modelling, indexing, and caching layers.',
    accent: 'from-blue-500 to-cyan-500',
  },
  'DevOps & Cloud': {
    icon: Cloud,
    blurb: 'Deployment pipelines, containers, and infrastructure.',
    accent: 'from-sky-500 to-indigo-500',
  },
  Languages: {
    icon: Code2,
    blurb: 'Core languages and runtime fundamentals.',
    accent: 'from-indigo-500 to-violet-500',
  },
  'Tools & Workflow': {
    icon: Wrench,
    blurb: 'Build tooling, testing, and daily workflow.',
    accent: 'from-blue-500 to-indigo-500',
  },
};

const DEFAULT_ACCENT = 'from-indigo-500 to-blue-500';

// Category anchor IDs
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const Skills = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['skills', 'grouped'],
    queryFn: () => skillsApi.getAll({ grouped: 'true' }),
  });

  const grouped = data?.data?.data || {};

  // Keep original database records unchanged.
  const categories = [
    ...CATEGORY_ORDER.filter(
      (category) => grouped[category]?.length
    ),
    ...Object.keys(grouped).filter(
      (category) =>
        !CATEGORY_ORDER.includes(category) &&
        grouped[category]?.length
    ),
  ];

  const allSkills = Object.values(grouped).flat();

  // Statistics without proficiency or experience
  const stats = [
    {
      label: 'Skill Entries',
      value: allSkills.length,
      icon: Layers,
    },
    {
      label: 'Skill Categories',
      value: categories.length,
      icon: Layout,
    },
  ];

  return (
    <PageTransition>
      <SEO
        title="Technical Skills & Proficiencies"
        description="Full-stack capabilities across frontend, backend, database, cloud infrastructure, and tooling."
      />

      <main className="relative overflow-x-clip pt-28 sm:pt-36 pb-24">

        <PageHeroBand />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          {/* =================================
              PAGE HEADER
          ================================= */}

          <PageHeader
            eyebrow="Capabilities"
            eyebrowIcon={Sparkles}
            title="Technical Proficiencies"
            lead="The tools and disciplines I reach for when designing, building, and operating production software — grouped by where they sit in the stack."
          />


          {/* =================================
              STATISTICS
          ================================= */}

          {!isLoading && !isError && allSkills.length > 0 && (
            <div className="grid grid-cols-2 gap-4">

              {stats.map((stat, index) => {
                const StatIcon = stat.icon;

                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-900"
                  >

                    <div className="flex items-center justify-between">

                      <div>
                        <div className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white">
                          <Counter value={stat.value} />
                        </div>

                        <div className="mt-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-neutral-400">
                          {stat.label}
                        </div>
                      </div>

                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-all group-hover:bg-indigo-500 group-hover:text-white">
                        <StatIcon className="h-5 w-5" />
                      </div>

                    </div>

                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 group-hover:w-full" />

                  </motion.div>
                );
              })}

            </div>
          )}


          {/* =================================
              CATEGORY NAVIGATION
          ================================= */}

          {!isLoading && !isError && categories.length > 1 && (
            <nav
              aria-label="Skill categories"
              className="flex flex-wrap gap-2"
            >

              {categories.map((category) => {
                const NavIcon =
                  CATEGORY_META[category]?.icon || Sparkles;

                return (
                  <a
                    key={category}
                    href={`#${slugify(category)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                  >
                    <NavIcon className="h-3.5 w-3.5" />
                    {category}
                  </a>
                );
              })}

            </nav>
          )}


          {/* =================================
              LOADING STATE
          ================================= */}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-52 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse"
                />
              ))}

            </div>
          )}


          {/* =================================
              ERROR STATE
          ================================= */}

          {isError && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">
                Unable to load skills. Please try refreshing the page.
              </p>
            </div>
          )}


          {/* =================================
              EMPTY STATE
          ================================= */}

          {!isLoading && !isError && categories.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">

              <Sparkles className="w-10 h-10 text-neutral-400 mx-auto" />

              <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                No skills listed yet
              </h3>

              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                Skills have not been added to the database yet. Check back shortly.
              </p>

            </div>
          )}


          {/* =================================
              SKILL CATEGORIES
          ================================= */}

          {!isLoading && !isError && categories.length > 0 && (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {categories.map((category, index) => {

                const meta = CATEGORY_META[category] || {};
                const Icon = meta.icon || Sparkles;
                const accent = meta.accent || DEFAULT_ACCENT;
                const skills = grouped[category] || [];

                return (
                  <motion.section
                    key={category}
                    id={slugify(category)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{
                      duration: 0.45,
                      delay: (index % 2) * 0.08,
                    }}
                    className="group relative min-w-0 scroll-mt-28 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/80 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/5"
                  >

                    {/* Top gradient accent */}

                    <div
                      className={`absolute top-0 left-0 h-[3px] w-full bg-gradient-to-r ${accent} opacity-70`}
                    />

                    {/* Subtle background glow */}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/0 blur-3xl transition-colors duration-500 group-hover:bg-indigo-400/10"
                    />

                    {/* Category heading */}

                    <div className="relative flex items-start gap-4">

                      <div
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-indigo-500/10`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <h2 className="text-lg sm:text-xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                            {category}
                          </h2>

                          <span className="font-mono text-[10px] text-neutral-400">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                        </div>

                        {meta.blurb && (
                          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {meta.blurb}
                          </p>
                        )}

                      </div>

                    </div>


                    {/* Category divider */}

                    <div
                      className={`relative mt-6 mb-6 h-px w-full bg-gradient-to-r ${accent} opacity-30`}
                    />


                    {/* All technologies together */}

                    <div className="relative min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        {skills.map((skill) => (

                          <div
                            key={skill._id || skill.name}
                            className="inline-flex max-w-full min-w-0 items-center rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/70 px-3 py-2 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/70 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                          >

                            <div className="min-w-0 max-w-full [&_*]:!max-w-full [&_*]:!whitespace-normal [&_*]:!break-words">

                              <TechBadge
                                name={skill.name}
                                size="sm"
                              />

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>


                    {/* Bottom category information */}

                    <div className="relative mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">

                      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                        {category}
                      </span>

                      <span className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 font-medium">
                        PART OF MY TOOLKIT
                      </span>

                    </div>

                  </motion.section>
                );
              })}

            </div>

          )}


          {/* =================================
              PROJECT CTA
          ================================= */}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-900 border border-blue-500/30 p-8 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/10">

            {/* Background glow */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-indigo-300/10 blur-3xl"
            />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-7">

              <div className="max-w-xl space-y-3">

                <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white">
                  See these skills applied in production.
                </h2>

                <p className="text-sm leading-relaxed text-blue-100/80">
                  Browse the case studies to see the architecture decisions behind each build.
                </p>

              </div>

              <Link
                to="/projects"
                className="group relative shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-blue-800 font-semibold text-sm transition-all duration-300 hover:bg-blue-50 hover:gap-4 shadow-lg shadow-blue-950/10"
              >
                <span>View Projects</span>

                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

            </div>

          </section>

        </div>

      </main>
    </PageTransition>
  );
};

export default Skills;
