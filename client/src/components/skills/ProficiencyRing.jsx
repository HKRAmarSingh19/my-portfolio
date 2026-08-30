import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { resolveTechIcon } from '../common/techIcons';

/**
 * Circular proficiency dial with the technology's logo at its centre. Used only
 * for the handful of strongest skills — a ring is a much heavier graphic than a
 * bar, so it earns attention precisely because most of the page doesn't use it.
 *
 * The arc is stroked with a per-instance gradient: SVG gradient ids are global to
 * the document, so each ring mints its own via `useId` rather than sharing one.
 */
export const ProficiencyRing = ({
  skill,
  index = 0,
  size = 116,
  stroke = 7,
  fallbackIcon: FallbackIcon,
}) => {
  const gradientId = useId();
  const prefersReducedMotion = useReducedMotion();

  const tech = resolveTechIcon(skill.name);
  const Icon = tech?.Icon || FallbackIcon;
  const proficiency = Math.max(0, Math.min(100, skill.proficiency || 0));

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (1 - proficiency / 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="group flex flex-col items-center gap-3 text-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          aria-hidden="true"
          // Rotated so the arc starts at 12 o'clock instead of 3 o'clock.
          className="-rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-neutral-200 dark:stroke-neutral-800"
          />

          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#${gradientId})`}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: prefersReducedMotion ? filled : circumference }}
            whileInView={{ strokeDashoffset: filled }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          {Icon ? (
            <Icon
              aria-hidden="true"
              style={tech?.color ? { color: tech.color } : undefined}
              className={`h-8 w-8 transition-transform duration-300 group-hover:scale-110 ${
                tech?.color ? '' : 'text-neutral-700 dark:text-neutral-200'
              }`}
            />
          ) : null}
        </div>
      </div>

      {/* Width-capped: database skill names are compound ("JavaScript (ESNext) /
          TypeScript") and would otherwise stretch the ring's column. */}
      <div className="max-w-[9rem] space-y-0.5">
        <p className="text-xs font-semibold leading-snug text-neutral-900 dark:text-white">
          {skill.name}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          {proficiency}%
        </p>
      </div>
    </motion.div>
  );
};

export default ProficiencyRing;
