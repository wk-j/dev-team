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
  onSurface?: () => void;
}

// Position work items along the stream path in dive mode
function calculateItemPosition(
  streamPosition: number,
  index: number
): [number, number, number] {
  // Create a flowing curve layout
  const x = (streamPosition - 0.5) * 40; // -20 to 20
  const y = Math.sin(streamPosition * Math.PI * 2) * 3 + (index % 3 - 1) * 2;
  const z = Math.cos(streamPosition * Math.PI) * 5;
  return [x, y, z];
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
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color={diver.energySignatureColor}
          transparent
          opacity={isCurrentUser ? 1 : 0.7}
        />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial
          color={diver.energySignatureColor}
          transparent
          opacity={0.2}
        />
      </mesh>
      {/* Name label */}
      <Html center distanceFactor={15} position={[0, 1.5, 0]}>
        <div
          className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
            isCurrentUser
              ? "bg-accent-primary/20 text-accent-primary border border-accent-primary"
              : "bg-void-deep/80 text-text-muted"
          }`}
        >
          {isCurrentUser ? "You" : diver.name}
        </div>
      </Html>
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
  onSurface,
}: DiveModeProps) {
  const { camera } = useThree();
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Find focused item
  const focusedItem = workItems.find((w) => w.id === focusedItemId);

  // Calculate positions for work items
  const itemsWithPositions = useMemo(() => {
    return workItems.map((item, index) => ({
      ...item,
      position: calculateItemPosition(item.streamPosition, index),
    }));
  }, [workItems]);

  // Calculate positions for divers
  const diversWithPositions = useMemo(() => {
    return divers.map((diver, index) => ({
      ...diver,
      position: [
        -15 + index * 5,
        8,
        5,
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
          <EnergyOrb
            id={item.id}
            title={item.title}
            description={item.description}
            energyState={item.energyState}
            depth={item.depth}
            position={item.position}
            onClick={() => onItemClick?.(item.id)}
          />
          {/* Highlight for focused item */}
          {focusedItemId === item.id && (
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

          {/* Focused item panel */}
          {focusedItem && (
            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <FocusedItemPanel
                item={focusedItem}
                onKindle={() => onItemKindle?.(focusedItem.id)}
              />
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default DiveMode;
