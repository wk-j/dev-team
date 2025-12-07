"use client";

import { useRef, useMemo } from "react";
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
  onClick?: () => void;
}

// Stream state visual configuration - softer, more organic appearance
const streamConfig: Record<StreamState, {
  color: string;
  particleSpeed: number;
  particleDensity: number;
  lineWidth: number;
  opacity: number;
}> = {
  nascent: { color: "#64748b", particleSpeed: 0.3, particleDensity: 0.4, lineWidth: 1.5, opacity: 0.5 },
  flowing: { color: "#00d4ff", particleSpeed: 0.5, particleDensity: 0.7, lineWidth: 2, opacity: 0.6 },
  rushing: { color: "#fbbf24", particleSpeed: 0.8, particleDensity: 0.9, lineWidth: 2.5, opacity: 0.7 },
  flooding: { color: "#ef4444", particleSpeed: 1.0, particleDensity: 1.0, lineWidth: 3, opacity: 0.8 },
  stagnant: { color: "#6b7280", particleSpeed: 0.05, particleDensity: 0.3, lineWidth: 1.5, opacity: 0.4 },
  evaporated: { color: "#374151", particleSpeed: 0, particleDensity: 0.1, lineWidth: 1, opacity: 0.3 },
};

export function Stream({ 
  id, 
  name, 
  pathPoints, 
  state, 
  velocity, 
  itemCount, 
  crystalCount = 0,
  onClick 
}: StreamProps) {
  const particlesRef = useRef<THREE.Points>(null);
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
    <group onClick={onClick}>
      {/* Stream start point indicator - small orb at beginning */}
      <mesh position={startPosition}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Main stream path */}
      <Line
        points={curvePoints}
        color={config.color}
        lineWidth={config.lineWidth}
        transparent
        opacity={config.opacity}
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
          size={0.4}
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
  onStreamClick?: (streamId: string) => void;
}

export function StreamsView({ streams, onStreamClick }: StreamsViewProps) {
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
