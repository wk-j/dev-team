"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type PingType = "gentle" | "warm" | "direct";

interface PingEffectProps {
  /** Starting position (sender) */
  from: [number, number, number];
  /** Target position (receiver) */
  to: [number, number, number];
  /** Type of ping affects visuals */
  type: PingType;
  /** Called when animation completes */
  onComplete?: () => void;
  /** Duration in seconds */
  duration?: number;
}

// Visual config for each ping type
const pingConfig: Record<PingType, {
  color: string;
  trailColor: string;
  size: number;
  trailLength: number;
  pulseSpeed: number;
  particleCount: number;
}> = {
  gentle: {
    color: "#4ade80", // Soft green
    trailColor: "#22c55e",
    size: 0.3,
    trailLength: 15,
    pulseSpeed: 2,
    particleCount: 20,
  },
  warm: {
    color: "#fbbf24", // Warm amber
    trailColor: "#f59e0b",
    size: 0.5,
    trailLength: 25,
    pulseSpeed: 3,
    particleCount: 35,
  },
  direct: {
    color: "#ef4444", // Urgent red
    trailColor: "#dc2626",
    size: 0.7,
    trailLength: 40,
    pulseSpeed: 5,
    particleCount: 50,
  },
};

/**
 * PingEffect - Animated ping traveling between two points
 */
export function PingEffect({
  from,
  to,
  type,
  onComplete,
  duration = 1.5,
}: PingEffectProps) {
  const config = pingConfig[type];
  const pingRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Create curved path
  const { curve, trailPositions } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    
    // Create an arc by adding control points
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    
    // Arc height based on distance
    const arcHeight = distance * 0.3;
    midPoint.y += arcHeight;
    
    // Add some horizontal curve based on ping type
    const perpendicular = new THREE.Vector3()
      .subVectors(end, start)
      .cross(new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(distance * 0.1 * (type === "direct" ? 0 : 1));
    
    midPoint.add(perpendicular);
    
    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    
    // Pre-allocate trail positions
    const trailPositions = new Float32Array(config.trailLength * 3);
    
    return { curve, trailPositions };
  }, [from, to, type, config.trailLength]);

  useFrame(() => {
    if (isComplete) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out for smoother arrival
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    // Update ping position
    if (pingRef.current) {
      const pos = curve.getPoint(easedProgress);
      pingRef.current.position.copy(pos);
      
      // Pulse scale
      const pulse = 1 + Math.sin(elapsed * config.pulseSpeed * Math.PI * 2) * 0.3;
      pingRef.current.scale.setScalar(config.size * pulse);
    }

    // Update glow
    if (glowRef.current && pingRef.current) {
      glowRef.current.position.copy(pingRef.current.position);
      const pulse = 1 + Math.sin(elapsed * config.pulseSpeed * Math.PI * 2 + 0.5) * 0.2;
      glowRef.current.scale.setScalar(config.size * 3 * pulse);
    }

    // Update trail
    if (trailRef.current) {
      const positions = trailRef.current.geometry.attributes.position;
      if (positions) {
        const arr = positions.array as Float32Array;
        
        for (let i = 0; i < config.trailLength; i++) {
          // Each trail point is slightly behind the main ping
          const trailProgress = Math.max(0, easedProgress - (i / config.trailLength) * 0.3);
          const trailPos = curve.getPoint(trailProgress);
          
          arr[i * 3] = trailPos.x;
          arr[i * 3 + 1] = trailPos.y;
          arr[i * 3 + 2] = trailPos.z;
        }
        
        positions.needsUpdate = true;
      }
    }

    // Complete
    if (progress >= 1) {
      setIsComplete(true);
      onComplete?.();
    }
  });

  if (isComplete) return null;

  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main ping */}
      <mesh ref={pingRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Trail particles */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={config.size * 0.5}
          color={config.trailColor}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Point light for glow */}
      <pointLight
        position={pingRef.current?.position.toArray() ?? from}
        color={config.color}
        intensity={2}
        distance={10}
      />
    </group>
  );
}

/**
 * Ping arrival burst effect
 */
export function PingArrivalEffect({
  position,
  type,
  onComplete,
}: {
  position: [number, number, number];
  type: PingType;
  onComplete?: () => void;
}) {
  const config = pingConfig[type];
  const burstRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // 1 second
  const [isComplete, setIsComplete] = useState(false);

  // Burst particles
  const burstParticles = useMemo(() => {
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random outward velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.5 + Math.random() * 1;
      velocities.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      ));
    }

    return { positions, velocities };
  }, [config.particleCount]);

  useFrame(() => {
    if (isComplete) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Update burst particles
    if (burstRef.current) {
      const positions = burstRef.current.geometry.attributes.position;
      if (positions) {
        const arr = positions.array as Float32Array;
        const ease = 1 - Math.pow(1 - progress, 2);

        for (let i = 0; i < burstParticles.velocities.length; i++) {
          const vel = burstParticles.velocities[i];
          if (!vel) continue;

          arr[i * 3] = vel.x * ease * 3;
          arr[i * 3 + 1] = vel.y * ease * 3;
          arr[i * 3 + 2] = vel.z * ease * 3;
        }
        positions.needsUpdate = true;
      }

      // Fade out
      const material = burstRef.current.material as THREE.PointsMaterial;
      material.opacity = (1 - progress) * 0.8;
    }

    // Update rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const ringProgress = Math.max(0, progress - i * 0.1);
        const scale = 1 + ringProgress * 4;
        ring.scale.setScalar(scale);
        (ring as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: Math.max(0, (1 - ringProgress) * 0.3),
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
      });
    }

    if (progress >= 1) {
      setIsComplete(true);
      onComplete?.();
    }
  });

  if (isComplete) return null;

  return (
    <group position={position}>
      {/* Burst particles */}
      <points ref={burstRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[burstParticles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          color={config.color}
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Expanding rings */}
      <group ref={ringsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Active pings manager - renders all active ping animations
 */
interface ActivePing {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  type: PingType;
}

interface PingManagerProps {
  pings: ActivePing[];
  onPingComplete?: (id: string) => void;
}

export function PingManager({ pings, onPingComplete }: PingManagerProps) {
  const [arrivals, setArrivals] = useState<Array<{
    id: string;
    position: [number, number, number];
    type: PingType;
  }>>([]);

  const handlePingComplete = (ping: ActivePing) => {
    // Show arrival effect
    setArrivals(prev => [...prev, {
      id: `arrival-${ping.id}`,
      position: ping.to,
      type: ping.type,
    }]);
    
    onPingComplete?.(ping.id);
  };

  const handleArrivalComplete = (id: string) => {
    setArrivals(prev => prev.filter(a => a.id !== id));
  };

  return (
    <group>
      {pings.map(ping => (
        <PingEffect
          key={ping.id}
          from={ping.from}
          to={ping.to}
          type={ping.type}
          onComplete={() => handlePingComplete(ping)}
        />
      ))}
      
      {arrivals.map(arrival => (
        <PingArrivalEffect
          key={arrival.id}
          position={arrival.position}
          type={arrival.type}
          onComplete={() => handleArrivalComplete(arrival.id)}
        />
      ))}
    </group>
  );
}
