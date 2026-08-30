import React from 'react';
import { Hash } from 'lucide-react';
import { resolveTechIcon } from './techIcons';

const SIZES = {
  sm: { pill: 'gap-1.5 px-2 py-0.5 text-[11px]', icon: 'h-3 w-3' },
  md: { pill: 'gap-2 px-2.5 py-1 text-xs', icon: 'h-3.5 w-3.5' },
  lg: { pill: 'gap-2 px-3 py-1.5 text-sm', icon: 'h-4 w-4' },
};

/**
 * A single technology, rendered as a logo chip. Replaces the plain grey text
 * pills that used to list tech stacks — the mark is what makes a stack scannable
 * at a glance, and it keeps one technology looking identical on every page.
 *
 * `interactive` swaps in button-ish affordances for the filter pills on the
 * projects page; `active` is that filter's selected state.
 */
export const TechBadge = ({
  name,
  size = 'sm',
  as: Tag = 'span',
  interactive = false,
  active = false,
  className = '',
  showFallbackIcon = true,
  ...rest
}) => {
  const tech = resolveTechIcon(name);
  const Icon = tech?.Icon || (showFallbackIcon ? Hash : null);
  const { pill, icon } = SIZES[size] || SIZES.sm;

  const base = active
    ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
    : 'border-neutral-200/80 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300';

  return (
    <Tag
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border font-mono ${pill} ${base} ${
        interactive
          ? 'transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400'
          : ''
      } ${className}`}
      {...rest}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          // Brand colour when the logo has one that survives both themes;
          // otherwise it inherits the pill's text colour.
          style={tech?.color ? { color: tech.color } : undefined}
          className={`${icon} shrink-0 ${tech?.color ? '' : 'opacity-70'}`}
        />
      ) : null}
      <span className="truncate">{name}</span>
    </Tag>
  );
};

/**
 * Convenience wrapper for the common case: a wrapped row of chips with an
 * optional overflow counter so long stacks don't dominate a card.
 */
export const TechBadgeList = ({ items = [], limit, size = 'sm', className = '' }) => {
  if (items.length === 0) return null;

  const shown = limit ? items.slice(0, limit) : items;
  const hidden = items.length - shown.length;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((name) => (
        <TechBadge key={name} name={name} size={size} />
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center px-1 font-mono text-[11px] text-neutral-400">
          +{hidden}
        </span>
      )}
    </div>
  );
};

export default TechBadge;
