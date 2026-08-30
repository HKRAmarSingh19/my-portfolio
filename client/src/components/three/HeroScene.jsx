import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Indigo palette, inverted per theme so the form always separates from the page
 * behind it: deep indigo on the near-white canvas, pale indigo on the near-black
 * one. Depth reads from lighting and specularity, hue only tints it.
 */
const PALETTE = {
  light: { core: '#4f46e5', emissive: '#312e81', wire: '#818cf8', particles: '#6366f1' },
  dark: { core: '#a5b4fc', emissive: '#4f46e5', wire: '#818cf8', particles: '#c7d2fe' },
};

/**
 * Distorted metallic knot at the centre of the composition. Rotates on its own
 * axis so the form still reads as 3D when the pointer is idle.
 */
const CoreKnot = ({ animate, palette }) => {
  const mesh = useRef();

  useFrame((_, delta) => {
    if (!mesh.current || !animate) return;
    mesh.current.rotation.x += delta * 0.14;
    mesh.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={mesh} castShadow>
      <torusKnotGeometry args={[1.05, 0.3, 180, 28]} />
      <MeshDistortMaterial
        color={palette.core}
        distort={animate ? 0.28 : 0}
        speed={1.3}
        roughness={0.18}
        metalness={0.82}
        emissive={palette.emissive}
        emissiveIntensity={0.35}
      />
    </mesh>
  );
};

/** Wireframe shell that counter-rotates, giving the scene visible depth. */
const WireShell = ({ animate, palette }) => {
  const mesh = useRef();

  useFrame((_, delta) => {
    if (!mesh.current || !animate) return;
    mesh.current.rotation.y -= delta * 0.075;
    mesh.current.rotation.z += delta * 0.035;
  });

  return (
    <mesh ref={mesh} scale={2.5}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color={palette.wire} wireframe transparent opacity={0.22} />
    </mesh>
  );
};

/** Sparse drifting point field for atmosphere. */
const ParticleField = ({ count = 130, animate, palette }) => {
  const points = useRef();

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Distribute on a spherical shell so the core stays visually clear.
      const radius = 3.1 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      array[i * 3 + 2] = radius * Math.cos(phi);
    }
    return array;
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current || !animate) return;
    points.current.rotation.y += delta * 0.045;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={palette.particles}
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

/**
 * Normalised window pointer in the range [-1, 1], y flipped to match three's
 * own convention (+1 at the top). Tracked at the window rather than the canvas
 * so the parallax keeps working when the canvas sits behind other hero content
 * with `pointer-events: none`.
 */
const useWindowPointer = (enabled) => {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return undefined;

    const handleMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [enabled]);

  return pointer;
};

/**
 * Eases the whole composition toward the pointer instead of using OrbitControls,
 * so the scene never fights the page for scroll or drag gestures.
 */
const PointerRig = ({ children, animate }) => {
  const group = useRef();
  const pointer = useWindowPointer(animate);

  useFrame(() => {
    if (!group.current || !animate) return;
    const { x, y } = pointer.current;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.38, 0.045);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.26, 0.045);
  });

  return <group ref={group}>{children}</group>;
};

export const HeroScene = ({ isDark = false, animate = true }) => {
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  return (
    <Canvas
      // Cap DPR so the scene stays cheap on high-density displays.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // A static single frame is enough when motion is suppressed.
      frameloop={animate ? 'always' : 'demand'}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={isDark ? 0.45 : 0.85} />
      <directionalLight position={[4, 5, 4]} intensity={isDark ? 1.5 : 1.15} color="#ffffff" />
      <pointLight position={[-5, -2, -3]} intensity={isDark ? 3.2 : 1.8} color="#ffffff" />
      <pointLight position={[3, -3, 4]} intensity={1.4} color="#818cf8" />

      <PointerRig animate={animate}>
        <CoreKnot animate={animate} palette={palette} />
        <WireShell animate={animate} palette={palette} />
        <ParticleField animate={animate} palette={palette} />
      </PointerRig>
    </Canvas>
  );
};

export default HeroScene;
