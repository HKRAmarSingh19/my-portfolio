import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reveals a string word-by-word on mount or scroll-into-view.
 * Words stay in normal flow so text still wraps and remains selectable.
 */
export const AnimatedText = ({
  text,
  className = '',
  delay = 0,
  stagger = 0.055,
  as: Component = 'span',
  inView = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const words = String(text).split(' ');

  if (prefersReducedMotion) {
    return <Component className={className}>{text}</Component>;
  }

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const word = {
    hidden: { opacity: 0, y: '0.5em', filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      y: '0em',
      filter: 'blur(0px)',
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const revealProps = inView
    ? { whileInView: 'visible', viewport: { once: true, margin: '-60px' } }
    : { animate: 'visible' };

  return (
    <Component className={className}>
      <motion.span variants={container} initial="hidden" {...revealProps} className="inline">
        {words.map((item, index) => (
          <motion.span key={`${item}-${index}`} variants={word} className="inline-block whitespace-pre">
            {item}
            {index < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
};

export default AnimatedText;
