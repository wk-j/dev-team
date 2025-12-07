"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-void-deep">
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-void-atmosphere/50 rounded-none"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link 
              href="/observatory" 
              className="flex items-center gap-2"
              aria-label="FlowState - Go to Observatory"
            >
              <span className="text-xl md:text-2xl" aria-hidden="true">✦</span>
              <span className="text-sm md:text-planet font-display text-text-stellar">
                FlowState
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1" role="menubar">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-moon text-text-dim hover:text-text-bright hover:bg-void-atmosphere/50 transition-colors"
                  role="menuitem"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-text-dim hover:text-text-bright hover:bg-void-atmosphere/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/sanctum"
                className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/50 flex items-center justify-center text-accent-primary hover:bg-accent-primary/30 transition-colors"
                aria-label="User settings"
              >
                <span aria-hidden="true">U</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text-bright hover:bg-void-atmosphere/50 rounded-lg transition-colors"
                aria-label="Sign out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden border-t border-void-atmosphere/50 bg-void-deep/95 backdrop-blur-md"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-moon text-text-dim hover:text-text-bright hover:bg-void-atmosphere/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t border-void-atmosphere/50 pt-3 mt-3 space-y-1">
                <Link
                  href="/sanctum"
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-moon text-text-dim hover:text-text-bright hover:bg-void-atmosphere/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-6 h-6 rounded-full bg-accent-primary/20 border border-accent-primary/50 flex items-center justify-center text-accent-primary text-xs">
                    U
                  </span>
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-moon text-accent-warning hover:bg-void-atmosphere/50 transition-colors w-full"
                >
                  <span aria-hidden="true">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main id="main" className="pt-14 md:pt-16" role="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
