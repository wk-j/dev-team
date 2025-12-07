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
  const [showStats, setShowStats] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
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
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] relative overflow-hidden">
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
          teamPulseSettings={(currentUserData as any)?.preferences?.teamPulse}
        />
      </div>

      {/* Overlay UI - Hidden in dive mode */}
      {!diveMode && (
        <>
          {/* Top bar with title and controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <h1 className="text-xl font-semibold text-text-bright drop-shadow-lg">Observatory</h1>
              <p className="text-sm text-text-muted">
                {isLoading ? "Loading..." : `${metrics.teamOnline} active · ${metrics.activeStreams} streams`}
              </p>
            </div>
            
            <div className="flex gap-2 pointer-events-auto">
              {hasError && (
                <span className="px-2 py-1 text-xs text-accent-warning bg-void-deep/80 backdrop-blur-sm rounded-lg border border-accent-warning/30">
                  Demo mode
                </span>
              )}
              <button
                className="px-3 py-1.5 text-xs rounded-lg backdrop-blur-sm transition-colors bg-void-deep/80 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/10 flex items-center gap-1.5"
                onClick={() => setShowGuide(true)}
                title="Show guide"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>
              <button
                className={`px-2 py-1 text-xs rounded-lg backdrop-blur-sm transition-colors ${
                  showStats
                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/50"
                    : "bg-void-deep/80 text-text-muted border border-void-atmosphere hover:text-text-bright"
                }`}
                onClick={() => setShowStats(!showStats)}
              >
                Stats
              </button>
              <button
                className={`px-2 py-1 text-xs rounded-lg backdrop-blur-sm transition-colors ${
                  showPerformance
                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/50"
                    : "bg-void-deep/80 text-text-muted border border-void-atmosphere hover:text-text-bright"
                }`}
                onClick={() => setShowPerformance(!showPerformance)}
              >
                FPS
              </button>
            </div>
          </div>

          {/* Stats panel - floating overlay */}
          {showStats && (
            <div className="absolute top-16 left-4 z-10 pointer-events-auto">
              <div className="bg-void-deep/80 backdrop-blur-md border border-void-atmosphere rounded-xl p-4 w-56">
                {/* Energy bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">Team Energy</span>
                    <span className="text-text-bright">{Math.round(metrics.energyLevel * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-void-atmosphere rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-primary transition-all duration-500"
                      style={{ width: `${metrics.energyLevel * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-lg font-semibold text-energy-blazing">{metrics.activeStreams}</div>
                    <div className="text-xs text-text-muted">Streams</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-accent-primary">{metrics.teamOnline}</div>
                    <div className="text-xs text-text-muted">Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-energy-crystallized">{metrics.totalCrystals}</div>
                    <div className="text-xs text-text-muted">Crystals</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-energy-kindling">{metrics.activeItems}</div>
                    <div className="text-xs text-text-muted">In flow</div>
                  </div>
                </div>

                {/* Rushing indicator */}
                {metrics.rushingStreams > 0 && (
                  <div className="mt-3 pt-3 border-t border-void-atmosphere">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-energy-blazing animate-pulse" />
                      <span className="text-text-muted">{metrics.rushingStreams} rushing</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <div className="bg-void-deep/80 backdrop-blur-md border border-void-atmosphere rounded-full px-4 py-2 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-void-atmosphere rounded text-text-dim">Drag</kbd>
                rotate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-void-atmosphere rounded text-text-dim">Scroll</kbd>
                zoom
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-void-atmosphere rounded text-text-dim">Click</kbd>
                dive
              </span>
            </div>
          </div>

          {/* Legend - bottom right - explains all canvas elements */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
            <div className="bg-void-deep/90 backdrop-blur-md border border-void-atmosphere rounded-xl p-3 min-w-[200px]">
              <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">Legend</div>
              
              {/* Element types */}
              <div className="space-y-2 text-xs">
                {/* Center pulse */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#00d4ff]/50 flex-shrink-0" />
                  <span className="text-text-muted">Team Pulse (center)</span>
                </div>
                
                {/* Streams */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-[#00d4ff] flex-shrink-0 rounded" />
                  <span className="text-text-muted">Work Stream</span>
                </div>
                
                {/* Work items */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#fbbf24] flex-shrink-0" />
                  <span className="text-text-muted">Work Item (active)</span>
                </div>
                
                {/* Team members */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff6b9d] ring-1 ring-[#ff6b9d]/50 flex-shrink-0" />
                  <span className="text-text-muted">Team Member (outer ring)</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-void-atmosphere my-2" />
              
              {/* Work item states */}
              <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">Work States</div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4b5563]" />
                  <span className="text-text-dim">Dormant</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                  <span className="text-text-dim">Kindling</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                  <span className="text-text-dim">Blazing</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
                  <span className="text-text-dim">Done</span>
                </span>
              </div>
            </div>
          </div>
        </>
      )}



      {/* Observatory Guide Modal */}
      <ObservatoryGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
