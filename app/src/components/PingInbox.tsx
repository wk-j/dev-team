"use client";

import { useState, useCallback } from "react";
import { usePings, useSendPing, useMarkPingAsRead } from "@/lib/api/hooks";
import type { Ping, PingType } from "@/lib/api/client";

interface PingInboxProps {
  /** Current user's position for animations */
  userPosition?: [number, number, number];
  /** Callback when a ping is sent (for animation) */
  onPingSent?: (ping: Ping, toPosition: [number, number, number]) => void;
  /** Team members for sending pings */
  teamMembers?: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    position: [number, number, number];
    orbitalState: string;
  }>;
}

const pingTypeInfo: Record<PingType, {
  label: string;
  icon: string;
  description: string;
  color: string;
}> = {
  gentle: {
    label: "Gentle",
    icon: "🌿",
    description: "A soft nudge, delivered when convenient",
    color: "#4ade80",
  },
  warm: {
    label: "Warm",
    icon: "🔆",
    description: "A friendly signal, respects focus time",
    color: "#fbbf24",
  },
  direct: {
    label: "Direct",
    icon: "⚡",
    description: "Urgent, breaks through deep work",
    color: "#ef4444",
  },
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function PingItem({
  ping,
  onMarkRead,
}: {
  ping: Ping;
  onMarkRead: (id: string) => void;
}) {
  const typeInfo = pingTypeInfo[ping.type];
  const isUnread = ping.status === "sent" || ping.status === "delivered";

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isUnread
          ? "bg-void-surface border-void-atmosphere"
          : "bg-void-deep/50 border-transparent"
      }`}
      onClick={() => isUnread && onMarkRead(ping.id)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: `${ping.fromUser.energySignatureColor}20` }}
        >
          {ping.fromUser.avatarUrl ? (
            <img
              src={ping.fromUser.avatarUrl}
              alt={ping.fromUser.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{ping.fromUser.name.charAt(0)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-bright truncate">
              {ping.fromUser.name}
            </span>
            <span
              className="px-1.5 py-0.5 text-xs rounded"
              style={{
                backgroundColor: `${typeInfo.color}20`,
                color: typeInfo.color,
              }}
            >
              {typeInfo.icon} {typeInfo.label}
            </span>
          </div>

          {ping.message && (
            <p className="text-sm text-text-muted mt-1 line-clamp-2">
              {ping.message}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs text-text-dim">
            <span>{formatTimeAgo(ping.sentAt)}</span>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SendPingModal({
  isOpen,
  onClose,
  teamMembers,
  onSend,
  isSending,
}: {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: PingInboxProps["teamMembers"];
  onSend: (toUserId: string, type: PingType, message?: string) => void;
  isSending: boolean;
}) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PingType>("warm");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSend = () => {
    if (!selectedMember) return;
    onSend(selectedMember, selectedType, message || undefined);
    setMessage("");
    setSelectedMember(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/80 backdrop-blur-sm">
      <div className="bg-void-surface border border-void-atmosphere rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-bright">Send Ping</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-bright transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Select team member */}
        <div className="mb-4">
          <label className="block text-sm text-text-muted mb-2">To</label>
          <div className="grid grid-cols-3 gap-2">
            {teamMembers?.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`p-2 rounded-lg border transition-colors text-center ${
                  selectedMember === member.id
                    ? "border-accent-primary bg-accent-primary/10"
                    : "border-void-atmosphere hover:border-void-atmosphere/80"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-void-atmosphere mx-auto mb-1 flex items-center justify-center text-sm">
                  {member.name.charAt(0)}
                </div>
                <div className="text-xs text-text-muted truncate">
                  {member.name.split(" ")[0]}
                </div>
                {member.orbitalState === "deep_work" && (
                  <div className="text-xs text-accent-warning">🔒</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Select ping type */}
        <div className="mb-4">
          <label className="block text-sm text-text-muted mb-2">Type</label>
          <div className="flex gap-2">
            {(Object.keys(pingTypeInfo) as PingType[]).map((type) => {
              const info = pingTypeInfo[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    selectedType === type
                      ? "border-accent-primary bg-accent-primary/10"
                      : "border-void-atmosphere hover:border-void-atmosphere/80"
                  }`}
                >
                  <div className="text-xl mb-1">{info.icon}</div>
                  <div className="text-sm font-medium text-text-bright">
                    {info.label}
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    {info.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm text-text-muted mb-2">
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright placeholder-text-dim resize-none focus:outline-none focus:border-accent-primary"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-text-muted border border-void-atmosphere rounded-lg hover:bg-void-atmosphere transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedMember || isSending}
            className="flex-1 px-4 py-2 bg-accent-primary text-void-deep font-medium rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? "Sending..." : "Send Ping"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PingInbox({
  userPosition,
  onPingSent,
  teamMembers,
}: PingInboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: inbox, refetch } = usePings(
    { direction: "received" },
    { pollInterval: 10000 }
  );
  const { sendPing, isLoading: isSending } = useSendPing();
  const { markAsRead } = useMarkPingAsRead();

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markAsRead(id);
      refetch();
    },
    [markAsRead, refetch]
  );

  const handleSendPing = useCallback(
    async (toUserId: string, type: PingType, message?: string) => {
      try {
        const ping = await sendPing({ toUserId, type, message });
        
        // Find member position for animation
        const member = teamMembers?.find((m) => m.id === toUserId);
        if (member && userPosition && onPingSent) {
          onPingSent(ping, member.position);
        }
        
        setShowSendModal(false);
      } catch (error) {
        console.error("Failed to send ping:", error);
      }
    },
    [sendPing, teamMembers, userPosition, onPingSent]
  );

  const filteredPings = inbox?.pings.filter((ping) => {
    if (filter === "unread") {
      return ping.status === "sent" || ping.status === "delivered";
    }
    return true;
  });

  const unreadCount = inbox?.unreadCount ?? 0;

  return (
    <>
      {/* Inbox button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-void-deep/80 backdrop-blur-sm border border-void-atmosphere hover:border-accent-primary/50 transition-colors"
      >
        <svg
          className="w-5 h-5 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-void-deep text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Inbox panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-void-deep/95 backdrop-blur-md border border-void-atmosphere rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-void-atmosphere">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-bright">Resonance</h3>
              <button
                onClick={() => setShowSendModal(true)}
                className="px-3 py-1 text-sm bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors"
              >
                + Ping
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-void-atmosphere text-text-bright"
                    : "text-text-muted hover:text-text-bright"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === "unread"
                    ? "bg-void-atmosphere text-text-bright"
                    : "text-text-muted hover:text-text-bright"
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
          </div>

          {/* Pings list */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-2">
            {filteredPings && filteredPings.length > 0 ? (
              filteredPings.map((ping) => (
                <PingItem
                  key={ping.id}
                  ping={ping}
                  onMarkRead={handleMarkRead}
                />
              ))
            ) : (
              <div className="py-8 text-center text-text-dim">
                <div className="text-3xl mb-2">✨</div>
                <p>No pings yet</p>
                <p className="text-xs mt-1">Send a ping to connect!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send modal */}
      <SendPingModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        teamMembers={teamMembers}
        onSend={handleSendPing}
        isSending={isSending}
      />
    </>
  );
}
