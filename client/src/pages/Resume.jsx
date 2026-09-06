import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  Mail,
  Github,
  Linkedin,
  Code2,
  MapPin,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  BadgeCheck,
  ExternalLink,
  FileText,
  UserRound,
  FolderGit2,
  Users,
} from 'lucide-react';
import { experienceApi, skillsApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import PageHeroBand from '../components/common/PageHeroBand';
import { TechBadgeList } from '../components/common/TechBadge';
import { SITE } from '../constants/site';
import { EXPERIENCE_TYPES } from '../constants/experienceTypes';

// Presentation metadata (title + icon) per entry type, in the canonical section
// order. The resume is fully data-driven: a section renders only if at least one
// entry of that type exists. `award` (legacy) is normalised into `achievement`.
const TYPE_META = {
  header: { title: 'Header / Contact', icon: UserRound },
  summary: { title: 'Professional Summary', icon: FileText },
  education: { title: 'Education', icon: GraduationCap },
  skills: { title: 'Technical Skills', icon: BadgeCheck },
  project: { title: 'Projects', icon: FolderGit2 },
  work: { title: 'Professional Experience', icon: Briefcase },
  achievement: { title: 'Achievements', icon: Award },
  certification: { title: 'Certifications', icon: BadgeCheck },
  coding: { title: 'Coding Profiles', icon: Code2 },
  leadership: { title: 'Leadership / Positions of Responsibility', icon: Users },
};

// Legacy `award` rows render inside the Achievements section too.
const LEGACY_ALIAS = { award: 'achievement' };

export const Resume = () => {
  const { data: experienceData, isLoading: experienceLoading } = useQuery({
    queryKey: ['experience'],
    queryFn: () => experienceApi.getAll({}),
  });

  // Technical Skills can come from a `skills` resume entry (items[]). If none
  // exists yet, fall back to the legacy grouped categories from the skills
  // collection so existing content isn't lost.
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'grouped'],
    queryFn: () => skillsApi.getAll({ grouped: 'true' }),
    enabled: true,
  });

  const experiences = experienceData?.data?.data || [];
  const groupedSkills = skillsData?.data?.data || {};

  // Normalise legacy `award` under `achievement`, then group rows per type.
  const rowsByType = experiences.reduce((acc, item) => {
    const key = LEGACY_ALIAS[item.type] || item.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const headerEntry = rowsByType.header?.[0];
  const summaryEntry = rowsByType.summary?.[0];
  const skillsEntries = rowsByType.skills || [];
  const hasSkillsEntries = skillsEntries.length > 0;

  // Identity, driven by the `header` entry; falls back to SITE constants only
  // when the admin hasn't added one yet. `role` falls back to the profile
  // headline only when there's no header entry at all (so an empty role on a
  // header entry doesn't double-print the name).
  const name = headerEntry?.title || SITE.name;
  const role = headerEntry?.role || 'Full-Stack Software Engineer';
  const contact = headerEntry?.contact || {};
  // Professional Summary is entirely user-defined: nothing renders until the
  // admin adds a `summary` entry in Admin → Manage Resume & Experience.
  const bio = summaryEntry?.description || '';

  // Build the section list in canonical order, honouring each section's lowest
  // `order` value when the admin has set one (0 = default position).
  // `header` and `summary` are consumed by the header block at the top of the
  // resume (name/role/contact + bio), so they're excluded from the standalone
  // sections list — otherwise the summary would render a second time below.
  const EXCLUDED_FROM_SECTIONS = ['header', 'summary'];
  const canonical = EXPERIENCE_TYPES.filter(
    (t) => TYPE_META[t] && !EXCLUDED_FROM_SECTIONS.includes(t)
  );
  const sections = canonical
    .map((key) => ({
      key,
      meta: TYPE_META[key],
      items: [...(rowsByType[key] || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt < b.createdAt ? 1 : -1)
      ),
    }))
    .filter((s) => s.items.length > 0)
    .map((s, i) => {
      const minOrder = Math.min(...s.items.map((it) => it.order ?? 0));
      return { ...s, minOrder, base: i };
    })
    .sort((a, b) => (a.minOrder || a.base) - (b.minOrder || b.base));

  return (
    <PageTransition>
      <SEO
        title="Resume & Professional Experience"
        description="Structured resume of Amar Singh — full-stack engineering experience, education, and technical skills."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <PageHeroBand />
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
            {/* Header / Contact */}
            <header className="space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
                  {name}
                </h2>
                {role && (
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 sm:text-base">
                    {role}
                  </p>
                )}
              </div>

              {bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
                <a
                  href={`mailto:${contact.email || SITE.email}`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{contact.email || SITE.email}</span>
                </a>
                <a
                  href={contact.github || SITE.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>{(contact.github || SITE.socials.github).replace('https://', '')}</span>
                </a>
                <a
                  href={contact.linkedin || SITE.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  <span>hkr-amar-singh</span>
                </a>
                <a
                  href={contact.codolio || SITE.socials.codolio}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>{contact.codolio ? contact.codolio.replace('https://', '') : SITE.socials.codolio.replace('https://', '')}</span>
                </a>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-500"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{contact.phone}</span>
                  </a>
                )}
                {(contact.location || headerEntry) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{contact.location || 'Remote / Worldwide'}</span>
                  </span>
                )}
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
            ) : (
              sections.map((section) => {
                const Icon = section.meta.icon;

                // These types have bespoke renderers, everything else reuses the
                // timeline card.
                if (section.key === 'skills') {
                  // Categorized layout when the entry defines groups (the classic
                  // resume style); otherwise fall back to a flat badge cloud.
                  const groups = section.items.flatMap((it) => it.groups || []);
                  const hasGroups = groups.length > 0;
                  if (hasGroups) {
                    return (
                      <section key={section.key} className="space-y-6">
                        <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                          <Icon className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{section.meta.title}</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                          {groups.map((g, gi) => (
                            <div key={gi} className="space-y-2">
                              <h4 className="font-mono text-[11px] uppercase tracking-wider text-neutral-900 dark:text-white">
                                {g.category}
                              </h4>
                              <TechBadgeList items={g.skills || []} />
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }
                  const flatSkills = section.items.flatMap((it) => it.items || []);
                  return (
                    <section key={section.key} className="space-y-5">
                      <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        <Icon className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{section.meta.title}</span>
                      </h3>
                      <TechBadgeList items={flatSkills} size="md" />
                    </section>
                  );
                }

                if (section.key === 'coding') {
                  const profiles = section.items.flatMap((it) => it.profiles || []);
                  return (
                    <section key={section.key} className="space-y-5">
                      <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        <Icon className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{section.meta.title}</span>
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {profiles.map((p, i) => (
                          <a
                            key={i}
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:text-indigo-400"
                          >
                            <span>{p.label}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                          </a>
                        ))}
                      </div>
                    </section>
                  );
                }

                // Timeline section (work/education/project/achievement/certification/leadership).
                return (
                  <section key={section.key} className="space-y-6">
                    <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <Icon className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{section.meta.title}</span>
                    </h3>

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
                                {item.organization && (
                                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                    {item.organization}
                                  </span>
                                )}
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
                              {item.startDate && (
                                <span>
                                  {item.startDate} —{' '}
                                  {item.current ? 'Present' : item.endDate || 'Present'}
                                </span>
                              )}
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

            {/* Legacy grouped-skills fallback: shown only while no dedicated
                `skills` resume entry exists, so prior skills content is retained. */}
            {!hasSkillsEntries && (
              (() => {
                const categories = [
                  ...['Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Languages', 'Tools & Workflow'].filter(
                    (c) => groupedSkills[c]?.length
                  ),
                  ...Object.keys(groupedSkills).filter(
                    (c) => !['Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Languages', 'Tools & Workflow'].includes(c) && groupedSkills[c]?.length
                  ),
                ];

                if (categories.length === 0) return null;

                return (
                  <section className="space-y-5">
                    <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 font-mono text-xs uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Technical Skills</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                      {categories.map((category) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-mono text-[11px] uppercase tracking-wider text-neutral-900 dark:text-white">
                            {category}
                          </h4>
                          <TechBadgeList
                            items={groupedSkills[category].map((skill) => skill.name)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
export default Resume;