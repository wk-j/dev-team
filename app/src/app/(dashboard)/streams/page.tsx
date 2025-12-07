"use client";

import { useState } from "react";
import { useStreams, useWorkItems, useCreateStream, useUpdateStream, useDeleteStream, useCreateWorkItem, useUpdateWorkItem, useDeleteWorkItem, useUsers, useMe } from "@/lib/api/hooks";
import { api, type WorkItem } from "@/lib/api/client";

// Energy state configuration
const energyStates = {
  dormant: { label: "Dormant", color: "text-gray-400", bg: "bg-gray-500/20", icon: "○" },
  kindling: { label: "Kindling", color: "text-orange-400", bg: "bg-orange-500/20", icon: "◐" },
  blazing: { label: "Blazing", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: "●" },
  cooling: { label: "Cooling", color: "text-purple-400", bg: "bg-purple-500/20", icon: "◑" },
  crystallized: { label: "Done", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: "◇" },
} as const;

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
  const { data: streams, isLoading, refetch } = useStreams({ pollInterval: 30000 });
  const { data: workItems, refetch: refetchWorkItems } = useWorkItems();
  const { createStream, isLoading: isCreating } = useCreateStream();
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
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Group work items by stream
  const itemsByStream = workItems?.reduce((acc, item) => {
    if (!acc[item.streamId]) acc[item.streamId] = [];
    acc[item.streamId]!.push(item);
    return acc;
  }, {} as Record<string, typeof workItems>) ?? {};

  const selectedStream = streams?.find(s => s.id === selectedStreamId);
  const selectedItems = selectedStreamId ? itemsByStream[selectedStreamId] ?? [] : [];

  const handleCreateStream = async () => {
    if (!newStreamName.trim()) return;
    await createStream({ name: newStreamName });
    setNewStreamName("");
    setShowCreateStream(false);
    refetch();
  };

  const handleCreateItem = async () => {
    if (!newItemTitle.trim() || !selectedStreamId) return;
    await createWorkItem({ streamId: selectedStreamId, title: newItemTitle, depth: "medium" });
    setNewItemTitle("");
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
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;
    await updateWorkItem(editingItem.id, { 
      title: editTitle.trim(), 
      description: editDescription.trim() || undefined 
    });
    setEditingItem(null);
    refetchWorkItems();
    refetch();
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteWorkItem(itemId);
    refetchWorkItems();
    refetch();
  };

  const handleAssignItem = async (userId: string) => {
    if (!assigningItem) return;
    setIsAssigning(true);
    try {
      // Use assign for dormant items, handoff for active items
      if (assigningItem.energyState === "dormant") {
        await api.assignWorkItem(assigningItem.id, userId);
      } else {
        await api.handoffWorkItem(assigningItem.id, userId);
      }
      setAssigningItem(null);
      refetchWorkItems();
      refetch();
    } catch (error) {
      console.error("Failed to assign/handoff:", error);
      alert("Failed to assign work item");
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-text-dim">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Stream List */}
      <div className="w-72 border-r border-void-atmosphere bg-void-deep/50 flex flex-col">
        <div className="p-4 border-b border-void-atmosphere">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-text-bright">Streams</h1>
            <button
              onClick={() => setShowCreateStream(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-xs text-text-dim">Organize your work</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {streams?.map((stream) => {
            const items = itemsByStream[stream.id] ?? [];
            const active = items.filter(i => i.energyState === "kindling" || i.energyState === "blazing").length;
            const isSelected = stream.id === selectedStreamId;

            return (
              <button
                key={stream.id}
                onClick={() => setSelectedStreamId(stream.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  isSelected 
                    ? "bg-accent-primary/20 border border-accent-primary/50" 
                    : "hover:bg-void-atmosphere border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium truncate ${isSelected ? "text-accent-primary" : "text-text-bright"}`}>
                    {stream.name}
                  </span>
                  {active > 0 && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                      {active}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-dim">
                  <span>{items.length} items</span>
                  <span>{stream.crystalCount} done</span>
                </div>
              </button>
            );
          })}

          {(!streams || streams.length === 0) && (
            <div className="text-center py-8 text-text-dim text-sm">
              No streams yet
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Work Items */}
      <div className="flex-1 flex flex-col bg-void-nebula/30">
        {selectedStream ? (
          <>
            {/* Stream Header */}
            <div className="p-4 border-b border-void-atmosphere bg-void-deep/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-bright">{selectedStream.name}</h2>
                  <p className="text-sm text-text-dim mt-0.5">
                    {selectedItems.length} items · {selectedStream.crystalCount} completed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateItem(true)}
                    className="px-3 py-1.5 text-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 rounded-lg hover:bg-accent-primary/30 transition-colors"
                  >
                    + New Item
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${selectedStream.name}"?`)) return;
                      await deleteStream(selectedStream.id);
                      setSelectedStreamId(null);
                      refetch();
                    }}
                    className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Work Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedItems.map((item) => {
                    const state = energyStates[item.energyState as keyof typeof energyStates];
                    const availableTransitions = transitions[item.energyState] ?? [];

                    return (
                      <div
                        key={item.id}
                        className="bg-void-deep/50 border border-void-atmosphere rounded-lg p-4 hover:border-void-surface transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={state.color}>{state.icon}</span>
                              <h3 className="font-medium text-text-bright truncate">{item.title}</h3>
                            </div>
                            {item.description && (
                              <p className="text-sm text-text-dim mt-1 line-clamp-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${state.bg} ${state.color}`}>
                              {state.label}
                            </span>
                            {/* Action buttons - visible on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Assign/Handoff - not available for crystallized items */}
                              {item.energyState !== "crystallized" && (
                                <button
                                  onClick={() => setAssigningItem(item)}
                                  className="p-1 text-text-dim hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                                  title={item.energyState === "dormant" ? "Assign to team member" : "Hand off to team member"}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

      {/* Create Stream Modal */}
      {showCreateStream && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateStream(false)}>
          <div className="bg-void-deep border border-void-atmosphere rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-bright mb-4">New Stream</h2>
            <input
              type="text"
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.target.value)}
              placeholder="Stream name..."
              className="w-full px-3 py-2 bg-void-atmosphere border border-void-surface rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateStream()}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCreateStream(false)}
                className="flex-1 px-3 py-2 text-sm border border-void-atmosphere rounded-lg text-text-dim hover:text-text-bright transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStream}
                disabled={!newStreamName.trim() || isCreating}
                className="flex-1 px-3 py-2 text-sm bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {showCreateItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateItem(false)}>
          <div className="bg-void-deep border border-void-atmosphere rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-bright mb-4">New Work Item</h2>
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-void-atmosphere border border-void-surface rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCreateItem(false)}
                className="flex-1 px-3 py-2 text-sm border border-void-atmosphere rounded-lg text-text-dim hover:text-text-bright transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateItem}
                disabled={!newItemTitle.trim()}
                className="flex-1 px-3 py-2 text-sm bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditingItem(null)}>
          <div className="bg-void-deep border border-void-atmosphere rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-bright mb-4">Edit Work Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-dim mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 bg-void-atmosphere border border-void-surface rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-text-dim mb-1">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full px-3 py-2 bg-void-atmosphere border border-void-surface rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 px-3 py-2 text-sm border border-void-atmosphere rounded-lg text-text-dim hover:text-text-bright transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className="flex-1 px-3 py-2 text-sm bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign/Handoff Item Modal */}
      {assigningItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setAssigningItem(null)}>
          <div className="bg-void-deep border border-void-atmosphere rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-bright mb-2">
              {assigningItem.energyState === "dormant" ? "Assign Work Item" : "Hand Off Work Item"}
            </h2>
            <p className="text-sm text-text-dim mb-4 truncate">"{assigningItem.title}"</p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users
                ?.filter(user => user.id !== currentUser?.id) // Filter out current user
                .map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssignItem(user.id)}
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
                    <div className="text-sm font-medium text-text-bright truncate">{user.name}</div>
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
              
              {users && users.filter(u => u.id !== currentUser?.id).length === 0 && (
                <div className="text-center py-4 text-text-dim text-sm">
                  No other team members to assign to
                </div>
              )}
            </div>
            
            <button
              onClick={() => setAssigningItem(null)}
              className="w-full mt-4 px-3 py-2 text-sm border border-void-atmosphere rounded-lg text-text-dim hover:text-text-bright transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
