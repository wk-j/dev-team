"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  type EnergyState,
  type WorkItemDepth,
  ENERGY_STATE_CONFIG,
  WORK_ITEM_DEPTH_CONFIG,
} from "@/lib/constants";

export type { EnergyState, WorkItemDepth };

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
  streamPosition?: [number, number, number]; // Position on the stream path (for tether line)
  /** Show persistent title label (default: true) */
  showLabel?: boolean;
}

// Energy state visual configuration - uses centralized config
const energyConfig: Record<EnergyState, {
  color: string;
  emissiveIntensity: number;
  pulseSpeed: number;
  particleCount: number;
  wireframe: boolean;
}> = {
  dormant: { color: ENERGY_STATE_CONFIG.dormant.color, emissiveIntensity: 0.3, pulseSpeed: 0.3, particleCount: 0, wireframe: false },
  kindling: { color: ENERGY_STATE_CONFIG.kindling.color, emissiveIntensity: 0.8, pulseSpeed: 1.0, particleCount: 0, wireframe: false },
  blazing: { color: ENERGY_STATE_CONFIG.blazing.color, emissiveIntensity: 1.0, pulseSpeed: 1.5, particleCount: 0, wireframe: false },
  cooling: { color: ENERGY_STATE_CONFIG.cooling.color, emissiveIntensity: 0.5, pulseSpeed: 0.5, particleCount: 0, wireframe: false },
  crystallized: { color: ENERGY_STATE_CONFIG.crystallized.color, emissiveIntensity: 0.6, pulseSpeed: 0.2, particleCount: 0, wireframe: false },
};

// Depth affects size - uses centralized scale values
const depthScale: Record<WorkItemDepth, number> = {
  shallow: WORK_ITEM_DEPTH_CONFIG.shallow.scale,
  medium: WORK_ITEM_DEPTH_CONFIG.medium.scale,
  deep: WORK_ITEM_DEPTH_CONFIG.deep.scale,
  abyssal: WORK_ITEM_DEPTH_CONFIG.abyssal.scale,
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
  streamPosition,
  showLabel = true,
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
      {/* Tether line connecting work item to its stream */}
      {streamPosition && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  0, 0, 0, // Start at work item (relative to group)
                  streamPosition[0] - position[0],
                  streamPosition[1] - position[1],
                  streamPosition[2] - position[2],
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={config.color}
            transparent
            opacity={0.6}
          />
        </line>
      )}

      {/* Crystallization burst effect */}
      {showCrystallizationEffect && (
        <CrystallizationEffect
          position={[0, 0, 0]}
          color={energyConfig.cooling.color}
          onComplete={() => setShowCrystallizationEffect(false)}
        />
      )}

      {/* Crystallization rings for crystallized state only */}
      {energyState === "crystallized" && (
        <CrystallizationRings
          position={[0, 0, 0]}
          color={config.color}
          scale={scale}
        />
      )}

      {/* Subtle glow - only for active states, much smaller */}
      {(energyState === "blazing" || energyState === "kindling") && (
        <mesh scale={scale * 1.4}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.15}
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

      {/* Point light for subtle glow - only for active items */}
      {(energyState === "blazing" || energyState === "kindling") && (
        <pointLight
          color={config.color}
          intensity={config.emissiveIntensity * 0.8}
          distance={scale * 3}
        />
      )}

      {/* Sparkle effect for crystallized */}
      {energyState === "crystallized" && (
        <CrystalSparkles scale={scale} color={config.color} />
      )}

      {/* Blazing/focus effect - aura and rings */}
      {energyState === "blazing" && (
        <BlazingFocusEffect scale={scale} />
      )}

      {/* Persistent title label - always visible when not hovered */}
      {showLabel && !hovered && (
        <Html 
          position={[0, -scale * 2.5, 0]} 
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[100, 200]}
        >
          <div 
            className="text-center"
            style={{ 
              textShadow: "0 0 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)",
            }}
          >
            <div 
              className="text-[10px] font-medium px-1.5 py-0.5 rounded max-w-[100px] truncate"
              style={{ 
                color: config.color,
                backgroundColor: "rgba(5, 8, 15, 0.7)",
              }}
            >
              {title.length > 20 ? title.slice(0, 18) + "..." : title}
            </div>
          </div>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html 
          position={[0, scale * 3, 0]} 
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[1200, 1300]}
        >
          {energyState === "blazing" ? (
            /* Enhanced blazing/focus hover tooltip */
            <div 
              className="relative rounded-xl px-5 py-4 text-center whitespace-nowrap pointer-events-none min-w-[200px] overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(5, 8, 15, 0.98), rgba(20, 15, 5, 0.95))",
                border: "1px solid rgba(251, 191, 36, 0.5)",
                boxShadow: "0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(249, 115, 22, 0.2), 0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* Animated gradient border glow */}
              <div 
                className="absolute inset-0 rounded-xl opacity-30"
                style={{
                  background: "radial-gradient(ellipse at top, rgba(251, 191, 36, 0.4) 0%, transparent 60%)",
                }}
              />
              
              {/* Focus badge */}
              <div className="relative mb-2">
                <span 
                  className="inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                  style={{ 
                    background: "linear-gradient(135deg, #fbbf24, #f97316)",
                    color: "#000",
                    boxShadow: "0 0 15px rgba(251, 191, 36, 0.6)",
                  }}
                >
                  In Focus
                </span>
              </div>
              
              <div className="relative text-base font-semibold text-white truncate max-w-[200px]">
                {title}
              </div>
              
              <div className="relative flex items-center justify-center gap-2 mt-2">
                <div className="relative">
                  <span
                    className="w-3 h-3 rounded-full block animate-pulse"
                    style={{ 
                      backgroundColor: "#fbbf24", 
                      boxShadow: "0 0 12px #fbbf24, 0 0 24px rgba(251, 191, 36, 0.5)" 
                    }}
                  />
                </div>
                <span className="text-sm" style={{ color: "#fbbf24" }}>
                  Active Work
                </span>
              </div>
              
              {assignee && (
                <div 
                  className="relative text-sm mt-3 pt-3"
                  style={{ 
                    color: "#fbbf24",
                    borderTop: "1px solid rgba(251, 191, 36, 0.3)",
                  }}
                >
                  {assignee}
                </div>
              )}
            </div>
          ) : (
            /* Standard hover tooltip */
            <div className="bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl px-5 py-4 text-center whitespace-nowrap pointer-events-none shadow-2xl min-w-[180px]">
              <div className="text-base font-semibold text-text-bright truncate max-w-[200px]">
                {title}
              </div>
              <div className="text-sm text-text-muted flex items-center justify-center gap-2 mt-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}` }}
                />
                {energyState.charAt(0).toUpperCase() + energyState.slice(1)}
                {energyState === "crystallized" && " ✨"}
              </div>
              {assignee && (
                <div className="text-sm text-text-dim mt-3 pt-3 border-t border-void-atmosphere">
                  {assignee}
                </div>
              )}
            </div>
          )}
        </Html>
      )}
    </group>
  );
}

// Blazing Focus Effect - aura and rings for items in focus mode
function BlazingFocusEffect({ scale }: { scale: number }) {
  const auraRef = useRef<THREE.Mesh>(null);
  const innerAuraRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Pulsing aura
    if (auraRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.15;
      auraRef.current.scale.setScalar(pulse);
      const mat = auraRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(t * 4) * 0.06;
    }

    // Inner aura with faster pulse
    if (innerAuraRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.1;
      innerAuraRef.current.scale.setScalar(pulse);
      const mat = innerAuraRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 6) * 0.1;
    }

    // Rotating energy rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 2;
      const mat = ring1Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 4) * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 1.5;
      const mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 3 + 1) * 0.1;
    }
  });

  return (
    <group>
      {/* Outer pulsing aura */}
      <mesh ref={auraRef} scale={scale * 3}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner brighter aura */}
      <mesh ref={innerAuraRef} scale={scale * 2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rotating energy ring 1 */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]} scale={scale * 2.2}>
        <ringGeometry args={[0.9, 1, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rotating energy ring 2 - tilted */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]} scale={scale * 2.5}>
        <ringGeometry args={[0.9, 1, 32]} />
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Bright point light */}
      <pointLight
        color="#fbbf24"
        intensity={2}
        distance={scale * 6}
        decay={2}
      />
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

// WorkItemsView to render all work items with proper z-ordering
interface WorkItemsViewProps {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    energyState: EnergyState;
    depth: WorkItemDepth;
    position: [number, number, number];
    streamPosition?: [number, number, number]; // Anchor point on stream for tether
    assignee?: string;
  }>;
  onItemClick?: (id: string) => void;
  onItemCrystallize?: (id: string) => void;
}

export function WorkItemsView({ items, onItemClick, onItemCrystallize }: WorkItemsViewProps) {
  // Sort by energy state for visual priority (blazing/kindling on top)
  const stateOrder: Record<EnergyState, number> = {
    blazing: 0,
    kindling: 1,
    cooling: 2,
    dormant: 3,
    crystallized: 4,
  };
  
  const sortedItems = [...items].sort((a, b) => {
    return stateOrder[a.energyState] - stateOrder[b.energyState];
  });

  return (
    <group>
      {sortedItems.map((item) => (
        <EnergyOrb
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          energyState={item.energyState}
          depth={item.depth}
          position={item.position}
          streamPosition={item.streamPosition}
          assignee={item.assignee}
          onClick={() => onItemClick?.(item.id)}
          onCrystallize={() => onItemCrystallize?.(item.id)}
        />
      ))}
    </group>
  );
}

// Mock work items for demo - positioned in work zone (Y: 4-8, above streams)
export const mockWorkItems = [
  {
    id: "w1",
    title: "Implement login flow",
    energyState: "crystallized" as EnergyState,
    depth: "medium" as WorkItemDepth,
    position: [20, 5, 3] as [number, number, number],      // Above stream 1
    streamPosition: [20, 2, 3] as [number, number, number], // Anchor on stream
    assignee: "Alex Chen",
  },
  {
    id: "w2",
    title: "Design system updates",
    energyState: "blazing" as EnergyState,
    depth: "deep" as WorkItemDepth,
    position: [6, 6, 22] as [number, number, number],      // Above stream 2
    streamPosition: [6, 2.5, 22] as [number, number, number],
    assignee: "Maya Patel",
  },
  {
    id: "w3",
    title: "API endpoint for users",
    energyState: "kindling" as EnergyState,
    depth: "medium" as WorkItemDepth,
    position: [3, 5, 15] as [number, number, number],      // Above stream 2
    streamPosition: [3, 2, 15] as [number, number, number],
    assignee: "Jordan Kim",
  },
  {
    id: "w4",
    title: "Bug: Form validation",
    energyState: "dormant" as EnergyState,
    depth: "shallow" as WorkItemDepth,
    position: [-20, 4, -4] as [number, number, number],    // Above stream 3
    streamPosition: [-20, 2, -4] as [number, number, number],
  },
  {
    id: "w5",
    title: "Performance optimization",
    energyState: "cooling" as EnergyState,
    depth: "abyssal" as WorkItemDepth,
    position: [-6, 7, -22] as [number, number, number],    // Above stream 4
    streamPosition: [-6, 2, -22] as [number, number, number],
    assignee: "Dr. Nova",
  },
];
