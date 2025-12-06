import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void-deep">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✦</span>
            <span className="text-planet font-display text-text-stellar">
              FlowState
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-moon text-text-dim hover:text-text-bright transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-accent-primary text-void-deep font-semibold rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-cosmic text-text-stellar mb-6">
            Work is not a checklist.
            <br />
            <span className="text-accent-primary">
              It&apos;s a living system.
            </span>
          </h1>
          <p className="text-planet text-text-dim mb-8 max-w-2xl mx-auto">
            Transform task management into an organic flow of energy. FlowState
            brings your team together in a cosmic workspace where work flows
            naturally.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-accent-primary text-void-deep font-semibold text-planet rounded-lg hover:bg-accent-primary/90 glow-primary transition-all"
          >
            Enter the Void
          </Link>
        </div>
      </section>

      {/* Concept Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-stellar text-text-stellar text-center mb-16">
            A New Way to Work
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-panel p-8">
              <h3 className="text-nebula text-text-muted mb-6">Traditional</h3>
              <ul className="space-y-3 text-moon text-text-dim">
                <li>Tasks</li>
                <li>Kanban boards</li>
                <li>Team lists</li>
                <li>Notifications</li>
                <li>Done checkbox</li>
              </ul>
            </div>

            <div className="glass-panel p-8 border-accent-primary/30">
              <h3 className="text-nebula text-accent-primary mb-6">
                FlowState
              </h3>
              <ul className="space-y-3 text-moon text-text-bright">
                <li>Energy entities</li>
                <li>Flowing streams</li>
                <li>Constellations</li>
                <li>Resonance pings</li>
                <li>Crystallization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-void-nebula/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-stellar text-text-stellar text-center mb-16">
            Experience the Void
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔭",
                title: "Observatory",
                desc: "See your team's pulse at a glance",
              },
              {
                icon: "🌊",
                title: "Streams",
                desc: "Work flows naturally through energy",
              },
              {
                icon: "✨",
                title: "Crystals",
                desc: "Completed work becomes permanent",
              },
              {
                icon: "🌟",
                title: "Constellation",
                desc: "Your team as connected stars",
              },
              {
                icon: "🔔",
                title: "Resonance",
                desc: "Thoughtful pings, not interrupts",
              },
              {
                icon: "🛡️",
                title: "Deep Work",
                desc: "Protected focus time by design",
              },
            ].map((feature) => (
              <div key={feature.title} className="glass-panel p-6 text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-planet text-text-bright mb-2">
                  {feature.title}
                </h3>
                <p className="text-moon text-text-dim">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-stellar text-text-stellar mb-6">
            Ready to transform how your team works?
          </h2>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-accent-primary text-void-deep font-semibold text-planet rounded-lg hover:bg-accent-primary/90 glow-primary transition-all"
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-moon text-text-muted">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-void-atmosphere">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <span className="text-moon font-display text-text-dim">
              FlowState
            </span>
          </div>
          <p className="text-dust text-text-muted">
            © 2024 FlowState. The void awaits your energy.
          </p>
        </div>
      </footer>
    </div>
  );
}
