"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useStream, useStreams, useWorkItems, useUpdateWorkItem, useTeam, useMe } from "@/lib/api/hooks";
import type { DiveModeState } from "@/components/canvas/VoidCanvas";
import type { StreamState } from "@/components/canvas/Stream";
import type { WorkItem as WorkItemType } from "@/lib/api/client";

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
  const bars = 12;
  return (
    <div className={`flex items-center gap-0.5 h-6 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 0.3 + Math.sin((i / bars) * Math.PI) * 0.4;
        const animDelay = i * 0.08;
        const height = baseHeight * intensity;
        return (
          <div
            key={i}
            className="w-1 rounded-full animate-pulse"
            style={{
              backgroundColor: color,
              height: `${Math.max(15, height * 100)}%`,
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

// State badge with glow effect
function StateBadge({ state, className = "" }: { state: string; className?: string }) {
  const config: Record<string, { bg: string; text: string; glow: string }> = {
    nascent: { bg: "bg-gray-500/20", text: "text-gray-400", glow: "shadow-gray-500/20" },
    flowing: { bg: "bg-cyan-500/20", text: "text-cyan-400", glow: "shadow-cyan-500/30" },
    rushing: { bg: "bg-yellow-500/20", text: "text-yellow-400", glow: "shadow-yellow-500/30" },
    flooding: { bg: "bg-red-500/20", text: "text-red-400", glow: "shadow-red-500/30" },
    stagnant: { bg: "bg-slate-500/20", text: "text-slate-400", glow: "shadow-slate-500/20" },
    evaporated: { bg: "bg-gray-700/20", text: "text-gray-500", glow: "shadow-gray-700/20" },
  };
  const { bg, text, glow } = config[state] ?? config.flowing!;
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${bg} ${text} shadow-lg ${glow} ${className}`}>
      {state}
    </span>
  );
}

// Work item card for the sidebar
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
  const color = stateColors[item.energyState] ?? "#6b7280";
  
  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "bg-accent-primary/10 border-accent-primary/50"
          : "bg-void-surface/50 border-void-atmosphere hover:border-void-surface hover:bg-void-surface/80"
      }`}
    >
      {/* Energy indicator */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: color }}
      />
      
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-medium text-text-bright leading-tight line-clamp-1">
            {item.title}
          </h4>
          <span 
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: color }}
          />
        </div>
        
        {item.description && (
          <p className="text-xs text-text-dim line-clamp-1 mb-2">{item.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-text-muted capitalize">
            {item.energyState}
          </span>
          <div className="flex items-center gap-1">
            {item.contributors?.slice(0, 3).map((c, i) => (
              <div
                key={c.id}
                className="w-5 h-5 rounded-full border border-void-atmosphere flex items-center justify-center text-[10px] font-medium"
                style={{ 
                  backgroundColor: c.energySignatureColor + "30",
                  marginLeft: i > 0 ? "-6px" : 0,
                  zIndex: 3 - i,
                }}
                title={c.name}
              >
                {c.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// View mode types
type ViewMode = "stream" | "list" | "map";

export default function StreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  
  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("stream");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

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
      <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center bg-void-deep">
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
      <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center bg-void-deep">
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
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] relative overflow-hidden bg-void-deep">
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

      {/* Enhanced Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-void-deep/80 backdrop-blur-xl border border-void-atmosphere/50 rounded-2xl p-4 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Stream Title & State */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/observatory"
                className="p-2 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors"
                title="Back to Observatory"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-text-bright">{streamDetails.name}</h1>
                  <StateBadge state={streamDetails.state} />
                </div>
                {streamDetails.description && (
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-xs">{streamDetails.description}</p>
                )}
              </div>
            </div>

            {/* Metrics Row */}
            {metrics && (
              <div className="flex flex-wrap items-center gap-6 lg:gap-8 lg:ml-auto">
                <MetricCard
                  label="Current Speed"
                  value={`${metrics.speed}`}
                  subValue="Gbps"
                  color={stateColor}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
                
                <MetricCard
                  label="Divers"
                  value={metrics.activeDivers}
                  subValue="Active"
                  progress={(metrics.activeDivers / Math.max(1, teamMembers.length)) * 100}
                  color="#06b6d4"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">Velocity</div>
                  <div className="flex items-center gap-2">
                    <ActivityWaveform intensity={metrics.velocity / 100} color={stateColor} />
                    <span className="text-lg font-semibold text-text-bright">{metrics.velocity}%</span>
                  </div>
                </div>
                
                <MetricCard
                  label="Completion"
                  value={`${metrics.completion}%`}
                  progress={metrics.completion}
                  color="#10b981"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg transition-colors ${
                  showSidebar 
                    ? "bg-accent-primary/20 text-accent-primary" 
                    : "bg-void-surface/50 text-text-muted hover:text-text-bright"
                }`}
                title="Toggle work items panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="p-2 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors"
                title="Copy link to share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Work Items Sidebar */}
      {showSidebar && (
        <div className="absolute top-28 right-4 bottom-20 w-80 z-10 overflow-hidden">
          <div className="h-full bg-void-deep/80 backdrop-blur-xl border border-void-atmosphere/50 rounded-2xl flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-void-atmosphere/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-bright">Work Items</h2>
                <span className="text-xs text-text-muted">{metrics?.total ?? 0} total</span>
              </div>
              
              {/* Energy State Summary */}
              {metrics && (
                <div className="flex gap-1">
                  {[
                    { state: "blazing", count: metrics.blazing, color: "#fbbf24" },
                    { state: "kindling", count: metrics.kindling, color: "#f97316" },
                    { state: "cooling", count: metrics.cooling, color: "#a78bfa" },
                    { state: "dormant", count: metrics.dormant, color: "#6b7280" },
                    { state: "crystallized", count: metrics.crystallized, color: "#06b6d4" },
                  ].map(({ state, count, color }) => (
                    <div
                      key={state}
                      className="flex-1 h-1.5 rounded-full"
                      style={{ 
                        backgroundColor: color,
                        opacity: count > 0 ? 1 : 0.2,
                      }}
                      title={`${state}: ${count}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Work Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {streamDetails.workItems?.map((item) => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                  onStateChange={(newState) => handleWorkItemStateChange(item.id, newState)}
                />
              ))}
              
              {(!streamDetails.workItems || streamDetails.workItems.length === 0) && (
                <div className="text-center py-8 text-text-muted">
                  <div className="text-3xl mb-2">🌊</div>
                  <p className="text-sm">No work items yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-void-deep/80 backdrop-blur-xl border border-void-atmosphere/50 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            {/* Left - Filter & Sort */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors" title="Filter">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors" title="Sort">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Center - View Mode Switcher */}
            <div className="flex items-center bg-void-surface/30 rounded-lg p-1">
              {[
                { mode: "stream" as ViewMode, label: "Stream Flow", icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )},
                { mode: "list" as ViewMode, label: "List View", icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                )},
                { mode: "map" as ViewMode, label: "Map", icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )},
              ].map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    viewMode === mode
                      ? "bg-accent-primary/20 text-accent-primary"
                      : "text-text-muted hover:text-text-bright"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-void-surface/50 hover:bg-void-surface text-text-muted hover:text-text-bright transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Item</span>
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ 
                  backgroundColor: stateColor + "20",
                  color: stateColor,
                  borderColor: stateColor + "50",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Compose</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Divers Indicator */}
      {streamDetails.divers && streamDetails.divers.length > 0 && (
        <div className="absolute bottom-20 left-4 z-10">
          <div className="bg-void-deep/80 backdrop-blur-xl border border-void-atmosphere/50 rounded-xl px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Active Divers</div>
            <div className="flex -space-x-2">
              {streamDetails.divers.slice(0, 5).map((diver) => (
                <div
                  key={diver.id}
                  className="w-8 h-8 rounded-full border-2 border-void-deep flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: (diver.energySignatureColor ?? "#00d4ff") + "40",
                    borderColor: diver.energySignatureColor ?? "#00d4ff",
                  }}
                  title={diver.name}
                >
                  {diver.name.charAt(0)}
                </div>
              ))}
              {streamDetails.divers.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-void-deep bg-void-surface flex items-center justify-center text-xs text-text-muted">
                  +{streamDetails.divers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
