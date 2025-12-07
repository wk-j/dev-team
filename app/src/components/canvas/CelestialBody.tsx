"use client";

import { useRef, useState, useMemo } from "react";
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
  /** Number of active work items (affects star appearance) */
  activeWorkItems?: number;
  /** Current energy level 0-100 (affects glow intensity) */
  energyLevel?: number;
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
  /** Number of active work items (affects star appearance) */
  activeWorkItems?: number;
  /** Current energy level 0-100 (affects glow intensity) */
  energyLevel?: number;
}

// Orbiting work item particle component
function WorkItemOrbit({ 
  count, 
  color, 
  baseScale,
  orbitSpeed = 1,
}: { 
  count: number; 
  color: string; 
  baseScale: number;
  orbitSpeed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  // Create particle positions
  const particleCount = Math.min(count, 5); // Max 5 visible particles
  const orbitRadius = baseScale * 2;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame(({ clock }) => {
    if (!particlesRef.current || particleCount === 0) return;
    
    const t = clock.getElapsedTime() * orbitSpeed;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + t;
      const yOffset = Math.sin(t * 2 + i) * 0.3;
      
      dummy.position.set(
        Math.cos(angle) * orbitRadius,
        yOffset,
        Math.sin(angle) * orbitRadius
      );
      dummy.scale.setScalar(0.15 + Math.sin(t * 3 + i) * 0.05);
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (particleCount === 0) return null;
  
  return (
    <group ref={groupRef}>
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
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
  activeWorkItems = 0,
  energyLevel = 50,
}: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const config = starConfig[starType];
  const orbital = orbitalConfig[orbitalState];
  
  // Calculate dynamic intensity based on energy level and active work
  const energyFactor = energyLevel / 100;
  const workFactor = Math.min(1, activeWorkItems / 3); // 0-1 based on work items (3+ = max)
  const dynamicIntensity = 0.5 + (energyFactor * 0.3) + (workFactor * 0.2); // 0.5 to 1.0
  
  // More active pulse when working on items
  const dynamicPulseSpeed = orbital.pulseSpeed * (1 + workFactor * 0.5);

  // Animation frame - pause animations when hovered for readability
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      if (hovered) {
        // Static enlarged scale when hovered
        meshRef.current.scale.setScalar(config.scale * 1.15);
      } else {
        // Breathing effect when not hovered - more pronounced with active work
        const breatheAmount = 0.05 + workFactor * 0.03; // 0.05 to 0.08
        const breathe = 1 + Math.sin(t * dynamicPulseSpeed) * breatheAmount;
        meshRef.current.scale.setScalar(config.scale * breathe);
      }
    }

    if (ringRef.current) {
      if (!hovered) {
        // Ring rotation only when not hovered - faster with active work
        const rotationSpeed = 0.5 + workFactor * 0.3;
        ringRef.current.rotation.z = t * rotationSpeed;
        ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.1;
      }
    }

    if (glowRef.current) {
      if (hovered) {
        // Static glow when hovered - slightly larger
        glowRef.current.scale.setScalar(config.scale * 1.8);
      } else {
        // Glow pulsing when not hovered - more intense with active work
        const glowPulse = 0.1 + workFactor * 0.05;
        const glowScale = config.scale * (1.5 + workFactor * 0.3) * (1 + Math.sin(t * dynamicPulseSpeed * 0.5) * glowPulse);
        glowRef.current.scale.setScalar(glowScale);
      }
    }
  });

  return (
    <group position={position}>
      {/* Outer glow - intensity varies with energy */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={(0.1 + energyFactor * 0.1) * orbital.dimFactor}
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

      {/* Orbiting work item particles - visible when user has active work */}
      {activeWorkItems > 0 && (
        <WorkItemOrbit 
          count={activeWorkItems} 
          color={color} 
          baseScale={config.scale}
          orbitSpeed={0.8 + workFactor * 0.4}
        />
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
          emissiveIntensity={config.emissiveIntensity * orbital.dimFactor * dynamicIntensity}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Point light for local glow - brighter with more energy/work */}
      <pointLight
        color={color}
        intensity={config.emissiveIntensity * 2 * orbital.dimFactor * dynamicIntensity}
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
            
            {/* Work items indicator */}
            {activeWorkItems > 0 && (
              <div className="text-xs mt-2 px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary">
                {activeWorkItems} active {activeWorkItems === 1 ? 'item' : 'items'}
              </div>
            )}
            
            <div className="text-sm mt-3 flex items-center justify-center gap-2 pt-2 border-t border-void-atmosphere">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              <span className="text-text-dim capitalize">{orbitalState.replace("_", " ")}</span>
            </div>
            
            {/* Energy level bar */}
            <div className="mt-2">
              <div className="h-1 bg-void-atmosphere rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${energyLevel}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="text-xs text-text-dim mt-1">{energyLevel}% energy</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
