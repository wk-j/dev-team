"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { EnergyOrb, type EnergyState, type WorkItemDepth } from "./EnergyOrb";

interface DiveModeWorkItem {
  id: string;
  title: string;
  description?: string;
  energyState: EnergyState;
  energyLevel: number;
  depth: WorkItemDepth;
  streamPosition: number;
  isPrimary?: boolean;
}

interface DiveModeDiver {
  id: string;
  name: string;
  avatarUrl?: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
}

interface DiveModeProps {
  streamId: string;
  streamName: string;
  streamState: string;
  workItems: DiveModeWorkItem[];
  divers: DiveModeDiver[];
  currentUserId?: string;
  focusedItemId?: string | null;
  onItemClick?: (itemId: string) => void;
  onItemKindle?: (itemId: string) => void;
  onStateChange?: (itemId: string, newState: EnergyState) => void;
  onDepthChange?: (itemId: string, newDepth: WorkItemDepth) => void;
  onSurface?: () => void;
}

// Valid state transitions
const stateTransitions: Record<EnergyState, { to: EnergyState; label: string; color: string }[]> = {
  dormant: [{ to: "kindling", label: "Start", color: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/50" }],
  kindling: [
    { to: "blazing", label: "Focus", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/50" },
    { to: "dormant", label: "Pause", color: "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border-gray-500/50" },
  ],
  blazing: [{ to: "cooling", label: "Wind Down", color: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/50" }],
  cooling: [
    { to: "crystallized", label: "Complete", color: "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/50" },
    { to: "blazing", label: "Continue", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/50" },
  ],
  crystallized: [],
};

// Depth configuration
const depthConfig: Record<WorkItemDepth, { label: string; color: string; bg: string }> = {
  shallow: { label: "Shallow", color: "text-sky-400", bg: "bg-sky-500/20" },
  medium: { label: "Medium", color: "text-blue-400", bg: "bg-blue-500/20" },
  deep: { label: "Deep", color: "text-indigo-400", bg: "bg-indigo-500/20" },
  abyssal: { label: "Abyssal", color: "text-purple-400", bg: "bg-purple-500/20" },
};

// Get point on the stream path curve (must match DiveStreamPath)
function getStreamPoint(t: number): [number, number, number] {
  const x = (t - 0.5) * 50;
  const y = Math.sin(t * Math.PI * 2) * 3;
  const z = Math.cos(t * Math.PI) * 5 - 10;
  return [x, y, z];
}

// Position work items along the stream path in dive mode
function calculateItemPosition(
  streamPosition: number,
  _index: number,
  total: number
): { position: [number, number, number]; streamAnchor: [number, number, number] } {
  // Get position on stream path
  const streamPoint = getStreamPoint(streamPosition);
  
  // Offset items slightly above the stream for visibility
  const yOffset = 2.5;
  
  return {
    position: [streamPoint[0], streamPoint[1] + yOffset, streamPoint[2]],
    streamAnchor: streamPoint,
  };
}

// Ambient underwater-like particles for dive mode
function DiveParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position;
    if (!positions) return;
    
    const time = clock.getElapsedTime();
    const arr = positions.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const y = arr[i3 + 1];
      const x = arr[i3];
      
      if (y !== undefined && x !== undefined) {
        // Gentle floating motion
        arr[i3 + 1] = y + Math.sin(time + i * 0.1) * 0.01;
        // Slow drift
        arr[i3] = x + 0.01;
        // Wrap around
        if (arr[i3] > 40) {
          arr[i3] = -40;
        }
      }
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#00d4ff"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Stream path visualization in dive mode
function DiveStreamPath({ color = "#00d4ff" }: { color?: string }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = (t - 0.5) * 50;
      const y = Math.sin(t * Math.PI * 2) * 3;
      const z = Math.cos(t * Math.PI) * 5 - 10;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  return (
    <>
      {/* Main stream line */}
      <Line
        points={points}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.4}
      />
      {/* Glow effect */}
      <Line
        points={points}
        color={color}
        lineWidth={8}
        transparent
        opacity={0.1}
      />
    </>
  );
}

// Diver avatar in dive mode
function DiverAvatar({
  diver,
  position,
  isCurrentUser,
}: {
  diver: DiveModeDiver;
  position: [number, number, number];
  isCurrentUser: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle bobbing motion
      meshRef.current.position.y =
        position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial
          color={diver.energySignatureColor}
          transparent
          opacity={isCurrentUser ? 1 : 0.8}
        />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshBasicMaterial
          color={diver.energySignatureColor}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}

// Focused work item panel
function FocusedItemPanel({
  item,
  onKindle,
}: {
  item: DiveModeWorkItem;
  onKindle?: () => void;
}) {
  const canKindle = item.energyState === "dormant";

  return (
    <div className="bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl p-4 min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-medium text-text-bright leading-tight">
          {item.title}
        </h3>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            item.energyState === "crystallized"
              ? "bg-energy-crystallized/20 text-energy-crystallized"
              : item.energyState === "blazing"
              ? "bg-energy-blazing/20 text-energy-blazing"
              : item.energyState === "kindling"
              ? "bg-energy-kindling/20 text-energy-kindling"
              : item.energyState === "cooling"
              ? "bg-energy-cooling/20 text-energy-cooling"
              : "bg-void-atmosphere text-text-muted"
          }`}
        >
          {item.energyState}
        </span>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-text-dim mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Energy bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Energy</span>
          <span>{item.energyLevel}%</span>
        </div>
        <div className="h-2 bg-void-atmosphere rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              item.energyState === "blazing"
                ? "bg-energy-blazing"
                : item.energyState === "kindling"
                ? "bg-energy-kindling"
                : item.energyState === "cooling"
                ? "bg-energy-cooling"
                : item.energyState === "crystallized"
                ? "bg-energy-crystallized"
                : "bg-text-muted"
            }`}
            style={{ width: `${item.energyLevel}%` }}
          />
        </div>
      </div>

      {/* Depth indicator */}
      <div className="flex items-center gap-2 mb-4 text-xs text-text-muted">
        <span>Depth:</span>
        <div className="flex gap-0.5">
          {["shallow", "medium", "deep", "abyssal"].map((d, i) => (
            <div
              key={d}
              className={`w-2 h-2 rounded-full ${
                ["shallow", "medium", "deep", "abyssal"].indexOf(item.depth) >= i
                  ? "bg-accent-primary"
                  : "bg-void-atmosphere"
              }`}
            />
          ))}
        </div>
        <span className="capitalize">{item.depth}</span>
      </div>

      {/* Actions */}
      {canKindle && onKindle && (
        <button
          onClick={onKindle}
          className="w-full py-2 px-4 bg-energy-kindling/20 hover:bg-energy-kindling/30 text-energy-kindling border border-energy-kindling/50 rounded-lg text-sm font-medium transition-colors"
        >
          Kindle This Work
        </button>
      )}
    </div>
  );
}

export function DiveMode({
  streamId,
  streamName,
  streamState,
  workItems,
  divers,
  currentUserId,
  focusedItemId,
  onItemClick,
  onItemKindle,
  onStateChange,
  onDepthChange,
  onSurface,
}: DiveModeProps) {
  const { camera } = useThree();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Find selected item
  const selectedItem = workItems.find((w) => w.id === selectedItemId);
  const availableTransitions = selectedItem ? stateTransitions[selectedItem.energyState] : [];

  // Calculate positions for work items
  const itemsWithPositions = useMemo(() => {
    const total = workItems.length;
    return workItems.map((item, index) => {
      const { position, streamAnchor } = calculateItemPosition(item.streamPosition, index, total);
      return {
        ...item,
        position,
        streamAnchor,
      };
    });
  }, [workItems]);

  // Calculate positions for divers - small, positioned at top-right of view
  const diversWithPositions = useMemo(() => {
    return divers.map((diver, index) => ({
      ...diver,
      position: [
        15 + index * 2,  // Right side, close together
        10,              // Above the stream
        -5,              // Behind the stream slightly
      ] as [number, number, number],
    }));
  }, [divers]);

  // Smooth camera for dive mode
  useFrame(() => {
    // Gently adjust camera for immersive feel
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 30, 0.02);
  });

  return (
    <group>
      {/* Ambient particles */}
      <DiveParticles />

      {/* Stream path */}
      <DiveStreamPath
        color={
          streamState === "rushing"
            ? "#fbbf24"
            : streamState === "flooding"
            ? "#ef4444"
            : "#00d4ff"
        }
      />

      {/* Work items */}
      {itemsWithPositions.map((item) => (
        <group key={item.id}>
          {/* Tether line connecting work item to stream */}
          <Line
            points={[item.position, item.streamAnchor]}
            color={
              item.energyState === "crystallized" ? "#06b6d4" :
              item.energyState === "blazing" ? "#fbbf24" :
              item.energyState === "kindling" ? "#f97316" :
              item.energyState === "cooling" ? "#a78bfa" :
              "#6b7280"
            }
            lineWidth={2}
            transparent
            opacity={0.5}
            dashed
            dashSize={0.3}
            gapSize={0.2}
          />
          {/* Anchor point on stream */}
          <mesh position={item.streamAnchor}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial
              color={
                item.energyState === "crystallized" ? "#06b6d4" :
                item.energyState === "blazing" ? "#fbbf24" :
                item.energyState === "kindling" ? "#f97316" :
                item.energyState === "cooling" ? "#a78bfa" :
                "#6b7280"
              }
              transparent
              opacity={0.8}
            />
          </mesh>
          <EnergyOrb
            id={item.id}
            title={item.title}
            description={item.description}
            energyState={item.energyState}
            depth={item.depth}
            position={item.position}
            onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
          />
          {/* Highlight for selected item */}
          {selectedItemId === item.id && (
            <mesh position={item.position}>
              <ringGeometry args={[2, 2.3, 32]} />
              <meshBasicMaterial
                color="#00d4ff"
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Divers */}
      {diversWithPositions.map((diver) => (
        <DiverAvatar
          key={diver.id}
          diver={diver}
          position={diver.position}
          isCurrentUser={diver.id === currentUserId}
        />
      ))}

      {/* UI Overlay */}
      <Html fullscreen>
        <div className="absolute inset-0 pointer-events-none">
          {/* Header */}
          <div className="absolute top-4 left-4 pointer-events-auto">
            <div className="bg-void-deep/90 backdrop-blur-sm border border-void-atmosphere rounded-lg px-4 py-3">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Diving In
              </div>
              <div className="text-lg font-medium text-text-bright">
                {streamName}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-text-dim">
                <span
                  className={`w-2 h-2 rounded-full ${
                    streamState === "rushing"
                      ? "bg-yellow-500"
                      : streamState === "flooding"
                      ? "bg-red-500"
                      : streamState === "stagnant"
                      ? "bg-gray-500"
                      : "bg-cyan-500"
                  }`}
                />
                <span className="capitalize">{streamState}</span>
                <span className="text-text-muted">
                  {workItems.length} items
                </span>
              </div>
            </div>
          </div>

          {/* Surface button */}
          <div className="absolute top-4 right-4 pointer-events-auto">
            <button
              onClick={onSurface}
              className="px-4 py-2 bg-void-surface hover:bg-void-atmosphere border border-void-atmosphere rounded-lg text-sm text-text-muted hover:text-text-bright transition-colors flex items-center gap-2"
            >
              <span>Surface</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>

          {/* Fellow divers */}
          {divers.length > 1 && (
            <div className="absolute bottom-4 left-4 pointer-events-auto">
              <div className="bg-void-deep/90 backdrop-blur-sm border border-void-atmosphere rounded-lg px-3 py-2">
                <div className="text-xs text-text-muted mb-2">
                  Fellow Divers
                </div>
                <div className="flex -space-x-2">
                  {divers
                    .filter((d) => d.id !== currentUserId)
                    .map((diver) => (
                      <div
                        key={diver.id}
                        className="w-8 h-8 rounded-full border-2 border-void-deep flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: diver.energySignatureColor + "40",
                          borderColor: diver.energySignatureColor,
                        }}
                        title={diver.name}
                      >
                        {diver.name.charAt(0)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected item panel with state transitions */}
          {selectedItem && (
            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <div className="bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl p-4 min-w-[280px] max-w-[320px]">
                {/* Close button */}
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="absolute top-2 right-2 text-text-muted hover:text-text-bright transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3 pr-6">
                  <h3 className="text-base font-medium text-text-bright leading-tight">
                    {selectedItem.title}
                  </h3>
                </div>

                {/* Current state badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-text-muted">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedItem.energyState === "crystallized"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : selectedItem.energyState === "blazing"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : selectedItem.energyState === "kindling"
                        ? "bg-orange-500/20 text-orange-400"
                        : selectedItem.energyState === "cooling"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {selectedItem.energyState === "crystallized" ? "Done" : selectedItem.energyState}
                  </span>
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <p className="text-sm text-text-dim mb-3 line-clamp-2">
                    {selectedItem.description}
                  </p>
                )}

                {/* Depth selector */}
                <div className="mb-3">
                  <div className="text-xs text-text-muted mb-1.5">Depth:</div>
                  <div className="flex gap-1">
                    {(["shallow", "medium", "deep", "abyssal"] as const).map((d) => {
                      const config = depthConfig[d];
                      const isSelected = selectedItem.depth === d;
                      return (
                        <button
                          key={d}
                          onClick={() => onDepthChange?.(selectedItem.id, d)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors border ${
                            isSelected
                              ? `${config.bg} ${config.color} border-current`
                              : "border-void-atmosphere text-text-dim hover:border-void-surface hover:text-text-muted"
                          }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* State transition buttons */}
                {availableTransitions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-text-muted">Actions:</div>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((t) => (
                        <button
                          key={t.to}
                          onClick={() => {
                            onStateChange?.(selectedItem.id, t.to);
                            setSelectedItemId(null);
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${t.color}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed message */}
                {selectedItem.energyState === "crystallized" && (
                  <div className="text-sm text-cyan-400 flex items-center gap-2">
                    <span>◇</span>
                    <span>This work has crystallized</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default DiveMode;
