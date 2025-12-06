"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface Crystal {
  id: string;
  title: string;
  completedAt: Date;
  energyLevel: number; // 0-100, affects brightness
  depth: "shallow" | "medium" | "deep" | "abyssal";
  contributor?: string;
}

interface CrystalGardenProps {
  /** Completed work items to display as crystals */
  crystals: Crystal[];
  /** Position of the garden in the void */
  position?: [number, number, number];
  /** Radius of the garden arrangement */
  radius?: number;
  /** Maximum crystals to display */
  maxCrystals?: number;
  /** Called when a crystal is clicked */
  onCrystalClick?: (id: string) => void;
}

// Crystal size based on depth
const depthScale: Record<Crystal["depth"], number> = {
  shallow: 0.4,
  medium: 0.6,
  deep: 0.9,
  abyssal: 1.2,
};

// Crystal color palette
const crystalColors = [
  "#00ffc8", // Cyan
  "#00d4ff", // Electric cyan
  "#4de8ff", // Light cyan
  "#80ffea", // Pale cyan
  "#00b894", // Teal
];

/**
 * Individual crystal component
 */
function Crystal({
  crystal,
  position,
  baseRotation,
  onClick,
}: {
  crystal: Crystal;
  position: [number, number, number];
  baseRotation: number;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const scale = depthScale[crystal.depth];
  const color = crystalColors[Math.floor(Math.random() * crystalColors.length)] ?? "#00ffc8";
  const brightness = 0.3 + (crystal.energyLevel / 100) * 0.7;
  
  // Calculate time since completion for animation
  const age = useMemo(() => {
    const now = new Date();
    return (now.getTime() - crystal.completedAt.getTime()) / (1000 * 60 * 60); // hours
  }, [crystal.completedAt]);
  
  // Newer crystals glow brighter
  const glowIntensity = Math.max(0.3, 1 - age / 24);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (meshRef.current) {
      // Gentle floating motion
      meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + baseRotation) * 0.1;
      
      // Slow rotation
      meshRef.current.rotation.y = baseRotation + t * 0.2;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
      
      // Hover scale
      const targetScale = hovered ? scale * 1.3 : scale;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
    
    if (glowRef.current) {
      // Pulsing glow
      const pulse = 1 + Math.sin(t * 2 + baseRotation) * 0.2;
      glowRef.current.scale.setScalar(scale * 2 * pulse);
      
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 * glowIntensity * brightness;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main crystal */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={brightness * glowIntensity}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh scale={0.3}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.5 * brightness}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Crystal facet wireframe */}
      <mesh scale={scale * 1.02}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>

      {/* Point light */}
      <pointLight
        color={color}
        intensity={brightness * glowIntensity * 0.5}
        distance={3}
      />

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, scale * 2, 0]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[1000, 1100]}
        >
          <div className="bg-void-deep/95 backdrop-blur-md border border-cyan-500/30 rounded-xl px-5 py-4 text-center whitespace-nowrap shadow-2xl min-w-[180px]">
            <div className="text-base font-semibold text-cyan-400 truncate max-w-[200px]">
              {crystal.title}
            </div>
            <div className="text-sm text-text-muted mt-2 flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px #06b6d4" }} />
              Crystallized
            </div>
            {crystal.contributor && (
              <div className="text-sm text-text-dim mt-3 pt-3 border-t border-void-atmosphere">
                by {crystal.contributor}
              </div>
            )}
            <div className="text-xs text-text-dim mt-2 opacity-70">
              {formatTimeAgo(crystal.completedAt)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Format time ago string
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

/**
 * Floating particles around the garden
 */
function GardenParticles({ 
  position, 
  radius, 
  count = 30 
}: { 
  position: [number, number, number]; 
  radius: number;
  count?: number;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Random position in cylinder around garden
      const angle = Math.random() * Math.PI * 2;
      const r = radius * 0.5 + Math.random() * radius;
      const y = (Math.random() - 0.5) * radius;
      
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      
      // Cyan-ish colors
      const color = new THREE.Color(crystalColors[i % crystalColors.length] ?? "#00ffc8");
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, [count, radius]);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const t = clock.getElapsedTime();
    particlesRef.current.rotation.y = t * 0.05;
    
    // Floating motion
    const posAttr = particlesRef.current.geometry.attributes.position;
    if (posAttr) {
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const originalY = particles.positions[i3 + 1] ?? 0;
        arr[i3 + 1] = originalY + Math.sin(t + i * 0.5) * 0.2;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[particles.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
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

/**
 * Ground plane with subtle glow
 */
function GardenGround({ 
  position, 
  radius 
}: { 
  position: [number, number, number]; 
  radius: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.05 + Math.sin(t * 0.5) * 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1] - 1.5, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[radius * 1.2, 64]} />
      <meshBasicMaterial
        color="#00ffc8"
        transparent
        opacity={0.05}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * CrystalGarden - Display completed work as a garden of crystals
 * 
 * Crystals are arranged in a circular pattern, with newer crystals
 * glowing brighter. Each crystal represents a completed work item.
 */
export function CrystalGarden({
  crystals,
  position = [25, -5, -15],
  radius = 8,
  maxCrystals = 20,
  onCrystalClick,
}: CrystalGardenProps) {
  // Sort by completion time, newest first, and limit
  const sortedCrystals = useMemo(() => {
    return [...crystals]
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, maxCrystals);
  }, [crystals, maxCrystals]);

  // Calculate positions in a spiral pattern
  const crystalPositions = useMemo(() => {
    return sortedCrystals.map((crystal, i) => {
      const total = sortedCrystals.length;
      
      if (total === 1) {
        return { crystal, position: [0, 0, 0] as [number, number, number], rotation: 0 };
      }
      
      // Golden ratio spiral
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angle = i * goldenAngle;
      const r = Math.sqrt(i / total) * radius * 0.8;
      const y = (Math.random() - 0.5) * 2; // Slight vertical variation
      
      return {
        crystal,
        position: [
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r,
        ] as [number, number, number],
        rotation: angle,
      };
    });
  }, [sortedCrystals, radius]);

  if (crystals.length === 0) {
    return null;
  }

  return (
    <group position={position}>
      {/* Ground glow */}
      <GardenGround position={[0, 0, 0]} radius={radius} />
      
      {/* Floating particles */}
      <GardenParticles position={[0, 0, 0]} radius={radius} count={40} />
      
      {/* Crystals */}
      {crystalPositions.map(({ crystal, position: pos, rotation }) => (
        <Crystal
          key={crystal.id}
          crystal={crystal}
          position={pos}
          baseRotation={rotation}
          onClick={() => onCrystalClick?.(crystal.id)}
        />
      ))}

      {/* Label */}
      <Html
        position={[0, -2.5, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="text-xs text-cyan-400/60 font-medium tracking-wider uppercase">
          Crystal Garden
        </div>
        <div className="text-xs text-text-dim text-center mt-0.5">
          {crystals.length} completed
        </div>
      </Html>
    </group>
  );
}

/**
 * Create mock crystals from work items
 */
export function createMockCrystals(count: number = 12): Crystal[] {
  const titles = [
    "User authentication flow",
    "API endpoint refactor",
    "Dashboard redesign",
    "Performance optimization",
    "Bug fix: Login issue",
    "Documentation update",
    "Database migration",
    "Unit test coverage",
    "Mobile responsive layout",
    "Search functionality",
    "Email notifications",
    "Data export feature",
    "Security audit",
    "Caching layer",
    "Error handling",
  ];
  
  const depths: Crystal["depth"][] = ["shallow", "medium", "deep", "abyssal"];
  const contributors = ["Alex Chen", "Maya Patel", "Jordan Kim", "Dr. Nova", "Sam Rivera"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `crystal-${i}`,
    title: titles[i % titles.length] ?? "Completed Task",
    completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
    energyLevel: 50 + Math.random() * 50,
    depth: depths[Math.floor(Math.random() * depths.length)] ?? "medium",
    contributor: Math.random() > 0.3 ? contributors[Math.floor(Math.random() * contributors.length)] : undefined,
  }));
}
