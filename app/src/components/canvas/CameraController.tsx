"use client";

import { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Gentle camera breathing effect
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Subtle position oscillation
    camera.position.y = camera.position.y + Math.sin(t * 0.3) * 0.002;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      panSpeed={0.8}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
      minDistance={10}
      maxDistance={200}
      // Smooth damping for organic feel
      enableDamping={true}
      dampingFactor={0.05}
      // Limit vertical rotation
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
    />
  );
}
