import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Terminal,
  Code2,
  Server,
  Cpu,
  ArrowRight,
  Sparkles,
  Layers,
  CalendarClock,
  FolderGit2,
} from 'lucide-react';
import { projectsApi, skillsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import Counter from '../components/common/Counter';
import { TechBadge } from '../components/common/TechBadge';

/**
 * Each principle gets its own accent inside the indigo→violet→blue band, so the
 * four cards read as a set while still being individually distinguishable.
 */
const PRINCIPLES = [
  {
    title: 'Solve Real Problems',
    description:
      'Prioritizing typography, generous whitespace, and purposeful micro-interactions over distracting visual decoration.',
    icon: Terminal,
    accent: 'from-indigo-500 to-blue-500',
  },
  {
    title: 'Resilient Architecture',
    description:
      'Strict schema validation at boundaries, clear domain separation, and defensive error handling across backend services.',
    icon: Server,
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    title: 'Performance by Default',
    description:
      'Zero unnecessary dependencies, aggressive caching strategies, efficient query indexing, and optimized asset delivery.',
    icon: Cpu,
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Developer Ergonomics',
    description:
      'Clear documentation, predictable project structures, and automated CI/CD pipelines to ensure team velocity.',
    icon: Code2,
    accent: 'from-fuchsia-500 to-violet-500',
  },
];

// Hand-curated rather than read from the skills collection: this is the everyday
// working set, which is a deliberately shorter list than everything I can use.
const TOOLKIT = [
  {
    label: 'Frontend',
    accent: 'from-indigo-500 to-blue-500',
    items: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'TanStack Query', 'TypeScript'],
  },
  {
    label: 'Backend & Data',
    accent: 'from-violet-500 to-indigo-500',
    items: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'Redis', 'PostgreSQL', 'Zod', 'JWT'],
  },
  {
    label: 'DevOps & Tooling',
    accent: 'from-sky-500 to-indigo-500',
    items: ['Docker', 'GitHub Actions', 'Vercel', 'Vite', 'Linux', 'Figma'],
  },
];

export const About = () => {
  // Counts come from the live collections so the numbers can't go stale the way
  // a hard-coded "20+ projects" line would.
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll({}),
  });

  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'grouped'],
    queryFn: () => skillsApi.getAll({ grouped: 'true' }),
  });

  const projects = projectsData?.data?.data || [];
  const skills = Object.values(skillsData?.data?.data || {}).flat();
  const maxYears = skills.reduce((max, s) => Math.max(max, s.yearsOfExperience || 0), 0);

  const facts = [
    { label: 'Projects shipped', value: projects.length, suffix: '', icon: FolderGit2 },
    { label: 'Technologies', value: skills.length, suffix: '', icon: Layers },
    { label: 'Years building', value: maxYears, suffix: '+', icon: CalendarClock },
  ];

  const hasFacts = facts.some((fact) => fact.value > 0);

  return (
    <PageTransition>
      <SEO
        title="About Me & Engineering Philosophy"
        description="Learn more about Amar Singh, full-stack software engineer, design philosophy, and career journey."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <PageHeader
            eyebrow="Engineering Narrative"
            eyebrowIcon={Sparkles}
            title="Curious by nature, driven by problems, and always building something new."
          >
            <div className="prose-editorial space-y-4 text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">
              <p>
                I’m a Software Developer passionate about building modern applications, exploring AI/ML, and working with emerging technologies. I enjoy turning ideas into practical solutions and learning through real-world projects.
              </p>
              <p>
                I believe great software emerges at the intersection of rigorous engineering
                fundamentals and restrained design. I enjoy turning complex business requirements
                into elegant, accessible, and fast web products that users love interacting with.
              </p>
            </div>
          </PageHeader>

          {hasFacts && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {facts.map((fact, index) => {
                const FactIcon = fact.icon;
                return (
                  <motion.div
                    key={fact.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 transition-colors duration-300 hover:border-indigo-500/40"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/0 blur-2xl transition-colors duration-500 group-hover:bg-indigo-500/20"
                    />
                    <FactIcon className="relative h-4 w-4 text-indigo-500" />
                    <div className="relative mt-3 text-xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
                      <Counter value={fact.value} suffix={fact.suffix} />
                    </div>
                    <div className="relative mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-neutral-400">
                      {fact.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <section className="space-y-8 border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Values &amp; Standards
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                Engineering Principles
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {PRINCIPLES.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <motion.div
                    key={principle.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lift"
                  >
                    {/* Oversized index numeral, sitting behind the content as
                        texture rather than as something to read. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-1 -top-4 select-none font-display text-7xl font-bold leading-none text-neutral-100 dark:text-neutral-800/60"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="relative space-y-3">
                      <div
                        className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${principle.accent} text-white shadow-glow transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                        {principle.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {principle.description}
                      </p>
                    </div>

                    <div
                      aria-hidden="true"
                      className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r ${principle.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-70`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6 border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Toolkit
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                Everyday Tools &amp; Workflow
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TOOLKIT.map((group, groupIndex) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: groupIndex * 0.08 }}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900/60 p-5 space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                      {group.label}
                    </h3>
                    <div
                      aria-hidden="true"
                      className={`h-px w-full bg-gradient-to-r ${group.accent} opacity-40`}
                    />
                  </div>
                  {/* Logo chips instead of a bulleted list — the marks are what
                      make a stack readable at a glance. */}
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <TechBadge key={item} name={item} size="sm" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-white sm:flex-row sm:items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"
            />
            <div className="relative space-y-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                Interested in my career timeline?
              </h2>
              <p className="text-sm text-neutral-300">
                View structured roles, education, certifications, and achievements.
              </p>
            </div>
            <Link
              to="/resume"
              className="relative inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <span>View Full Resume</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
export default About;
