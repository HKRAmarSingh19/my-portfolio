import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

const SPRING = { stiffness: 220, damping: 24, mass: 0.4 };

/**
 * Wraps content in a pointer-tracked 3D tilt with a moving specular highlight.
 * Falls back to a plain container when the OS requests reduced motion.
 */
export const TiltCard = ({ children, className = '', intensity = 7, glare = true, lift = 6 }) => {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Normalised pointer position within the card (0..1 on both axes).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), SPRING);
  const translateZ = useSpring(0, SPRING);

  const glareBackground = useTransform(
    [px, py],
    ([x, y]) =>
      `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255,255,255,0.18), transparent 55%)`
  );

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const handlePointerMove = (event) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
    translateZ.set(0);
  };

  return (
    <div ref={ref} className="perspective" onPointerMove={handlePointerMove} onPointerLeave={reset}>
      <motion.div
        onPointerEnter={() => translateZ.set(lift)}
        style={{ rotateX, rotateY, translateZ, transformStyle: 'preserve-3d' }}
        className={`relative ${className}`}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden="true"
            style={{ background: glareBackground }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100 mix-blend-overlay"
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltCard;
