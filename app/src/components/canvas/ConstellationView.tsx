"use client";

import { useMemo } from "react";
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
}

export function ConstellationView({ members = [] }: ConstellationViewProps) {
  // Generate positions for members if not provided
  const positionedMembers = useMemo(() => {
    return members.map((member, index) => {
      // Use stored position or generate one based on index
      const angle = (index / Math.max(members.length, 1)) * Math.PI * 2;
      const radius = 12 + (index % 3) * 6;
      
      return {
        ...member,
        position: [
          member.positionX ?? Math.cos(angle) * radius,
          member.positionY ?? (Math.sin(index * 1.5) * 5),
          member.positionZ ?? Math.sin(angle) * radius,
        ] as [number, number, number],
      };
    });
  }, [members]);

  if (members.length === 0) {
    return null;
  }

  return (
    <group>
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
