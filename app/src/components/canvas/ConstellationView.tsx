"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { CelestialBody, type StarType, type OrbitalState } from "./CelestialBody";

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
}

interface ConstellationViewProps {
  members?: TeamMember[];
  /** Radius of the constellation */
  orbitRadius?: number;
  /** Vertical variation for depth effect */
  yVariation?: number;
  /** Base Y position for team members */
  baseY?: number;
  /** Show the orbit ring indicator */
  showOrbitRing?: boolean;
}

// Orbital ring visualization for the constellation zone
function OrbitRing({ radius, opacity = 0.15 }: { radius: number; opacity?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#00d4ff"
      lineWidth={1.5}
      transparent
      opacity={opacity}
    />
  );
}

export function ConstellationView({ 
  members = [],
  orbitRadius = 20,
  yVariation = 2,
  baseY = 15,
  showOrbitRing = false,
}: ConstellationViewProps) {
  // Generate positions for members - spread evenly in the outer zone
  const positionedMembers = useMemo(() => {
    const count = members.length;
    if (count === 0) return [];
    
    // Calculate optimal spacing - ensure members don't overlap
    const minAngularSpacing = Math.PI / 8; // 22.5 degrees minimum between members
    const totalAngle = Math.PI * 2;
    const anglePerMember = Math.max(minAngularSpacing, totalAngle / count);
    
    // Sort by star type for visual grouping (optional - keeps similar stars together)
    const starTypeOrder: Record<string, number> = {
      sun: 0,
      giant: 1,
      main_sequence: 2,
      dwarf: 3,
      neutron: 4,
    };
    
    const sortedMembers = [...members].sort((a, b) => {
      const orderA = starTypeOrder[a.starType] ?? 2;
      const orderB = starTypeOrder[b.starType] ?? 2;
      return orderA - orderB;
    });
    
    return sortedMembers.map((member, index) => {
      // Use stored position if available (allows manual positioning)
      if (member.positionX !== undefined && member.positionZ !== undefined) {
        return {
          ...member,
          position: [member.positionX, member.positionY ?? 0, member.positionZ] as [number, number, number],
        };
      }
      
      // Calculate position on the constellation ring
      const baseAngle = (index * anglePerMember);
      // Add slight offset based on member id hash for consistent but varied positioning
      const hashOffset = (member.id.charCodeAt(0) % 10) * 0.02;
      const angle = baseAngle + hashOffset;
      
      // Slight radius variation for depth (not all on exact same circle)
      const radiusVariation = (Math.sin(index * 1.618 + 0.5) * 3); // ±3 units
      const memberRadius = orbitRadius + radiusVariation;
      
      // Y variation based on orbital state (deep work members slightly lower)
      const stateYOffset = member.orbitalState === "deep_work" ? -2 : 
                           member.orbitalState === "away" ? -1 : 0;
      const y = baseY + Math.sin(index * 2.1) * yVariation + stateYOffset;
      
      return {
        ...member,
        position: [
          Math.cos(angle) * memberRadius,
          y,
          Math.sin(angle) * memberRadius,
        ] as [number, number, number],
      };
    });
  }, [members, orbitRadius, yVariation]);

  if (members.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Subtle orbit ring to show the constellation zone */}
      {showOrbitRing && <OrbitRing radius={orbitRadius} opacity={0.1} />}
      
      {/* Team members as celestial bodies */}
      {positionedMembers.map((member) => (
        <CelestialBody
          key={member.id}
          id={member.id}
          name={member.name}
          role={member.role ?? undefined}
          starType={member.starType as StarType}
          orbitalState={member.orbitalState as OrbitalState}
          position={member.position}
          color={member.energySignatureColor}
        />
      ))}
    </group>
  );
}
