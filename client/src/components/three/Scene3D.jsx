import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

// three.js is ~600kB; keep it out of the initial bundle entirely.
const HeroScene = lazy(() => import('./HeroScene'));

/** Cheap CSS stand-in shown while three.js loads, or when WebGL is unavailable. */
const SceneFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
    <div className="relative">
      <div className="w-48 h-48 rounded-full border border-indigo-500/25 animate-spin-slow" />
      <div className="absolute inset-6 rounded-full border border-indigo-500/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl animate-float" />
      </div>
    </div>
  </div>
);

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
};

/**
 * Guarded entry point for the WebGL hero. Renders the CSS fallback on machines
 * without WebGL, and mounts only after first paint so the 3D work never
 * competes with the hero copy for the critical render path.
 */
export const Scene3D = ({ className = '' }) => {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [webGL, setWebGL] = useState(true);

  useEffect(() => {
    setWebGL(supportsWebGL());
    // Defer one frame past mount so the text hero paints first.
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!webGL) {
    return (
      <div className={className}>
        <SceneFallback />
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<SceneFallback />}>
        {ready && <HeroScene isDark={theme === 'dark'} animate={!prefersReducedMotion} />}
      </Suspense>
    </div>
  );
};

export default Scene3D;
