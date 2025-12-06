"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

export function VoidEnvironment() {
  const fogRef = useRef<THREE.Fog>(null);

  // Subtle fog animation for depth
  useFrame(({ clock }) => {
    if (fogRef.current) {
      const t = clock.getElapsedTime();
      fogRef.current.far = 150 + Math.sin(t * 0.1) * 20;
    }
  });

  return (
    <>
      {/* Deep space background color */}
      <color attach="background" args={["#05080f"]} />

      {/* Atmospheric fog for depth */}
      <fog ref={fogRef} attach="fog" args={["#0a1628", 30, 150]} />

      {/* Ambient light for base visibility */}
      <ambientLight intensity={0.15} color="#4a5568" />

      {/* Directional light simulating distant star */}
      <directionalLight
        position={[50, 30, 20]}
        intensity={0.3}
        color="#00d4ff"
      />

      {/* Point lights for nebula glow effect */}
      <pointLight position={[-30, 20, -20]} intensity={0.5} color="#8b5cf6" distance={100} />
      <pointLight position={[40, -10, 30]} intensity={0.4} color="#ff6b9d" distance={80} />

      {/* Background stars */}
      <Stars
        radius={200}
        depth={100}
        count={3000}
        factor={4}
        saturation={0.3}
        fade
        speed={0.5}
      />
    </>
  );
}
