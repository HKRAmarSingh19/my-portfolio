import React, { useEffect, useState } from 'react';
import TiltCard from './TiltCard';

/**
 * No bundled default photo anymore. When `src` is missing (no uploaded portrait,
 * or a broken URL) the portrait renders a clean initials box instead of a 404 —
 * so the fallback is an EMPTY string, not a file path.
 */
export const FALLBACK_AVATAR = '';

/**
 * Framed hero portrait. Deliberately restrained: one accent ring, a scrim for
 * caption legibility and a slight tilt on hover. The 3D scene behind it does
 * the atmospheric work, so this element only has to read as a photograph.
 *
 * No bundled default photo — when `src` is missing (no uploaded portrait, or a
 * broken URL) it renders a clean empty box with the initials instead of a 404.
 */
export const ProfilePortrait = ({
  src,
  name = 'Hkr. Amar Singh',
  headline = 'Full-Stack MERN Engineer',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  // A newly uploaded portrait should get a fresh chance to load.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const hasImage = Boolean(src) && !failed;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TiltCard intensity={6} lift={8} className={`rounded-full ${className}`}>
      <div className="relative aspect-square overflow-hidden rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-lift ring-1 ring-black/5 dark:ring-white/10">
        {hasImage ? (
          <img
            src={src}
            alt={`Portrait of ${name}`}
            // Above the fold, so it should not be deferred.
            loading="eager"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900">
            <span className="font-display text-3xl font-bold text-neutral-500 dark:text-neutral-400">
              {initials || '?'}
            </span>
          </div>
        )}

        {/* Scrim keeps the caption readable over a light shirt / bright wall. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-neutral-950/80 via-neutral-950/25 to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grain opacity-40"
        />

        <div className="absolute inset-x-4 bottom-4 min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white">{name}</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-neutral-300">
            {headline}
          </p>
        </div>
      </div>
    </TiltCard>
  );
};

export default ProfilePortrait;
