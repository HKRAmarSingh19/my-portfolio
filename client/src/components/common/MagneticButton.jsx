import React, { useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

const SPRING = { stiffness: 260, damping: 18, mass: 0.35 };

/**
 * Button/link wrapper whose contents drift toward the cursor while it is inside
 * the element, then spring back on exit. `as` lets it wrap a Link or anchor.
 */
export const MagneticButton = ({
  children,
  className = '',
  as: Component = 'button',
  strength = 0.28,
  ...props
}) => {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  // Memoised: creating this during render would remount children every pass.
  const MotionComponent = useMemo(() => motion.create(Component), [Component]);

  if (prefersReducedMotion) {
    return (
      <Component ref={ref} className={className} {...props}>
        {children}
      </Component>
    );
  }

  const handlePointerMove = (event) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    // Offset from the element's centre, damped by `strength`.
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <MotionComponent
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={{ x, y }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default MagneticButton;
