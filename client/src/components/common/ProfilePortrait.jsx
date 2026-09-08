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
            style={{ transform: 'scale(1.3)' }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900">
            <span className="font-display text-3xl font-bold text-neutral-500 dark:text-neutral-400">
              {initials || '?'}
            </span>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grain opacity-40"
        />
      </div>
    </TiltCard>
  );
};

export default ProfilePortrait;
