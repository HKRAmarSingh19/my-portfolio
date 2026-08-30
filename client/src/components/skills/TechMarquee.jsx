import React from 'react';
import { resolveTechIcon } from '../common/techIcons';

/**
 * Infinite logo ticker for the page header. Same seamless-loop trick as the text
 * Marquee — the list is rendered twice and translated by -50% — but each pill
 * carries the technology's real logo, which is what makes the strip read as a
 * stack rather than as decoration.
 */
export const TechMarquee = ({ names = [], reverse = false, className = '' }) => {
  const resolved = names
    .map((name) => ({ name, tech: resolveTechIcon(name) }))
    .filter((entry) => entry.tech);

  if (resolved.length === 0) return null;

  const sequence = [...resolved, ...resolved];

  return (
    <div
      aria-hidden="true"
      className={`relative flex overflow-hidden ${className}`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className="flex shrink-0 items-center gap-3 animate-marquee"
        style={{ animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {sequence.map(({ name, tech }, index) => {
          const { Icon, color } = tech;
          return (
            <span
              key={`${name}-${index}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/60 px-4 py-2 backdrop-blur"
            >
              <Icon
                style={color ? { color } : undefined}
                className={`h-3.5 w-3.5 shrink-0 ${color ? '' : 'text-neutral-700 dark:text-neutral-200'}`}
              />
              <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                {name}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default TechMarquee;
