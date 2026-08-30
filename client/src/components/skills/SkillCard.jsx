import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { resolveTechIcon } from '../common/techIcons';

/** Turns a 0–100 score into the words a reader actually scans for. */
const proficiencyLabel = (value) => {
  if (value >= 90) return 'Advanced';
  if (value >= 75) return 'Proficient';
  if (value >= 55) return 'Working';
  return 'Familiar';
};

/**
 * One technology: brand logo, name, self-assessed level and an animated
 * proficiency bar. The logo carries the visual interest, so everything else on
 * the card stays neutral — the logos are the only polychrome element on the page.
 */
export const SkillCard = ({
  skill,
  index = 0,
  fallbackIcon: FallbackIcon,
  accent = 'from-indigo-500 to-violet-500',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const tech = resolveTechIcon(skill.name);
  const Icon = tech?.Icon || FallbackIcon;
  const proficiency = Math.max(0, Math.min(100, skill.proficiency || 0));
  const years = skill.yearsOfExperience || 0;

  // Brand-tinted tile for real logos; neutral for marks whose brand colour is
  // black, which would otherwise vanish against the dark theme.
  const tileStyle = tech?.color ? { backgroundColor: `${tech.color}1F` } : undefined;
  const iconStyle = tech?.color ? { color: tech.color } : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index, 7) * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lift"
    >
      {/* Soft bloom that fades in behind the logo on hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-indigo-500/0 blur-2xl transition-colors duration-500 group-hover:bg-indigo-500/20"
      />

      <div className="relative flex items-start gap-3">
        <div
          style={tileStyle}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            tech?.color ? '' : 'bg-neutral-100 dark:bg-neutral-800'
          }`}
        >
          {Icon ? (
            <Icon
              aria-hidden="true"
              style={iconStyle}
              className={`h-5 w-5 ${tech?.color ? '' : 'text-neutral-700 dark:text-neutral-200'}`}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {skill.name}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            {proficiencyLabel(proficiency)}
            {years ? ` · ${years} yr${years === 1 ? '' : 's'}` : ''}
          </p>
        </div>

        <span className="shrink-0 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
          {proficiency}%
        </span>
      </div>

      <div
        className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        role="meter"
        aria-valuenow={proficiency}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${skill.name} proficiency`}
      >
        <motion.div
          initial={{ width: prefersReducedMotion ? `${proficiency}%` : 0 }}
          whileInView={{ width: `${proficiency}%` }}
          viewport={{ once: true }}
          transition={{
            duration: 0.9,
            delay: Math.min(index, 7) * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
        />
      </div>
    </motion.div>
  );
};

export default SkillCard;
