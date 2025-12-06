"use client";

import { useState } from "react";
import type { StarType, OrbitalState } from "./CelestialBody";

interface MemberProfileCardProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    starType: StarType;
    orbitalState: OrbitalState;
    energyLevel: number;
    energySignatureColor: string;
    stats?: {
      crystalsThisWeek: number;
      activeStreams: number;
      resonanceScore: number;
    };
  };
  onClose: () => void;
  onPing?: () => void;
  onViewProfile?: () => void;
}

export function MemberProfileCard({ member, onClose, onPing, onViewProfile }: MemberProfileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const starTypeLabels: Record<StarType, string> = {
    sun: "☀️ Sun (Team Lead)",
    giant: "🌟 Giant (Senior)",
    main_sequence: "⭐ Main Sequence",
    dwarf: "✨ Dwarf (Junior)",
    neutron: "💫 Neutron (Specialist)",
  };

  const orbitalStateLabels: Record<OrbitalState, { label: string; color: string }> = {
    open: { label: "Open", color: "#10b981" },
    focused: { label: "Focused", color: "#00d4ff" },
    deep_work: { label: "Deep Work", color: "#8b5cf6" },
    away: { label: "Away", color: "#64748b" },
    supernova: { label: "Supernova!", color: "#fbbf24" },
  };

  const orbital = orbitalStateLabels[member.orbitalState];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void-deep/80 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative glass-panel p-6 w-full max-w-md animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-text-muted hover:text-text-bright transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: `radial-gradient(circle, ${member.energySignatureColor}40, ${member.energySignatureColor}10)`,
              border: `2px solid ${member.energySignatureColor}`,
              boxShadow: isHovered ? `0 0 20px ${member.energySignatureColor}40` : "none",
            }}
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              member.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name & Role */}
          <div className="flex-1">
            <h2 className="text-nebula text-text-stellar">{member.name}</h2>
            <p className="text-moon text-text-dim">{member.role}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: orbital.color }}
              />
              <span className="text-dust" style={{ color: orbital.color }}>
                {orbital.label}
              </span>
            </div>
          </div>
        </div>

        {/* Star Type */}
        <div className="mb-4 p-3 bg-void-surface/50 rounded-lg">
          <span className="text-moon text-text-bright">
            {starTypeLabels[member.starType]}
          </span>
        </div>

        {/* Energy Level */}
        <div className="mb-4">
          <div className="flex justify-between text-dust mb-1">
            <span className="text-text-muted">Energy Level</span>
            <span className="text-text-bright">{member.energyLevel}%</span>
          </div>
          <div className="h-2 bg-void-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${member.energyLevel}%`,
                background: `linear-gradient(90deg, ${member.energySignatureColor}, ${member.energySignatureColor}80)`,
              }}
            />
          </div>
        </div>

        {/* Stats */}
        {member.stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 bg-void-surface/50 rounded-lg">
              <div className="text-stellar text-energy-crystallized">
                {member.stats.crystalsThisWeek}
              </div>
              <div className="text-dust text-text-muted">Crystals</div>
            </div>
            <div className="text-center p-3 bg-void-surface/50 rounded-lg">
              <div className="text-stellar text-accent-primary">
                {member.stats.activeStreams}
              </div>
              <div className="text-dust text-text-muted">Streams</div>
            </div>
            <div className="text-center p-3 bg-void-surface/50 rounded-lg">
              <div className="text-stellar text-accent-secondary">
                {member.stats.resonanceScore}
              </div>
              <div className="text-dust text-text-muted">Resonance</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-2 px-4 bg-accent-primary/20 border border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-colors"
            onClick={onPing}
          >
            📡 Send Ping
          </button>
          <button
            className="flex-1 py-2 px-4 bg-void-surface border border-void-atmosphere text-text-bright rounded-lg hover:bg-void-atmosphere transition-colors"
            onClick={onViewProfile}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// Simpler inline card that appears next to celestial body
interface InlineProfileCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    orbitalState: OrbitalState;
    energySignatureColor: string;
  };
  onClose: () => void;
}

export function InlineProfileCard({ member, onClose }: InlineProfileCardProps) {
  const orbital = {
    open: { label: "Open", color: "#10b981" },
    focused: { label: "Focused", color: "#00d4ff" },
    deep_work: { label: "Deep Work", color: "#8b5cf6" },
    away: { label: "Away", color: "#64748b" },
    supernova: { label: "Supernova!", color: "#fbbf24" },
  }[member.orbitalState];

  return (
    <div
      className="glass-panel p-4 min-w-[200px] pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{
            background: `radial-gradient(circle, ${member.energySignatureColor}40, transparent)`,
            border: `2px solid ${member.energySignatureColor}`,
          }}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-moon text-text-bright font-medium">{member.name}</div>
          <div className="text-dust text-text-muted">{member.role}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: orbital.color }}
        />
        <span className="text-dust" style={{ color: orbital.color }}>
          {orbital.label}
        </span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-1.5 px-3 text-dust bg-accent-primary/20 text-accent-primary rounded hover:bg-accent-primary/30 transition-colors">
          Ping
        </button>
        <button
          className="py-1.5 px-3 text-dust bg-void-surface text-text-muted rounded hover:bg-void-atmosphere transition-colors"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
