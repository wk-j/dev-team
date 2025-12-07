"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useStream, useStreams, useWorkItems, useUpdateWorkItem, useTeam, useMe } from "@/lib/api/hooks";
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
          <div className="animate-pulse text-4xl mb-4">🌊</div>
          <p className="text-moon text-text-dim">Loading stream...</p>
        </div>
      </div>
    ),
  }
);

export default function StreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;

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
          <p className="text-text-muted mb-4">This stream may have been deleted or you don't have access.</p>
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
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] relative overflow-hidden">
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
        />
      </div>

      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/observatory"
          className="flex items-center gap-2 px-3 py-2 bg-void-deep/80 backdrop-blur-sm border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright hover:border-accent-primary/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Observatory</span>
        </Link>
      </div>

      {/* Share button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
          }}
          className="flex items-center gap-2 px-3 py-2 bg-void-deep/80 backdrop-blur-sm border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright hover:border-accent-primary/50 transition-colors"
          title="Copy link to share"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}
