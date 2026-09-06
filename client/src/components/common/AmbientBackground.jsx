import React from 'react';
import { IMAGERY } from '../../constants/imagery';

/**
 * Layered decorative backdrop: hairline grid, drifting accent glows, film
 * grain, and a heavily veiled ambient photograph so every public page carries
 * a soft picture in the background. Purely decorative — fixed, non-interactive,
 * and hidden from the a11y tree.
 *
 * The photo sits behind the grid and glows, faded with the edge mask and
 * grayscale filter so it reads as atmospheric texture rather than literal
 * content — text above it stays crisp.
 */
export const AmbientBackground = ({ variant = 'grid' }) => {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden grain">
      {/* Ambient photograph, faint and monochrome so it never fights the text.
          object-cover + full-bleed keeps it edge-to-edge; the mask fades it at
          the page margins. */}
      <img
        src={IMAGERY.AMBIENT}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover grayscale opacity-[0.05] dark:opacity-[0.07] print:hidden"
      />

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
