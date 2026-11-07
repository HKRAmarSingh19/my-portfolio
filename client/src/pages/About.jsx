
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

import {
  projectsApi,
  skillsApi,
} from '../api/client';

import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import Counter from '../components/common/Counter';
import { TechBadge } from '../components/common/TechBadge';

// Personal philosophy
const PRINCIPLES = [
  {
    number: '01',
    title: 'Think Before You Build',
    keyword: 'UNDERSTANDING',
    description:
      'Har problem ka solution code likhna nahi hota. I like understanding the problem first, exploring possibilities, and building something that actually makes a difference.',
  },
  {
    number: '02',
    title: 'Ideas into Reality',
    keyword: 'CREATIVITY',
    description:
      'Ideas toh bahut aate hain, but the real satisfaction is turning them into something real. I enjoy experimenting, creating, and bringing my thoughts to life through code.',
  },
  {
    number: '03',
    title: 'Never Stop Exploring',
    keyword: 'CURIOSITY',
    description:
      'Nayi cheezein seekhne ka alag hi maza hai. From full-stack development to AI and DevOps, I enjoy exploring unfamiliar technologies and challenging myself to grow.',
  },
  {
    number: '04',
    title: 'Better Together',
    keyword: 'COLLABORATION',
    description:
      'Akele seekhna achha hai, but growing together is even better. I enjoy sharing ideas, collaborating with people, learning from different perspectives, and building things together.',
  },
];

// Skill category ordering
const CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps & Cloud',
  'Languages',
  'Tools & Workflow',
];

// Subtle toolkit accents
const CATEGORY_ACCENT = {
  Frontend: 'from-indigo-400 to-violet-400',
  Backend: 'from-violet-400 to-purple-400',
  Database: 'from-slate-400 to-indigo-400',
  'DevOps & Cloud': 'from-sky-400 to-indigo-400',
  Languages: 'from-purple-400 to-pink-400',
  'Tools & Workflow': 'from-indigo-400 to-slate-400',
};

const DEFAULT_ACCENT = 'from-indigo-400 to-violet-400';

export const About = () => {
  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll({}),
  });

  // Fetch grouped skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'grouped'],
    queryFn: () => skillsApi.getAll({ grouped: 'true' }),
  });

  const projects = projectsData?.data?.data || [];
  const groupedSkills = skillsData?.data?.data || {};
  const skills = Object.values(groupedSkills).flat();

  // Prepare toolkit
  const toolkit = [
    ...CATEGORY_ORDER.filter(
      (category) => groupedSkills[category]?.length
    ),
    ...Object.keys(groupedSkills).filter(
      (category) =>
        !CATEGORY_ORDER.includes(category) &&
        groupedSkills[category]?.length
    ),
  ].map((category) => ({
    label: category,
    accent: CATEGORY_ACCENT[category] || DEFAULT_ACCENT,
    items: (groupedSkills[category] || []).map(
      (skill) => skill.name
    ),
  }));

  // Highest experience among listed skills
  const maxYears = skills.reduce(
    (max, skill) =>
      Math.max(max, skill.yearsOfExperience || 0),
    0
  );

  // Dynamic statistics
  const facts = [
    {
      label: 'Projects built',
      value: projects.length,
      suffix: '+',
    },
    {
      label: 'Technologies',
      value: skills.length,
      suffix: '+',
    },
    {
      label: 'Highest skill experience',
      value: maxYears,
      suffix: '+',
    },
  ];

  const hasFacts = facts.some((fact) => fact.value > 0);

  const tags = [
    'Computer Science Student',
    'Full-Stack Developer',
    'DSA in Java',
    'Exploring AI',
  ];

  return (
    <PageTransition>
      <SEO
        title="About"
        description="Get to know Amar Singh — a Computer Science student, full-stack developer, curious thinker and passionate builder."
      />

      <main className="relative isolate min-h-screen overflow-hidden bg-[#fafafa] dark:bg-[#0c0c0f] pt-28 sm:pt-36 pb-24">

        {/* =================================
            BACKGROUND
        ================================= */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          {/* Soft ambient glows */}
          <div className="absolute -top-40 -right-40 h-[450px] w-[450px] rounded-full bg-indigo-200/30 dark:bg-indigo-900/10 blur-[120px]" />

          <div className="absolute top-[35%] -left-40 h-[400px] w-[400px] rounded-full bg-violet-200/20 dark:bg-violet-900/10 blur-[120px]" />

          <div className="absolute bottom-0 right-[10%] h-[350px] w-[350px] rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-[120px]" />
        </div>


        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 sm:space-y-28">


          {/* =================================
              HERO / ABOUT INTRODUCTION
          ================================= */}

          <section className="relative">

            <PageHeader
              eyebrow="A LITTLE BIT OF AMAR"
              title="Manzil se zyada safar ka shauq hai, seekhne ki zid hai, aur kuch karne ka junoon hai."
            >
              <div className="max-w-3xl space-y-5 text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">

                <p>
                  I'm Amar Singh — a Computer Science student
                  who loves exploring ideas, experimenting with
                  technology, and turning random thoughts into
                  something real.
                </p>

                <p>
                  Most days, you'll find me writing code, solving
                  problems, or thinking about what I could build
                  next. I work primarily with the MERN stack,
                  practice DSA in Java, and enjoy exploring
                  Generative AI and emerging technologies.
                </p>

                <p>
                  I don't have everything figured out yet, and
                  honestly, that's the exciting part. I'm here
                  to learn, make mistakes, build things, and
                  become a little better with every experience.
                </p>

              </div>
            </PageHeader>


            {/* Personal tags */}
            <div className="mt-9 flex flex-wrap gap-2.5">

              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-neutral-200/90 bg-white/80 px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-300 dark:hover:border-indigo-800"
                >
                  {tag}
                </span>
              ))}

            </div>

          </section>


          {/* =================================
              STATISTICS
          ================================= */}

          {hasFacts && (
            <section>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">

                {facts.map((fact, index) => (
                  <motion.div
                    key={fact.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/80 dark:hover:border-indigo-900"
                  >

                    <div className="flex items-center justify-between">

                      <span className="font-mono text-xs tracking-widest text-neutral-400">
                        0{index + 1}
                      </span>

                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />

                    </div>

                    <div className="mt-7 text-4xl sm:text-5xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">

                      <Counter
                        value={fact.value}
                        suffix={fact.suffix}
                      />

                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                      {fact.label}
                    </p>

                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-indigo-400 transition-all duration-500 group-hover:w-full" />

                  </motion.div>
                ))}

              </div>

            </section>
          )}


          {/* =================================
              PERSONAL PHILOSOPHY
          ================================= */}

          <section className="space-y-9">

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">

              <div>

                <span className="font-mono text-[11px] tracking-[0.2em] text-indigo-500 uppercase">
                  A LITTLE PHILOSOPHY
                </span>

                <h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                  A Few Things I Believe In.
                </h2>

              </div>

              <p className="max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                Not rules to follow, just a few things that shape
                the way I think, learn and build.
              </p>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {PRINCIPLES.map((principle, index) => (
                <motion.article
                  key={principle.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                  className="group relative flex flex-col min-h-[230px] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-900"
                >

                  <div className="flex items-start justify-between">

                    <span className="font-mono text-sm text-indigo-500">
                      / {principle.number}
                    </span>

                    <span className="font-mono text-[9px] tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
                      {principle.keyword}
                    </span>

                  </div>

                  <div className="mt-9 space-y-3">

                    <h3 className="text-xl font-display font-semibold tracking-tight text-neutral-900 dark:text-white">
                      {principle.title}
                    </h3>

                    <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                      {principle.description}
                    </p>

                  </div>

                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-indigo-400/70 transition-all duration-500 group-hover:w-full" />

                </motion.article>
              ))}

            </div>

          </section>



          {/* =================================
    MY EVERYDAY TOOLKIT
================================= */}

          <section className="space-y-9">

            {/* Section heading */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">

              <div>
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-indigo-500">
                  MY EVERYDAY TOOLKIT
                </span>

                <h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                  Tools of the Trade.
                </h2>

                <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Technologies I use, experiment with, and keep exploring
                  to turn ideas into working products.
                </p>
              </div>

              <span className="font-mono text-xs text-neutral-400">
                {skills.length} TECHNOLOGIES
              </span>

            </div>


            {/* Toolkit cards */}
            {toolkit.length > 0 ? (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                {toolkit.map((group, index) => {

                  // Support old comma-separated database entries
                  const technologies = [
                    ...new Set(
                      group.items.flatMap((item) =>
                        item.split(',').map((name) => name.trim())
                      ).filter(Boolean)
                    ),
                  ];

                  return (
                    <motion.div
                      key={group.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.08,
                      }}
                      className="group relative min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/80 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/5"
                    >

                      {/* Top accent */}
                      <div
                        className={`absolute top-0 left-0 h-[3px] w-full bg-gradient-to-r ${group.accent} opacity-70`}
                      />

                      {/* Soft background glow */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-400/0 blur-3xl transition-colors duration-500 group-hover:bg-indigo-400/10"
                      />

                      {/* Category heading */}
                      <div className="relative flex items-center justify-between mb-5">

                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-800 dark:text-neutral-200">
                          {group.label}
                        </h3>

                        <span className="font-mono text-[10px] text-neutral-400">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                      </div>

                      {/* Divider */}
                      <div
                        className={`h-px w-full bg-gradient-to-r ${group.accent} opacity-30 mb-5`}
                      />

                      {/* Technology logos and badges */}
                      <div className="relative flex flex-wrap gap-2">

                        {technologies.map((technology) => (

                          <div
                            key={technology}
                            className="rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/70 px-2.5 py-2 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/70 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                          >

                            <TechBadge
                              name={technology}
                              size="sm"
                            />

                          </div>

                        ))}

                      </div>

                      {/* Technology count */}
                      <div className="relative mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="font-mono text-[10px] tracking-wider text-neutral-400">
                          {technologies.length} {technologies.length === 1 ? 'TECHNOLOGY' : 'TECHNOLOGIES'}
                        </span>
                      </div>

                    </motion.div>
                  );
                })}

              </div>

            ) : (

              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Toolkit information will appear here once skills have been added.
              </p>

            )}

          </section>




          {/* =================================
              RESUME CTA
          ================================= */}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-900 border border-blue-500/30 p-7 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/10">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"
            />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">

              <div className="max-w-xl space-y-4">

                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-200">
                  WHAT'S NEXT?
                </span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-white">
                  There's more to my journey.
                </h2>

                <p className="max-w-md text-sm sm:text-base leading-relaxed text-blue-100/80">
                  From the things I've learned to the things I've built,
                  explore my experience, education, achievements and the journey so far.
                </p>

              </div>


              <Link
                to="/resume"
                className="group inline-flex items-center justify-center gap-3 shrink-0 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-blue-800 transition-all duration-300 hover:bg-blue-50 hover:gap-5">

                Explore My Resume

                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />

              </Link>

            </div>

          </section>

        </div>

      </main>

    </PageTransition>
  );
};

export default About;
