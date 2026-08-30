import React from 'react';
import { motion } from 'framer-motion';

/**
 * Shared header for the public routes: eyebrow chip, title, lead paragraph, and
 * the pair of soft blooms that anchor the top of every page. Extracted so the
 * seven routes stay visually identical rather than drifting apart — before this,
 * each page hand-rolled its own eyebrow and none of them had the blooms.
 *
 * `align="center"` is for the pages with no left-column content to line up with.
 */
export const PageHeader = ({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  lead,
  align = 'left',
  children,
  className = '',
}) => {
  const centered = align === 'center';

  return (
    <header className={`relative ${centered ? 'text-center' : ''} ${className}`}>
      {/* Purely decorative, and pinned outside the flow so it never affects
          layout height. Clipped by the page wrapper's own overflow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-56 left-0 right-0 h-[30rem] overflow-hidden"
      >
        <div
          className={`absolute -top-32 h-[26rem] w-[26rem] rounded-full bg-indigo-500/[0.10] blur-3xl ${
            centered ? 'left-1/2 -translate-x-1/2' : 'left-0 sm:left-16'
          }`}
        />
        <div className="absolute -top-20 right-0 h-[20rem] w-[20rem] rounded-full bg-violet-500/[0.08] blur-3xl sm:right-24" />
      </div>

      <div className={`relative space-y-4 ${centered ? 'mx-auto max-w-2xl' : 'max-w-3xl'}`}>
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
          >
            {EyebrowIcon && <EyebrowIcon className="h-3 w-3" />}
            {eyebrow}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-neutral-900 dark:text-white"
        >
          {title}
        </motion.h1>

        {lead && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="text-base sm:text-lg font-light leading-relaxed text-neutral-600 dark:text-neutral-300"
          >
            {lead}
          </motion.p>
        )}

        {children}
      </div>
    </header>
  );
};

export default PageHeader;
