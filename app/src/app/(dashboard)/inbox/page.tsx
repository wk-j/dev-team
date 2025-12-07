"use client";

import { useState } from "react";
import { usePings, useMarkPingAsRead } from "@/lib/api/hooks";

export default function InboxPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: pingsData, isLoading, refetch } = usePings({ direction: "received" }, { pollInterval: 10000 });
  const { markAsRead } = useMarkPingAsRead();

  const pings = pingsData?.pings || [];
  const unreadCount = pingsData?.unreadCount || 0;

  const filteredPings = filter === "unread" 
    ? pings.filter(p => p.status !== "read")
    : pings;

  const handleMarkAsRead = async (pingId: string) => {
    try {
      await markAsRead(pingId);
      refetch();
    } catch (error) {
      console.error("Failed to mark ping as read:", error);
    }
  };

  const getPingTypeColor = (type: string) => {
    switch (type) {
      case "direct": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warm": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "gentle": return "bg-green-500/20 text-green-400 border-green-500/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getPingTypeIcon = (type: string) => {
    switch (type) {
      case "direct": return "🔴";
      case "warm": return "🟡";
      case "gentle": return "🟢";
      default: return "●";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">📨</div>
          <p className="text-text-dim">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-stellar mb-2">
              Ping Inbox
            </h1>
            <p className="text-sm text-text-muted">
              Messages from your teammates
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="glass-button-pill px-4 py-1.5 text-accent-primary border-accent-primary/40 text-sm">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`glass-button-pill px-4 py-2 text-sm transition-all ${
              filter === "all"
                ? "glass-button-active text-accent-primary"
                : "text-text-muted hover:text-text-bright"
            }`}
          >
            All ({pings.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`glass-button-pill px-4 py-2 text-sm transition-all ${
              filter === "unread"
                ? "glass-button-active text-accent-primary"
                : "text-text-muted hover:text-text-bright"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Pings List */}
        {filteredPings.length > 0 ? (
          <div className="space-y-3">
            {filteredPings.map((ping) => (
              <div
                key={ping.id}
                className={`glass-panel-float p-5 transition-all ${
                  ping.status === "read" 
                    ? "opacity-60" 
                    : "border-accent-primary/30 hover:shadow-[0_0_25px_rgba(0,212,255,0.1)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{
                      backgroundColor: `${ping.fromUser.energySignatureColor}20`,
                      border: `2px solid ${ping.fromUser.energySignatureColor}`,
                    }}
                  >
                    {ping.fromUser.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-text-bright">
                        {ping.fromUser.name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded border ${getPingTypeColor(ping.type)}`}>
                        {getPingTypeIcon(ping.type)} {ping.type}
                      </span>
                      {ping.status !== "read" && (
                        <span className="w-2 h-2 bg-accent-primary rounded-full"></span>
                      )}
                    </div>

                    {/* Message */}
                    {ping.message && (
                      <p className="text-text-muted mb-3">{ping.message}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-text-dim">
                      <span>
                        Sent {new Date(ping.sentAt).toLocaleString()}
                      </span>
                      {ping.deliveredAt && (
                        <span>
                          • Delivered {new Date(ping.deliveredAt).toLocaleString()}
                        </span>
                      )}
                      {ping.status === "read" && ping.readAt && (
                        <span>
                          • Read {new Date(ping.readAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {ping.status !== "read" && (
                      <button
                        onClick={() => handleMarkAsRead(ping.id)}
                        className="mt-3 px-3 py-1 text-xs bg-void-atmosphere hover:bg-void-surface rounded text-text-dim hover:text-text-bright transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              {filter === "unread" ? "✅" : "📭"}
            </div>
            <h2 className="text-xl text-text-bright mb-2">
              {filter === "unread" ? "All caught up!" : "No pings yet"}
            </h2>
            <p className="text-text-muted">
              {filter === "unread" 
                ? "You've read all your messages"
                : "When teammates send you pings, they'll appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
