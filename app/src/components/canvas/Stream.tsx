"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import * as THREE from "three";

export type StreamState = "nascent" | "flowing" | "rushing" | "flooding" | "stagnant" | "evaporated";

// Animated stream origin star - energetic, outward radiating
export function StreamOriginStar({ 
  position, 
  color, 
  intensity = 1,
  scale = 1,
}: { 
  position: THREE.Vector3; 
  color: string;
  intensity?: number;
  scale?: number;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const sparklesRef = useRef<THREE.Points>(null);
  
  // Create sparkle positions around the star
  const sparkleData = useMemo(() => {
    const count = 8;
    const positions = new Float32Array(count * 3);
    const angles: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      angles.push(angle);
      positions[i * 3] = Math.cos(angle) * 2.0;
      positions[i * 3 + 1] = Math.sin(angle) * 2.0;
      positions[i * 3 + 2] = 0;
    }
    
    return { positions, angles };
  }, []);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Pulse the core
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.15;
      coreRef.current.scale.setScalar(pulse);
    }
    
    // Pulse the glow
    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(t * 2) * 0.2;
      glowRef.current.scale.setScalar(glowPulse);
    }
    
    // Rotate rings in opposite directions
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.5;
      ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.3) * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.3;
      ring2Ref.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.4) * 0.1;
    }
    
    // Animate sparkles orbiting
    if (sparklesRef.current) {
      const positions = sparklesRef.current.geometry.attributes.position;
      if (positions) {
        for (let i = 0; i < sparkleData.angles.length; i++) {
          const baseAngle = sparkleData.angles[i]!;
          const angle = baseAngle + t * 1.5;
          const radius = 1.8 + Math.sin(t * 4 + i) * 0.3;
          const z = Math.sin(t * 2 + i * 0.5) * 0.6;
          
          positions.setXYZ(
            i,
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            z
          );
        }
        positions.needsUpdate = true;
      }
    }
  });
  
  return (
    <group position={position} scale={scale}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Orbital ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.4, 0.05, 8, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Orbital ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.1, 0.04, 8, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core star */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Orbiting sparkles */}
      <points ref={sparklesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkleData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          color={color}
          transparent
          opacity={0.3}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Point light for glow effect */}
      <pointLight
        color={color}
        intensity={1.0 * intensity}
        distance={6}
      />
    </group>
  );
}

// Animated stream destination polygon - crystalline gem shape, collecting energy
export function StreamDestinationStar({ 
  position, 
  color, 
  intensity = 1,
  crystalCount = 0,
  scale = 1,
}: { 
  position: THREE.Vector3; 
  color: string;
  intensity?: number;
  crystalCount?: number;
  scale?: number;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const absorbParticlesRef = useRef<THREE.Points>(null);
  
  // Create absorbing particle positions (coming inward)
  const absorbData = useMemo(() => {
    const count = 12;
    const positions = new Float32Array(count * 3);
    const offsets: number[] = [];
    
    for (let i = 0; i < count; i++) {
      offsets.push(Math.random());
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.0;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 0;
    }
    
    return { positions, offsets };
  }, []);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Slow rotation for the polygon core
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 1.5) * 0.1;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.x = t * 0.2;
      coreRef.current.rotation.y = t * 0.4;
    }
    
    // Outer glow breathes
    if (outerRef.current) {
      const breathe = 1 + Math.sin(t * 1) * 0.15;
      outerRef.current.scale.setScalar(breathe);
      outerRef.current.rotation.x = t * 0.15;
      outerRef.current.rotation.y = t * 0.25;
    }
    
    // Edges rotate with core
    if (edgesRef.current) {
      edgesRef.current.rotation.x = t * 0.2;
      edgesRef.current.rotation.y = t * 0.4;
    }
    
    // Particles spiral inward (absorbing effect)
    if (absorbParticlesRef.current) {
      const positions = absorbParticlesRef.current.geometry.attributes.position;
      if (positions) {
        for (let i = 0; i < absorbData.offsets.length; i++) {
          const offset = absorbData.offsets[i]!;
          // Spiral inward animation
          const progress = ((t * 0.3 + offset) % 1);
          const radius = 2.8 * (1 - progress * 0.7); // Shrinks as it goes in
          const angle = offset * Math.PI * 2 + t * 2 + progress * Math.PI * 4; // Spirals
          const z = Math.sin(progress * Math.PI) * 1.0 * (1 - progress);
          
          positions.setXYZ(
            i,
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            z
          );
        }
        positions.needsUpdate = true;
      }
    }
  });
  
  // Crystal color - slightly shifted toward cyan/white
  const crystalColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.lerp(new THREE.Color("#88ffff"), 0.3);
    return "#" + c.getHexString();
  }, [color]);
  
  // Create edges geometry for the polygon wireframe (icosahedron = 20-sided gem)
  const edgesGeometry = useMemo(() => {
    const icoGeom = new THREE.IcosahedronGeometry(1.0, 0);
    return new THREE.EdgesGeometry(icoGeom);
  }, []);
  
  return (
    <group position={position} scale={scale}>
      {/* Outer ethereal glow - polygon shaped, stronger than origin */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial
          color={crystalColor}
          transparent
          opacity={0.25 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Secondary glow layer for more intensity */}
      <mesh>
        <icosahedronGeometry args={[1.4, 0]} />
        <meshBasicMaterial
          color={crystalColor}
          transparent
          opacity={0.15 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Wireframe edges - faceted gem look, brighter */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={crystalColor}
          transparent
          opacity={0.8 * intensity}
        />
      </lineSegments>
      
      {/* Core polygon - more saturated */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial
          color={crystalColor}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Inner bright core - larger and brighter */}
      <mesh>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1.0}
        />
      </mesh>
      
      {/* Absorbing/spiraling particles - brighter */}
      <points ref={absorbParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[absorbData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          color={crystalColor}
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Strong point light - represents collected energy */}
      <pointLight
        color={crystalColor}
        intensity={1.5 * intensity}
        distance={8}
      />
      
      {/* Secondary ambient glow */}
      <pointLight
        color="#ffffff"
        intensity={0.5 * intensity}
        distance={4}
      />
      
      {/* Crystal count indicator - small floating gems */}
      {crystalCount > 0 && (
        <group>
          {Array.from({ length: Math.min(crystalCount, 5) }).map((_, i) => {
            const angle = (i / Math.min(crystalCount, 5)) * Math.PI * 2;
            const radius = 2.0;
            return (
              <mesh 
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(angle) * radius,
                  0
                ]}
                scale={0.15}
              >
                <icosahedronGeometry args={[1, 0]} />
                <meshBasicMaterial
                  color="#88ffff"
                  transparent
                  opacity={0.8}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

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
// Speed ranges from very slow (stagnant) to very fast (flooding)
const streamConfig: Record<StreamState, {
  color: string;
  particleSpeed: number;
  particleDensity: number;
  lineWidth: number;
  opacity: number;
}> = {
  nascent: { color: "#64748b", particleSpeed: 0.15, particleDensity: 0.4, lineWidth: 1.5, opacity: 0.5 },    // Slow, just starting
  flowing: { color: "#00d4ff", particleSpeed: 0.4, particleDensity: 0.7, lineWidth: 2, opacity: 0.6 },      // Moderate pace
  rushing: { color: "#fbbf24", particleSpeed: 0.9, particleDensity: 0.9, lineWidth: 2.5, opacity: 0.7 },    // Fast
  flooding: { color: "#ef4444", particleSpeed: 1.5, particleDensity: 1.0, lineWidth: 3, opacity: 0.8 },     // Very fast, intense
  stagnant: { color: "#6b7280", particleSpeed: 0.03, particleDensity: 0.3, lineWidth: 1.5, opacity: 0.4 },  // Almost stopped
  evaporated: { color: "#374151", particleSpeed: 0, particleDensity: 0.1, lineWidth: 1, opacity: 0.3 },     // No movement
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

  // Get the start and end positions
  const startPosition = useMemo(() => curve.getPoint(0), [curve]);
  const endPosition = useMemo(() => curve.getPoint(1), [curve]);

  // Calculate intensity based on stream state
  const stateIntensity = state === "flooding" ? 1.2 
    : state === "rushing" ? 1.0 
    : state === "flowing" ? 0.8 
    : state === "nascent" ? 0.6
    : state === "stagnant" ? 0.4
    : 0.2; // evaporated

  return (
    <group onClick={onClick}>
      {/* Animated stream origin star */}
      <StreamOriginStar 
        position={startPosition} 
        color={config.color}
        intensity={stateIntensity}
      />

      {/* Animated stream destination star */}
      <StreamDestinationStar 
        position={endPosition} 
        color={config.color}
        intensity={stateIntensity}
        crystalCount={crystalCount}
      />

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
