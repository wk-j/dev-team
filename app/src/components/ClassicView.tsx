"use client";

import { useMemo } from "react";
import type { Stream, WorkItem } from "@/lib/api/client";

interface ClassicViewProps {
  streams?: Stream[];
  workItems?: WorkItem[];
  teamMembers?: Array<{
    id: string;
    name: string;
    role: string | null;
    orbitalState: string;
    energySignatureColor: string;
  }>;
  onStreamClick?: (streamId: string) => void;
  onWorkItemClick?: (itemId: string) => void;
}

const energyStateColors: Record<string, string> = {
  dormant: "#6b7280",
  kindling: "#f97316",
  blazing: "#fbbf24",
  cooling: "#a78bfa",
  crystallized: "#06b6d4",
};

const streamStateColors: Record<string, string> = {
  nascent: "#6b7280",
  flowing: "#10b981",
  rushing: "#fbbf24",
  flooding: "#ef4444",
  stagnant: "#f97316",
  evaporated: "#374151",
};

const orbitalStateLabels: Record<string, { label: string; color: string }> = {
  open: { label: "Available", color: "#10b981" },
  focused: { label: "Focused", color: "#fbbf24" },
  deep_work: { label: "Deep Work", color: "#ef4444" },
  away: { label: "Away", color: "#6b7280" },
  supernova: { label: "Celebrating!", color: "#a78bfa" },
};

/**
 * Classic 2D View - Accessible fallback for the 3D canvas
 */
export function ClassicView({
  streams = [],
  workItems = [],
  teamMembers = [],
  onStreamClick,
  onWorkItemClick,
}: ClassicViewProps) {
  // Group work items by stream
  const workItemsByStream = useMemo(() => {
    const grouped: Record<string, typeof workItems> = {};
    workItems.forEach((item) => {
      if (!grouped[item.streamId]) {
        grouped[item.streamId] = [];
      }
      grouped[item.streamId]!.push(item);
    });
    return grouped;
  }, [workItems]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeItems = workItems.filter(
      (item) => item.energyState === "kindling" || item.energyState === "blazing"
    ).length;
    const completedItems = workItems.filter(
      (item) => item.energyState === "crystallized"
    ).length;
    const activeStreams = streams.filter(
      (s) => s.state !== "evaporated" && s.state !== "stagnant"
    ).length;
    const activeMembers = teamMembers.filter(
      (m) => m.orbitalState !== "away"
    ).length;

    return { activeItems, completedItems, activeStreams, activeMembers };
  }, [workItems, streams, teamMembers]);

  return (
    <div className="classic-fallback hidden p-6 bg-void-deep min-h-full">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Streams"
          value={stats.activeStreams}
          total={streams.length}
          color="#00d4ff"
        />
        <StatCard
          label="Work In Progress"
          value={stats.activeItems}
          total={workItems.length}
          color="#fbbf24"
        />
        <StatCard
          label="Completed"
          value={stats.completedItems}
          color="#06b6d4"
        />
        <StatCard
          label="Team Active"
          value={stats.activeMembers}
          total={teamMembers.length}
          color="#10b981"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streams & Work Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-bright mb-4">
            Streams
          </h2>

          {streams.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No streams yet
            </div>
          ) : (
            streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                workItems={workItemsByStream[stream.id] || []}
                onClick={() => onStreamClick?.(stream.id)}
                onWorkItemClick={onWorkItemClick}
              />
            ))
          )}
        </div>

        {/* Team Members */}
        <div>
          <h2 className="text-lg font-semibold text-text-bright mb-4">
            Team ({teamMembers.length})
          </h2>

          <div className="space-y-2">
            {teamMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total?: number;
  color: string;
}) {
  return (
    <div className="bg-void-surface border border-void-atmosphere rounded-lg p-4">
      <div className="text-sm text-text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
        {total !== undefined && (
          <span className="text-sm text-text-muted font-normal">/{total}</span>
        )}
      </div>
    </div>
  );
}

function StreamCard({
  stream,
  workItems,
  onClick,
  onWorkItemClick,
}: {
  stream: Stream;
  workItems: WorkItem[];
  onClick: () => void;
  onWorkItemClick?: (id: string) => void;
}) {
  const stateColor = streamStateColors[stream.state] || "#6b7280";

  return (
    <div className="bg-void-surface border border-void-atmosphere rounded-lg overflow-hidden">
      {/* Stream Header */}
      <button
        onClick={onClick}
        className="w-full p-4 text-left hover:bg-void-atmosphere/50 transition-colors flex items-center justify-between"
        aria-expanded="true"
      >
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stateColor }}
            aria-hidden="true"
          />
          <div>
            <h3 className="font-medium text-text-bright">{stream.name}</h3>
            <p className="text-sm text-text-muted capitalize">
              {stream.state} · {stream.itemCount} items
            </p>
          </div>
        </div>
        <div className="text-sm text-text-muted">
          {stream.crystalCount} completed
        </div>
      </button>

      {/* Work Items */}
      {workItems.length > 0 && (
        <div className="border-t border-void-atmosphere p-2 space-y-1">
          {workItems.map((item) => (
            <WorkItemRow
              key={item.id}
              item={item}
              onClick={() => onWorkItemClick?.(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkItemRow({
  item,
  onClick,
}: {
  item: WorkItem;
  onClick: () => void;
}) {
  const stateColor = energyStateColors[item.energyState] || "#6b7280";

  return (
    <button
      onClick={onClick}
      className="w-full p-2 rounded-md hover:bg-void-atmosphere/30 transition-colors flex items-center gap-3 text-left"
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: stateColor }}
        aria-hidden="true"
      />
      <span className="text-sm text-text-bright truncate flex-1">
        {item.title}
      </span>
      <span className="text-xs text-text-muted capitalize">
        {item.energyState}
      </span>
    </button>
  );
}

function MemberCard({
  member,
}: {
  member: {
    id: string;
    name: string;
    role: string | null;
    orbitalState: string;
    energySignatureColor: string;
  };
}) {
  const stateInfo = orbitalStateLabels[member.orbitalState] || {
    label: member.orbitalState,
    color: "#6b7280",
  };

  return (
    <div className="bg-void-surface border border-void-atmosphere rounded-lg p-3 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
        style={{
          backgroundColor: `${member.energySignatureColor}20`,
          color: member.energySignatureColor,
        }}
        aria-hidden="true"
      >
        {member.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-bright truncate">{member.name}</div>
        {member.role && (
          <div className="text-xs text-text-muted truncate">{member.role}</div>
        )}
      </div>
      <span
        className="px-2 py-1 text-xs rounded-full"
        style={{
          backgroundColor: `${stateInfo.color}20`,
          color: stateInfo.color,
        }}
      >
        {stateInfo.label}
      </span>
    </div>
  );
}
