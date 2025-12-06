import Link from "next/link";

const navItems = [
  { href: "/observatory", label: "Observatory", icon: "🔭" },
  { href: "/streams", label: "Streams", icon: "🌊" },
  { href: "/constellation", label: "Constellation", icon: "✨" },
  { href: "/sanctum", label: "Sanctum", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void-deep">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-void-atmosphere/50 rounded-none">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/observatory" className="flex items-center gap-2">
              <span className="text-2xl">✦</span>
              <span className="text-planet font-display text-text-stellar">
                FlowState
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-moon text-text-dim hover:text-text-bright hover:bg-void-atmosphere/50 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/50 flex items-center justify-center text-accent-primary">
                U
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">{children}</main>
    </div>
  );
}
