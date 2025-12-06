"use client";

import { useState, useEffect } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
  resonanceScore: number;
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // Fetch team members (mock for now - would come from API)
  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setTeamMembers([
        {
          id: "1",
          name: "Alex Chen",
          email: "alex@flowstate.dev",
          role: "Tech Lead",
          starType: "sun",
          orbitalState: "focused",
          energySignatureColor: "#fbbf24",
          resonanceScore: 92,
        },
        {
          id: "2",
          name: "Jordan Park",
          email: "jordan@flowstate.dev",
          role: "Senior Developer",
          starType: "giant",
          orbitalState: "open",
          energySignatureColor: "#f97316",
          resonanceScore: 88,
        },
        {
          id: "3",
          name: "Sam Rivera",
          email: "sam@flowstate.dev",
          role: "Full Stack Developer",
          starType: "main_sequence",
          orbitalState: "deep_work",
          energySignatureColor: "#00d4ff",
          resonanceScore: 85,
        },
        {
          id: "4",
          name: "Casey Kim",
          email: "casey@flowstate.dev",
          role: "Junior Developer",
          starType: "dwarf",
          orbitalState: "open",
          energySignatureColor: "#ff6b9d",
          resonanceScore: 78,
        },
        {
          id: "5",
          name: "Morgan Lee",
          email: "morgan@flowstate.dev",
          role: "DevOps Specialist",
          starType: "neutron",
          orbitalState: "away",
          energySignatureColor: "#8b5cf6",
          resonanceScore: 90,
        },
        {
          id: "6",
          name: "Taylor Swift",
          email: "taylor@flowstate.dev",
          role: "Designer",
          starType: "main_sequence",
          orbitalState: "supernova",
          energySignatureColor: "#ec4899",
          resonanceScore: 95,
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

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

        {/* Team Grid */}
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
                    <p className="text-sm text-text-muted truncate">{member.role}</p>
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
                    className="flex-1 px-3 py-2 text-xs bg-void-atmosphere hover:bg-void-surface rounded-lg text-text-dim hover:text-text-bright transition-colors"
                    disabled={member.orbitalState === "deep_work"}
                    title={member.orbitalState === "deep_work" ? "In deep work mode" : "Send a ping"}
                  >
                    Send Ping
                  </button>
                  <button className="px-3 py-2 text-xs bg-void-atmosphere hover:bg-void-surface rounded-lg text-text-dim hover:text-text-bright transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔭</div>
            <p className="text-text-muted">No team members match this filter</p>
          </div>
        )}

        {/* Team Stats */}
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
                {Math.round(teamMembers.reduce((sum, m) => sum + m.resonanceScore, 0) / teamMembers.length)}%
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
      </div>
    </div>
  );
}
