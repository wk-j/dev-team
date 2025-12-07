"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/observatory", label: "Observatory", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { href: "/constellation", label: "Constellation", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )},
  { href: "/streams", label: "Streams", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )},
  { href: "/inbox", label: "Inbox", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0a2.25 2.25 0 00-2.25 2.25v6a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25m-17.5 0V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v7.5" />
    </svg>
  )},
  { href: "/team", label: "Team", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )},
  { href: "/sanctum", label: "Sanctum", icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
];

interface UserInfo {
  name?: string | null;
  email?: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const pathname = usePathname();
  
  // Fetch user info on mount
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);
  
  const isActive = (href: string) => {
    if (href === "/observatory") {
      return pathname === "/observatory" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  
  return (
    <div className="min-h-screen bg-void-deep">
      {/* Navigation */}
      <nav 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Desktop Navigation - Floating Pill */}
        <div className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full bg-void-nebula/80 backdrop-blur-xl border border-void-atmosphere/60 shadow-[0_0_30px_rgba(0,212,255,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-moon transition-all duration-300
                  ${active 
                    ? "bg-void-atmosphere/80 text-text-stellar shadow-[0_0_15px_rgba(0,212,255,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]" 
                    : "text-text-dim hover:text-text-bright hover:bg-void-atmosphere/30"
                  }
                `}
                role="menuitem"
                aria-current={active ? "page" : undefined}
              >
                <span className={`transition-colors duration-300 ${active ? "text-accent-primary" : ""}`} aria-hidden="true">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Divider */}
          <div className="w-px h-6 bg-void-atmosphere/60 mx-1" aria-hidden="true" />
          
          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-full text-text-dim hover:text-text-bright hover:bg-void-atmosphere/30 transition-all duration-300"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-warning rounded-full animate-pulse" aria-hidden="true" />
          </button>
          
          {/* User Avatar */}
          <Link
            href="/sanctum"
            className="relative ml-1 group"
            aria-label="User profile"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary/40 to-accent-secondary/40 p-0.5 transition-all duration-300 group-hover:from-accent-primary/60 group-hover:to-accent-secondary/60 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              <div className="w-full h-full rounded-full bg-void-nebula flex items-center justify-center text-sm font-semibold text-text-stellar">
                {userInitial}
              </div>
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent-success rounded-full border-2 border-void-nebula" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 rounded-2xl bg-void-nebula/80 backdrop-blur-xl border border-void-atmosphere/60 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
          {/* Logo */}
          <Link 
            href="/observatory" 
            className="flex items-center gap-2 px-2"
            aria-label="FlowState - Go to Dashboard"
          >
            <span className="text-lg text-accent-primary" aria-hidden="true">✦</span>
            <span className="text-sm font-display text-text-stellar font-semibold">
              FlowState
            </span>
          </Link>
          
          <div className="flex-1" />
          
          {/* Mobile menu button */}
          <button
            className="p-2 rounded-full text-text-dim hover:text-text-bright hover:bg-void-atmosphere/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* User Avatar - Mobile */}
          <Link
            href="/sanctum"
            className="relative"
            aria-label="User profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary/40 to-accent-secondary/40 p-0.5">
              <div className="w-full h-full rounded-full bg-void-nebula flex items-center justify-center text-xs font-semibold text-text-stellar">
                {userInitial}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-accent-success rounded-full border-2 border-void-nebula" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden mt-2 py-2 rounded-2xl bg-void-nebula/95 backdrop-blur-xl border border-void-atmosphere/60 shadow-[0_0_30px_rgba(0,212,255,0.1)]"
          >
            <div className="px-2 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-moon transition-all duration-300
                      ${active 
                        ? "bg-void-atmosphere/60 text-text-stellar" 
                        : "text-text-dim hover:text-text-bright hover:bg-void-atmosphere/30"
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={active ? "text-accent-primary" : ""} aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-void-atmosphere/50 pt-2 mt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-moon text-accent-warning hover:bg-void-atmosphere/30 transition-colors w-full"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main id="main" className="pt-20 md:pt-24" role="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
