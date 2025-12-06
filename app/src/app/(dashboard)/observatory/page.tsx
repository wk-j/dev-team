"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useStreams, useWorkItems, useStream, useDiveMode, useUpdateWorkItem } from "@/lib/api/hooks";
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
  const [diveMode, setDiveMode] = useState<DiveModeState | null>(null);
  
  // Fetch real data from API
  const { data: streams, isLoading: streamsLoading, error: streamsError, refetch: refetchStreams } = useStreams({
    pollInterval: 30000, // Refresh every 30 seconds
  });
  
  const { data: workItems, isLoading: workItemsLoading, refetch: refetchWorkItems } = useWorkItems(undefined, {
    pollInterval: 30000,
  });

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
  const activeStreams = streams?.filter(s => s.state !== "evaporated" && s.state !== "stagnant").length ?? 0;
  const rushingStreams = streams?.filter(s => s.state === "rushing" || s.state === "flooding").length ?? 0;
  const crystalsToday = workItems?.filter(w => {
    if (!w.crystallizedAt) return false;
    const today = new Date();
    const crystalDate = new Date(w.crystallizedAt);
    return crystalDate.toDateString() === today.toDateString();
  }).length ?? 0;
  const totalCrystals = workItems?.filter(w => w.energyState === "crystallized").length ?? 0;

  // Calculate team divers count
  const activeDivers = new Set(streams?.flatMap(s => s.divers.map(d => d.id)) ?? []);
  const teamOnline = activeDivers.size;

  const isLoading = streamsLoading || workItemsLoading;
  const hasError = !!streamsError;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Hidden in dive mode */}
        {!diveMode && (
          <>
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-stellar text-text-stellar mb-2">Observatory</h1>
                <p className="text-moon text-text-dim">
                  Your window into the team&apos;s energy and activity
                </p>
              </div>
              <div className="flex gap-2">
                {hasError && (
                  <span className="px-3 py-1.5 text-dust text-accent-warning bg-accent-warning/10 rounded-lg">
                    Using demo data
                  </span>
                )}
                <button
                  className={`px-3 py-1.5 text-dust rounded-lg transition-colors ${
                    showPerformance
                      ? "bg-accent-primary/20 text-accent-primary border border-accent-primary"
                      : "bg-void-surface text-text-muted border border-void-atmosphere hover:bg-void-atmosphere"
                  }`}
                  onClick={() => setShowPerformance(!showPerformance)}
                >
                  {showPerformance ? "Hide" : "Show"} Stats
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-panel p-6">
                <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
                  Team Pulse
                </div>
                <div className="text-stellar text-accent-primary">
                  {isLoading ? "..." : "72 BPM"}
                </div>
                <div className="text-moon text-text-dim">Steady rhythm</div>
              </div>

              <div className="glass-panel p-6">
                <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
                  Active Streams
                </div>
                <div className="text-stellar text-energy-blazing">
                  {isLoading ? "..." : activeStreams}
                </div>
                <div className="text-moon text-text-dim">
                  {rushingStreams} rushing
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
                  Crystals Today
                </div>
                <div className="text-stellar text-energy-crystallized">
                  {isLoading ? "..." : crystalsToday}
                </div>
                <div className="text-moon text-text-dim">
                  {totalCrystals} total
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
                  Team Diving
                </div>
                <div className="text-stellar text-accent-success">
                  {isLoading ? "..." : teamOnline}
                </div>
                <div className="text-moon text-text-dim">active in streams</div>
              </div>
            </div>
          </>
        )}

        {/* 3D Void Canvas */}
        <div 
          className={`glass-panel overflow-hidden rounded-xl transition-all ${
            diveMode ? "fixed inset-0 z-50 rounded-none" : ""
          }`} 
          style={{ height: diveMode ? "100vh" : "500px" }}
        >
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
            diveMode={diveMode}
            onDiveIntoStream={handleDiveIntoStream}
            onSurfaceFromStream={handleSurface}
            onWorkItemKindle={handleKindleWorkItem}
          />
        </div>

        {/* Legend and controls - Hidden in dive mode */}
        {!diveMode && (
          <>
            <div className="mt-4 flex flex-wrap gap-4 justify-center text-dust text-text-muted">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#fbbf24]" /> Team Lead
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f97316]" /> Senior
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00d4ff]" /> Developer
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff6b9d]" /> Junior
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" /> Specialist
              </span>
            </div>

            <div className="mt-4 text-center text-dust text-text-muted">
              <span className="mr-4">Drag to rotate</span>
              <span className="mr-4">Scroll to zoom</span>
              <span className="mr-4">Hover streams for info</span>
              <span>Click stream to dive in</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
