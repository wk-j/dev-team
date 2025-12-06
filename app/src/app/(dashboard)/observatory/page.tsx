"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useStreams, useWorkItems, useStream, useDiveMode, useUpdateWorkItem, useTeam } from "@/lib/api/hooks";
import { useClassicView } from "@/lib/accessibility";
import { ClassicView } from "@/components/ClassicView";
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
  const [showPerformance, setShowPerformance] = useState(false);
  const [showStats, setShowStats] = useState(true);
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
  const { kindleWorkItem } = useUpdateWorkItem();

  // Fetch stream details when diving
  const { data: streamDetails, refetch: refetchStreamDetails } = useStream(
    diveMode?.streamId ?? "",
    { enabled: !!diveMode?.streamId }
  );

  // Handle diving into a stream
  const handleDiveIntoStream = useCallback(async (streamId: string) => {
    try {
      const result = await diveIntoStream(streamId);
      
      // Find the stream from our list
      const stream = streams?.find(s => s.id === streamId);
      
      if (stream) {
        setDiveMode({
          streamId: stream.id,
          streamName: stream.name,
          streamState: stream.state as StreamState,
          workItems: workItems?.filter(w => w.streamId === streamId) ?? [],
          divers: result.divers,
        });
      }
    } catch (error) {
      console.error("Failed to dive:", error);
    }
  }, [diveIntoStream, streams, workItems]);

  // Handle surfacing from a stream
  const handleSurface = useCallback(async () => {
    if (!diveMode?.streamId) return;
    
    try {
      await surfaceFromStream(diveMode.streamId);
      setDiveMode(null);
      // Refresh data after surfacing
      refetchStreams();
      refetchWorkItems();
    } catch (error) {
      console.error("Failed to surface:", error);
    }
  }, [diveMode?.streamId, surfaceFromStream, refetchStreams, refetchWorkItems]);

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
          streams={streams ?? undefined}
          workItems={workItems ?? undefined}
          teamMembers={teamMembers}
          teamMemberCount={teamMembers.length || 1}
          diveMode={diveMode}
          onDiveIntoStream={handleDiveIntoStream}
          onSurfaceFromStream={handleSurface}
          onWorkItemKindle={handleKindleWorkItem}
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

          {/* Legend - bottom right */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
            <div className="bg-void-deep/80 backdrop-blur-md border border-void-atmosphere rounded-lg px-3 py-2">
              <div className="flex gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                  Lead
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                  Dev
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                  Spec
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dive mode indicator */}
      {diveMode && (
        <div className="absolute top-4 left-4 z-10 pointer-events-auto">
          <div className="bg-void-deep/90 backdrop-blur-md border border-accent-primary/50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-sm text-text-bright">Diving: {diveMode.streamName}</span>
              <button
                onClick={handleSurface}
                className="px-2 py-1 text-xs bg-void-atmosphere hover:bg-void-surface rounded transition-colors"
              >
                Surface
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
