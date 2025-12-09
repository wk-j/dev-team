"use client";

import { useState } from "react";
import {
  ENERGY_STATES,
  ENERGY_STATE_CONFIG,
  STREAM_STATES,
  STREAM_STATE_CONFIG,
  WORK_ITEM_DEPTHS,
  WORK_ITEM_DEPTH_CONFIG,
} from "@/lib/constants";

interface ObservatoryGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ObservatoryGuide({ isOpen, onClose }: ObservatoryGuideProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const pages = [
    {
      title: "Welcome to the Observatory",
      icon: "🔭",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted">
            The Observatory is your team's cosmic command center - a living 3D visualization
            of your work flowing through space.
          </p>
          <div className="bg-void-surface/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-text-bright">Quick Controls</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-void-atmosphere rounded text-text-dim min-w-[80px] text-center">
                  Click + Drag
                </kbd>
                <span className="text-text-muted">Rotate the view</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-void-atmosphere rounded text-text-dim min-w-[80px] text-center">
                  Scroll
                </kbd>
                <span className="text-text-muted">Zoom in/out</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-void-atmosphere rounded text-text-dim min-w-[80px] text-center">
                  Hover
                </kbd>
                <span className="text-text-muted">See details</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-void-atmosphere rounded text-text-dim min-w-[80px] text-center">
                  Click
                </kbd>
                <span className="text-text-muted">Interact with elements</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Streams (Purple Lines)",
      icon: "🌊",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted">
            <strong className="text-accent-primary">Streams</strong> are flowing rivers of work -
            like projects or workflows where tasks move from start to completion.
          </p>
          
          <div className="bg-void-surface/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"></div>
              <span className="text-sm text-text-bright">Stream Path</span>
            </div>
            <p className="text-sm text-text-muted">
              Each stream is a curved line showing the flow of work from beginning to end.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-bright">Stream States</h4>
            <div className="space-y-2">
              {STREAM_STATES.filter(s => s !== "evaporated").map((state) => (
                <div key={state} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-1 rounded-full"
                    style={{ backgroundColor: STREAM_STATE_CONFIG[state].color }}
                  ></div>
                  <div className="flex-1">
                    <div className="text-sm text-text-bright">{STREAM_STATE_CONFIG[state].label}</div>
                    <div className="text-xs text-text-dim">{STREAM_STATE_CONFIG[state].description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-3">
            <div className="text-sm text-accent-primary font-medium mb-1">💡 Pro Tip</div>
            <div className="text-xs text-text-muted">
              Click on a stream to "dive in" - you'll enter an immersive view showing only that stream's work items!
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Work Items (Orbs)",
      icon: "💎",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted">
            <strong className="text-accent-primary">Work items</strong> are floating orbs positioned
            along streams, representing individual tasks or features.
          </p>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-bright">Energy States</h4>
            <div className="space-y-2">
              {ENERGY_STATES.map((state) => (
                <div key={state} className="flex items-center gap-3">
                  <div 
                    className={`w-6 h-6 ${state === "crystallized" ? "rounded-lg" : "rounded-full"} ${state === "blazing" ? "animate-pulse" : ""}`}
                    style={{ 
                      backgroundColor: ENERGY_STATE_CONFIG[state].color,
                      boxShadow: state !== "dormant" ? `0 10px 15px -3px ${ENERGY_STATE_CONFIG[state].color}50` : undefined,
                      clipPath: state === "crystallized" ? "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" : undefined,
                    }}
                  ></div>
                  <div className="flex-1">
                    <div className="text-sm text-text-bright">
                      {ENERGY_STATE_CONFIG[state].label} {state === "crystallized" && "✨"}
                    </div>
                    <div className="text-xs text-text-dim">{ENERGY_STATE_CONFIG[state].description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-bright">Size = Complexity (Depth)</h4>
            {WORK_ITEM_DEPTHS.map((depth) => (
              <div key={depth} className="flex items-center gap-2 text-xs text-text-muted">
                <div 
                  className="rounded-full bg-accent-primary"
                  style={{ 
                    width: `${12 + WORK_ITEM_DEPTH_CONFIG[depth].complexity * 4}px`,
                    height: `${12 + WORK_ITEM_DEPTH_CONFIG[depth].complexity * 4}px`,
                  }}
                ></div>
                <span>{WORK_ITEM_DEPTH_CONFIG[depth].label} = {WORK_ITEM_DEPTH_CONFIG[depth].description}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Team Members (Celestial Bodies)",
      icon: "⭐",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted">
            <strong className="text-accent-primary">Team members</strong> appear as glowing celestial
            bodies - stars, planets, and other cosmic objects.
          </p>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-bright">Star Types (Roles)</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                <div className="flex-1">
                  <div className="text-sm text-text-bright">☀️ Sun</div>
                  <div className="text-xs text-text-dim">Team Lead</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></div>
                <div className="flex-1">
                  <div className="text-sm text-text-bright">🌟 Giant</div>
                  <div className="text-xs text-text-dim">Senior Member</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></div>
                <div className="flex-1">
                  <div className="text-sm text-text-bright">⭐ Main Sequence</div>
                  <div className="text-xs text-text-dim">Team Member</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50"></div>
                <div className="flex-1">
                  <div className="text-sm text-text-bright">✨ Dwarf</div>
                  <div className="text-xs text-text-dim">Junior Member</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
                <div className="flex-1">
                  <div className="text-sm text-text-bright">💫 Neutron</div>
                  <div className="text-xs text-text-dim">Specialist</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-bright">Orbital States (Availability)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-text-muted">Open - Available for collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-text-muted">Focused - Concentrated work</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-text-muted">Deep Work - Do not disturb</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-text-muted">Away - Offline</span>
              </div>
            </div>
          </div>

          <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-3">
            <div className="text-sm text-accent-primary font-medium mb-1">💡 Pro Tip</div>
            <div className="text-xs text-text-muted">
              Click on a team member to see their profile and send them a resonance ping!
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding the Flow",
      icon: "🎯",
      content: (
        <div className="space-y-4">
          <p className="text-text-muted">
            Everything in the Observatory tells a story about your team's work and energy.
          </p>

          <div className="space-y-4">
            <div className="bg-void-surface/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-text-bright mb-2">Work Flow Direction</h4>
              <div className="text-xs text-text-muted space-y-1">
                <div>• Work items flow along streams from <strong className="text-text-bright">start → end</strong></div>
                <div>• Items near the start = new work</div>
                <div>• Items in the middle = active work</div>
                <div>• Items near the end = nearly complete</div>
              </div>
            </div>

            <div className="bg-void-surface/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-text-bright mb-2">Connection Lines</h4>
              <div className="text-xs text-text-muted space-y-1">
                <div>• <strong className="text-text-bright">Thin lines from items to streams</strong> = tether lines showing which stream an item belongs to</div>
                <div>• <strong className="text-text-bright">Faint lines between members</strong> = resonance connections (collaboration strength)</div>
                <div>• <strong className="text-text-bright">Flowing particles</strong> = active work moving through streams</div>
              </div>
            </div>

            <div className="bg-void-surface/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-text-bright mb-2">Reading Team Health</h4>
              <div className="text-xs text-text-muted space-y-1">
                <div>✅ Many <strong className="text-orange-400">kindling</strong> & <strong className="text-yellow-400">blazing</strong> items = team is productive</div>
                <div>✅ Items moving along streams = healthy progress</div>
                <div>✅ Strong resonance connections = good collaboration</div>
                <div>⚠️ Many <strong className="text-gray-500">dormant</strong> items = work not started</div>
                <div>⚠️ <strong className="text-red-500">Flooding</strong> streams = team overwhelmed</div>
              </div>
            </div>
          </div>

          <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-3">
            <div className="text-sm text-accent-primary font-medium mb-1">🎊 Celebrations</div>
            <div className="text-xs text-text-muted">
              When work items crystallize (complete), watch for the burst animation and sparkles! These are your team's victories.
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentPageData = pages[currentPage];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-void-deep/90 backdrop-blur-md" style={{ zIndex: 9999 }}>
      <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-void-atmosphere">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentPageData?.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-text-stellar">
                {currentPageData?.title}
              </h2>
              <p className="text-sm text-text-dim">
                Observatory Quick Guide · {currentPage + 1} of {pages.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-bright transition-colors p-2"
            aria-label="Close guide"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentPageData?.content}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-void-atmosphere">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 text-sm border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright hover:border-accent-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {/* Page Indicators */}
          <div className="flex items-center gap-2">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPage
                    ? "bg-accent-primary w-6"
                    : "bg-void-atmosphere hover:bg-accent-primary/50"
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>

          {currentPage === pages.length - 1 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
            >
              Got it! ✨
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
              className="px-4 py-2 text-sm border border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary/10 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
