"use client";

import { useState, useCallback } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export interface IntentionWheelAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
}

interface IntentionWheelProps {
  position: THREE.Vector3;
  actions: IntentionWheelAction[];
  onClose: () => void;
}

export function IntentionWheel({ position, actions, onClose }: IntentionWheelProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const angleStep = (2 * Math.PI) / actions.length;
  const radius = 80; // pixels

  const handleActionClick = useCallback((action: IntentionWheelAction) => {
    action.onClick();
    onClose();
  }, [onClose]);

  return (
    <Html position={position} center style={{ pointerEvents: "auto" }}>
      <div
        className="relative"
        style={{ width: radius * 2.5, height: radius * 2.5 }}
      >
        {/* Backdrop to capture clicks outside */}
        <div
          className="fixed inset-0 z-0"
          onClick={onClose}
          style={{ transform: "translate(-50vw, -50vh)", width: "200vw", height: "200vh" }}
        />

        {/* Center circle */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-void-deep/90 border border-void-atmosphere flex items-center justify-center z-10"
        >
          <span className="text-text-muted text-lg">✦</span>
        </div>

        {/* Action buttons arranged in a circle */}
        {actions.map((action, index) => {
          const angle = angleStep * index - Math.PI / 2; // Start from top
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isHovered = hoveredAction === action.id;

          return (
            <button
              key={action.id}
              className="absolute left-1/2 top-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 z-20"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isHovered ? 1.15 : 1})`,
                backgroundColor: isHovered ? action.color : "rgba(10, 22, 40, 0.9)",
                border: `2px solid ${action.color}`,
                boxShadow: isHovered ? `0 0 20px ${action.color}40` : "none",
              }}
              onClick={() => handleActionClick(action)}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              title={action.label}
            >
              <span
                className="text-xl transition-transform duration-200"
                style={{
                  filter: isHovered ? "brightness(1.2)" : "none",
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}
              >
                {action.icon}
              </span>
            </button>
          );
        })}

        {/* Tooltip for hovered action */}
        {hoveredAction && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-8 px-3 py-1 bg-void-deep/95 border border-void-atmosphere rounded-lg text-dust text-text-bright whitespace-nowrap z-30"
          >
            {actions.find(a => a.id === hoveredAction)?.label}
          </div>
        )}

        {/* Connecting lines from center to actions */}
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: radius * 2.5, height: radius * 2.5 }}
        >
          {actions.map((action, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const x = Math.cos(angle) * (radius - 20) + radius * 1.25;
            const y = Math.sin(angle) * (radius - 20) + radius * 1.25;
            const centerX = radius * 1.25;
            const centerY = radius * 1.25;

            return (
              <line
                key={action.id}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={hoveredAction === action.id ? action.color : "rgba(100, 116, 139, 0.3)"}
                strokeWidth={hoveredAction === action.id ? 2 : 1}
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>
      </div>
    </Html>
  );
}

// Hook to manage intention wheel state
export function useIntentionWheel() {
  const [wheelState, setWheelState] = useState<{
    isOpen: boolean;
    position: THREE.Vector3;
    targetId?: string;
    targetType?: "user" | "stream" | "work-item";
  }>({
    isOpen: false,
    position: new THREE.Vector3(),
  });

  const openWheel = useCallback((
    position: THREE.Vector3,
    targetId?: string,
    targetType?: "user" | "stream" | "work-item"
  ) => {
    setWheelState({
      isOpen: true,
      position: position.clone(),
      targetId,
      targetType,
    });
  }, []);

  const closeWheel = useCallback(() => {
    setWheelState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...wheelState,
    openWheel,
    closeWheel,
  };
}

// Default actions for different contexts
export const userActions: IntentionWheelAction[] = [
  { id: "ping", label: "Send Ping", icon: "📡", color: "#00d4ff", onClick: () => console.log("Ping") },
  { id: "profile", label: "View Profile", icon: "👤", color: "#8b5cf6", onClick: () => console.log("Profile") },
  { id: "handoff", label: "Hand Off Work", icon: "🤝", color: "#10b981", onClick: () => console.log("Handoff") },
  { id: "celebrate", label: "Celebrate", icon: "🎉", color: "#fbbf24", onClick: () => console.log("Celebrate") },
];

export const streamActions: IntentionWheelAction[] = [
  { id: "dive", label: "Dive In", icon: "🏊", color: "#00d4ff", onClick: () => console.log("Dive") },
  { id: "spark", label: "Spark Work Item", icon: "✨", color: "#fbbf24", onClick: () => console.log("Spark") },
  { id: "details", label: "Stream Details", icon: "📊", color: "#8b5cf6", onClick: () => console.log("Details") },
];

export const workItemActions: IntentionWheelAction[] = [
  { id: "kindle", label: "Kindle", icon: "🔥", color: "#f97316", onClick: () => console.log("Kindle") },
  { id: "assign", label: "Infuse Energy", icon: "⚡", color: "#00d4ff", onClick: () => console.log("Assign") },
  { id: "details", label: "View Details", icon: "📋", color: "#8b5cf6", onClick: () => console.log("Details") },
  { id: "crystallize", label: "Crystallize", icon: "💎", color: "#06b6d4", onClick: () => console.log("Crystallize") },
];
