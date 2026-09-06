import React from 'react';
import { resolveTechIcon } from './techIcons';

/**
 * Seamless infinite ticker. The child list is rendered twice and translated by
 * -50%, so the loop point is invisible. When `items` are technology names they
 * render as pills that pair each brand's logo (via the shared techIcon lookup)
 * with the skill name — matching how logos appear across the site.
 *
 * Passing `items` as already-rendered nodes is still supported: non-string
 * entries are rendered as-is, so existing callers that pass JSX keep working.
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
        {sequence.map((item, index) => {
          // Non-string entries (already-rendered JSX) pass through untouched.
          if (typeof item !== 'string') {
            return (
              <span key={`${index}-${String(index)}`} className="shrink-0">
                {React.cloneElement(item, { key: `${index}-${String(index)}` })}
              </span>
            );
          }
          const tech = resolveTechIcon(item);
          const Icon = tech?.Icon || null;
          const iconStyle = tech?.color ? { color: tech.color } : undefined;
          return (
            <span
              key={`${item}-${index}`}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-200/70 bg-white/70 px-4 py-1.5 font-mono text-xs text-neutral-600 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/70 dark:text-neutral-400"
            >
              {Icon ? (
                <Icon
                  aria-hidden="true"
                  style={iconStyle}
                  className={`h-3.5 w-3.5 shrink-0 ${tech?.color ? '' : 'text-neutral-500 dark:text-neutral-300'}`}
                />
              ) : null}
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default Marquee;
