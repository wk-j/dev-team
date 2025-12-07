"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import * as THREE from "three";

export type StreamState = "nascent" | "flowing" | "rushing" | "flooding" | "stagnant" | "evaporated";

interface StreamProps {
  id: string;
  name: string;
  pathPoints: Array<{ x: number; y: number; z: number }>;
  state: StreamState;
  velocity: number;
  itemCount: number;
  crystalCount?: number;
  showHealthIndicator?: boolean;
  onClick?: () => void;
}

// Stream state visual configuration - increased visibility
const streamConfig: Record<StreamState, {
  color: string;
  particleSpeed: number;
  particleDensity: number;
  lineWidth: number;
  opacity: number;
  healthColor: string;
  healthLabel: string;
  pulseSpeed: number;
}> = {
  nascent: { color: "#64748b", particleSpeed: 0.3, particleDensity: 0.3, lineWidth: 3, opacity: 0.7, healthColor: "#64748b", healthLabel: "New", pulseSpeed: 0 },
  flowing: { color: "#00d4ff", particleSpeed: 0.5, particleDensity: 0.6, lineWidth: 4, opacity: 0.85, healthColor: "#10b981", healthLabel: "Healthy", pulseSpeed: 1 },
  rushing: { color: "#fbbf24", particleSpeed: 0.8, particleDensity: 0.8, lineWidth: 5, opacity: 0.9, healthColor: "#fbbf24", healthLabel: "Active", pulseSpeed: 2 },
  flooding: { color: "#ef4444", particleSpeed: 1.0, particleDensity: 1.0, lineWidth: 6, opacity: 1.0, healthColor: "#ef4444", healthLabel: "Overloaded", pulseSpeed: 3 },
  stagnant: { color: "#6b7280", particleSpeed: 0.05, particleDensity: 0.2, lineWidth: 3, opacity: 0.6, healthColor: "#f97316", healthLabel: "Stagnant", pulseSpeed: 0.5 },
  evaporated: { color: "#374151", particleSpeed: 0, particleDensity: 0.1, lineWidth: 2, opacity: 0.4, healthColor: "#374151", healthLabel: "Archived", pulseSpeed: 0 },
};

// Stream health indicator component
function StreamHealthIndicator({ 
  position, 
  state, 
  itemCount,
  crystalCount = 0,
  name,
  isHovered,
}: { 
  position: THREE.Vector3;
  state: StreamState;
  itemCount: number;
  crystalCount?: number;
  name: string;
  isHovered: boolean;
}) {
  const indicatorRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const config = streamConfig[state];
  
  // Animate the health indicator
  useFrame(({ clock }) => {
    if (indicatorRef.current && config.pulseSpeed > 0) {
      const pulse = Math.sin(clock.getElapsedTime() * config.pulseSpeed) * 0.1 + 1;
      indicatorRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01 * config.pulseSpeed;
    }
  });

  // Calculate health percentage based on state and items
  const healthPercent = state === "evaporated" ? 0 
    : state === "stagnant" ? 30
    : state === "flooding" ? 100
    : state === "rushing" ? 80
    : state === "flowing" ? 60
    : 20;

  return (
    <group position={position}>
      {/* Central orb */}
      <mesh ref={indicatorRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial 
          color={config.healthColor} 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.1, 8, 32]} />
        <meshBasicMaterial 
          color={config.color} 
          transparent 
          opacity={0.4}
        />
      </mesh>

      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial 
          color={config.healthColor} 
          transparent 
          opacity={0.15}
        />
      </mesh>

      {/* Health bar arc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.15, 8, 32, (healthPercent / 100) * Math.PI * 2]} />
        <meshBasicMaterial 
          color={config.healthColor} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      {/* Info tooltip on hover */}
      {isHovered && (
        <Html 
          center 
          style={{ pointerEvents: "none" }}
          zIndexRange={[1000, 1100]}
        >
          <div className="bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl px-5 py-4 pointer-events-none min-w-[180px] shadow-2xl">
            <div className="text-base font-semibold text-text-bright mb-2">{name}</div>
            <div className="flex items-center gap-2 text-sm">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: config.healthColor, boxShadow: `0 0 8px ${config.healthColor}` }}
              />
              <span className="text-text-muted">{config.healthLabel}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-void-atmosphere grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-text-bright font-medium">{itemCount}</div>
                <div className="text-text-dim text-xs">Items</div>
              </div>
              <div>
                <div className="text-energy-crystallized font-medium">{crystalCount}</div>
                <div className="text-text-dim text-xs">Done</div>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function Stream({ 
  id, 
  name, 
  pathPoints, 
  state, 
  velocity, 
  itemCount, 
  crystalCount = 0,
  showHealthIndicator = true,
  onClick 
}: StreamProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const [isHovered, setIsHovered] = useState(false);
  const config = streamConfig[state];

  // Create smooth curve from path points
  const { curve, curvePoints, particleData } = useMemo(() => {
    if (pathPoints.length < 2) {
      // Default path if not enough points
      const defaultPoints = [
        new THREE.Vector3(-20, 0, 0),
        new THREE.Vector3(-10, 5, 5),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(10, -5, 5),
        new THREE.Vector3(20, 0, 0),
      ];
      const curve = new THREE.CatmullRomCurve3(defaultPoints);
      return {
        curve,
        curvePoints: curve.getPoints(100),
        particleData: createParticleData(curve, config.particleDensity),
      };
    }

    const vectorPoints = pathPoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(vectorPoints);

    return {
      curve,
      curvePoints: curve.getPoints(100),
      particleData: createParticleData(curve, config.particleDensity),
    };
  }, [pathPoints, config.particleDensity]);

  // Animate particles flowing along the stream
  useFrame(({ clock }) => {
    if (particlesRef.current && config.particleSpeed > 0) {
      const t = clock.getElapsedTime();
      const geometry = particlesRef.current.geometry;
      const positions = geometry.attributes.position;
      if (!positions) return;

      const numParticles = positions.count;
      for (let i = 0; i < numParticles; i++) {
        const baseT = particleData.offsets[i] ?? 0;
        const animatedT = (baseT + t * config.particleSpeed * velocity) % 1;
        const point = curve.getPoint(animatedT);

        // Add some wobble perpendicular to flow direction
        const wobble = Math.sin(t * 2 + i * 0.5) * 0.2;
        positions.setXYZ(
          i,
          point.x + wobble,
          point.y + wobble * 0.5,
          point.z
        );
      }
      positions.needsUpdate = true;
    }
  });

  // Get the start position for health indicator
  const startPosition = useMemo(() => curve.getPoint(0), [curve]);

  return (
    <group 
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Health indicator at stream start - only on hover to reduce clutter */}
      {showHealthIndicator && isHovered && (
        <StreamHealthIndicator
          position={startPosition}
          state={state}
          itemCount={itemCount}
          crystalCount={crystalCount}
          name={name}
          isHovered={isHovered}
        />
      )}

      {/* Stream start point indicator - small orb at beginning */}
      <mesh position={startPosition}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Main stream path - BOLD and visible */}
      <Line
        points={curvePoints}
        color={config.color}
        lineWidth={isHovered ? config.lineWidth * 1.5 : config.lineWidth}
        transparent
        opacity={isHovered ? 1 : config.opacity}
      />

      {/* Stream glow (wider, more transparent) */}
      <Line
        points={curvePoints}
        color={config.color}
        lineWidth={config.lineWidth * 2}
        transparent
        opacity={config.opacity * 0.3}
      />

      {/* Flowing particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isHovered ? 0.6 : 0.4}
          color={config.color}
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Stream name label at START (left side) - always visible */}
      <Html 
        position={curve.getPoint(0).toArray()} 
        center 
        style={{ pointerEvents: "none" }}
        zIndexRange={[50, 100]}
      >
        <div 
          className="whitespace-nowrap"
          style={{ 
            transform: "translateX(-100%) translateX(-8px)",
          }}
        >
          <div 
            className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ 
              color: "#fff",
              backgroundColor: config.color,
              boxShadow: `0 0 12px ${config.color}40`,
            }}
          >
            {name}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Helper to create particle data
function createParticleData(curve: THREE.CatmullRomCurve3, density: number) {
  const numParticles = Math.floor(30 * density);
  const positions = new Float32Array(numParticles * 3);
  const offsets: number[] = [];

  for (let i = 0; i < numParticles; i++) {
    const t = Math.random();
    offsets.push(t);
    const point = curve.getPoint(t);
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  }

  return { positions, offsets };
}

// StreamsView component to render all streams with proper spacing
interface StreamsViewProps {
  streams: Array<{
    id: string;
    name: string;
    pathPoints: Array<{ x: number; y: number; z: number }>;
    state: StreamState;
    velocity: number;
    itemCount: number;
    crystalCount?: number;
  }>;
  showHealthIndicators?: boolean;
  onStreamClick?: (streamId: string) => void;
}

export function StreamsView({ streams, showHealthIndicators = true, onStreamClick }: StreamsViewProps) {
  // Sort streams by state priority (flooding/rushing first, then flowing, etc.)
  // This ensures important streams are rendered on top
  const stateOrder: Record<StreamState, number> = {
    flooding: 0,
    rushing: 1,
    flowing: 2,
    nascent: 3,
    stagnant: 4,
    evaporated: 5,
  };
  
  const sortedStreams = [...streams].sort((a, b) => {
    return stateOrder[a.state] - stateOrder[b.state];
  });

  return (
    <group>
      {sortedStreams.map((stream) => (
        <Stream
          key={stream.id}
          id={stream.id}
          name={stream.name}
          pathPoints={stream.pathPoints}
          state={stream.state}
          velocity={stream.velocity}
          itemCount={stream.itemCount}
          crystalCount={stream.crystalCount}
          showHealthIndicator={showHealthIndicators}
          onClick={() => onStreamClick?.(stream.id)}
        />
      ))}
    </group>
  );
}

// Mock streams for demo - using zoned layout (streams flow from radius 10 to 30)
export const mockStreams = [
  {
    id: "1",
    name: "Frontend Sprint",
    pathPoints: [
      { x: 10, y: 0, z: 0 },      // Start at inner edge
      { x: 18, y: 3, z: 4 },      // Curve up
      { x: 28, y: 1.5, z: 6 },    // End at outer edge
    ],
    state: "rushing" as StreamState,
    velocity: 1.2,
    itemCount: 8,
    crystalCount: 3,
  },
  {
    id: "2",
    name: "API Development",
    pathPoints: [
      { x: 0, y: 0, z: 10 },      // Start at inner edge (90 degrees)
      { x: 5, y: 3, z: 18 },      // Curve up
      { x: 8, y: 1.5, z: 28 },    // End at outer edge
    ],
    state: "flowing" as StreamState,
    velocity: 1.0,
    itemCount: 5,
    crystalCount: 2,
  },
  {
    id: "3",
    name: "Bug Fixes",
    pathPoints: [
      { x: -10, y: 0, z: 0 },     // Start at inner edge (180 degrees)
      { x: -18, y: 3, z: -4 },    // Curve up
      { x: -28, y: 1.5, z: -6 },  // End at outer edge
    ],
    state: "nascent" as StreamState,
    velocity: 0.5,
    itemCount: 2,
    crystalCount: 0,
  },
  {
    id: "4",
    name: "Tech Debt",
    pathPoints: [
      { x: 0, y: 0, z: -10 },     // Start at inner edge (270 degrees)
      { x: -5, y: 3, z: -18 },    // Curve up
      { x: -8, y: 1.5, z: -28 },  // End at outer edge
    ],
    state: "stagnant" as StreamState,
    velocity: 0.2,
    itemCount: 12,
    crystalCount: 1,
  },
];
