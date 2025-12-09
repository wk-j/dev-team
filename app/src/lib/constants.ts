/**
 * Centralized constants for FlowState application
 * 
 * This file contains all state definitions, colors, labels, and configurations
 * for streams, work items, and other entities. All components should import
 * from this file to ensure consistency across the application.
 */

// ============================================================================
// ENERGY STATES (Work Item States)
// ============================================================================

export const ENERGY_STATES = ["dormant", "kindling", "blazing", "cooling", "crystallized"] as const;
export type EnergyState = (typeof ENERGY_STATES)[number];

export const ENERGY_STATE_CONFIG: Record<EnergyState, {
  label: string;
  color: string;
  bg: string;
  icon: string;
  description: string;
  emissiveIntensity: number;
  pulseSpeed: number;
}> = {
  dormant: {
    label: "Dormant",
    color: "#6b7280",
    bg: "bg-gray-500/20",
    icon: "○",
    description: "Waiting to be started",
    emissiveIntensity: 0.1,
    pulseSpeed: 0.5,
  },
  kindling: {
    label: "Kindling",
    color: "#f97316",
    bg: "bg-orange-500/20",
    icon: "◐",
    description: "Getting started",
    emissiveIntensity: 0.4,
    pulseSpeed: 1.0,
  },
  blazing: {
    label: "Blazing",
    color: "#fbbf24",
    bg: "bg-yellow-500/20",
    icon: "●",
    description: "In deep focus",
    emissiveIntensity: 0.8,
    pulseSpeed: 2.0,
  },
  cooling: {
    label: "Cooling",
    color: "#a78bfa",
    bg: "bg-purple-500/20",
    icon: "◑",
    description: "Wrapping up",
    emissiveIntensity: 0.3,
    pulseSpeed: 0.7,
  },
  crystallized: {
    label: "Crystallized",
    color: "#06b6d4",
    bg: "bg-cyan-500/20",
    icon: "◇",
    description: "Completed",
    emissiveIntensity: 0.6,
    pulseSpeed: 0.3,
  },
};

// Valid state transitions for work items
export const ENERGY_STATE_TRANSITIONS: Record<EnergyState, Array<{ to: EnergyState; label: string }>> = {
  dormant: [
    { to: "kindling", label: "Start Working" },
  ],
  kindling: [
    { to: "blazing", label: "Focus Mode" },
    { to: "dormant", label: "Pause" },
  ],
  blazing: [
    { to: "cooling", label: "Wind Down" },
  ],
  cooling: [
    { to: "crystallized", label: "Complete" },
    { to: "blazing", label: "Continue" },
  ],
  crystallized: [],
};

// ============================================================================
// STREAM STATES
// ============================================================================

export const STREAM_STATES = ["nascent", "flowing", "rushing", "flooding", "stagnant", "evaporated"] as const;
export type StreamState = (typeof STREAM_STATES)[number];

export const STREAM_STATE_CONFIG: Record<StreamState, {
  label: string;
  color: string;
  bg: string;
  glow: string;
  description: string;
  particleSpeed: number;
  particleDensity: number;
  lineWidth: number;
  opacity: number;
}> = {
  nascent: {
    label: "Nascent",
    color: "#64748b",
    bg: "bg-slate-500/20",
    glow: "shadow-slate-500/30",
    description: "Just started, building momentum",
    particleSpeed: 0.3,
    particleDensity: 0.5,
    lineWidth: 2,
    opacity: 0.4,
  },
  flowing: {
    label: "Flowing",
    color: "#00d4ff",
    bg: "bg-cyan-500/20",
    glow: "shadow-cyan-500/30",
    description: "Steady progress",
    particleSpeed: 0.5,
    particleDensity: 0.8,
    lineWidth: 3,
    opacity: 0.6,
  },
  rushing: {
    label: "Rushing",
    color: "#fbbf24",
    bg: "bg-yellow-500/20",
    glow: "shadow-yellow-500/30",
    description: "High activity",
    particleSpeed: 0.8,
    particleDensity: 1.2,
    lineWidth: 4,
    opacity: 0.8,
  },
  flooding: {
    label: "Flooding",
    color: "#ef4444",
    bg: "bg-red-500/20",
    glow: "shadow-red-500/30",
    description: "Overwhelming activity",
    particleSpeed: 1.0,
    particleDensity: 1.5,
    lineWidth: 5,
    opacity: 1.0,
  },
  stagnant: {
    label: "Stagnant",
    color: "#6b7280",
    bg: "bg-gray-500/20",
    glow: "shadow-gray-500/30",
    description: "No recent activity",
    particleSpeed: 0.1,
    particleDensity: 0.3,
    lineWidth: 2,
    opacity: 0.3,
  },
  evaporated: {
    label: "Evaporated",
    color: "#374151",
    bg: "bg-gray-700/20",
    glow: "shadow-gray-700/30",
    description: "Completed or archived",
    particleSpeed: 0,
    particleDensity: 0.1,
    lineWidth: 1,
    opacity: 0.2,
  },
};

// ============================================================================
// WORK ITEM DEPTHS
// ============================================================================

export const WORK_ITEM_DEPTHS = ["shallow", "medium", "deep", "abyssal"] as const;
export type WorkItemDepth = (typeof WORK_ITEM_DEPTHS)[number];

export const WORK_ITEM_DEPTH_CONFIG: Record<WorkItemDepth, {
  label: string;
  color: string;
  textColor: string;
  bg: string;
  icon: string;
  description: string;
  scale: number;
  complexity: number;
}> = {
  shallow: {
    label: "Shallow",
    color: "#0ea5e9",
    textColor: "text-sky-400",
    bg: "bg-sky-500/20",
    icon: "~",
    description: "Quick task, < 1 hour",
    scale: 0.24,
    complexity: 1,
  },
  medium: {
    label: "Medium",
    color: "#3b82f6",
    textColor: "text-blue-400",
    bg: "bg-blue-500/20",
    icon: "≈",
    description: "Half-day task",
    scale: 0.32,
    complexity: 2,
  },
  deep: {
    label: "Deep",
    color: "#6366f1",
    textColor: "text-indigo-400",
    bg: "bg-indigo-500/20",
    icon: "≋",
    description: "Full day or more",
    scale: 0.4,
    complexity: 3,
  },
  abyssal: {
    label: "Abyssal",
    color: "#a855f7",
    textColor: "text-purple-400",
    bg: "bg-purple-500/20",
    icon: "◈",
    description: "Multi-day deep work",
    scale: 0.52,
    complexity: 5,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the color for an energy state
 */
export function getEnergyStateColor(state: EnergyState): string {
  return ENERGY_STATE_CONFIG[state]?.color ?? ENERGY_STATE_CONFIG.dormant.color;
}

/**
 * Get the label for an energy state
 */
export function getEnergyStateLabel(state: EnergyState): string {
  return ENERGY_STATE_CONFIG[state]?.label ?? "Unknown";
}

/**
 * Get available transitions for an energy state
 */
export function getAvailableTransitions(state: EnergyState): Array<{ to: EnergyState; label: string }> {
  return ENERGY_STATE_TRANSITIONS[state] ?? [];
}

/**
 * Check if a transition is valid
 */
export function isValidTransition(from: EnergyState, to: EnergyState): boolean {
  const transitions = ENERGY_STATE_TRANSITIONS[from] ?? [];
  return transitions.some(t => t.to === to);
}

/**
 * Get the color for a stream state
 */
export function getStreamStateColor(state: StreamState): string {
  return STREAM_STATE_CONFIG[state]?.color ?? STREAM_STATE_CONFIG.flowing.color;
}

/**
 * Get the label for a stream state
 */
export function getStreamStateLabel(state: StreamState): string {
  return STREAM_STATE_CONFIG[state]?.label ?? "Unknown";
}

/**
 * Get the config for a work item depth
 */
export function getDepthConfig(depth: WorkItemDepth) {
  return WORK_ITEM_DEPTH_CONFIG[depth] ?? WORK_ITEM_DEPTH_CONFIG.medium;
}
