import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/** Hairline reading-progress indicator pinned to the top of the viewport. */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-500"
    />
  );
};

export default ScrollProgress;
