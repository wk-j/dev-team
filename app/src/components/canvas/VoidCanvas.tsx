"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useMemo } from "react";
import { VoidEnvironment } from "./VoidEnvironment";
import { CameraController } from "./CameraController";
import { ParticleField } from "./ParticleField";
import { ConstellationView } from "./ConstellationView";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { ResonanceConnections, generateMockConnections } from "./ResonanceConnections";
import { StreamsView, mockStreams, type StreamState } from "./Stream";
import { WorkItemsView, mockWorkItems, type EnergyState, type WorkItemDepth } from "./EnergyOrb";
import { DiveMode } from "./DiveMode";
import type { Stream, WorkItem, StreamDiver } from "@/lib/api/client";

// Mock team member positions for generating connections
const mockTeamPositions = [
  { id: "1", position: [0, 0, 0] as [number, number, number] },
  { id: "2", position: [15, 5, -10] as [number, number, number] },
  { id: "3", position: [-12, -3, 8] as [number, number, number] },
  { id: "4", position: [8, -8, 15] as [number, number, number] },
  { id: "5", position: [-18, 10, -5] as [number, number, number] },
  { id: "6", position: [20, 2, 12] as [number, number, number] },
];

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
  showConnections?: boolean;
  // Real data from API
  streams?: Stream[];
  workItems?: WorkItem[];
  // Dive mode
  diveMode?: DiveModeState | null;
  currentUserId?: string;
  onDiveIntoStream?: (streamId: string) => void;
  onSurfaceFromStream?: () => void;
  onWorkItemClick?: (itemId: string) => void;
  onWorkItemKindle?: (itemId: string) => void;
}

// Transform API stream data to component format
function transformStreams(apiStreams: Stream[] | undefined) {
  if (!apiStreams || apiStreams.length === 0) {
    return mockStreams;
  }

  return apiStreams.map((stream, index) => ({
    id: stream.id,
    name: stream.name,
    pathPoints: stream.pathPoints.length >= 2 
      ? stream.pathPoints 
      : mockStreams[index % mockStreams.length]?.pathPoints ?? [
          { x: -20, y: 0, z: 0 },
          { x: 20, y: 0, z: 0 },
        ],
    state: stream.state as StreamState,
    velocity: stream.velocity,
    itemCount: stream.itemCount,
    crystalCount: stream.crystalCount,
  }));
}

// Transform API work item data to component format
function transformWorkItems(apiWorkItems: WorkItem[] | undefined) {
  if (!apiWorkItems || apiWorkItems.length === 0) {
    return mockWorkItems;
  }

  return apiWorkItems.map((item, index) => {
    // Generate position based on stream position or use mock positions
    const mockItem = mockWorkItems[index % mockWorkItems.length];
    const position: [number, number, number] = mockItem?.position ?? [
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 30,
    ];

    return {
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      energyState: item.energyState as EnergyState,
      depth: item.depth as WorkItemDepth,
      position,
      assignee: item.contributors.find(c => c.isPrimary)?.name,
    };
  });
}

export function VoidCanvas({
  className,
  showPerformance = false,
  showStreams = true,
  showWorkItems = true,
  showConnections = true,
  streams: apiStreams,
  workItems: apiWorkItems,
  diveMode,
  currentUserId,
  onDiveIntoStream,
  onSurfaceFromStream,
  onWorkItemClick,
  onWorkItemKindle,
}: VoidCanvasProps) {
  const [connections] = useState(() => generateMockConnections(mockTeamPositions));
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Transform API data to component format, memoized
  const streams = useMemo(() => transformStreams(apiStreams), [apiStreams]);
  const workItems = useMemo(() => transformWorkItems(apiWorkItems), [apiWorkItems]);

  // Handle stream click for diving
  const handleStreamClick = (streamId: string) => {
    onDiveIntoStream?.(streamId);
  };

  // Handle work item click in dive mode
  const handleItemClick = (itemId: string) => {
    setFocusedItemId(itemId);
    onWorkItemClick?.(itemId);
  };

  const isInDiveMode = !!diveMode;

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 50], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <VoidEnvironment />
          <CameraController />
          
          {isInDiveMode ? (
            // Dive mode view
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
              divers={diveMode.divers.map(d => ({
                id: d.id,
                name: d.name,
                avatarUrl: d.avatarUrl,
                starType: d.starType,
                orbitalState: d.orbitalState,
                energySignatureColor: "#00d4ff", // Default color if not provided
              }))}
              currentUserId={currentUserId}
              focusedItemId={focusedItemId}
              onItemClick={handleItemClick}
              onItemKindle={onWorkItemKindle}
              onSurface={onSurfaceFromStream}
            />
          ) : (
            // Normal observatory view
            <>
              <ParticleField count={500} />

              {/* Layer 1: Streams (background) */}
              {showStreams && (
                <StreamsView 
                  streams={streams} 
                  onStreamClick={handleStreamClick}
                />
              )}

              {/* Layer 2: Work Items */}
              {showWorkItems && <WorkItemsView items={workItems} />}

              {/* Layer 3: Connections between team members */}
              {showConnections && <ResonanceConnections connections={connections} />}

              {/* Layer 4: Team members (foreground) */}
              <ConstellationView />
            </>
          )}

          {/* UI Overlays */}
          {showPerformance && <PerformanceMonitor visible={true} position="bottom-right" />}
        </Suspense>
      </Canvas>
    </div>
  );
}
