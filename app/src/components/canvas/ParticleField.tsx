"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  count?: number;
  spread?: number;
  reducedMotion?: boolean;
  particleDensity?: number; // 0.1 to 2.0 multiplier
}

export function ParticleField({ 
  count = 500, 
  spread = 100,
  reducedMotion = false,
  particleDensity = 1.0,
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Check for system reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
  
  // Apply density multiplier to count (min 50, max 2000)
  const actualCount = useMemo(() => {
    return Math.max(50, Math.min(2000, Math.round(count * particleDensity)));
  }, [count, particleDensity]);
  
  const shouldReduceMotion = reducedMotion || prefersReducedMotion;

  // Generate particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const colors = new Float32Array(actualCount * 3);
    const sizes = new Float32Array(actualCount);

    const colorPalette = [
      new THREE.Color("#00d4ff"), // Cyan
      new THREE.Color("#8b5cf6"), // Purple
      new THREE.Color("#ff6b9d"), // Pink
      new THREE.Color("#10b981"), // Emerald
      new THREE.Color("#ffffff"), // White
    ];

    for (let i = 0; i < actualCount; i++) {
      // Random position in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.random() * spread;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      if (color) {
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      // Random size
      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, colors, sizes };
  }, [actualCount, spread]);

  // Animate particles (skip if reduced motion)
  useFrame(({ clock }) => {
    if (meshRef.current && !shouldReduceMotion) {
      const t = clock.getElapsedTime();
      // Slow rotation
      meshRef.current.rotation.y = t * 0.02;
      meshRef.current.rotation.x = Math.sin(t * 0.05) * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[particles.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
