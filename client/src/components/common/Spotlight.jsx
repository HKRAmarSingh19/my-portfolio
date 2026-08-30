import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Container that reveals a soft accent glow tracking the pointer. Intended for
 * the dark CTA panels, where it reads as a light source rather than decoration.
 */
export const Spotlight = ({ children, className = '', size = 420 }) => {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);

  const background = useTransform(
    [x, y],
    ([mx, my]) =>
      `radial-gradient(${size}px circle at ${mx}px ${my}px, rgba(129,140,248,0.18), transparent 68%)`
  );

  const handlePointerMove = (event) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  const reset = () => {
    x.set(-9999);
    y.set(-9999);
  };

  return (
    <div
      ref={ref}
      onPointerMove={prefersReducedMotion ? undefined : handlePointerMove}
      onPointerLeave={reset}
      className={`relative overflow-hidden ${className}`}
    >
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ background }}
          className="pointer-events-none absolute inset-0 z-0"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Spotlight;
