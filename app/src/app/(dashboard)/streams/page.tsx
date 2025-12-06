"use client";

import { useState } from "react";
import { useStreams, useWorkItems, useCreateStream } from "@/lib/api/hooks";
import Link from "next/link";

const streamStateColors: Record<string, { bg: string; text: string }> = {
  nascent: { bg: "bg-gray-500/20", text: "text-gray-400" },
  flowing: { bg: "bg-green-500/20", text: "text-green-400" },
  rushing: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  flooding: { bg: "bg-red-500/20", text: "text-red-400" },
  stagnant: { bg: "bg-orange-500/20", text: "text-orange-400" },
  evaporated: { bg: "bg-gray-700/20", text: "text-gray-500" },
};

export default function StreamsPage() {
  const { data: streams, isLoading, refetch } = useStreams({ pollInterval: 30000 });
  const { data: workItems } = useWorkItems();
  const { createStream, isLoading: isCreating } = useCreateStream();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStreamName, setNewStreamName] = useState("");
  const [newStreamDescription, setNewStreamDescription] = useState("");

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamName.trim()) return;
    
    try {
      await createStream({
        name: newStreamName,
        description: newStreamDescription || undefined,
      });
      setNewStreamName("");
      setNewStreamDescription("");
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error("Failed to create stream:", error);
    }
  };

  // Group work items by stream
  const workItemsByStream = workItems?.reduce((acc, item) => {
    if (!acc[item.streamId]) acc[item.streamId] = [];
    acc[item.streamId]!.push(item);
    return acc;
  }, {} as Record<string, typeof workItems>) ?? {};

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🌊</div>
          <p className="text-text-dim">Loading streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-stellar text-text-stellar mb-2">Streams</h1>
            <p className="text-moon text-text-dim">
              Energy flows where work happens
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-accent-primary/20 text-accent-primary border border-accent-primary/50 rounded-lg hover:bg-accent-primary/30 transition-colors"
          >
            + New Stream
          </button>
        </div>

        {/* Streams Grid */}
        {streams && streams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map((stream) => {
              const stateStyle = streamStateColors[stream.state] ?? streamStateColors.nascent!;
              const items = workItemsByStream[stream.id] ?? [];
              const activeItems = items.filter(
                (i) => i.energyState === "kindling" || i.energyState === "blazing"
              ).length;

              return (
                <Link
                  key={stream.id}
                  href={`/observatory?stream=${stream.id}`}
                  className="glass-panel p-5 rounded-xl hover:border-accent-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-bright group-hover:text-accent-primary transition-colors">
                      {stream.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${stateStyle.bg} ${stateStyle.text}`}
                    >
                      {stream.state}
                    </span>
                  </div>

                  {stream.description && (
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">
                      {stream.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-text-dim">
                    <span className="flex items-center gap-1">
                      <span className="text-energy-kindling">●</span>
                      {activeItems} active
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-energy-crystallized">●</span>
                      {stream.crystalCount} crystals
                    </span>
                  </div>

                  {/* Divers */}
                  {stream.divers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-void-atmosphere">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Diving:</span>
                        <div className="flex -space-x-2">
                          {stream.divers.slice(0, 3).map((diver) => (
                            <div
                              key={diver.id}
                              className="w-6 h-6 rounded-full bg-accent-primary/20 border border-void-atmosphere flex items-center justify-center text-xs"
                              title={diver.name}
                            >
                              {diver.name.charAt(0)}
                            </div>
                          ))}
                          {stream.divers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-void-atmosphere flex items-center justify-center text-xs text-text-muted">
                              +{stream.divers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌊</div>
            <h2 className="text-xl text-text-bright mb-2">No streams yet</h2>
            <p className="text-text-muted mb-6">
              Create your first stream to start tracking work
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Create First Stream
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-semibold text-text-bright mb-4">
                Create New Stream
              </h2>
              <form onSubmit={handleCreateStream}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">
                      Stream Name
                    </label>
                    <input
                      type="text"
                      value={newStreamName}
                      onChange={(e) => setNewStreamName(e.target.value)}
                      placeholder="e.g., Feature Development"
                      className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={newStreamDescription}
                      onChange={(e) => setNewStreamDescription(e.target.value)}
                      placeholder="What kind of work flows through this stream?"
                      rows={3}
                      className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newStreamName.trim() || isCreating}
                    className="flex-1 px-4 py-2 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Creating..." : "Create Stream"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
