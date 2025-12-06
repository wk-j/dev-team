"use client";

import { useMemo } from "react";

interface QuickStatsProps {
  /** Team energy level (0-1) */
  energyLevel: number;
  /** Number of active members */
  activeMembers: number;
  /** Total team members */
  totalMembers: number;
  /** Active work items (kindling + blazing) */
  activeWorkItems: number;
  /** Dormant work items */
  dormantItems: number;
  /** Completed today */
  completedToday: number;
  /** Total crystals (all time) */
  totalCrystals: number;
  /** Team harmony score (0-1) */
  harmonyScore: number;
  /** Number of active streams */
  activeStreams: number;
  /** Current time of day for theming */
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  /** Position of the panel */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Whether panel is minimized */
  minimized?: boolean;
  /** Toggle minimize callback */
  onToggleMinimize?: () => void;
}

/**
 * Energy bar visualization
 */
function EnergyBar({ 
  value, 
  maxValue, 
  color, 
  label,
  showValue = true,
}: { 
  value: number; 
  maxValue: number; 
  color: string;
  label: string;
  showValue?: boolean;
}) {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        {showValue && (
          <span className="text-text-bright font-mono">
            {value}{maxValue !== 100 ? `/${maxValue}` : '%'}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-void-atmosphere rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Stat item with icon and value
 */
function StatItem({
  icon,
  label,
  value,
  subValue,
  color = "#00d4ff",
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: "up" | "down" | "stable";
}) {
  return (
    <div className="flex items-center gap-2 group">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
        style={{ 
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-text-bright font-medium">{value}</span>
          {trend && (
            <span className={`text-xs ${
              trend === "up" ? "text-green-400" : 
              trend === "down" ? "text-red-400" : 
              "text-text-muted"
            }`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted truncate">{label}</div>
        {subValue && (
          <div className="text-xs text-text-dim">{subValue}</div>
        )}
      </div>
    </div>
  );
}

/**
 * QuickStats - HUD overlay showing team metrics
 * 
 * Displays key team statistics in a floating panel.
 */
export function QuickStats({
  energyLevel,
  activeMembers,
  totalMembers,
  activeWorkItems,
  dormantItems,
  completedToday,
  totalCrystals,
  harmonyScore,
  activeStreams,
  timeOfDay = "afternoon",
  position = "top-left",
  minimized = false,
  onToggleMinimize,
}: QuickStatsProps) {
  // Position classes
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  // Time of day colors
  const timeColors = {
    morning: "#fbbf24",
    afternoon: "#00d4ff",
    evening: "#f97316",
    night: "#9370db",
  };

  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case "morning": return "Good morning";
      case "afternoon": return "Good afternoon";
      case "evening": return "Good evening";
      case "night": return "Working late";
    }
  }, [timeOfDay]);

  if (minimized) {
    return (
      <div className={`absolute ${positionClasses[position]} z-20`}>
        <button
          onClick={onToggleMinimize}
          className="bg-void-deep/80 backdrop-blur-md border border-void-atmosphere rounded-lg px-3 py-2 text-text-muted hover:text-text-bright hover:border-primary-glow/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-primary-glow animate-pulse" />
            <span>{activeMembers}/{totalMembers}</span>
            <span>•</span>
            <span>{activeWorkItems} active</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-20`}>
      <div className="bg-void-deep/90 backdrop-blur-md border border-void-atmosphere rounded-xl p-4 w-64 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-text-muted">{greeting}</div>
            <div className="text-sm font-medium text-text-bright">Observatory</div>
          </div>
          <button
            onClick={onToggleMinimize}
            className="text-text-muted hover:text-text-bright transition-colors p-1"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Team Energy */}
        <div className="mb-4">
          <EnergyBar
            value={Math.round(energyLevel * 100)}
            maxValue={100}
            color="#00d4ff"
            label="Team Energy"
          />
        </div>

        {/* Harmony Score */}
        <div className="mb-4">
          <EnergyBar
            value={Math.round(harmonyScore * 100)}
            maxValue={100}
            color="#9370db"
            label="Harmony"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatItem
            icon="👥"
            label="Active now"
            value={activeMembers}
            subValue={`of ${totalMembers}`}
            color="#00d4ff"
          />
          <StatItem
            icon="🔥"
            label="In flow"
            value={activeWorkItems}
            color="#fbbf24"
            trend={activeWorkItems > 3 ? "up" : "stable"}
          />
          <StatItem
            icon="💎"
            label="Today"
            value={completedToday}
            subValue={`${totalCrystals} total`}
            color="#00ffc8"
          />
          <StatItem
            icon="🌊"
            label="Streams"
            value={activeStreams}
            color="#4de8ff"
          />
        </div>

        {/* Work Queue */}
        <div className="pt-3 border-t border-void-atmosphere">
          <div className="text-xs text-text-muted mb-2">Work Queue</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500/50" />
              <span className="text-xs text-text-muted">{dormantItems} dormant</span>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500/50" />
              <span className="text-xs text-text-muted">{activeWorkItems} active</span>
            </div>
          </div>
        </div>

        {/* Footer - Time indicator */}
        <div className="mt-3 pt-3 border-t border-void-atmosphere flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: timeColors[timeOfDay] }}
            />
            <span className="text-xs text-text-dim capitalize">{timeOfDay}</span>
          </div>
          <span className="text-xs text-text-dim font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Determine time of day from current hour
 */
export function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Calculate stats from work items and streams
 */
export function calculateQuickStats(
  workItems: Array<{ energyState: string }>,
  streams: Array<{ state: string }>,
  memberCount: number
) {
  const activeItems = workItems.filter(
    (item) => item.energyState === "kindling" || item.energyState === "blazing"
  ).length;
  
  const dormantItems = workItems.filter(
    (item) => item.energyState === "dormant"
  ).length;
  
  const completedItems = workItems.filter(
    (item) => item.energyState === "crystallized"
  ).length;
  
  const activeStreams = streams.filter(
    (stream) => stream.state === "flowing" || stream.state === "rushing"
  ).length;
  
  const energyLevel = workItems.length > 0
    ? Math.min(1, (activeItems / workItems.length) * 2)
    : 0.3;
  
  const harmonyScore = 0.6 + Math.random() * 0.3;
  
  return {
    energyLevel,
    activeWorkItems: activeItems,
    dormantItems,
    completedToday: completedItems,
    totalCrystals: completedItems,
    harmonyScore,
    activeMembers: Math.ceil(memberCount * (0.5 + energyLevel * 0.5)),
    totalMembers: memberCount,
    activeStreams,
    timeOfDay: getTimeOfDay(),
  };
}
