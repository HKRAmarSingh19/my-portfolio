import React, { useEffect, useState } from 'react';
import TiltCard from './TiltCard';

/**
 * Bundled with the client, so the hero always has a portrait to show — before
 * the admin uploads a replacement, and even if the API is unreachable.
 */
export const FALLBACK_AVATAR = '/profile.jpeg';

/**
 * Framed hero portrait. Deliberately restrained: one accent ring, a scrim for
 * caption legibility and a slight tilt on hover. The 3D scene behind it does
 * the atmospheric work, so this element only has to read as a photograph.
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

  const resolved = !src || failed ? FALLBACK_AVATAR : src;

  return (
    <TiltCard intensity={6} lift={8} className={`rounded-[2rem] ${className}`}>
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-lift ring-1 ring-black/5 dark:ring-white/10">
        <img
          src={resolved}
          alt={`Portrait of ${name}`}
          // Above the fold, so it should not be deferred.
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-center"
        />

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
