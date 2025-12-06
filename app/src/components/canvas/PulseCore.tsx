"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface PulseCoreProps {
  /** Collective team energy level (0-1) */
  energyLevel: number;
  /** Number of active team members */
  activeMembers: number;
  /** Total team members */
  totalMembers: number;
  /** Active work items (kindling + blazing) */
  activeWorkItems: number;
  /** Completed today */
  completedToday: number;
  /** Current team sync/harmony score (0-1) */
  harmonyScore: number;
  /** Position in the void */
  position?: [number, number, number];
  /** Whether to show the tooltip on hover */
  showTooltip?: boolean;
}

/**
 * PulseCore - The central team heartbeat visualization
 * 
 * A pulsing orb at the center of the Observatory that visualizes:
 * - Team energy level (size and brightness)
 * - Activity rhythm (pulse rate)
 * - Team harmony (color saturation and smoothness)
 */
export function PulseCore({
  energyLevel,
  activeMembers,
  totalMembers,
  activeWorkItems,
  completedToday,
  harmonyScore,
  position = [0, 0, 0],
  showTooltip = true,
}: PulseCoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const hovered = useRef(false);

  // Pulse rate based on activity (0.5-2.0 Hz)
  const pulseRate = 0.5 + energyLevel * 1.5;
  
  // Base scale based on team size and energy
  const baseScale = 2 + (activeMembers / Math.max(totalMembers, 1)) * 1.5;
  
  // Color based on harmony (cyan at high harmony, shifting to purple at low)
  const coreColor = useMemo(() => {
    const highHarmony = new THREE.Color("#00d4ff");
    const lowHarmony = new THREE.Color("#9370db");
    return highHarmony.lerp(lowHarmony, 1 - harmonyScore);
  }, [harmonyScore]);

  // Create orbital ring particles
  const ringParticles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const radius = 4 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
      
      // Vary colors slightly
      const color = coreColor.clone();
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, [coreColor]);

  // Ambient energy particles floating around
  const ambientParticles = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i * 3 + 2] = Math.cos(phi) * radius;
      
      // Random slow velocity
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ));
    }
    
    return { positions, velocities };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Core pulsing animation
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * pulseRate * Math.PI * 2) * 0.15 * energyLevel;
      const hoverScale = hovered.current ? 1.1 : 1;
      coreRef.current.scale.setScalar(baseScale * pulse * hoverScale);
      
      // Gentle rotation
      coreRef.current.rotation.y = t * 0.1;
    }
    
    // Glow pulsing (slightly out of phase for organic feel)
    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(t * pulseRate * Math.PI * 2 + 0.5) * 0.2 * energyLevel;
      glowRef.current.scale.setScalar(baseScale * 2.5 * glowPulse);
      
      // Fade glow based on energy
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 + energyLevel * 0.15;
    }
    
    // Rotating rings
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.3;
      ringsRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    
    // Animate ambient particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < ambientParticles.velocities.length; i++) {
          const vel = ambientParticles.velocities[i];
          if (!vel) continue;
          
          const i3 = i * 3;
          let x = arr[i3] ?? 0;
          let y = arr[i3 + 1] ?? 0;
          let z = arr[i3 + 2] ?? 0;
          
          // Add velocity
          x += vel.x;
          y += vel.y;
          z += vel.z;
          
          // Keep within bounds (spherical containment)
          const dist = Math.sqrt(x * x + y * y + z * z);
          if (dist > 6) {
            // Redirect toward center
            vel.x = -x * 0.01;
            vel.y = -y * 0.01;
            vel.z = -z * 0.01;
          }
          
          arr[i3] = x;
          arr[i3 + 1] = y;
          arr[i3 + 2] = z;
        }
        posAttr.needsUpdate = true;
      }
      
      // Rotate the particle system
      particlesRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={coreRef}
        onPointerOver={() => (hovered.current = true)}
        onPointerOut={() => (hovered.current = false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.5 + energyLevel * 0.5}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Inner core (brighter) */}
      <mesh scale={0.6}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3 + energyLevel * 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbital rings */}
      <group ref={ringsRef}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            rotation={[
              Math.PI / 2 + i * 0.3,
              i * 0.5,
              0
            ]}
            scale={baseScale}
          >
            <torusGeometry args={[1.5 + i * 0.3, 0.02, 16, 100]} />
            <meshBasicMaterial
              color={coreColor}
              transparent
              opacity={0.3 - i * 0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Orbital ring particles */}
      <points rotation={[Math.PI / 2, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ringParticles.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[ringParticles.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Ambient energy particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ambientParticles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color={coreColor}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Point light for glow effect */}
      <pointLight
        color={coreColor}
        intensity={1 + energyLevel * 2}
        distance={20}
      />

      {/* Tooltip on hover */}
      {showTooltip && hovered.current && (
        <Html
          position={[0, baseScale * 2, 0]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[1000, 1100]}
        >
          <div className="bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl px-5 py-4 text-center whitespace-nowrap shadow-2xl min-w-[200px]">
            <div className="text-base font-semibold text-text-bright">
              Team Pulse
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div>
                <div className="text-text-bright font-medium">{activeMembers}/{totalMembers}</div>
                <div className="text-text-dim text-xs">Active</div>
              </div>
              <div>
                <div className="text-energy-kindling font-medium">{activeWorkItems}</div>
                <div className="text-text-dim text-xs">In flow</div>
              </div>
              <div>
                <div className="text-energy-crystallized font-medium">{completedToday}</div>
                <div className="text-text-dim text-xs">Crystallized</div>
              </div>
              <div>
                <div className="text-accent-secondary font-medium">{Math.round(harmonyScore * 100)}%</div>
                <div className="text-text-dim text-xs">Harmony</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-void-atmosphere">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-dim">Energy</span>
                <span className="text-text-bright">{Math.round(energyLevel * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-void-atmosphere rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${energyLevel * 100}%`,
                    backgroundColor: `#${coreColor.getHexString()}`,
                  }}
                />
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Calculate team metrics from work items and members
 */
export function calculateTeamMetrics(workItems: Array<{ energyState: string }>, memberCount: number) {
  const activeItems = workItems.filter(
    (item) => item.energyState === "kindling" || item.energyState === "blazing"
  ).length;
  
  const completedItems = workItems.filter(
    (item) => item.energyState === "crystallized"
  ).length;
  
  // Energy level based on ratio of active to total items
  const energyLevel = workItems.length > 0
    ? Math.min(1, (activeItems / workItems.length) * 2)
    : 0.3;
  
  // Harmony based on distribution of work (more spread = higher harmony)
  // This is simplified - in real app would use actual collaboration data
  const harmonyScore = 0.6 + Math.random() * 0.3;
  
  return {
    energyLevel,
    activeWorkItems: activeItems,
    completedToday: completedItems,
    harmonyScore,
    activeMembers: Math.ceil(memberCount * (0.5 + energyLevel * 0.5)),
    totalMembers: memberCount,
  };
}
