import React from 'react';

/**
 * Layered decorative backdrop: hairline grid, drifting accent glows, and film
 * grain. Purely decorative — fixed, non-interactive, and hidden from a11y tree.
 */
export const AmbientBackground = ({ variant = 'grid' }) => {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden grain">
      <div
        className={`absolute inset-0 ${variant === 'dots' ? 'bg-dots' : 'bg-grid'} mask-fade-edges`}
      />

      {/* Slow-drifting indigo glows give the flat background depth. Kept at very
          low alpha so they tint the canvas rather than colouring it. */}
      <div className="absolute -top-32 -left-24 h-[30rem] w-[30rem] rounded-full bg-indigo-500/[0.10] dark:bg-indigo-500/[0.09] blur-3xl animate-drift" />
      <div className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-indigo-600/[0.08] dark:bg-indigo-400/[0.07] blur-3xl animate-drift-reverse" />
      <div className="absolute -bottom-40 left-1/4 h-[24rem] w-[24rem] rounded-full bg-violet-500/[0.07] dark:bg-violet-500/[0.09] blur-3xl animate-float-slow" />
    </div>
  );
};

export default AmbientBackground;
