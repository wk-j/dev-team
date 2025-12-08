"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useStream, useStreams, useWorkItems, useUpdateWorkItem, useCreateWorkItem, useUpdateStream, useTeam, useMe, useTimeEntries, useTimeTracking } from "@/lib/api/hooks";
import type { DiveModeState } from "@/components/canvas/VoidCanvas";
import type { StreamState } from "@/components/canvas/Stream";
import type { WorkItem as WorkItemType } from "@/lib/api/client";

// Format duration to show time with visible updates (e.g., "6:42" or "1:23:45")
function formatDurationCompact(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
}

// Time Tracker Component - Compact inline version
function TimeTracker({ workItemId, onUpdate }: { workItemId: string; onUpdate?: () => void }) {
  const { data: timeData, refetch } = useTimeEntries(workItemId, { pollInterval: 10000 });
  const { startTimer, stopTimer, isLoading } = useTimeTracking(workItemId);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isRunning = !!timeData?.activeEntry;
  const totalTime = timeData?.totalDuration || 0;

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!isRunning || !timeData?.activeEntry) {
      setElapsedTime(0);
      return;
    }

    const startedAt = new Date(timeData.activeEntry.startedAt).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startedAt) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeData?.activeEntry]);

  const handleToggle = async () => {
    try {
      if (isRunning) {
        await stopTimer();
      } else {
        await startTimer();
      }
      refetch();
      onUpdate?.();
    } catch (error) {
      console.error("Failed to toggle timer:", error);
    }
  };

  const displayTime = isRunning ? totalTime + elapsedTime : totalTime;

  return (
    <div className="flex items-center gap-2">
      {/* Time display */}
      <span className={`text-sm font-mono ${isRunning ? "text-accent-primary" : "text-text-muted"}`}>
        {formatDurationCompact(displayTime)}
      </span>
      
      {/* Play/Stop button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        disabled={isLoading}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isRunning
            ? "bg-red-500/30 text-red-400 hover:bg-red-500/40"
            : "bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30"
        }`}
        title={isRunning ? "Stop timer" : "Start timer"}
      >
        {isRunning ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Dynamic import to avoid SSR issues with Three.js
const VoidCanvas = dynamic(
  () => import("@/components/canvas").then((mod) => mod.VoidCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-void-deep">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🌊</div>
          <p className="text-moon text-text-dim">Loading stream...</p>
        </div>
      </div>
    ),
  }
);

// Animated waveform component for visualizing activity
function ActivityWaveform({ intensity = 0.5, color = "#00d4ff", className = "" }: { 
  intensity?: number; 
  color?: string;
  className?: string;
}) {
  const bars = 8;
  return (
    <div className={`flex items-center gap-px h-4 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 0.3 + Math.sin((i / bars) * Math.PI) * 0.4;
        const animDelay = i * 0.08;
        const height = baseHeight * intensity;
        return (
          <div
            key={i}
            className="w-0.5 rounded-full animate-pulse"
            style={{
              backgroundColor: color,
              height: `${Math.max(20, height * 100)}%`,
              animationDelay: `${animDelay}s`,
              animationDuration: `${0.8 + Math.random() * 0.4}s`,
              opacity: 0.6 + intensity * 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

// Metric card with animated progress
function MetricCard({ 
  label, 
  value, 
  subValue,
  progress, 
  color,
  icon,
}: { 
  label: string; 
  value: string | number;
  subValue?: string;
  progress?: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="flex items-center gap-2">
        {icon && <span className="text-sm" style={{ color }}>{icon}</span>}
        <span className="text-lg font-semibold text-text-bright">{value}</span>
        {subValue && <span className="text-xs text-text-muted">{subValue}</span>}
      </div>
      {progress !== undefined && (
        <div className="h-1 bg-void-atmosphere rounded-full overflow-hidden mt-1">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

// Stream state config
const streamStateConfig: Record<string, { bg: string; text: string; glow: string; color: string; label: string }> = {
  nascent: { bg: "bg-gray-500/20", text: "text-gray-400", glow: "shadow-gray-500/20", color: "#6b7280", label: "Nascent" },
  flowing: { bg: "bg-cyan-500/20", text: "text-cyan-400", glow: "shadow-cyan-500/30", color: "#00d4ff", label: "Flowing" },
  rushing: { bg: "bg-yellow-500/20", text: "text-yellow-400", glow: "shadow-yellow-500/30", color: "#fbbf24", label: "Rushing" },
  flooding: { bg: "bg-red-500/20", text: "text-red-400", glow: "shadow-red-500/30", color: "#ef4444", label: "Flooding" },
  stagnant: { bg: "bg-slate-500/20", text: "text-slate-400", glow: "shadow-slate-500/20", color: "#64748b", label: "Stagnant" },
  evaporated: { bg: "bg-gray-700/20", text: "text-gray-500", glow: "shadow-gray-700/20", color: "#374151", label: "Evaporated" },
};

// State badge with glow effect
function StateBadge({ state, className = "" }: { state: string; className?: string }) {
  const config = streamStateConfig[state] ?? streamStateConfig.flowing!;
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${config.bg} ${config.text} shadow-lg ${config.glow} ${className}`}>
      {state}
    </span>
  );
}

// Stream State Dropdown
function StreamStateDropdown({
  currentState,
  onChange,
  isOpen,
  onToggle,
  disabled = false,
}: {
  currentState: string;
  onChange: (newState: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const states = ["nascent", "flowing", "rushing", "flooding", "stagnant", "evaporated"];
  const config = streamStateConfig[currentState] ?? streamStateConfig.flowing!;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize flex items-center gap-1 transition-colors ${config.bg} ${config.text} shadow-lg ${config.glow} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Change stream status"
      >
        {currentState}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-void-deep/95 backdrop-blur-xl border border-void-atmosphere rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted border-b border-void-atmosphere">
            Change Status
          </div>
          {states.map((state) => {
            const stateConfig = streamStateConfig[state]!;
            const isCurrentState = state === currentState;
            return (
              <button
                key={state}
                onClick={() => {
                  if (!isCurrentState) {
                    onChange(state);
                  }
                  onToggle();
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isCurrentState
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-muted hover:text-text-bright hover:bg-void-surface/50"
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: stateConfig.color }} 
                />
                {stateConfig.label}
                {isCurrentState && (
                  <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Work item card for the sidebar - matches mockup design
function WorkItemCard({ 
  item, 
  isSelected,
  onClick,
  onStateChange,
}: { 
  item: WorkItemType;
  isSelected: boolean;
  onClick: () => void;
  onStateChange?: (newState: string) => void;
}) {
  const stateColors: Record<string, string> = {
    dormant: "#6b7280",
    kindling: "#f97316",
    blazing: "#fbbf24",
    cooling: "#a78bfa",
    crystallized: "#06b6d4",
  };
  const stateLabels: Record<string, string> = {
    dormant: "DORMANT",
    kindling: "KINDLING",
    blazing: "BLAZING",
    cooling: "COOLING",
    crystallized: "DONE",
  };
  const color = stateColors[item.energyState] ?? "#6b7280";
  
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? "bg-void-surface/80 ring-1 ring-accent-primary/50"
          : "bg-void-surface/50 hover:bg-void-surface/70"
      }`}
    >
      {/* Left color band with glow effect */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80, 0 0 24px ${color}40`,
        }}
      />
      
      <div className="flex items-center justify-between px-4 py-3 pl-5">
        {/* Title */}
        <h4 className="text-sm font-medium text-text-bright leading-tight line-clamp-1 flex-1 mr-3">
          {item.title}
        </h4>
        
        {/* Right side: Time + Play button + Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <TimeTracker workItemId={item.id} />
          <span className="text-xs text-text-muted uppercase tracking-wide min-w-[70px] text-right">
            {stateLabels[item.energyState] ?? item.energyState.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

// View mode types
type ViewMode = "stream" | "list" | "map";

// Filter types
type EnergyStateFilter = "all" | "dormant" | "kindling" | "blazing" | "cooling" | "crystallized";

// Sort types
type SortOption = "position" | "state" | "recent" | "name";

// Toast notification component
function Toast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-void-surface/95 backdrop-blur-xl border border-void-atmosphere rounded-lg px-4 py-2 shadow-2xl">
        <p className="text-sm text-text-bright">{message}</p>
      </div>
    </div>
  );
}

// Add Work Item Modal
function AddWorkItemModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; depth: string }) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [depth, setDepth] = useState<"shallow" | "medium" | "deep" | "abyssal">("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setDepth("medium");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), depth });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void-deep/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-void-deep/95 backdrop-blur-xl border border-void-atmosphere rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-text-bright mb-4">Add Work Item</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">Title</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-void-surface border border-void-atmosphere rounded-lg text-text-bright placeholder-text-muted focus:outline-none focus:border-accent-primary/50"
              placeholder="What needs to be done?"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-void-surface border border-void-atmosphere rounded-lg text-text-bright placeholder-text-muted focus:outline-none focus:border-accent-primary/50 resize-none"
              placeholder="Add more details (optional)"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">Depth</label>
            <div className="flex gap-2">
              {(["shallow", "medium", "deep", "abyssal"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-colors border ${
                    depth === d
                      ? "bg-accent-primary/20 text-accent-primary border-accent-primary/50"
                      : "bg-void-surface border-void-atmosphere text-text-muted hover:text-text-bright"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-void-surface border border-void-atmosphere text-text-muted hover:text-text-bright transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Work Item Detail Panel
function WorkItemDetailPanel({
  item,
  onClose,
  onStateChange,
  onDepthChange,
}: {
  item: WorkItemType;
  onClose: () => void;
  onStateChange: (newState: string) => void;
  onDepthChange: (newDepth: string) => void;
}) {
  const stateColors: Record<string, string> = {
    dormant: "#6b7280",
    kindling: "#f97316",
    blazing: "#fbbf24",
    cooling: "#a78bfa",
    crystallized: "#06b6d4",
  };
  const color = stateColors[item.energyState] ?? "#6b7280";

  // Valid state transitions
  const stateTransitions: Record<string, { to: string; label: string }[]> = {
    dormant: [{ to: "kindling", label: "Start Working" }],
    kindling: [
      { to: "blazing", label: "Focus Mode" },
      { to: "dormant", label: "Pause" },
    ],
    blazing: [{ to: "cooling", label: "Wind Down" }],
    cooling: [
      { to: "crystallized", label: "Complete" },
      { to: "blazing", label: "Continue" },
    ],
    crystallized: [],
  };

  const availableTransitions = stateTransitions[item.energyState] ?? [];

  return (
    <div className="absolute bottom-20 right-4 w-80 z-30">
      <div className="bg-void-deep/95 backdrop-blur-xl border border-void-atmosphere rounded-2xl p-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-muted hover:text-text-bright transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="pr-8 mb-3">
          <h3 className="text-base font-semibold text-text-bright leading-tight">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-text-dim mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-2 py-1 rounded-lg text-xs font-medium capitalize"
            style={{ backgroundColor: color + "20", color }}
          >
            {item.energyState}
          </span>
          <span className="text-xs text-text-muted capitalize">{item.depth} depth</span>
          <div className="ml-auto">
            <TimeTracker workItemId={item.id} />
          </div>
        </div>

        {/* Energy Level */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Energy</span>
            <span>{item.energyLevel}%</span>
          </div>
          <div className="h-2 bg-void-atmosphere rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${item.energyLevel}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Depth selector */}
        <div className="mb-4">
          <div className="text-xs text-text-muted mb-2">Change Depth:</div>
          <div className="flex gap-1">
            {(["shallow", "medium", "deep", "abyssal"] as const).map((d) => (
              <button
                key={d}
                onClick={() => onDepthChange(d)}
                className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors border ${
                  item.depth === d
                    ? "bg-accent-primary/20 text-accent-primary border-accent-primary/50"
                    : "border-void-atmosphere text-text-muted hover:text-text-bright hover:border-void-surface"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* State transitions */}
        {availableTransitions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-text-muted">Actions:</div>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((t) => (
                <button
                  key={t.to}
                  onClick={() => onStateChange(t.to)}
                  className="px-3 py-1.5 text-sm rounded-lg border transition-colors bg-void-surface border-void-atmosphere text-text-muted hover:text-text-bright hover:border-accent-primary/50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed message */}
        {item.energyState === "crystallized" && (
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <span>◇</span>
            <span>This work has crystallized</span>
          </div>
        )}

        {/* Contributors */}
        {item.contributors && item.contributors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-void-atmosphere">
            <div className="text-xs text-text-muted mb-2">Contributors:</div>
            <div className="flex flex-wrap gap-2">
              {item.contributors.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: c.energySignatureColor + "20" }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium"
                    style={{ backgroundColor: c.energySignatureColor + "40" }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <span className="text-text-dim">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Filter Dropdown - compact
function FilterDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
}: {
  value: EnergyStateFilter;
  onChange: (value: EnergyStateFilter) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const options: { value: EnergyStateFilter; label: string; color: string }[] = [
    { value: "all", label: "All", color: "#00d4ff" },
    { value: "blazing", label: "Blazing", color: "#fbbf24" },
    { value: "kindling", label: "Kindling", color: "#f97316" },
    { value: "cooling", label: "Cooling", color: "#a78bfa" },
    { value: "dormant", label: "Dormant", color: "#6b7280" },
    { value: "crystallized", label: "Done", color: "#06b6d4" },
  ];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-colors ${
          value !== "all"
            ? "bg-accent-primary/20 text-accent-primary"
            : "bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright"
        }`}
        title="Filter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-void-deep/95 backdrop-blur-xl border border-void-atmosphere rounded-lg shadow-2xl overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                onToggle();
              }}
              className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                value === opt.value
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-muted hover:text-text-bright hover:bg-void-surface/50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Sort Dropdown - compact
function SortDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const options: { value: SortOption; label: string }[] = [
    { value: "position", label: "Position" },
    { value: "state", label: "State" },
    { value: "recent", label: "Recent" },
    { value: "name", label: "Name" },
  ];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-colors ${
          value !== "position"
            ? "bg-accent-primary/20 text-accent-primary"
            : "bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright"
        }`}
        title="Sort"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-28 bg-void-deep/95 backdrop-blur-xl border border-void-atmosphere rounded-lg shadow-2xl overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                onToggle();
              }}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                value === opt.value
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-muted hover:text-text-bright hover:bg-void-surface/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  
  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("stream");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterState, setFilterState] = useState<EnergyStateFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("position");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStreamStateDropdown, setShowStreamStateDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch stream details
  const { data: streamDetails, isLoading: streamLoading, error: streamError, refetch: refetchStream } = useStream(streamId, {
    pollInterval: 30000,
  });

  // Fetch all streams for context in canvas
  const { data: streams } = useStreams({ pollInterval: 30000 });
  
  // Fetch all work items
  const { data: workItems, refetch: refetchWorkItems } = useWorkItems(undefined, {
    pollInterval: 30000,
  });

  // Team data
  const { data: team } = useTeam({ pollInterval: 60000 });
  const { data: currentUserData } = useMe();

  // Transform team members for canvas
  const teamMembers = useMemo(() => {
    if (!team?.members) return [];
    return team.members.map(m => ({
      id: m.id,
      name: m.name,
      role: m.userRole,
      starType: m.starType,
      orbitalState: m.orbitalState,
      energySignatureColor: m.energySignatureColor,
    }));
  }, [team?.members]);

  // Work item actions
  const { kindleWorkItem, updateWorkItem } = useUpdateWorkItem();
  const { createWorkItem, isLoading: isCreating } = useCreateWorkItem();
  
  // Stream actions
  const { updateStream, isLoading: isUpdatingStream } = useUpdateStream();

  // Create dive mode state from stream details
  const diveMode: DiveModeState | null = useMemo(() => {
    if (!streamDetails) return null;
    
    return {
      streamId: streamDetails.id,
      streamName: streamDetails.name,
      streamState: streamDetails.state as StreamState,
      workItems: streamDetails.workItems ?? [],
      divers: streamDetails.divers ?? [],
    };
  }, [streamDetails]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!streamDetails) return null;
    
    const items = streamDetails.workItems ?? [];
    const total = items.length;
    const crystallized = items.filter(i => i.energyState === "crystallized").length;
    const blazing = items.filter(i => i.energyState === "blazing").length;
    const kindling = items.filter(i => i.energyState === "kindling").length;
    const completion = total > 0 ? Math.round((crystallized / total) * 100) : 0;
    const velocity = Math.round(streamDetails.velocity * 100);
    const activeDivers = streamDetails.divers?.length ?? 0;
    
    // Calculate "speed" based on activity
    const activeItems = blazing + kindling;
    const speed = total > 0 ? (activeItems / total) * streamDetails.velocity * 10 : 0;
    
    return {
      total,
      crystallized,
      blazing,
      kindling,
      dormant: items.filter(i => i.energyState === "dormant").length,
      cooling: items.filter(i => i.energyState === "cooling").length,
      completion,
      velocity,
      activeDivers,
      speed: speed.toFixed(1),
    };
  }, [streamDetails]);

  // Filter and sort work items
  const filteredAndSortedItems = useMemo(() => {
    let items = streamDetails?.workItems ?? [];
    
    // Apply filter
    if (filterState !== "all") {
      items = items.filter(item => item.energyState === filterState);
    }
    
    // Apply sort
    items = [...items].sort((a, b) => {
      switch (sortOption) {
        case "state": {
          const stateOrder = ["blazing", "kindling", "cooling", "dormant", "crystallized"];
          return stateOrder.indexOf(a.energyState) - stateOrder.indexOf(b.energyState);
        }
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        case "position":
        default:
          return a.streamPosition - b.streamPosition;
      }
    });
    
    return items;
  }, [streamDetails?.workItems, filterState, sortOption]);

  // Get selected item
  const selectedItem = useMemo(() => {
    if (!selectedItemId || !streamDetails?.workItems) return null;
    return streamDetails.workItems.find(item => item.id === selectedItemId) ?? null;
  }, [selectedItemId, streamDetails?.workItems]);

  // Handle creating a work item
  const handleCreateWorkItem = useCallback(async (data: { title: string; description: string; depth: string }) => {
    try {
      await createWorkItem({
        streamId,
        title: data.title,
        description: data.description || undefined,
        depth: data.depth as "shallow" | "medium" | "deep" | "abyssal",
      });
      setShowAddModal(false);
      setToastMessage("Work item added successfully");
      refetchStream();
      refetchWorkItems();
    } catch (error) {
      console.error("Failed to create work item:", error);
      setToastMessage("Failed to add work item");
    }
  }, [createWorkItem, streamId, refetchStream, refetchWorkItems]);

  // Handle kindling a work item
  const handleKindleWorkItem = useCallback(async (itemId: string) => {
    try {
      await kindleWorkItem(itemId);
      refetchStream();
      refetchWorkItems();
    } catch (error) {
      console.error("Failed to kindle:", error);
    }
  }, [kindleWorkItem, refetchStream, refetchWorkItems]);

  // Handle changing work item state
  const handleWorkItemStateChange = useCallback(async (itemId: string, newState: string) => {
    try {
      await updateWorkItem(itemId, { energyState: newState as "dormant" | "kindling" | "blazing" | "cooling" | "crystallized" });
      refetchStream();
      refetchWorkItems();
    } catch (error) {
      console.error("Failed to update work item state:", error);
    }
  }, [updateWorkItem, refetchStream, refetchWorkItems]);

  // Handle changing work item depth
  const handleWorkItemDepthChange = useCallback(async (itemId: string, newDepth: string) => {
    try {
      await updateWorkItem(itemId, { depth: newDepth as "shallow" | "medium" | "deep" | "abyssal" });
      refetchStream();
      refetchWorkItems();
    } catch (error) {
      console.error("Failed to update work item depth:", error);
    }
  }, [updateWorkItem, refetchStream, refetchWorkItems]);

  // Handle changing stream state
  const handleStreamStateChange = useCallback(async (newState: string) => {
    try {
      await updateStream(streamId, { state: newState as "nascent" | "flowing" | "rushing" | "flooding" | "stagnant" | "evaporated" });
      setToastMessage(`Stream status changed to ${newState}`);
      refetchStream();
    } catch (error) {
      console.error("Failed to update stream state:", error);
      setToastMessage("Failed to update stream status");
    }
  }, [updateStream, streamId, refetchStream]);

  // Handle surface (go back to observatory)
  const handleSurface = useCallback(() => {
    router.push("/observatory");
  }, [router]);

  // Handle clicking another stream
  const handleDiveIntoStream = useCallback((newStreamId: string) => {
    if (newStreamId !== streamId) {
      router.push(`/streams/${newStreamId}`);
    }
  }, [router, streamId]);

  // Get state-based color
  const stateColor = useMemo(() => {
    const colors: Record<string, string> = {
      nascent: "#64748b",
      flowing: "#00d4ff",
      rushing: "#fbbf24",
      flooding: "#ef4444",
      stagnant: "#6b7280",
      evaporated: "#374151",
    };
    return colors[streamDetails?.state ?? "flowing"] ?? "#00d4ff";
  }, [streamDetails?.state]);

  // Loading state
  if (streamLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] flex items-center justify-center bg-void-deep">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🌊</div>
          <p className="text-moon text-text-dim">Loading stream...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (streamError || !streamDetails) {
    return (
      <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] flex items-center justify-center bg-void-deep">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-text-bright mb-2">Stream not found</p>
          <p className="text-text-muted mb-4">This stream may have been deleted or you don&apos;t have access.</p>
          <Link
            href="/observatory"
            className="px-4 py-2 bg-accent-primary/20 text-accent-primary border border-accent-primary/50 rounded-lg hover:bg-accent-primary/30 transition-colors"
          >
            Back to Observatory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] relative overflow-hidden bg-void-deep">
      {/* Full-screen 3D Canvas in dive mode */}
      <div className="absolute inset-0 canvas-container">
        <VoidCanvas 
          className="w-full h-full" 
          showPerformance={false}
          showStreams={true}
          streams={streams ?? undefined}
          workItems={workItems ?? undefined}
          teamMembers={teamMembers}
          teamMemberCount={teamMembers.length || 1}
          diveMode={diveMode}
          onDiveIntoStream={handleDiveIntoStream}
          onSurfaceFromStream={handleSurface}
          onWorkItemKindle={handleKindleWorkItem}
          onWorkItemStateChange={handleWorkItemStateChange}
          onWorkItemDepthChange={handleWorkItemDepthChange}
          teamPulseSettings={(currentUserData as any)?.preferences?.teamPulse}
          hideDiveModeOverlay={true}
        />
      </div>

      {/* Compact Header */}
      <div className="absolute top-3 left-3 right-3 z-20">
        <div className="bg-void-deep/80 backdrop-blur-xl border border-void-atmosphere/50 rounded-xl px-3 py-2 shadow-2xl">
          <div className="flex items-center gap-3">
            {/* Back button & Title */}
            <Link
              href="/observatory"
              className="p-1.5 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors"
              title="Back to Observatory"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base font-semibold text-text-bright truncate">{streamDetails.name}</h1>
              <StreamStateDropdown
                currentState={streamDetails.state}
                onChange={handleStreamStateChange}
                isOpen={showStreamStateDropdown}
                onToggle={() => {
                  setShowStreamStateDropdown(!showStreamStateDropdown);
                  setShowFilterDropdown(false);
                  setShowSortDropdown(false);
                }}
                disabled={isUpdatingStream}
              />
            </div>

            {/* Compact Metrics */}
            {metrics && (
              <div className="hidden md:flex items-center gap-4 ml-auto text-xs">
                <div className="flex items-center gap-1.5" title="Speed">
                  <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-text-bright font-medium">{metrics.speed}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Divers">
                  <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-text-bright font-medium">{metrics.activeDivers}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Velocity">
                  <ActivityWaveform intensity={metrics.velocity / 100} color={stateColor} className="h-4" />
                  <span className="text-text-bright font-medium">{metrics.velocity}%</span>
                </div>
                <div className="flex items-center gap-1.5" title="Completion">
                  <div className="w-12 h-1.5 bg-void-atmosphere rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.completion}%` }} />
                  </div>
                  <span className="text-text-bright font-medium">{metrics.completion}%</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">
              <FilterDropdown
                value={filterState}
                onChange={setFilterState}
                isOpen={showFilterDropdown}
                onToggle={() => {
                  setShowFilterDropdown(!showFilterDropdown);
                  setShowSortDropdown(false);
                }}
              />
              <SortDropdown
                value={sortOption}
                onChange={setSortOption}
                isOpen={showSortDropdown}
                onToggle={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowFilterDropdown(false);
                }}
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="p-1.5 rounded-lg bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary transition-colors"
                title="Add work item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showSidebar 
                    ? "bg-accent-primary/20 text-accent-primary" 
                    : "bg-void-surface/50 text-text-muted hover:text-text-bright"
                }`}
                title="Toggle work items panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setToastMessage("Link copied to clipboard!");
                }}
                className="p-1.5 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors"
                title="Copy link to share"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Work Items Sidebar */}
      {showSidebar && (
        <div className="absolute top-16 right-3 bottom-3 w-80 z-10 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Energy State Progress Bars */}
            {metrics && (
              <div className="flex gap-1 px-3 mb-3">
                {[
                  { state: "crystallized", count: metrics.crystallized, color: "#06b6d4" },
                  { state: "blazing", count: metrics.blazing, color: "#fbbf24" },
                  { state: "kindling", count: metrics.kindling, color: "#f97316" },
                  { state: "cooling", count: metrics.cooling, color: "#a78bfa" },
                  { state: "dormant", count: metrics.dormant, color: "#6b7280" },
                ].map(({ state, count, color }) => (
                  <div
                    key={state}
                    className="h-1.5 rounded-full cursor-pointer hover:opacity-80 transition-all"
                    style={{ 
                      backgroundColor: color,
                      flex: count > 0 ? count : 0.5,
                      opacity: count > 0 ? (filterState === state || filterState === "all" ? 1 : 0.4) : 0.2,
                    }}
                    title={`${state}: ${count}`}
                    onClick={() => setFilterState(filterState === state ? "all" : state as EnergyStateFilter)}
                  />
                ))}
              </div>
            )}
            
            {/* Work Items List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {filteredAndSortedItems.map((item) => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                  onStateChange={(newState) => handleWorkItemStateChange(item.id, newState)}
                />
              ))}
              
              {filteredAndSortedItems.length === 0 && (streamDetails.workItems?.length ?? 0) > 0 && (
                <div className="text-center py-6 text-text-muted">
                  <p className="text-xs">No items match filter</p>
                  <button
                    onClick={() => setFilterState("all")}
                    className="mt-1 text-[10px] text-accent-primary hover:underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}
              
              {(!streamDetails.workItems || streamDetails.workItems.length === 0) && (
                <div className="text-center py-6 text-text-muted">
                  <p className="text-xs">No work items yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-1 text-[10px] text-accent-primary hover:underline"
                  >
                    Add first item
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Divers Indicator - compact */}
      {streamDetails.divers && streamDetails.divers.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-void-deep/90 backdrop-blur-xl border border-void-atmosphere/50 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Divers</span>
            <div className="flex -space-x-1.5">
              {streamDetails.divers.slice(0, 4).map((diver) => (
                <div
                  key={diver.id}
                  className="w-7 h-7 rounded-full border-2 border-void-deep flex items-center justify-center text-[10px] font-medium shadow-md"
                  style={{
                    backgroundColor: (diver.energySignatureColor ?? "#00d4ff") + "40",
                    borderColor: diver.energySignatureColor ?? "#00d4ff",
                  }}
                  title={diver.name}
                >
                  {diver.name.charAt(0)}
                </div>
              ))}
              {streamDetails.divers.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-void-deep bg-void-surface flex items-center justify-center text-[10px] text-text-muted shadow-md">
                  +{streamDetails.divers.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Work Item Detail Panel */}
      {selectedItem && (
        <WorkItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onStateChange={(newState) => {
            handleWorkItemStateChange(selectedItem.id, newState);
            setSelectedItemId(null);
          }}
          onDepthChange={(newDepth) => handleWorkItemDepthChange(selectedItem.id, newDepth)}
        />
      )}

      {/* Add Work Item Modal */}
      <AddWorkItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateWorkItem}
        isLoading={isCreating}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage ?? ""}
        isVisible={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
