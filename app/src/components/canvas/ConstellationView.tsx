"use client";

import { CelestialBody, type StarType, type OrbitalState } from "./CelestialBody";

// Mock data for demo - will be replaced with real data from API
const mockTeamMembers = [
  { id: "1", name: "Alex Chen", role: "Tech Lead", starType: "sun" as StarType, orbitalState: "open" as OrbitalState, position: [0, 0, 0] as [number, number, number], color: "#fbbf24" },
  { id: "2", name: "Maya Patel", role: "Senior Dev", starType: "giant" as StarType, orbitalState: "focused" as OrbitalState, position: [15, 5, -10] as [number, number, number], color: "#f97316" },
  { id: "3", name: "Jordan Kim", role: "Developer", starType: "main_sequence" as StarType, orbitalState: "deep_work" as OrbitalState, position: [-12, -3, 8] as [number, number, number], color: "#00d4ff" },
  { id: "4", name: "Sam Wilson", role: "Developer", starType: "main_sequence" as StarType, orbitalState: "open" as OrbitalState, position: [8, -8, 15] as [number, number, number], color: "#10b981" },
  { id: "5", name: "Riley Brooks", role: "Junior Dev", starType: "dwarf" as StarType, orbitalState: "away" as OrbitalState, position: [-18, 10, -5] as [number, number, number], color: "#ff6b9d" },
  { id: "6", name: "Dr. Nova", role: "Specialist", starType: "neutron" as StarType, orbitalState: "focused" as OrbitalState, position: [20, 2, 12] as [number, number, number], color: "#8b5cf6" },
];

export function ConstellationView() {
  return (
    <group>
      {mockTeamMembers.map((member) => (
        <CelestialBody
          key={member.id}
          id={member.id}
          name={member.name}
          role={member.role}
          starType={member.starType}
          orbitalState={member.orbitalState}
          position={member.position}
          color={member.color}
        />
      ))}
    </group>
  );
}
