import React from 'react';

/**
 * Decorative top band shared by the public routes: the pair of soft background
 * blooms that give each page its ambience. Kept background-only — the photograph
 * accents were removed deliberately at the user's request, leaving just the
 * veiled colour wash (the global AmbientBackground supplies the imagery).
 *
 * Purely decorative — aria-hidden, pointer-events-none, and clipped by the page
 * wrapper's overflow-x-clip. Hidden in print so the resume/print views stay clean.
 */
export const PageHeroBand = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] overflow-hidden print:hidden"
    >
      <div className="absolute -top-32 left-0 h-[24rem] w-[24rem] rounded-full bg-indigo-500/[0.10] blur-3xl sm:left-16" />
      <div className="absolute -top-20 right-0 h-[18rem] w-[18rem] rounded-full bg-violet-500/[0.08] blur-3xl sm:right-24" />
    </div>
  );
};

export default PageHeroBand;
