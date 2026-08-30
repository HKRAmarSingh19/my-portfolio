import React from 'react';

/**
 * Seamless infinite ticker. The child list is rendered twice and translated by
 * -50%, so the loop point is invisible.
 */
export const Marquee = ({ items = [], className = '', reverse = false }) => {
  if (items.length === 0) return null;

  const sequence = [...items, ...items];

  return (
    <div
      className={`relative flex overflow-hidden ${className}`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div
        className="flex shrink-0 items-center gap-3 animate-marquee"
        style={{ animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {sequence.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="shrink-0 whitespace-nowrap rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/60 px-4 py-1.5 font-mono text-xs text-neutral-600 dark:text-neutral-400 backdrop-blur"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
