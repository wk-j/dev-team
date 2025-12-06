"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Three.js
const VoidCanvas = dynamic(
  () => import("@/components/canvas").then((mod) => mod.VoidCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-void-deep">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">✨</div>
          <p className="text-moon text-text-dim">Entering the void...</p>
        </div>
      </div>
    ),
  }
);

export default function ObservatoryPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-stellar text-text-stellar mb-2">Observatory</h1>
          <p className="text-moon text-text-dim">
            Your window into the team&apos;s energy and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-6">
            <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
              Team Pulse
            </div>
            <div className="text-stellar text-accent-primary">72 BPM</div>
            <div className="text-moon text-text-dim">Steady rhythm</div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
              Active Streams
            </div>
            <div className="text-stellar text-energy-blazing">5</div>
            <div className="text-moon text-text-dim">2 rushing</div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
              Crystals Today
            </div>
            <div className="text-stellar text-energy-crystallized">12</div>
            <div className="text-moon text-text-dim">+3 from yesterday</div>
          </div>

          <div className="glass-panel p-6">
            <div className="text-dust text-text-muted uppercase tracking-wider mb-1">
              Team Online
            </div>
            <div className="text-stellar text-accent-success">8/12</div>
            <div className="text-moon text-text-dim">3 in deep work</div>
          </div>
        </div>

        {/* 3D Void Canvas */}
        <div className="glass-panel overflow-hidden rounded-xl" style={{ height: "500px" }}>
          <VoidCanvas className="w-full h-full" />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-dust text-text-muted">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#fbbf24]" /> Team Lead
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f97316]" /> Senior
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00d4ff]" /> Developer
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff6b9d]" /> Junior
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" /> Specialist
          </span>
        </div>
      </div>
    </div>
  );
}
