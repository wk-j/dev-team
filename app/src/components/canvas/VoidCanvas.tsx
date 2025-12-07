"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { VoidEnvironment, getTimeOfDayFromHour, getWeatherFromTeamHealth } from "./VoidEnvironment";
import { CameraController } from "./CameraController";
import { ParticleField } from "./ParticleField";
import { ConstellationView, type TeamMember } from "./ConstellationView";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { StreamsView, mockStreams, type StreamState } from "./Stream";
import { WorkItemsView, mockWorkItems, type EnergyState, type WorkItemDepth } from "./EnergyOrb";
import { DiveMode } from "./DiveMode";
import { PulseCore, calculateTeamMetrics } from "./PulseCore";
import type { Stream, WorkItem, StreamDiver } from "@/lib/api/client";

// ============================================================================
// SPATIAL LAYOUT - SIMPLE HORIZONTAL LANES
// ============================================================================
// Much simpler layout for readability:
//
//   TOP: Team members (Y = +15)
//   CENTER: Team Pulse (Y = 0)  
//   BOTTOM: Streams as HORIZONTAL LANES (Y = -8 to -20)
//           Work items sit ON their stream lane
//
// ============================================================================

const LAYOUT = {
  // Core zone - central pulse (elevated slightly)
  core: {
    position: [0, 5, 0] as [number, number, number],
    radius: 4,
  },
  // Streams - horizontal lanes below center
  streams: {
    startX: -25,      // Left edge
    endX: 25,         // Right edge
    baseY: -5,        // First stream Y position
    spacing: 8,       // Vertical spacing between streams
    z: 0,             // All streams on same Z plane
  },
  // Work items - sit directly on stream lanes
  workItems: {
    yOffset: 0.5,     // Tiny offset above stream
    xSpacing: 8,      // Horizontal spacing between items on same stream
  },
  // Team constellation zone - above center
  team: {
    radius: 20,
    y: 15,            // Above the pulse
    yVariation: 2,
  },
  // Ambient particles zone
  ambient: {
    innerRadius: 40,
    outerRadius: 60,
  },
} as const;

// Zone boundary ring - subtle visual separator
function ZoneBoundary({ radius, opacity = 0.1, color = "#00d4ff" }: { 
  radius: number; 
  opacity?: number; 
  color?: string;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;
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
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
      dashed
      dashSize={2}
      gapSize={2}
    />
  );
}

// Dive mode state
export interface DiveModeState {
  streamId: string;
  streamName: string;
  streamState: StreamState;
  workItems: WorkItem[];
  divers: StreamDiver[];
}

interface VoidCanvasProps {
  className?: string;
  showPerformance?: boolean;
  showStreams?: boolean;
  showWorkItems?: boolean;
  showPulseCore?: boolean;
  // Real data from API
  streams?: Stream[];
  workItems?: WorkItem[];
  // Team data
  teamMembers?: TeamMember[];
  teamMemberCount?: number;
  // Dive mode
  diveMode?: DiveModeState | null;
  currentUserId?: string;
  onDiveIntoStream?: (streamId: string) => void;
  onSurfaceFromStream?: () => void;
  onWorkItemClick?: (itemId: string) => void;
  onWorkItemKindle?: (itemId: string) => void;
  onWorkItemStateChange?: (itemId: string, newState: EnergyState) => void;
  // Accessibility & Performance
  reducedMotion?: boolean;
  particleDensity?: number;
}

// Transform API stream data to SIMPLE HORIZONTAL LANES
function transformStreams(apiStreams: Stream[] | undefined) {
  if (!apiStreams || apiStreams.length === 0) {
    return [];
  }

  const { startX, endX, baseY, spacing, z } = LAYOUT.streams;

  return apiStreams.map((stream, index) => {
    // Each stream is a simple horizontal line at different Y positions
    const y = baseY - (index * spacing);
    
    return {
      id: stream.id,
      name: stream.name,
      // Simple straight horizontal line from left to right
      pathPoints: [
        { x: startX, y, z },
        { x: endX, y, z },
      ],
      state: stream.state as StreamState,
      velocity: stream.velocity,
      itemCount: stream.itemCount,
      crystalCount: stream.crystalCount,
      // Store Y position for work item placement
      laneY: y,
    };
  });
}

// Transform work items - position ON their stream lane (simple horizontal layout)
function transformWorkItems(
  apiWorkItems: WorkItem[] | undefined,
  streams: Array<{ id: string; pathPoints: Array<{ x: number; y: number; z: number }>; laneY?: number }>
) {
  if (!apiWorkItems || apiWorkItems.length === 0) {
    return [];
  }

  // If no streams, place items in a row
  if (streams.length === 0) {
    return apiWorkItems.map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      energyState: item.energyState as EnergyState,
      depth: item.depth as WorkItemDepth,
      position: [-15 + index * 8, -5, 0] as [number, number, number],
      streamPosition: undefined,
      assignee: item.contributors?.find(c => c.isPrimary)?.name,
    }));
  }

  // Group items by stream
  const itemsByStream = new Map<string, typeof apiWorkItems>();
  apiWorkItems.forEach(item => {
    // Find matching stream or use first stream
    const stream = streams.find(s => s.id === item.streamId) || streams[0]!;
    const streamId = stream.id;
    const items = itemsByStream.get(streamId) || [];
    items.push(item);
    itemsByStream.set(streamId, items);
  });

  return apiWorkItems.map((item) => {
    // Find the stream for this item (or fallback to first)
    const stream = streams.find(s => s.id === item.streamId) || streams[0]!;
    const itemsOnStream = itemsByStream.get(stream.id) || [];
    const indexOnStream = itemsOnStream.findIndex(i => i.id === item.id);
    const totalOnStream = itemsOnStream.length;
    
    // Get stream Y position (lane)
    const streamY = stream.laneY ?? stream.pathPoints[0]?.y ?? -5;
    
    // Position item along the stream (spread horizontally)
    const { startX, endX } = LAYOUT.streams;
    const streamWidth = endX - startX;
    const xPadding = 8; // Don't place at very edges
    const availableWidth = streamWidth - (xPadding * 2);
    
    // Distribute items evenly across the stream
    const x = totalOnStream > 1
      ? startX + xPadding + (indexOnStream / (totalOnStream - 1)) * availableWidth
      : 0; // Single item in center
    
    const position: [number, number, number] = [
      x,
      streamY + LAYOUT.workItems.yOffset, // Slightly above stream
      LAYOUT.streams.z,
    ];

    return {
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      energyState: item.energyState as EnergyState,
      depth: item.depth as WorkItemDepth,
      position,
      streamPosition: undefined, // No tether needed - items are ON the stream
      assignee: item.contributors?.find(c => c.isPrimary)?.name,
    };
  });
}

export function VoidCanvas({
  className,
  showPerformance = false,
  showStreams = true,
  showWorkItems = true,
  showPulseCore = true,
  streams: apiStreams,
  workItems: apiWorkItems,
  teamMembers = [],
  teamMemberCount = 6,
  diveMode,
  currentUserId,
  onDiveIntoStream,
  onSurfaceFromStream,
  onWorkItemClick,
  onWorkItemKindle,
  onWorkItemStateChange,
  reducedMotion = false,
  particleDensity = 1.0,
}: VoidCanvasProps) {
  // Transform data
  const streams = useMemo(() => transformStreams(apiStreams), [apiStreams]);
  const workItems = useMemo(() => transformWorkItems(apiWorkItems, streams), [apiWorkItems, streams]);

  // Calculate team metrics for PulseCore
  const teamMetrics = useMemo(() => {
    return calculateTeamMetrics(workItems, teamMemberCount);
  }, [workItems, teamMemberCount]);

  // Time-based environment
  const timeOfDay = getTimeOfDayFromHour();
  const weather = getWeatherFromTeamHealth(
    teamMetrics.energyLevel,
    teamMetrics.harmonyScore,
    teamMetrics.activeRatio
  );

  // In dive mode, show dive view
  if (diveMode) {
    return (
      <div className={className}>
        <Canvas
          camera={{ position: [0, 15, 30], fov: 60 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <VoidEnvironment timeOfDay={timeOfDay} weatherState={weather} />
            <CameraController />
            
            <DiveMode
              streamId={diveMode.streamId}
              streamName={diveMode.streamName}
              streamState={diveMode.streamState}
              workItems={diveMode.workItems.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description ?? undefined,
                energyState: item.energyState as EnergyState,
                energyLevel: item.energyLevel,
                depth: item.depth as WorkItemDepth,
                streamPosition: item.streamPosition,
              }))}
              divers={diveMode.divers.map(diver => ({
                id: diver.id,
                name: diver.name,
                avatarUrl: diver.avatarUrl,
                starType: diver.starType,
                orbitalState: diver.orbitalState,
                energySignatureColor: diver.energySignatureColor || "#00d4ff",
              }))}
              currentUserId={currentUserId}
              onSurface={onSurfaceFromStream}
              onItemClick={onWorkItemClick}
              onStateChange={onWorkItemStateChange}
            />
            
            {showPerformance && <PerformanceMonitor />}
          </Suspense>
        </Canvas>
      </div>
    );
  }

  // Normal observatory view - simple horizontal layout
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 20, 50], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Environment */}
          <VoidEnvironment timeOfDay={timeOfDay} weatherState={weather} />
          <CameraController />
          
          {/* ============================================ */}
          {/* ZONE 4: AMBIENT - Background particles      */}
          {/* ============================================ */}
          <ParticleField 
            count={reducedMotion ? 100 : 250} 
            spread={LAYOUT.ambient.outerRadius} 
            reducedMotion={reducedMotion}
            particleDensity={particleDensity * 0.7}
          />

          {/* No zone boundaries needed for horizontal layout */}

          {/* ============================================ */}
          {/* ZONE 0: CORE - Central team pulse           */}
          {/* ============================================ */}
          {showPulseCore && (
            <PulseCore 
              position={LAYOUT.core.position}
              energyLevel={teamMetrics.energyLevel}
              activeMembers={teamMetrics.activeMembers}
              totalMembers={teamMetrics.totalMembers}
              activeWorkItems={teamMetrics.activeWorkItems}
              completedToday={teamMetrics.completedToday}
              harmonyScore={teamMetrics.harmonyScore}
            />
          )}

          {/* ============================================ */}
          {/* ZONE 1: STREAMS - Work streams mid-zone     */}
          {/* ============================================ */}
          {showStreams && streams.length > 0 && (
            <StreamsView
              streams={streams}
              onStreamClick={onDiveIntoStream}
            />
          )}

          {/* ============================================ */}
          {/* ZONE 2: WORK ITEMS - Floating above streams */}
          {/* ============================================ */}
          {showWorkItems && workItems.length > 0 && (
            <WorkItemsView
              items={workItems}
              onItemClick={onWorkItemKindle}
            />
          )}

          {/* ============================================ */}
          {/* ZONE 3: TEAM - Above center                 */}
          {/* ============================================ */}
          {teamMembers.length > 0 && (
            <ConstellationView 
              members={teamMembers} 
              orbitRadius={LAYOUT.team.radius}
              yVariation={LAYOUT.team.yVariation}
              baseY={LAYOUT.team.y}
            />
          )}

          {/* Performance monitor */}
          {showPerformance && <PerformanceMonitor />}
        </Suspense>
      </Canvas>
    </div>
  );
}

// Re-export types and mocks for backward compatibility
export { mockStreams, mockWorkItems };
export type { EnergyState, WorkItemDepth, StreamState };

// Export layout constants for consistent positioning across components
export { LAYOUT, ZoneBoundary };
