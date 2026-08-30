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
  Gauge,
  CalendarClock,
} from 'lucide-react';
import { skillsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import Counter from '../components/common/Counter';
import SkillCard from '../components/skills/SkillCard';
import ProficiencyRing from '../components/skills/ProficiencyRing';
import TechMarquee from '../components/skills/TechMarquee';

// Mirrors the `category` enum on the Skill model, in intentional reading order.
const CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps & Cloud',
  'Languages',
  'Tools & Workflow',
];

/**
 * Per-category identity. Every `accent` stays inside the indigo→violet→blue band
 * so the six sections read as one family rather than six unrelated colours — the
 * only saturated colour on the page is the technology logos themselves.
 */
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
    accent: 'from-fuchsia-500 to-violet-500',
  },
  'Tools & Workflow': {
    icon: Wrench,
    blurb: 'Build tooling, testing, and daily workflow.',
    accent: 'from-purple-500 to-indigo-500',
  },
};

const DEFAULT_ACCENT = 'from-indigo-500 to-violet-500';

/** Anchor id for the in-page category jump links. */
const slugify = (value) =>
  value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const Skills = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['skills', 'grouped'],
    queryFn: () => skillsApi.getAll({ grouped: 'true' }),
  });

  const grouped = data?.data?.data || {};

  // Known categories first, then anything else the data contains.
  const categories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]?.length),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c) && grouped[c]?.length),
  ];

  const allSkills = Object.values(grouped).flat();
  const topProficiency = allSkills.filter((s) => (s.proficiency || 0) >= 90).length;
  const maxYears = allSkills.reduce((max, s) => Math.max(max, s.yearsOfExperience || 0), 0);

  // The rings are the page's loudest graphic, so only the strongest few get one.
  const signature = [...allSkills]
    .sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0))
    .slice(0, 4);

  const stats = [
    { label: 'Technologies', value: allSkills.length, suffix: '', icon: Layers },
    { label: 'Advanced Proficiency', value: topProficiency, suffix: '', icon: Gauge },
    { label: 'Years of Experience', value: maxYears, suffix: '+', icon: CalendarClock },
  ];

  return (
    <PageTransition>
      <SEO
        title="Technical Skills & Proficiencies"
        description="Full-stack capabilities across frontend, backend, database, cloud infrastructure, and tooling."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <PageHeader
            eyebrow="Capabilities"
            eyebrowIcon={Sparkles}
            title="Technical Proficiencies"
            lead="The tools and disciplines I reach for when designing, building, and operating production software — grouped by where they sit in the stack."
          />

          {/* Full-bleed logo ticker: breaks out of the text column so the strip
              reads as a band across the page rather than a boxed widget. */}
          {allSkills.length > 0 && (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <TechMarquee names={allSkills.map((s) => s.name)} className="py-1" />
            </div>
          )}

          {!isLoading && allSkills.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-5 transition-colors duration-300 hover:border-indigo-500/40"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/0 blur-2xl transition-colors duration-500 group-hover:bg-indigo-500/20"
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <div className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
                          <Counter value={stat.value} suffix={stat.suffix} />
                        </div>
                        <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                          {stat.label}
                        </div>
                      </div>
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <StatIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!isLoading && signature.length > 0 && (
            <section className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/40 p-6 sm:p-8 backdrop-blur">
              <div className="mb-8 space-y-1">
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
                  Signature stack
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  The technologies I work in most deeply, day to day.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                {signature.map((skill, index) => (
                  <ProficiencyRing
                    key={skill._id || skill.name}
                    skill={skill}
                    index={index}
                    fallbackIcon={Sparkles}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Jump links — six sections is enough scroll to want a shortcut. */}
          {!isLoading && categories.length > 1 && (
            <nav aria-label="Skill categories" className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const NavIcon = CATEGORY_META[category]?.icon || Sparkles;
                return (
                  <a
                    key={category}
                    href={`#${slugify(category)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <NavIcon className="h-3.5 w-3.5" />
                    {category}
                  </a>
                );
              })}
            </nav>
          )}

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 bg-neutral-100 dark:bg-neutral-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <Sparkles className="w-10 h-10 text-neutral-400 mx-auto" />
              <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                No skills listed yet
              </h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                Skills have not been added to the database yet. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              {categories.map((category, categoryIndex) => {
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
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.45, delay: Math.min(categoryIndex, 4) * 0.06 }}
                    // Offsets the anchor scroll clear of the fixed header.
                    className="space-y-6 scroll-mt-28"
                  >
                    <div className="flex items-start gap-4">
                      {/* Gradient tile: the one place each category's accent
                          appears at full strength. */}
                      <div
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-glow`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h2 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
                            {category}
                          </h2>
                          <span className="shrink-0 font-mono text-[11px] text-neutral-400">
                            {skills.length} {skills.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {meta.blurb && (
                          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            {meta.blurb}
                          </p>
                        )}
                        {/* Hairline that fades out — softer than a full rule. */}
                        <div
                          aria-hidden="true"
                          className={`mt-4 h-px w-full bg-gradient-to-r ${accent} opacity-30`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {skills.map((skill, skillIndex) => (
                        <SkillCard
                          key={skill._id || skill.name}
                          skill={skill}
                          index={skillIndex}
                          accent={accent}
                          fallbackIcon={Icon}
                        />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          )}

          <div className="relative overflow-hidden p-8 rounded-3xl bg-neutral-900 text-white border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"
            />
            <div className="relative space-y-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                See these skills applied in production.
              </h2>
              <p className="text-sm text-neutral-300">
                Browse the case studies to see the architecture decisions behind each build.
              </p>
            </div>
            <Link
              to="/projects"
              className="relative shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors"
            >
              <span>View Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
export default Skills;
