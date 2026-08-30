import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  Mail,
  Github,
  Linkedin,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  BadgeCheck,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { experienceApi, skillsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import { TechBadgeList } from '../components/common/TechBadge';

// Section order and presentation per Experience `type` enum.
const SECTIONS = [
  { type: 'work', title: 'Professional Experience', icon: Briefcase },
  { type: 'education', title: 'Education', icon: GraduationCap },
  { type: 'certification', title: 'Certifications', icon: BadgeCheck },
  { type: 'award', title: 'Awards & Recognition', icon: Award },
];

const CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps & Cloud',
  'Languages',
  'Tools & Workflow',
];

export const Resume = () => {
  const { data: experienceData, isLoading: experienceLoading } = useQuery({
    queryKey: ['experience'],
    queryFn: () => experienceApi.getAll({}),
  });

  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'grouped'],
    queryFn: () => skillsApi.getAll({ grouped: 'true' }),
  });

  const experiences = experienceData?.data?.data || [];
  const groupedSkills = skillsData?.data?.data || {};

  const skillCategories = [
    ...CATEGORY_ORDER.filter((c) => groupedSkills[c]?.length),
    ...Object.keys(groupedSkills).filter(
      (c) => !CATEGORY_ORDER.includes(c) && groupedSkills[c]?.length
    ),
  ];

  const populatedSections = SECTIONS.map((section) => ({
    ...section,
    items: experiences.filter((item) => item.type === section.type),
  })).filter((section) => section.items.length > 0);

  return (
    <PageTransition>
      <SEO
        title="Resume & Professional Experience"
        description="Structured resume of Amar Singh — full-stack engineering experience, education, and technical skills."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <PageHeader
              eyebrow="Curriculum Vitae"
              eyebrowIcon={FileText}
              title="Resume"
              lead="Rendered from structured data rather than a static file, so it never falls out of date. Use the print action to save a PDF copy."
            />

            <button
              onClick={() => window.print()}
              className="group relative shrink-0 inline-flex items-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-indigo-500"
            >
              <Printer className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="resume-container space-y-10 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-6 shadow-sm sm:p-10">
            <header className="space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                  Amar Singh
                </h2>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 sm:text-base">
                  Full-Stack Software Engineer
                </p>
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Full-stack engineer specialising in the MERN stack, REST API architecture, and
                performance-minded interface work. I build maintainable systems end to end — from
                MongoDB document models through to accessible, motion-aware React front ends.
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
                <a
                  href="mailto:amar@example.com"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>amar@example.com</span>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>github.com</span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  <span>linkedin.com</span>
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Remote / Worldwide</span>
                </span>
              </div>
            </header>

            {experienceLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"
                  />
                ))}
              </div>
            ) : populatedSections.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                No resume entries have been added yet.
              </p>
            ) : (
              populatedSections.map((section) => {
                const Icon = section.icon;

                return (
                  <section key={section.type} className="space-y-6">
                    <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <Icon className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{section.title}</span>
                    </h3>

                    {/* Timeline rail. Kept as a hairline plus small nodes rather
                        than anything filled, so it survives the print stylesheet
                        without laying down a block of ink. */}
                    <div className="relative space-y-7 border-l border-neutral-200 pl-6 dark:border-neutral-800 sm:pl-7">
                      {section.items.map((item, index) => (
                        <motion.div
                          key={item._id || index}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ duration: 0.4, delay: Math.min(index, 4) * 0.05 }}
                          className="relative space-y-2"
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900 sm:-left-[30px] ${
                              item.current
                                ? 'bg-indigo-500'
                                : 'bg-neutral-300 dark:bg-neutral-700'
                            }`}
                          />

                          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                            <div>
                              <h4 className="text-base font-display font-bold text-neutral-900 dark:text-white">
                                {item.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                  {item.organization}
                                </span>
                                {item.location && (
                                  <>
                                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                    <span className="text-xs">{item.location}</span>
                                  </>
                                )}
                                {item.link && (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="no-print text-neutral-400 transition-colors hover:text-indigo-500"
                                    aria-label={`${item.organization} website`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                              {item.current && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  Current
                                </span>
                              )}
                              <span>
                                {item.startDate} —{' '}
                                {item.current ? 'Present' : item.endDate || 'Present'}
                              </span>
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                              {item.description}
                            </p>
                          )}

                          {item.highlights?.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                              {item.highlights.map((highlight, highlightIndex) => (
                                <li
                                  key={highlightIndex}
                                  className="flex gap-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                                >
                                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {item.techStack?.length > 0 && (
                            <TechBadgeList items={item.techStack} className="pt-1" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </section>
                );
              })
            )}

            {skillCategories.length > 0 && (
              <section className="space-y-5">
                <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                  <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Technical Skills</span>
                </h3>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  {skillCategories.map((category) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-mono text-[11px] uppercase tracking-wider text-neutral-900 dark:text-white">
                        {category}
                      </h4>
                      {/* Chips rather than a dot-separated run of names: the logos
                          make the categories skimmable on screen, and each chip
                          still prints as plain bordered text. */}
                      <TechBadgeList
                        items={groupedSkills[category].map((skill) => skill.name)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
export default Resume;
