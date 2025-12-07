"use client";

import { useState, useEffect, useCallback } from "react";
import { useStreams, useWorkItems, useCreateStream, useUpdateStream, useDeleteStream, useCreateWorkItem, useUpdateWorkItem, useDeleteWorkItem, useUsers, useMe, useTimeEntries, useTimeTracking } from "@/lib/api/hooks";
import { api, type WorkItem } from "@/lib/api/client";

// Format seconds to HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format duration to human readable
function formatDurationHuman(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

// Time Tracker Component
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

  return (
    <div className="flex items-center gap-2">
      {/* Total time display */}
      <span className="text-xs text-text-muted font-mono" title="Total time tracked">
        {formatDurationHuman(isRunning ? totalTime + elapsedTime : totalTime)}
      </span>
      
      {/* Timer button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`p-1.5 rounded-lg transition-all ${
          isRunning
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
            : "bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20"
        }`}
        title={isRunning ? `Stop timer (${formatDuration(elapsedTime)})` : "Start timer"}
      >
        {isRunning ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      
      {/* Running indicator */}
      {isRunning && (
        <span className="text-xs text-red-400 font-mono">
          {formatDuration(elapsedTime)}
        </span>
      )}
    </div>
  );
}

// Energy state configuration
const energyStates = {
  dormant: { label: "Dormant", color: "text-gray-400", bg: "bg-gray-500/20", icon: "○" },
  kindling: { label: "Kindling", color: "text-orange-400", bg: "bg-orange-500/20", icon: "◐" },
  blazing: { label: "Blazing", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: "●" },
  cooling: { label: "Cooling", color: "text-purple-400", bg: "bg-purple-500/20", icon: "◑" },
  crystallized: { label: "Done", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: "◇" },
} as const;

// Depth configuration
const depthConfig = {
  shallow: { label: "Shallow", color: "text-sky-400", bg: "bg-sky-500/20", icon: "~", description: "Quick task, < 1 hour" },
  medium: { label: "Medium", color: "text-blue-400", bg: "bg-blue-500/20", icon: "≈", description: "Half-day task" },
  deep: { label: "Deep", color: "text-indigo-400", bg: "bg-indigo-500/20", icon: "≋", description: "Full day or more" },
  abyssal: { label: "Abyssal", color: "text-purple-400", bg: "bg-purple-500/20", icon: "◈", description: "Multi-day deep work" },
} as const;

type DepthType = keyof typeof depthConfig;

// Stream state configuration
const streamStateConfig = {
  nascent: { label: "Nascent", color: "text-slate-400", bg: "bg-slate-500/20", description: "New stream, just created" },
  flowing: { label: "Flowing", color: "text-cyan-400", bg: "bg-cyan-500/20", description: "Normal, healthy pace" },
  rushing: { label: "Rushing", color: "text-yellow-400", bg: "bg-yellow-500/20", description: "High activity, fast moving" },
  flooding: { label: "Flooding", color: "text-red-400", bg: "bg-red-500/20", description: "Overloaded, needs attention" },
  stagnant: { label: "Stagnant", color: "text-gray-400", bg: "bg-gray-500/20", description: "Blocked or inactive" },
} as const;

type StreamStateType = keyof typeof streamStateConfig;

// Valid state transitions
const transitions: Record<string, { to: string; label: string; color: string }[]> = {
  dormant: [{ to: "kindling", label: "Start", color: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" }],
  kindling: [
    { to: "blazing", label: "Focus", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" },
    { to: "dormant", label: "Pause", color: "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30" },
  ],
  blazing: [{ to: "cooling", label: "Wind Down", color: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" }],
  cooling: [
    { to: "crystallized", label: "Complete", color: "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" },
    { to: "blazing", label: "Continue", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" },
  ],
  crystallized: [],
};

export default function StreamsPage() {
  const [showClosedStreams, setShowClosedStreams] = useState(false);
  const { data: streams, isLoading, refetch } = useStreams({ pollInterval: 30000, includeClosed: showClosedStreams });
  const { data: workItems, refetch: refetchWorkItems } = useWorkItems({ includeClosed: showClosedStreams });
  const { createStream, isLoading: isCreating } = useCreateStream();
  const { updateStream } = useUpdateStream();
  const { deleteStream } = useDeleteStream();
  const { createWorkItem } = useCreateWorkItem();
  const { updateWorkItem } = useUpdateWorkItem();
  const { deleteWorkItem } = useDeleteWorkItem();
  
  const { data: users } = useUsers();
  const { data: currentUser } = useMe();
  
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [showCreateStream, setShowCreateStream] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [assigningItem, setAssigningItem] = useState<WorkItem | null>(null);
  const [newStreamName, setNewStreamName] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDepth, setNewItemDepth] = useState<DepthType>("medium");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDepth, setEditDepth] = useState<DepthType>("medium");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Separate active and closed streams
  const activeStreams = streams?.filter(s => !s.evaporatedAt) ?? [];
  const closedStreams = streams?.filter(s => s.evaporatedAt) ?? [];

  // Group work items by stream
  const itemsByStream = workItems?.reduce((acc, item) => {
    if (!acc[item.streamId]) acc[item.streamId] = [];
    acc[item.streamId]!.push(item);
    return acc;
  }, {} as Record<string, typeof workItems>) ?? {};

  const selectedStream = streams?.find(s => s.id === selectedStreamId);
  const selectedItems = (selectedStreamId ? itemsByStream[selectedStreamId] ?? [] : [])
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleCreateStream = async () => {
    if (!newStreamName.trim()) return;
    await createStream({ name: newStreamName });
    setNewStreamName("");
    setShowCreateStream(false);
    refetch();
  };

  const handleCreateItem = async () => {
    if (!newItemTitle.trim() || !selectedStreamId) return;
    await createWorkItem({ streamId: selectedStreamId, title: newItemTitle, depth: newItemDepth });
    setNewItemTitle("");
    setNewItemDepth("medium");
    setShowCreateItem(false);
    refetchWorkItems();
    refetch();
  };

  const handleStateChange = async (itemId: string, newState: string) => {
    await updateWorkItem(itemId, { energyState: newState as any });
    refetchWorkItems();
    refetch();
  };

  const handleEditItem = (item: WorkItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditDepth(item.depth as DepthType);
    setEditTags(item.tags || []);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;
    await updateWorkItem(editingItem.id, { 
      title: editTitle.trim(), 
      description: editDescription.trim(), // Send empty string to clear, API converts to null
      depth: editDepth,
      tags: editTags,
    });
    setEditingItem(null);
    setNewTag("");
    refetchWorkItems();
    refetch();
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteWorkItem(itemId);
    refetchWorkItems();
    refetch();
  };

  const handleAddContributor = async (userId: string) => {
    if (!assigningItem) return;
    setIsAssigning(true);
    try {
      await api.addContributor(assigningItem.id, userId);
      setAssigningItem(null);
      refetchWorkItems();
      refetch();
    } catch (error: unknown) {
      console.error("Failed to add contributor:", error);
      const message = error instanceof Error ? error.message : "Failed to add contributor";
      alert(message);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="text-text-dim">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-7xl gap-4">
      {/* Sidebar - Stream List */}
      <div className="w-72 flex-shrink-0 glass-panel-solid flex flex-col overflow-hidden">
        <div className="p-4 border-b border-void-atmosphere/60">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-text-stellar">Streams</h1>
            <button
              onClick={() => setShowCreateStream(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 border border-accent-primary/30 transition-all hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-text-muted">Organize your work</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Active Streams */}
          {activeStreams.map((stream) => {
            const items = itemsByStream[stream.id] ?? [];
            const active = items.filter(i => i.energyState === "kindling" || i.energyState === "blazing").length;
            const isSelected = stream.id === selectedStreamId;

            return (
              <button
                key={stream.id}
                onClick={() => setSelectedStreamId(stream.id)}
                className={`w-full text-left p-3 rounded-xl mb-1.5 transition-all ${
                  isSelected 
                    ? "bg-void-atmosphere/80 border border-accent-primary/40 shadow-[0_0_15px_rgba(0,212,255,0.1)]" 
                    : "hover:bg-void-atmosphere/50 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Stream state indicator dot */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        stream.state === "flooding" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                        stream.state === "rushing" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" :
                        stream.state === "flowing" ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" :
                        stream.state === "stagnant" ? "bg-gray-500" :
                        "bg-slate-500"
                      }`}
                      title={streamStateConfig[stream.state as StreamStateType]?.label || stream.state}
                    />
                    <span className={`font-medium truncate ${isSelected ? "text-text-stellar" : "text-text-bright"}`}>
                      {stream.name}
                    </span>
                  </div>
                  {active > 0 && (
                    <span className="text-xs bg-energy-kindling/20 text-energy-kindling px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                      {active}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                  <span>{items.length} items</span>
                  <span className="text-energy-crystallized">{stream.crystalCount} done</span>
                </div>
              </button>
            );
          })}

          {activeStreams.length === 0 && !showClosedStreams && (
            <div className="text-center py-8 text-text-dim text-sm">
              No streams yet
            </div>
          )}

          {/* Closed Streams Section */}
          {showClosedStreams && closedStreams.length > 0 && (
            <div className="mt-4 pt-4 border-t border-void-atmosphere">
              <div className="text-xs text-text-dim uppercase tracking-wider px-3 mb-2">
                Closed Streams
              </div>
              {closedStreams.map((stream) => {
                const items = itemsByStream[stream.id] ?? [];
                const isSelected = stream.id === selectedStreamId;

                return (
                  <button
                    key={stream.id}
                    onClick={() => setSelectedStreamId(stream.id)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors opacity-60 hover:opacity-100 ${
                      isSelected 
                        ? "bg-gray-500/20 border border-gray-500/50" 
                        : "hover:bg-void-atmosphere border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-600" title="Closed" />
                        <span className={`font-medium truncate ${isSelected ? "text-gray-400" : "text-text-muted"}`}>
                          {stream.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-dim">
                      <span>{items.length} items</span>
                      <span>{stream.crystalCount} done</span>
                      <span>Closed {new Date(stream.evaporatedAt!).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Show Closed Streams Toggle */}
        <div className="p-3 border-t border-void-atmosphere/60">
          <button
            onClick={() => setShowClosedStreams(!showClosedStreams)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-void-atmosphere/50 transition-colors"
          >
            <span className="text-text-muted">
              {showClosedStreams ? "Hide closed" : "Show closed"}
            </span>
            <span className="text-text-dim flex items-center">
              {closedStreams.length > 0 && !showClosedStreams && `(${closedStreams.length})`}
              {showClosedStreams && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {!showClosedStreams && closedStreams.length > 0 && (
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content - Work Items */}
      <div className="flex-1 flex flex-col glass-panel-float overflow-hidden">
        {selectedStream ? (
          <>
            {/* Stream Header */}
            <div className="p-5 border-b border-void-atmosphere/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-text-stellar">{selectedStream.name}</h2>
                    {/* Stream State Selector */}
                    <div className="relative group">
                      <button
                        className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                          streamStateConfig[selectedStream.state as StreamStateType]?.bg || "bg-gray-500/20"
                        } ${
                          streamStateConfig[selectedStream.state as StreamStateType]?.color || "text-gray-400"
                        } border-current/30 hover:border-current/50`}
                      >
                        {streamStateConfig[selectedStream.state as StreamStateType]?.label || selectedStream.state}
                      </button>
                      {/* Dropdown */}
                      <div className="absolute left-0 top-full mt-1 bg-void-deep border border-void-atmosphere rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[160px]">
                        {(Object.keys(streamStateConfig) as StreamStateType[]).map((state) => {
                          const config = streamStateConfig[state];
                          const isSelected = selectedStream.state === state;
                          return (
                            <button
                              key={state}
                              onClick={async () => {
                                await updateStream(selectedStream.id, { state });
                                refetch();
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-void-atmosphere transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                isSelected ? "bg-void-atmosphere" : ""
                              }`}
                            >
                              <div className={`font-medium ${config.color}`}>{config.label}</div>
                              <div className="text-xs text-text-dim">{config.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-dim mt-0.5">
                    {selectedItems.length} items · {selectedStream.crystalCount} completed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedStream.evaporatedAt ? (
                    <>
                      <button
                        onClick={() => setShowCreateItem(true)}
                        className="glass-button-pill px-4 py-2 text-sm text-accent-primary border-accent-primary/40 hover:border-accent-primary/60 flex items-center gap-2 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Item
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Close "${selectedStream.name}"?\n\nThis will archive the stream and hide it from the Observatory. Work items will be preserved.`)) return;
                          await deleteStream(selectedStream.id);
                          setSelectedStreamId(null);
                          refetch();
                        }}
                        className="glass-button-pill px-4 py-2 text-sm text-text-muted hover:text-text-bright"
                      >
                        Close Stream
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!confirm(`Reopen "${selectedStream.name}"?`)) return;
                        await updateStream(selectedStream.id, { state: "stagnant" });
                        refetch();
                      }}
                      className="glass-button-pill px-4 py-2 text-sm text-accent-success border-accent-success/40 hover:border-accent-success/60"
                    >
                      Reopen Stream
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Work Items List */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedItems.length > 0 ? (
                <div className="space-y-3">
                  {selectedItems.map((item) => {
                    const state = energyStates[item.energyState as keyof typeof energyStates];
                    const availableTransitions = transitions[item.energyState] ?? [];

                    const depth = depthConfig[item.depth as keyof typeof depthConfig];

                    return (
                      <div
                        key={item.id}
                        className="glass-panel p-4 hover:border-void-surface/80 transition-all group hover:shadow-[0_0_20px_rgba(0,212,255,0.05)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={state.color}>{state.icon}</span>
                              <h3 className="font-medium text-text-bright truncate">{item.title}</h3>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${depth.bg} ${depth.color}`} title={depth.description}>
                                {depth.icon} {depth.label}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-text-dim mt-1 line-clamp-1">{item.description}</p>
                            )}
                            {/* Tags */}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-1.5 py-0.5 rounded bg-void-atmosphere text-text-muted"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Time Tracker - only show for non-crystallized items */}
                            {item.energyState !== "crystallized" && (
                              <TimeTracker workItemId={item.id} onUpdate={refetchWorkItems} />
                            )}
                            
                            {/* Contributors avatars */}
                            {item.contributors && item.contributors.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {item.contributors.slice(0, 4).map((contributor) => (
                                  <div
                                    key={contributor.id}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                                    style={{
                                      backgroundColor: `${contributor.energySignatureColor}20`,
                                      color: contributor.energySignatureColor,
                                      border: `1px solid ${contributor.energySignatureColor}40`,
                                    }}
                                    title={`${contributor.name}${contributor.isPrimary ? ' (lead)' : ''}`}
                                  >
                                    {contributor.name.charAt(0)}
                                  </div>
                                ))}
                                {item.contributors.length > 4 && (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 bg-void-atmosphere text-text-dim border border-void-surface">
                                    +{item.contributors.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded ${state.bg} ${state.color}`}>
                              {state.label}
                            </span>
                            {/* Action buttons - visible on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Add contributor - not available for crystallized items */}
                              {item.energyState !== "crystallized" && (
                                <button
                                  onClick={() => setAssigningItem(item)}
                                  className="p-1 text-text-dim hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                                  title="Add contributor"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1 text-text-dim hover:text-text-bright hover:bg-void-atmosphere rounded transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.title)}
                                className="p-1 text-text-dim hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* State Transitions */}
                        {availableTransitions.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-void-atmosphere">
                            <span className="text-xs text-text-dim">Actions:</span>
                            {availableTransitions.map((t) => (
                              <button
                                key={t.to}
                                onClick={() => handleStateChange(item.id, t.to)}
                                className={`px-2 py-1 text-xs rounded transition-colors ${t.color}`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3 opacity-50">○</div>
                  <p className="text-text-dim mb-4">No work items yet</p>
                  <button
                    onClick={() => setShowCreateItem(true)}
                    className="px-4 py-2 text-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 rounded-lg hover:bg-accent-primary/30 transition-colors"
                  >
                    + Create First Item
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-30">←</div>
              <p className="text-text-dim">Select a stream to view items</p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Create Stream Modal */}
      {showCreateStream && (
        <div className="fixed inset-0 bg-void-deep/60 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowCreateStream(false)}>
          <div className="glass-panel-float p-6 w-full max-w-sm shadow-[0_0_60px_rgba(0,212,255,0.1)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-stellar mb-4">New Stream</h2>
            <input
              type="text"
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.target.value)}
              placeholder="Stream name..."
              className="glass-input w-full px-4 py-3 text-text-bright placeholder-text-muted"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateStream()}
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCreateStream(false)}
                className="flex-1 glass-button px-4 py-2.5 text-sm text-text-dim hover:text-text-bright"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStream}
                disabled={!newStreamName.trim() || isCreating}
                className="flex-1 px-4 py-2.5 text-sm bg-accent-primary text-void-deep rounded-xl font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {showCreateItem && (
        <div className="fixed inset-0 bg-void-deep/60 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowCreateItem(false)}>
          <div className="glass-panel-float p-6 w-full max-w-md shadow-[0_0_60px_rgba(0,212,255,0.1)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-stellar mb-4">New Work Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Title</label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="glass-input w-full px-4 py-3 text-text-bright placeholder-text-muted"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Depth</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(depthConfig) as DepthType[]).map((d) => {
                    const config = depthConfig[d];
                    const isSelected = newItemDepth === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNewItemDepth(d)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? `${config.bg} ${config.color} border-current shadow-[0_0_15px_rgba(0,212,255,0.1)]`
                            : "border-void-atmosphere/60 text-text-dim hover:border-void-surface hover:text-text-muted"
                        }`}
                        title={config.description}
                      >
                        <div className="text-lg">{config.icon}</div>
                        <div className="text-xs mt-1">{config.label}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-text-muted mt-2">{depthConfig[newItemDepth].description}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateItem(false); setNewItemDepth("medium"); }}
                className="flex-1 glass-button px-4 py-2.5 text-sm text-text-dim hover:text-text-bright"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateItem}
                disabled={!newItemTitle.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-accent-primary text-void-deep rounded-xl font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-void-deep/60 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setEditingItem(null)}>
          <div className="glass-panel-float p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(0,212,255,0.1)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-stellar mb-4">Edit Work Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="glass-input w-full px-4 py-3 text-text-bright placeholder-text-muted"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  className="glass-input w-full px-4 py-3 text-text-bright placeholder-text-muted resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-dim mb-1">Depth</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(depthConfig) as DepthType[]).map((d) => {
                    const config = depthConfig[d];
                    const isSelected = editDepth === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditDepth(d)}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          isSelected
                            ? `${config.bg} ${config.color} border-current`
                            : "border-void-atmosphere text-text-dim hover:border-void-surface hover:text-text-muted"
                        }`}
                        title={config.description}
                      >
                        <div className="text-lg">{config.icon}</div>
                        <div className="text-xs mt-0.5">{config.label}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-text-dim mt-1">{depthConfig[editDepth].description}</p>
              </div>
              <div>
                <label className="block text-sm text-text-dim mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-void-atmosphere border border-void-surface rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="px-3 py-2 text-sm bg-void-atmosphere border border-void-surface rounded-lg text-text-muted hover:text-text-bright hover:border-accent-primary/50 transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-void-atmosphere text-text-muted group"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditingItem(null); setNewTag(""); }}
                className="flex-1 glass-button px-4 py-2.5 text-sm text-text-dim hover:text-text-bright"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-accent-primary text-void-deep rounded-xl font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign/Handoff Item Modal */}
      {assigningItem && (
        <div className="fixed inset-0 bg-void-deep/60 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setAssigningItem(null)}>
          <div className="glass-panel-float p-6 w-full max-w-sm shadow-[0_0_60px_rgba(0,212,255,0.1)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-stellar mb-2">
              Add Contributor
            </h2>
            <p className="text-sm text-text-dim mb-4 truncate">"{assigningItem.title}"</p>
            
            {/* Current contributors */}
            {assigningItem.contributors && assigningItem.contributors.length > 0 && (
              <div className="mb-4 pb-4 border-b border-void-atmosphere">
                <div className="text-xs text-text-muted mb-2">Current contributors:</div>
                <div className="flex flex-wrap gap-2">
                  {assigningItem.contributors.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${c.energySignatureColor}20`,
                        color: c.energySignatureColor,
                      }}
                    >
                      {c.name}
                      {c.isPrimary && <span className="opacity-60">(lead)</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users
                ?.filter((user) => !assigningItem.contributors?.some((c) => c.id === user.id))
                .map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddContributor(user.id)}
                  disabled={isAssigning}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-void-atmosphere/50 hover:bg-void-atmosphere border border-transparent hover:border-accent-primary/30 transition-colors text-left disabled:opacity-50"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: `${user.energySignatureColor}20`,
                      color: user.energySignatureColor,
                    }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-bright truncate">
                      {user.name}
                      {user.id === currentUser?.id && <span className="text-text-muted ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-text-dim truncate">{user.role || "Team Member"}</div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: user.orbitalState === "open" ? "#10b981" 
                        : user.orbitalState === "focused" ? "#fbbf24"
                        : user.orbitalState === "deep_work" ? "#ef4444"
                        : "#6b7280"
                    }}
                    title={user.orbitalState}
                  />
                </button>
              ))}
              
              {users && users.filter((user) => !assigningItem.contributors?.some((c) => c.id === user.id)).length === 0 && (
                <div className="text-center py-4 text-text-dim text-sm">
                  All team members are already contributors
                </div>
              )}
            </div>
            
            <button
              onClick={() => setAssigningItem(null)}
              className="w-full mt-4 glass-button px-4 py-2.5 text-sm text-text-dim hover:text-text-bright"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
