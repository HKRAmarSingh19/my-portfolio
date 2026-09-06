import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProfilePortrait from './ProfilePortrait';

/**
 * Auto-rotating hero portrait carousel for the homepage. Cycles the admin's
 * FEATURED profile photos on the hero by swapping a SINGLE `ProfilePortrait`
 * (one TiltCard) — the src cross-fades, so the tilt + layout stay exactly as
 * the non-carousel portrait. Featured images show only on Home; when no (or
 * one) featured photo exists it renders the plain portrait.
 *
 * Props:
 *  - images       string[] — the featured image URLs to rotate
 *  - name         used for alt text + fallback
 *  - headline     subtitle shown on the portrait
 *  - className    extra classes for the root
 *  - intervalMs   auto-advance delay (default 3600ms)
 */
export const ProfilePortraitCarousel = ({
  images = [],
  name = 'Hkr. Amar Singh',
  headline = 'Full-Stack MERN Engineer',
  className = '',
  intervalMs = 3600,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to the first slide whenever the set changes (new featured photos).
  useEffect(() => {
    setIndex(0);
  }, [slides.join('|')]);

  // Auto-advance; cleared on unmount/deps change. Skipped entirely when the OS
  // prefers reduced motion. Pausing (hover/focus) stops the timer so autoplay
  // never fights the user.
  useEffect(() => {
    if (paused || prefersReducedMotion || slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, prefersReducedMotion, intervalMs, slides.length]);

  // Preload the next slide so the crossfade never reveals a blank frame.
  useEffect(() => {
    if (slides.length > 1) {
      const next = slides[(index + 1) % slides.length];
      const img = new Image();
      img.src = next;
    }
  }, [index, slides]);

  if (slides.length === 0) return null;

  // Single featured photo → static portrait, identical to the non-carousel
  // rendering (no timer, no controls).
  if (slides.length === 1) {
    return <ProfilePortrait src={slides[0]} name={name} headline={headline} className={className} />;
  }

  const current = slides[index];
  const go = (dir) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* ONE ProfilePortrait (one TiltCard) — the src swaps via crossfade, so
          the portrait box keeps its size and tilt stays intact. */}
      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ProfilePortrait src={current} name={name} headline={headline} />
          </motion.div>
        </AnimatePresence>

        {/* Prev / next */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous photograph"
          className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white opacity-70 backdrop-blur transition-opacity hover:opacity-100 focus-visible:opacity-100 hover:bg-black/60"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next photograph"
          className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white opacity-70 backdrop-blur transition-opacity hover:opacity-100 focus-visible:opacity-100 hover:bg-black/60"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute -bottom-4 inset-x-0 flex items-center justify-center gap-1.5">
        {slides.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show photograph ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-4 bg-indigo-500' : 'w-1.5 bg-neutral-400/50 hover:bg-neutral-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfilePortraitCarousel;