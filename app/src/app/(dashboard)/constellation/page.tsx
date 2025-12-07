"use client";

import { useState } from "react";
import { useUsers, useSendPing } from "@/lib/api/hooks";
import { MemberProfileCard } from "@/components/canvas/MemberProfileCard";
import { EnergyInfusionModal } from "@/components/canvas/EnergyInfusionModal";
import type { StarType, OrbitalState } from "@/components/canvas/CelestialBody";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
  resonanceScore: number;
  currentEnergyLevel: number;
  crystalsThisWeek?: number;
  activeStreams?: number;
}

const orbitalStateInfo: Record<string, { label: string; color: string; icon: string }> = {
  open: { label: "Available", color: "#10b981", icon: "🟢" },
  focused: { label: "Focused", color: "#fbbf24", icon: "🟡" },
  deep_work: { label: "Deep Work", color: "#ef4444", icon: "🔴" },
  away: { label: "Away", color: "#6b7280", icon: "⚫" },
  supernova: { label: "Celebrating!", color: "#a78bfa", icon: "✨" },
};

const starTypeInfo: Record<string, { label: string; description: string }> = {
  sun: { label: "Sun", description: "Team Lead" },
  giant: { label: "Giant", description: "Senior" },
  main_sequence: { label: "Main Sequence", description: "Team Member" },
  dwarf: { label: "Dwarf", description: "Junior" },
  neutron: { label: "Neutron", description: "Specialist" },
};

export default function ConstellationPage() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showInfusionModal, setShowInfusionModal] = useState(false);
  const [showPingModal, setShowPingModal] = useState(false);
  const [pingMessage, setPingMessage] = useState("");
  const [pingType, setPingType] = useState<"gentle" | "warm" | "direct">("warm");

  // Fetch team members with real resonance scores
  const { data: users, isLoading, refetch } = useUsers({ pollInterval: 30000 });
  const { sendPing, isLoading: isSendingPing } = useSendPing();

  // Transform users to team members
  const teamMembers: TeamMember[] = (users ?? []).map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    starType: user.starType,
    orbitalState: user.orbitalState,
    energySignatureColor: user.energySignatureColor,
    resonanceScore: user.resonanceScore ?? 0,
    currentEnergyLevel: user.currentEnergyLevel,
    crystalsThisWeek: (user as any).crystalsThisWeek ?? 0,
    activeStreams: (user as any).activeStreams ?? 0,
  }));

  const filteredMembers = teamMembers.filter((member) => {
    if (filter === "all") return true;
    if (filter === "available") return member.orbitalState === "open";
    if (filter === "busy") return member.orbitalState === "focused" || member.orbitalState === "deep_work";
    return member.orbitalState === filter;
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">✨</div>
          <p className="text-text-dim">Loading constellation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-stellar text-text-stellar mb-2">Constellation</h1>
          <p className="text-moon text-text-dim">
            Your team as celestial bodies
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: "all", label: "All" },
            { value: "available", label: "Available" },
            { value: "busy", label: "Busy" },
            { value: "away", label: "Away" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === option.value
                  ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/50"
                  : "bg-void-surface text-text-muted border border-void-atmosphere hover:text-text-bright"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl text-text-bright mb-2">Your constellation is empty</h2>
            <p className="text-text-muted mb-6">
              Invite team members to see them here as celestial bodies
            </p>
          </div>
        )}

        {/* Team Grid */}
        {teamMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const orbital = orbitalStateInfo[member.orbitalState] ?? orbitalStateInfo.open!;
              const star = starTypeInfo[member.starType] ?? starTypeInfo.main_sequence!;

              return (
                <div
                  key={member.id}
                  className="glass-panel p-5 rounded-xl hover:border-accent-primary/30 transition-colors"
                >
                  {/* Header with avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold relative"
                      style={{
                        backgroundColor: `${member.energySignatureColor}20`,
                        color: member.energySignatureColor,
                        boxShadow: `0 0 20px ${member.energySignatureColor}40`,
                      }}
                    >
                      {member.name.charAt(0)}
                      {/* Orbital state indicator */}
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-void-surface"
                        style={{ backgroundColor: orbital.color }}
                        title={orbital.label}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-bright truncate">
                        {member.name}
                      </h3>
                      <p className="text-sm text-text-muted truncate">{member.role || "Team Member"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-dim">{star.label}</span>
                        <span className="text-text-faded">·</span>
                        <span className="text-xs" style={{ color: orbital.color }}>
                          {orbital.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resonance Score */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-muted">Resonance</span>
                      <span className="text-text-bright">{member.resonanceScore}%</span>
                    </div>
                    <div className="h-1.5 bg-void-atmosphere rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${member.resonanceScore}%`,
                          backgroundColor: member.energySignatureColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 text-xs bg-void-atmosphere hover:bg-void-surface rounded-lg text-text-dim hover:text-text-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={member.orbitalState === "deep_work"}
                      title={member.orbitalState === "deep_work" ? "In deep work mode" : "Send a ping"}
                      onClick={() => {
                        setSelectedMember(member);
                        setShowPingModal(true);
                      }}
                    >
                      Send Ping
                    </button>
                    <button
                      className="px-3 py-2 text-xs bg-void-atmosphere hover:bg-void-surface rounded-lg text-text-dim hover:text-text-bright transition-colors"
                      onClick={() => setSelectedMember(member)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredMembers.length === 0 && teamMembers.length > 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔭</div>
            <p className="text-text-muted">No team members match this filter</p>
          </div>
        )}

        {/* Team Stats */}
        {teamMembers.length > 0 && (
          <div className="mt-8 glass-panel p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-text-bright mb-4">Team Pulse</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-accent-primary">
                  {teamMembers.filter((m) => m.orbitalState === "open").length}
                </div>
                <div className="text-sm text-text-muted">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-energy-kindling">
                  {teamMembers.filter((m) => m.orbitalState === "focused" || m.orbitalState === "deep_work").length}
                </div>
                <div className="text-sm text-text-muted">In Flow</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-energy-crystallized">
                  {teamMembers.length > 0
                    ? Math.round(teamMembers.reduce((sum, m) => sum + m.resonanceScore, 0) / teamMembers.length)
                    : 0}%
                </div>
                <div className="text-sm text-text-muted">Avg Resonance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-secondary">
                  {teamMembers.filter((m) => m.orbitalState === "supernova").length}
                </div>
                <div className="text-sm text-text-muted">Celebrating</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Profile Card Modal */}
      {selectedMember && (
        <MemberProfileCard
            member={{
              id: selectedMember.id,
              name: selectedMember.name,
              email: selectedMember.email,
              role: selectedMember.role || "Team Member",
              starType: selectedMember.starType as StarType,
              orbitalState: selectedMember.orbitalState as OrbitalState,
              energyLevel: selectedMember.currentEnergyLevel,
              energySignatureColor: selectedMember.energySignatureColor,
              stats: {
                crystalsThisWeek: selectedMember.crystalsThisWeek ?? 0,
                activeStreams: selectedMember.activeStreams ?? 0,
                resonanceScore: selectedMember.resonanceScore,
              },
            }}
          onClose={() => setSelectedMember(null)}
          onPing={() => {
            setShowPingModal(true);
          }}
          onInfuseEnergy={() => setShowInfusionModal(true)}
        />
      )}

      {/* Send Ping Modal */}
      {showPingModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPingModal(false)}>
          <div className="absolute inset-0 bg-void-deep/80 backdrop-blur-sm" />
          <div className="relative glass-panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-text-bright mb-4">
              Send Ping to {selectedMember.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Ping Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['gentle', 'warm', 'direct'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPingType(type)}
                      className={`px-3 py-2 text-sm rounded-lg capitalize transition-colors ${
                        pingType === type
                          ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/50'
                          : 'bg-void-surface text-text-muted border border-void-atmosphere hover:text-text-bright'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-dim mt-2">
                  {pingType === 'gentle' && 'Respects all orbital states • 72h expiry'}
                  {pingType === 'warm' && 'Delivers when open • 24h expiry'}
                  {pingType === 'direct' && 'Always immediate • 4h expiry'}
                </p>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Message (optional)</label>
                <textarea
                  value={pingMessage}
                  onChange={(e) => setPingMessage(e.target.value)}
                  placeholder="Quick check-in about..."
                  rows={3}
                  className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPingModal(false)}
                className="flex-1 px-4 py-2 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await sendPing({
                      toUserId: selectedMember.id,
                      type: pingType,
                      message: pingMessage || undefined,
                    });
                    setShowPingModal(false);
                    setPingMessage("");
                    setSelectedMember(null);
                    alert(`Ping sent to ${selectedMember.name}!`);
                    refetch();
                  } catch (error) {
                    alert('Failed to send ping');
                  }
                }}
                disabled={isSendingPing}
                className="flex-1 px-4 py-2 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                {isSendingPing ? "Sending..." : "Send Ping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Energy Infusion Modal */}
      {showInfusionModal && selectedMember && (
        <EnergyInfusionModal
          targetMember={{
            id: selectedMember.id,
            name: selectedMember.name,
            energySignatureColor: selectedMember.energySignatureColor,
          }}
          onClose={() => setShowInfusionModal(false)}
          onInfused={(workItem) => {
            console.log("Infused work item:", workItem.title, "to", selectedMember.name);
            setShowInfusionModal(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}
