"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface Connection {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength: number; // 0-100
  active: boolean;
}

interface ResonanceConnectionsProps {
  connections: Connection[];
}

export function ResonanceConnections({ connections }: ResonanceConnectionsProps) {
  return (
    <group>
      {connections.map((connection, index) => (
        <ConnectionLine
          key={index}
          from={connection.from}
          to={connection.to}
          strength={connection.strength}
          active={connection.active}
        />
      ))}
    </group>
  );
}

interface ConnectionLineProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength: number;
  active: boolean;
}

function ConnectionLine({ from, to, strength, active }: ConnectionLineProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Create curved path between points
  const { curve, points, particlePositions } = useMemo(() => {
    const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    // Add some curve by lifting the midpoint
    const distance = from.distanceTo(to);
    midPoint.y += distance * 0.15;

    const curve = new THREE.QuadraticBezierCurve3(from, midPoint, to);
    const curvePoints = curve.getPoints(50);

    // Create particles along the curve
    const numParticles = Math.floor(strength / 10) + 3;
    const particlePositions = new Float32Array(numParticles * 3);
    for (let i = 0; i < numParticles; i++) {
      const t = i / numParticles;
      const point = curve.getPoint(t);
      particlePositions[i * 3] = point.x;
      particlePositions[i * 3 + 1] = point.y;
      particlePositions[i * 3 + 2] = point.z;
    }

    return { curve, points: curvePoints, particlePositions };
  }, [from, to, strength]);

  // Animate particles flowing along the connection
  useFrame(({ clock }) => {
    if (particlesRef.current && active) {
      const t = clock.getElapsedTime();
      const geometry = particlesRef.current.geometry;
      const positions = geometry.attributes.position;
      if (!positions) return;

      const numParticles = positions.count;
      for (let i = 0; i < numParticles; i++) {
        // Move particles along the curve
        const baseT = i / numParticles;
        const animatedT = (baseT + t * 0.1) % 1;
        const point = curve.getPoint(animatedT);
        positions.setXYZ(i, point.x, point.y, point.z);
      }
      positions.needsUpdate = true;
    }
  });

  // Color based on strength
  const getColor = () => {
    if (strength >= 80) return "#00d4ff"; // Strong - Cyan
    if (strength >= 50) return "#8b5cf6"; // Medium - Purple
    if (strength >= 30) return "#10b981"; // Low-medium - Green
    return "#64748b"; // Weak - Gray
  };

  const color = getColor();
  const opacity = active ? 0.6 : 0.2;
  const lineWidth = Math.max(1, strength / 30);

  return (
    <group>
      {/* Main connection line using drei Line */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={!active}
        dashSize={0.5}
        gapSize={0.3}
      />

      {/* Flowing particles (only when active) */}
      {active && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.5}
            color={color}
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Glow at connection endpoints when strong */}
      {strength >= 70 && (
        <>
          <mesh position={from}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={to}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// Helper to generate mock connections from celestial body positions
export function generateMockConnections(
  positions: Array<{ id: string; position: [number, number, number] }>
): Connection[] {
  const connections: Connection[] = [];

  // Create some connections between nearby users
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const posA = positions[i];
      const posB = positions[j];
      if (!posA || !posB) continue;

      const from = new THREE.Vector3(...posA.position);
      const to = new THREE.Vector3(...posB.position);
      const distance = from.distanceTo(to);

      // Only connect if within reasonable distance
      if (distance < 30) {
        // Random strength based on proximity
        const strength = Math.max(10, Math.round(100 - distance * 3 + Math.random() * 20));
        connections.push({
          from,
          to,
          strength,
          active: strength > 50, // Active if strong connection
        });
      }
    }
  }

  return connections;
}
