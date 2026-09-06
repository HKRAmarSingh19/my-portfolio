/**
 * Client mirror of the resume entry types. Must stay in sync with the server's
 * authoritative source in server/models/Experience.js (EXPERIENCE_TYPES /
 * EXPERIENCE_TYPE_LABELS). Vite and Node can't share a module graph, so this is
 * the one-place copy the admin UI and public Resume read from. When you change
 * one, change the other.
 *
 * Order here is the canonical display order for the resume sections.
 */
export const EXPERIENCE_TYPES = [
  'header', // 1. Header / Contact
  'summary', // 2. Professional Summary
  'education', // 3. Education
  'skills', // 4. Technical Skills
  'project', // 5. Projects
  'work', // 6. Experience / Internships
  'achievement', // 7. Achievements
  'certification', // 8. Certifications
  'coding', // 9. Coding Profiles
  'leadership', // 10. Leadership / Positions of Responsibility
  'award', // legacy alias -> grouped under Achievements
];

export const EXPERIENCE_TYPE_LABELS = {
  header: 'Header / Contact',
  summary: 'Professional Summary',
  education: 'Education',
  skills: 'Technical Skills',
  project: 'Projects',
  work: 'Experience / Internships',
  achievement: 'Achievements',
  certification: 'Certifications',
  coding: 'Coding Profiles',
  leadership: 'Leadership / Positions of Responsibility',
  award: 'Achievements',
};

/**
 * The entry types offered in the admin "Add Resume Entry" dropdown. One entry
 * per resume section. `award` (legacy) is intentionally excluded — the admin
 * writes `achievement` for the Achievements section.
 */
export const ADMIN_ENTRY_TYPES = [
  'header',
  'summary',
  'education',
  'skills',
  'project',
  'work',
  'achievement',
  'certification',
  'coding',
  'leadership',
];