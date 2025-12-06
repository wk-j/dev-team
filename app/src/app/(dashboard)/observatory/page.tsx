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

        {/* Placeholder for 3D Canvas */}
        <div className="glass-panel p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌌</div>
            <h2 className="text-nebula text-text-bright mb-2">
              Void Canvas Coming Soon
            </h2>
            <p className="text-moon text-text-dim max-w-md">
              The 3D visualization of your team constellation will appear here.
              React Three Fiber integration in progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
