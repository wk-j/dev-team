"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type StarType = "sun" | "giant" | "main_sequence" | "dwarf" | "neutron";
export type OrbitalState = "open" | "focused" | "deep_work" | "away" | "supernova";

interface CelestialBodyProps {
  id: string;
  name: string;
  role: string;
  starType: StarType;
  orbitalState: OrbitalState;
  position: [number, number, number];
  color: string;
  onClick?: () => void;
}

// Star type configuration
const starConfig: Record<StarType, { scale: number; emissiveIntensity: number }> = {
  sun: { scale: 2.5, emissiveIntensity: 2 },
  giant: { scale: 2, emissiveIntensity: 1.5 },
  main_sequence: { scale: 1.2, emissiveIntensity: 1 },
  dwarf: { scale: 0.8, emissiveIntensity: 0.7 },
  neutron: { scale: 0.5, emissiveIntensity: 3 },
};

// Orbital state affects pulse speed and ring visibility
const orbitalConfig: Record<OrbitalState, { pulseSpeed: number; ringOpacity: number; dimFactor: number }> = {
  open: { pulseSpeed: 2, ringOpacity: 0.8, dimFactor: 1 },
  focused: { pulseSpeed: 1.5, ringOpacity: 0.5, dimFactor: 0.85 },
  deep_work: { pulseSpeed: 0.5, ringOpacity: 0.3, dimFactor: 0.6 },
  away: { pulseSpeed: 0.2, ringOpacity: 0.1, dimFactor: 0.3 },
  supernova: { pulseSpeed: 4, ringOpacity: 1, dimFactor: 1.5 },
};

export function CelestialBody({
  id,
  name,
  role,
  starType,
  orbitalState,
  position,
  color,
  onClick,
}: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const config = starConfig[starType];
  const orbital = orbitalConfig[orbitalState];

  // Animation frame
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      // Breathing effect
      const breathe = 1 + Math.sin(t * orbital.pulseSpeed) * 0.05;
      meshRef.current.scale.setScalar(config.scale * breathe * (hovered ? 1.2 : 1));
    }

    if (ringRef.current) {
      // Ring rotation
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.1;
    }

    if (glowRef.current) {
      // Glow pulsing
      const glowScale = config.scale * 2 * (1 + Math.sin(t * orbital.pulseSpeed * 0.5) * 0.1);
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15 * orbital.dimFactor}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[config.scale * 1.5, 0.03, 8, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={orbital.ringOpacity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core star */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={config.emissiveIntensity * orbital.dimFactor}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Point light for local glow */}
      <pointLight
        color={color}
        intensity={config.emissiveIntensity * 2 * orbital.dimFactor}
        distance={config.scale * 10}
      />

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={15} position={[0, config.scale * 2, 0]}>
          <div className="glass-panel px-3 py-2 text-center whitespace-nowrap pointer-events-none">
            <div className="text-moon text-text-bright font-medium">{name}</div>
            <div className="text-dust text-text-muted">{role}</div>
            <div className="text-dust mt-1">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: color }}
              />
              {orbitalState.replace("_", " ")}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
