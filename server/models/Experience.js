import mongoose from 'mongoose';

/**
 * The authoritative list of entry types the resume can hold. This is the single
 * source of truth shared with the zod schema in middleware/validate.js (imported
 * here, not duplicated) so the two can never drift.
 *
 * NOTE: 'award' is a LEGACY alias kept permanently in the enum so pre-existing
 * rows still validate. The admin UI writes 'achievement' for the Achievements
 * section; 'award' rows are grouped with it on the public resume.
 *
 * Keep the mirror client constant (client/src/constants/experienceTypes.js) in
 * sync with this array.
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

const experienceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: EXPERIENCE_TYPES,
      default: 'work',
    },
    // Every type carries a display title. For a `header` entry this is the full
    // name; for the rest it is the role/degree/project/cert name. Relaxed to a
    // plain default (not required) because header/summary/skills/coding rows
    // legitimately have no organization or start date.
    title: {
      type: String,
      default: '',
      trim: true,
    },
    // One-line role/headline for a `header` entry.
    role: {
      type: String,
      default: '',
      trim: true,
    },
    organization: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    // Nested contact card for a `header` entry. Object (not a sub-schema) so
    // arbitrary/partial writes pass through unchanged.
    contact: {
      type: Object,
      default: {},
    },
    // Flat skill names for a `skills` entry (legacy fallback).
    items: {
      type: [String],
      default: [],
    },
    // Optional categorized skills for a `skills` entry, e.g. the classic resume
    // layout: [{ category: 'Languages', skills: ['C','Java','Python'] }]. When
    // present, the resume renders these as grouped sections. Kept separate from
    // the flat `items` so existing entries are untouched (no migration).
    groups: {
      type: [{ category: String, skills: [String] }],
      default: [],
    },
    // Label + URL pairs for a `coding` entry.
    profiles: {
      type: [{ label: String, url: String }],
      default: [],
    },
    startDate: {
      type: String,
      default: '',
    },
    endDate: {
      type: String,
      default: 'Present',
    },
    current: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
    highlights: {
      type: [String],
      default: [],
    },
    techStack: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Experience = mongoose.model('Experience', experienceSchema);
export default Experience;