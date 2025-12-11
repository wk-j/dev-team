"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useStreams, useWorkItems, useStream, useDiveMode, useUpdateWorkItem, useTeam, useMe } from "@/lib/api/hooks";
import { useClassicView } from "@/lib/accessibility";
import { ClassicView } from "@/components/ClassicView";
import { ObservatoryGuide } from "@/components/canvas/ObservatoryGuide";
import type { DiveModeState } from "@/components/canvas/VoidCanvas";
import type { StreamState } from "@/components/canvas/Stream";
import { ENERGY_STATES, ENERGY_STATE_CONFIG } from "@/lib/constants";

// Dynamic import to avoid SSR issues with Three.js
const VoidCanvas = dynamic(
  () => import("@/components/canvas").then((mod) => mod.VoidCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-void-deep">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">✨</div>
          <p className="text-moon text-text-dim">Entering the void...</p>
        </div>
      </div>
    ),
  }
);

export default function ObservatoryPage() {
  const router = useRouter();
  const [showPerformance, setShowPerformance] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [diveMode, setDiveMode] = useState<DiveModeState | null>(null);
  
  // Check if classic view is enabled
  const isClassicView = useClassicView();
  
  // Fetch real data from API
  const { data: streams, isLoading: streamsLoading, error: streamsError, refetch: refetchStreams } = useStreams({
    pollInterval: 30000, // Refresh every 30 seconds
  });
  
  const { data: workItems, isLoading: workItemsLoading, refetch: refetchWorkItems } = useWorkItems(undefined, {
    pollInterval: 30000,
  });

  // Fetch team members for constellation view
  const { data: team } = useTeam({
    pollInterval: 60000, // Refresh every minute
  });

  // Fetch current user for preferences
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

  // Dive mode hooks
  const { diveIntoStream, surfaceFromStream, isLoading: diveLoading } = useDiveMode();
  const { kindleWorkItem, updateWorkItem } = useUpdateWorkItem();

  // Fetch stream details when diving
  const { data: streamDetails, refetch: refetchStreamDetails } = useStream(
    diveMode?.streamId ?? "",
    { enabled: !!diveMode?.streamId }
  );

  // Handle viewing stream details - navigate to dedicated page
  const handleDiveIntoStream = useCallback((streamId: string) => {
    router.push(`/streams/${streamId}`);
  }, [router]);

  // Handle exiting stream detail view (not used in observatory anymore, kept for interface)
  const handleSurface = useCallback(() => {
    setDiveMode(null);
  }, []);

  // Handle kindling a work item
  const handleKindleWorkItem = useCallback(async (itemId: string) => {
    try {
      await kindleWorkItem(itemId);
      // Refresh stream details if in dive mode
      if (diveMode) {
        refetchStreamDetails();
      }
      refetchWorkItems();
    } catch (error) {
      console.error("Failed to kindle:", error);
    }
  }, [kindleWorkItem, diveMode, refetchStreamDetails, refetchWorkItems]);

  // Handle changing work item state
  const handleWorkItemStateChange = useCallback(async (itemId: string, newState: string) => {
    try {
      await updateWorkItem(itemId, { energyState: newState as "dormant" | "kindling" | "blazing" | "cooling" | "crystallized" });
      // Refresh data
      refetchWorkItems();
      refetchStreams();
      // Update dive mode work items if active
      if (diveMode) {
        const updatedItems = workItems?.filter(w => w.streamId === diveMode.streamId).map(w => 
          w.id === itemId ? { ...w, energyState: newState } : w
        ) ?? [];
        setDiveMode(prev => prev ? { ...prev, workItems: updatedItems as typeof prev.workItems } : null);
      }
    } catch (error) {
      console.error("Failed to update work item state:", error);
    }
  }, [updateWorkItem, refetchWorkItems, refetchStreams, diveMode, workItems]);

  // Handle changing work item depth
  const handleWorkItemDepthChange = useCallback(async (itemId: string, newDepth: string) => {
    try {
      await updateWorkItem(itemId, { depth: newDepth as "shallow" | "medium" | "deep" | "abyssal" });
      // Refresh data
      refetchWorkItems();
      // Update dive mode work items if active
      if (diveMode) {
        const updatedItems = workItems?.filter(w => w.streamId === diveMode.streamId).map(w => 
          w.id === itemId ? { ...w, depth: newDepth } : w
        ) ?? [];
        setDiveMode(prev => prev ? { ...prev, workItems: updatedItems as typeof prev.workItems } : null);
      }
    } catch (error) {
      console.error("Failed to update work item depth:", error);
    }
  }, [updateWorkItem, refetchWorkItems, diveMode, workItems]);

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const activeStreams = streams?.filter(s => s.state !== "evaporated" && s.state !== "stagnant").length ?? 0;
    const rushingStreams = streams?.filter(s => s.state === "rushing" || s.state === "flooding").length ?? 0;
    const crystalsToday = workItems?.filter(w => {
      if (!w.crystallizedAt) return false;
      const today = new Date();
      const crystalDate = new Date(w.crystallizedAt);
      return crystalDate.toDateString() === today.toDateString();
    }).length ?? 0;
    const totalCrystals = workItems?.filter(w => w.energyState === "crystallized").length ?? 0;
    const activeItems = workItems?.filter(w => w.energyState === "kindling" || w.energyState === "blazing").length ?? 0;
    const dormantItems = workItems?.filter(w => w.energyState === "dormant").length ?? 0;

    // Calculate team divers count
    const activeDivers = new Set(streams?.flatMap(s => s.divers.map(d => d.id)) ?? []);
    const teamOnline = activeDivers.size;

    // Calculate energy level
    const totalItems = workItems?.length ?? 0;
    const energyLevel = totalItems > 0 ? Math.min(1, (activeItems / totalItems) * 2) : 0.5;

    return {
      activeStreams,
      rushingStreams,
      crystalsToday,
      totalCrystals,
      activeItems,
      dormantItems,
      teamOnline,
      energyLevel,
    };
  }, [streams, workItems]);

  const isLoading = streamsLoading || workItemsLoading;
  const hasError = !!streamsError;
  const pulseVisible = (currentUserData as any)?.preferences?.teamPulse?.visible ?? false;

  // Render classic 2D view if accessibility setting is enabled
  if (isClassicView) {
    return (
      <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-auto">
        <ClassicView
          streams={streams ?? []}
          workItems={workItems ?? []}
          teamMembers={teamMembers}
          onStreamClick={handleDiveIntoStream}
          onWorkItemClick={(itemId) => {
            // Find the work item and kindle it
            handleKindleWorkItem(itemId);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] relative overflow-hidden">
      {/* Full-screen 3D Canvas */}
      <div className="absolute inset-0 canvas-container">
        {diveLoading && (
          <div className="absolute inset-0 bg-void-deep/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-4">🌊</div>
              <p className="text-moon text-text-dim">
                {diveMode ? "Surfacing..." : "Diving in..."}
              </p>
            </div>
          </div>
        )}
          <VoidCanvas 
            className="w-full h-full" 
            showPerformance={showPerformance}
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
            showPulseCore={pulseVisible}
            teamPulseSettings={(currentUserData as any)?.preferences?.teamPulse}
          />
      </div>

      {/* Overlay UI - Hidden in dive mode */}
      {!diveMode && (
        <>
          {/* Top Left - Stats Panel */}
          <div className="absolute top-4 left-4 z-10 pointer-events-auto">
            {/* Stats panel */}
            {showStats && (
              <div className="glass-panel-float p-4 w-52">
                {/* Energy bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-dim">Team Energy</span>
                    <span className="text-text-bright font-medium">{Math.round(metrics.energyLevel * 100)}%</span>
                  </div>
                  <div className="h-2 bg-void-atmosphere/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-primary/70 transition-all duration-500"
                      style={{ width: `${metrics.energyLevel * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <div className="text-xl font-bold text-accent-primary">{metrics.activeStreams}</div>
                    <div className="text-xs text-text-muted">Streams</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-accent-primary">{metrics.teamOnline}</div>
                    <div className="text-xs text-text-muted">Active</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-energy-crystallized">{metrics.totalCrystals}</div>
                    <div className="text-xs text-text-muted">Crystals</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-energy-kindling">{metrics.activeItems}</div>
                    <div className="text-xs text-text-muted">In flow</div>
                  </div>
                </div>

                {/* Rushing indicator */}
                {metrics.rushingStreams > 0 && (
                  <div className="mt-3 pt-3 border-t border-void-atmosphere/60">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-energy-blazing animate-pulse" />
                      <span className="text-text-muted">{metrics.rushingStreams} rushing</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
            
          {/* Top Right - Control Buttons */}
          <div className="absolute top-4 right-4 z-10 pointer-events-auto">
            <div className="flex items-center gap-2">
              {hasError && (
                <span className="px-3 py-1.5 text-xs text-accent-warning glass-panel-float border-accent-warning/30 rounded-full">
                  Demo mode
                </span>
              )}
              <button
                className="glass-button-pill px-4 py-2 text-xs text-accent-primary border-accent-primary/30 hover:border-accent-primary/50 flex items-center gap-2"
                onClick={() => setShowGuide(true)}
                title="Show guide"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Help
              </button>
              <button
                className={`glass-button-pill px-4 py-2 text-xs transition-all ${
                  showStats
                    ? "glass-button-active text-accent-primary"
                    : "text-text-dim hover:text-text-bright"
                }`}
                onClick={() => setShowStats(!showStats)}
              >
                Stats
              </button>
              <button
                className={`glass-button-pill px-4 py-2 text-xs transition-all ${
                  showPerformance
                    ? "glass-button-active text-accent-primary"
                    : "text-text-dim hover:text-text-bright"
                }`}
                onClick={() => setShowPerformance(!showPerformance)}
              >
                FPS
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <div className="glass-panel-float rounded-full px-5 py-2.5 flex items-center gap-5 text-xs text-text-muted">
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-void-atmosphere/60 rounded-md text-text-dim font-mono text-[10px]">Drag</kbd>
                <span>rotate</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-void-atmosphere/60 rounded-md text-text-dim font-mono text-[10px]">Scroll</kbd>
                <span>zoom</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-void-atmosphere/60 rounded-md text-text-dim font-mono text-[10px]">Click</kbd>
                <span>dive</span>
              </span>
            </div>
          </div>

          {/* Legend - bottom right */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-auto hidden md:block">
            <div className="glass-panel-float p-3 min-w-[200px] pointer-events-auto">
              <div
                className={`flex items-center justify-between ${legendCollapsed ? "mb-0" : "mb-2"} cursor-pointer select-none`}
                onClick={() => setLegendCollapsed(!legendCollapsed)}
              >
                <div className="text-[10px] text-text-dim uppercase tracking-wider font-medium">Legend</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLegendCollapsed(!legendCollapsed);
                  }}
                  className="p-1 rounded text-text-dim hover:text-text-bright hover:bg-void-atmosphere transition-colors"
                  title={legendCollapsed ? "Expand" : "Collapse"}
                >
                  {legendCollapsed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              {!legendCollapsed && (
                <>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-primary to-accent-primary/50 flex-shrink-0 shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
                      <span className="text-text-muted">Team Pulse (center)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-0.5 bg-accent-primary flex-shrink-0 rounded shadow-[0_0_4px_rgba(0,212,255,0.4)]" />
                      <span className="text-text-muted">Work Stream</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-energy-blazing flex-shrink-0 shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
                      <span className="text-text-muted">Work Item (active)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff6b9d] ring-2 ring-[#ff6b9d]/30 flex-shrink-0" />
                      <span className="text-text-muted">Team Member (outer ring)</span>
                    </div>
                  </div>
                  <div className="h-px bg-void-atmosphere/60 my-2.5" />
                  <div className="text-[10px] text-text-dim uppercase tracking-wider font-medium mb-2">Work States</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                    {ENERGY_STATES.map((state) => (
                      <span key={state} className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: ENERGY_STATE_CONFIG[state].color }}
                        />
                        <span className="text-text-dim">{ENERGY_STATE_CONFIG[state].label}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}



      {/* Observatory Guide Modal */}
      <ObservatoryGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
