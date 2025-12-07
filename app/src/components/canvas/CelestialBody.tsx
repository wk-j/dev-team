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
  role?: string;
  starType: StarType;
  orbitalState: OrbitalState;
  position: [number, number, number];
  color: string;
  onClick?: () => void;
  /** Show persistent name label (default: true) */
  showLabel?: boolean;
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

interface CelestialBodyProps {
  id: string;
  name: string;
  role?: string;
  starType: StarType;
  orbitalState: OrbitalState;
  position: [number, number, number];
  color: string;
  onClick?: () => void;
  /** Show persistent name label (default: true) */
  showLabel?: boolean;
}

export function CelestialBody({
  id,
  name,
  role,
  starType,
  orbitalState,
  position,
  color,
  onClick,
  showLabel = true,
}: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const config = starConfig[starType];
  const orbital = orbitalConfig[orbitalState];

  // Animation frame - pause animations when hovered for readability
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      if (hovered) {
        // Static enlarged scale when hovered
        meshRef.current.scale.setScalar(config.scale * 1.15);
      } else {
        // Breathing effect when not hovered
        const breathe = 1 + Math.sin(t * orbital.pulseSpeed) * 0.05;
        meshRef.current.scale.setScalar(config.scale * breathe);
      }
    }

    if (ringRef.current) {
      if (!hovered) {
        // Ring rotation only when not hovered
        ringRef.current.rotation.z = t * 0.5;
        ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.1;
      }
    }

    if (glowRef.current) {
      if (hovered) {
        // Static glow when hovered - slightly larger
        glowRef.current.scale.setScalar(config.scale * 1.8);
      } else {
        // Glow pulsing when not hovered - reduced size
        const glowScale = config.scale * 1.5 * (1 + Math.sin(t * orbital.pulseSpeed * 0.5) * 0.1);
        glowRef.current.scale.setScalar(glowScale);
      }
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

      {/* Orbital ring - only visible for focused/deep_work states */}
      {(orbitalState === "focused" || orbitalState === "deep_work") && (
        <mesh ref={ringRef}>
          <torusGeometry args={[config.scale * 1.8, 0.04, 8, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={orbital.ringOpacity * 0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

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

      {/* Persistent name label - always visible */}
      {showLabel && !hovered && (
        <Html 
          position={[0, -config.scale * 2, 0]} 
          center
          style={{ 
            pointerEvents: "none",
          }}
          zIndexRange={[100, 200]}
        >
          <div 
            className="text-center whitespace-nowrap"
            style={{ 
              textShadow: "0 0 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)",
            }}
          >
            <div 
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ 
                color: color,
                backgroundColor: "rgba(5, 8, 15, 0.7)",
              }}
            >
              {name.split(" ")[0]}
            </div>
          </div>
        </Html>
      )}

      {/* Hover tooltip - Higher z-index for team members */}
      {hovered && (
        <Html 
          position={[0, config.scale * 2.5, 0]} 
          center
          style={{ 
            pointerEvents: "none",
            transform: "translate(-50%, -100%)",
          }}
          zIndexRange={[1300, 1400]}
        >
          <div className="bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl px-5 py-4 text-center whitespace-nowrap shadow-2xl min-w-[160px]">
            <div className="text-base font-semibold text-text-bright">{name}</div>
            <div className="text-sm text-text-muted mt-1">{role}</div>
            <div className="text-sm mt-3 flex items-center justify-center gap-2 pt-2 border-t border-void-atmosphere">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              <span className="text-text-dim capitalize">{orbitalState.replace("_", " ")}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
