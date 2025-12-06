"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type EnergyState = "dormant" | "kindling" | "blazing" | "cooling" | "crystallized";
export type WorkItemDepth = "shallow" | "medium" | "deep" | "abyssal";

interface EnergyOrbProps {
  id: string;
  title: string;
  description?: string;
  energyState: EnergyState;
  depth: WorkItemDepth;
  position: [number, number, number];
  assignee?: string;
  onClick?: () => void;
  onCrystallize?: () => void;
}

// Energy state visual configuration
const energyConfig: Record<EnergyState, {
  color: string;
  emissiveIntensity: number;
  pulseSpeed: number;
  particleCount: number;
  wireframe: boolean;
}> = {
  dormant: { color: "#4b5563", emissiveIntensity: 0.2, pulseSpeed: 0.3, particleCount: 0, wireframe: false },
  kindling: { color: "#f97316", emissiveIntensity: 0.6, pulseSpeed: 1.0, particleCount: 5, wireframe: false },
  blazing: { color: "#fbbf24", emissiveIntensity: 1.2, pulseSpeed: 2.0, particleCount: 15, wireframe: false },
  cooling: { color: "#a78bfa", emissiveIntensity: 0.4, pulseSpeed: 0.5, particleCount: 3, wireframe: false },
  crystallized: { color: "#06b6d4", emissiveIntensity: 0.8, pulseSpeed: 0.2, particleCount: 0, wireframe: true },
};

// Depth affects size
const depthScale: Record<WorkItemDepth, number> = {
  shallow: 0.6,
  medium: 0.9,
  deep: 1.3,
  abyssal: 1.8,
};

// Crystallization particle burst effect
function CrystallizationEffect({ 
  position, 
  color, 
  onComplete 
}: { 
  position: [number, number, number]; 
  color: string;
  onComplete: () => void;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const burstParticles = 50;
  const startTime = useRef(Date.now());
  const duration = 2000; // 2 seconds

  // Create burst particles
  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(burstParticles * 3);
    const vel: THREE.Vector3[] = [];
    const cols = new Float32Array(burstParticles * 3);
    const baseColor = new THREE.Color(color);
    const crystalColor = new THREE.Color("#06b6d4");

    for (let i = 0; i < burstParticles; i++) {
      // Start from center
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      // Random outward velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.5 + Math.random() * 1.5;
      vel.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      ));

      // Gradient from original color to crystal color
      const t = Math.random();
      const particleColor = baseColor.clone().lerp(crystalColor, t);
      cols[i * 3] = particleColor.r;
      cols[i * 3 + 1] = particleColor.g;
      cols[i * 3 + 2] = particleColor.b;
    }

    return { positions: pos, velocities: vel, colors: cols };
  }, [color]);

  useFrame(() => {
    if (!particlesRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      onComplete();
      return;
    }

    const posAttr = particlesRef.current.geometry.attributes.position;
    if (!posAttr) return;

    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < burstParticles; i++) {
      const vel = velocities[i];
      if (!vel) continue;

      const i3 = i * 3;
      const x = arr[i3];
      const y = arr[i3 + 1];
      const z = arr[i3 + 2];
      
      if (x === undefined || y === undefined || z === undefined) continue;
      
      // Apply velocity with easing
      const ease = 1 - Math.pow(progress, 0.5);
      arr[i3] = x + vel.x * 0.1 * ease;
      arr[i3 + 1] = y + vel.y * 0.1 * ease;
      arr[i3 + 2] = z + vel.z * 0.1 * ease;
    }

    posAttr.needsUpdate = true;

    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 1 - progress;
    material.size = 0.3 * (1 - progress * 0.5);
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Ring expansion effect during crystallization
function CrystallizationRings({ 
  position, 
  color,
  scale,
}: { 
  position: [number, number, number]; 
  color: string;
  scale: number;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Staggered ring animations
    [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
      if (ref.current) {
        const offset = i * 0.3;
        const ringT = (t + offset) % 2;
        const ringScale = 1 + ringT * 2;
        const opacity = Math.max(0, 1 - ringT / 2);
        
        ref.current.scale.setScalar(ringScale * scale);
        (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.3;
      }
    });
  });

  return (
    <group position={position}>
      {[ring1Ref, ring2Ref, ring3Ref].map((ref, i) => (
        <mesh key={i} ref={ref} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function EnergyOrb({
  id,
  title,
  description,
  energyState,
  depth,
  position,
  assignee,
  onClick,
  onCrystallize,
}: EnergyOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);
  const [showCrystallizationEffect, setShowCrystallizationEffect] = useState(false);
  const [previousState, setPreviousState] = useState<EnergyState | null>(null);

  const config = energyConfig[energyState];
  const scale = depthScale[depth];

  // Detect transition to crystallized state
  useEffect(() => {
    if (previousState && previousState !== "crystallized" && energyState === "crystallized") {
      setShowCrystallizationEffect(true);
      onCrystallize?.();
    }
    setPreviousState(energyState);
  }, [energyState, previousState, onCrystallize]);

  // Create particles for kindling/blazing states
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(config.particleCount * 3);
    for (let i = 0; i < config.particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, [config.particleCount]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Orb breathing/pulsing
    if (meshRef.current) {
      const pulse = 1 + Math.sin(t * config.pulseSpeed) * 0.08;
      const hoverScale = hovered ? 1.2 : 1;
      meshRef.current.scale.setScalar(scale * pulse * hoverScale);

      // Rotation for crystallized - more elaborate
      if (energyState === "crystallized") {
        meshRef.current.rotation.y = t * 0.3;
        meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.2;
        meshRef.current.rotation.z = Math.cos(t * 0.15) * 0.1;
      }
    }

    // Animate particles
    if (particlesRef.current && config.particleCount > 0) {
      const positions = particlesRef.current.geometry.attributes.position;
      if (!positions) return;

      for (let i = 0; i < config.particleCount; i++) {
        const baseY = positions.getY(i);
        const speed = energyState === "blazing" ? 0.05 : 0.02;
        let newY = baseY + speed;
        if (newY > 1.5) newY = -1.5;
        positions.setY(i, newY);

        // Wobble X/Z
        const wobble = Math.sin(t * 3 + i) * 0.02;
        positions.setX(i, positions.getX(i) + wobble);
      }
      positions.needsUpdate = true;
    }
  });

  // Choose geometry based on state
  const renderGeometry = () => {
    if (energyState === "crystallized") {
      return <icosahedronGeometry args={[1, 0]} />;
    }
    if (energyState === "cooling") {
      // Transition geometry - octahedron
      return <octahedronGeometry args={[1, 0]} />;
    }
    return <sphereGeometry args={[1, 32, 32]} />;
  };

  return (
    <group position={position}>
      {/* Crystallization burst effect */}
      {showCrystallizationEffect && (
        <CrystallizationEffect
          position={[0, 0, 0]}
          color={energyConfig.cooling.color}
          onComplete={() => setShowCrystallizationEffect(false)}
        />
      )}

      {/* Crystallization rings for crystallized state */}
      {energyState === "crystallized" && (
        <CrystallizationRings
          position={[0, 0, 0]}
          color={config.color}
          scale={scale}
        />
      )}

      {/* Outer glow */}
      <mesh scale={scale * 2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={energyState === "crystallized" ? 0.15 : 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Crystal facet highlights for crystallized state */}
      {energyState === "crystallized" && (
        <mesh scale={scale * 1.1}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.1}
            wireframe
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Main orb */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={config.emissiveIntensity}
          roughness={energyState === "crystallized" ? 0.1 : 0.5}
          metalness={energyState === "crystallized" ? 0.8 : 0.1}
          wireframe={config.wireframe}
        />
      </mesh>

      {/* Particles for active states */}
      {config.particleCount > 0 && (
        <points ref={particlesRef} scale={scale}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.15}
            color={config.color}
            transparent
            opacity={0.9}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Point light for glow effect */}
      <pointLight
        color={config.color}
        intensity={config.emissiveIntensity * 2}
        distance={scale * 5}
      />

      {/* Sparkle effect for crystallized */}
      {energyState === "crystallized" && (
        <CrystalSparkles scale={scale} color={config.color} />
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={15} position={[0, scale * 2, 0]}>
          <div className="glass-panel px-3 py-2 text-center whitespace-nowrap pointer-events-none max-w-[200px]">
            <div className="text-moon text-text-bright font-medium truncate">
              {title}
            </div>
            <div className="text-dust text-text-muted flex items-center justify-center gap-2 mt-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {energyState.charAt(0).toUpperCase() + energyState.slice(1)}
              {energyState === "crystallized" && " ✨"}
            </div>
            {assignee && (
              <div className="text-dust text-text-dim mt-1">
                {assignee}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Sparkle effect for crystallized orbs
function CrystalSparkles({ scale, color }: { scale: number; color: string }) {
  const sparkleCount = 8;
  const sparklesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i++) {
      const theta = (i / sparkleCount) * Math.PI * 2;
      const radius = scale * 1.5;
      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * scale;
      pos[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return pos;
  }, [scale]);

  useFrame(({ clock }) => {
    if (!sparklesRef.current) return;
    
    const t = clock.getElapsedTime();
    sparklesRef.current.rotation.y = t * 0.5;
    
    // Twinkle effect
    const material = sparklesRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.5 + Math.sin(t * 4) * 0.3;
  });

  return (
    <points ref={sparklesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// WorkItemsView to render all work items
interface WorkItemsViewProps {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    energyState: EnergyState;
    depth: WorkItemDepth;
    position: [number, number, number];
    assignee?: string;
  }>;
  onItemClick?: (id: string) => void;
  onItemCrystallize?: (id: string) => void;
}

export function WorkItemsView({ items, onItemClick, onItemCrystallize }: WorkItemsViewProps) {
  return (
    <group>
      {items.map((item) => (
        <EnergyOrb
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          energyState={item.energyState}
          depth={item.depth}
          position={item.position}
          assignee={item.assignee}
          onClick={() => onItemClick?.(item.id)}
          onCrystallize={() => onItemCrystallize?.(item.id)}
        />
      ))}
    </group>
  );
}

// Mock work items for demo
export const mockWorkItems = [
  {
    id: "w1",
    title: "Implement login flow",
    energyState: "crystallized" as EnergyState,
    depth: "medium" as WorkItemDepth,
    position: [25, 0, -2] as [number, number, number],
    assignee: "Alex Chen",
  },
  {
    id: "w2",
    title: "Design system updates",
    energyState: "blazing" as EnergyState,
    depth: "deep" as WorkItemDepth,
    position: [5, 2, -12] as [number, number, number],
    assignee: "Maya Patel",
  },
  {
    id: "w3",
    title: "API endpoint for users",
    energyState: "kindling" as EnergyState,
    depth: "medium" as WorkItemDepth,
    position: [-5, -3, 18] as [number, number, number],
    assignee: "Jordan Kim",
  },
  {
    id: "w4",
    title: "Bug: Form validation",
    energyState: "dormant" as EnergyState,
    depth: "shallow" as WorkItemDepth,
    position: [15, 12, -8] as [number, number, number],
  },
  {
    id: "w5",
    title: "Performance optimization",
    energyState: "cooling" as EnergyState,
    depth: "abyssal" as WorkItemDepth,
    position: [-15, 0, 5] as [number, number, number],
    assignee: "Dr. Nova",
  },
];
