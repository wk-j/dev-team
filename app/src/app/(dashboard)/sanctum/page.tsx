"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccessibility } from "@/lib/accessibility";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string | null;
  starType: "sun" | "giant" | "main_sequence" | "dwarf" | "neutron";
  energySignatureColor: string;
  orbitalState: "open" | "focused" | "deep_work" | "away" | "supernova";
  sanctumTheme: string | null;
  preferences: UserPreferences | null;
  team: {
    teamId: string;
    teamName: string;
    role: string;
  } | null;
}

interface UserPreferences {
  dailyCheckInEnabled: boolean;
  weeklyReflectionEnabled: boolean;
  pingDelivery: {
    gentle: "immediate" | "batch_hourly" | "batch_daily";
    warm: "when_open" | "always";
    direct: "always";
  };
  visualPowers: {
    particleDensity: number;
    glowIntensity: number;
    animationSpeed: "slow" | "normal" | "fast";
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    classicView: boolean;
  };
  teamPulse: {
    visible: boolean;
    scale: number;
    showLabel: boolean;
    showRings: boolean;
    showParticles: boolean;
  };
}

const starTypes = [
  { value: "sun", label: "Sun", description: "Team lead - bright and central", color: "#fbbf24" },
  { value: "giant", label: "Giant", description: "Senior - large and powerful", color: "#f97316" },
  { value: "main_sequence", label: "Main Sequence", description: "Standard team member", color: "#00d4ff" },
  { value: "dwarf", label: "Dwarf", description: "Junior - small but growing", color: "#ff6b9d" },
  { value: "neutron", label: "Neutron", description: "Specialist - compact but intense", color: "#8b5cf6" },
];

const orbitalStates = [
  { value: "open", label: "Open", description: "Available for interaction", icon: "🟢" },
  { value: "focused", label: "Focused", description: "Working but interruptible", icon: "🟡" },
  { value: "deep_work", label: "Deep Work", description: "Do not disturb", icon: "🔴" },
  { value: "away", label: "Away", description: "Not at desk", icon: "⚫" },
  { value: "supernova", label: "Supernova", description: "Celebrating an achievement!", icon: "✨" },
];

const colorPresets = [
  "#00d4ff", "#4ade80", "#fbbf24", "#f97316", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#84cc16",
];

function Section({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-text-bright mb-1">{title}</h2>
      {description && <p className="text-sm text-text-muted mb-4">{description}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ 
  enabled, 
  onChange, 
  label, 
  description 
}: { 
  enabled: boolean; 
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-text-bright">{label}</div>
        {description && <div className="text-xs text-text-muted">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-accent-primary" : "bg-void-atmosphere"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SanctumPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  
  // Get accessibility context to sync settings globally
  const { updateSetting } = useAccessibility();

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [starType, setStarType] = useState<UserProfile["starType"]>("main_sequence");
  const [energyColor, setEnergyColor] = useState("#00d4ff");
  const [orbitalState, setOrbitalState] = useState<UserProfile["orbitalState"]>("open");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in to access settings");
          } else {
            setError("Failed to load profile");
          }
          return;
        }
        const data = await res.json();
        setProfile(data);
        setName(data.name);
        setRole(data.role ?? "");
        setStarType(data.starType);
        setEnergyColor(data.energySignatureColor);
        setOrbitalState(data.orbitalState);
        
        const prefs = data.preferences ?? getDefaultPreferences();
        setPreferences(prefs);
        
        // Sync accessibility settings with global provider
        if (prefs.accessibility) {
          updateSetting("highContrast", prefs.accessibility.highContrast);
          updateSetting("reducedMotion", prefs.accessibility.reducedMotion);
          updateSetting("classicView", prefs.accessibility.classicView);
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [updateSetting]);

  // Save profile
  const saveProfile = useCallback(async (updates: Record<string, unknown>) => {
    setSaveStatus("saving");
    setIsSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        throw new Error("Failed to save");
      }
      const data = await res.json();
      setProfile(data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updatePreferences = useCallback((key: string, value: unknown) => {
    if (!preferences) return;
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    saveProfile({ preferences: newPrefs });
  }, [preferences, saveProfile]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">⚙️</div>
          <p className="text-text-dim">Loading sanctum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-accent-warning">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-stellar text-text-stellar mb-2">Sanctum</h1>
          <p className="text-moon text-text-dim">
            Your personal space for customization and preferences
          </p>
        </div>

        {/* Save status indicator */}
        {saveStatus !== "idle" && (
          <div className={`fixed top-20 right-6 px-4 py-2 rounded-lg text-sm z-50 ${
            saveStatus === "saving" ? "bg-void-atmosphere text-text-muted" :
            saveStatus === "saved" ? "bg-accent-success/20 text-accent-success" :
            "bg-accent-warning/20 text-accent-warning"
          }`}>
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved ✓"}
            {saveStatus === "error" && "Failed to save"}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <Section 
            title="Identity" 
            description="How you appear in the constellation"
          >
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-text-muted mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name !== profile?.name && saveProfile({ name })}
                  className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-text-muted mb-1">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onBlur={() => role !== profile?.role && saveProfile({ role })}
                  placeholder="e.g., Frontend Developer"
                  className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm text-text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full px-3 py-2 bg-void-deep/50 border border-void-atmosphere rounded-lg text-text-dim cursor-not-allowed"
                />
              </div>
            </div>
          </Section>

          {/* Star Type Section */}
          <Section 
            title="Celestial Type" 
            description="Your appearance in the team constellation"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {starTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setStarType(type.value as UserProfile["starType"]);
                    saveProfile({ starType: type.value });
                  }}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    starType === type.value
                      ? "border-accent-primary bg-accent-primary/10"
                      : "border-void-atmosphere hover:border-void-atmosphere/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="font-medium text-text-bright">{type.label}</span>
                  </div>
                  <p className="text-xs text-text-muted">{type.description}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* Energy Color */}
          <Section 
            title="Energy Signature" 
            description="Your personal color in the void"
          >
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setEnergyColor(color);
                    saveProfile({ energySignatureColor: color });
                  }}
                  className={`w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 ${
                    energyColor === color ? "border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={energyColor}
                onChange={(e) => {
                  setEnergyColor(e.target.value);
                }}
                onBlur={() => saveProfile({ energySignatureColor: energyColor })}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-text-muted">Preview:</span>
              <div
                className="w-8 h-8 rounded-full"
                style={{ 
                  backgroundColor: energyColor,
                  boxShadow: `0 0 20px ${energyColor}` 
                }}
              />
              <span className="text-sm text-text-dim font-mono">{energyColor}</span>
            </div>
          </Section>

          {/* Orbital State */}
          <Section 
            title="Current Orbit" 
            description="Your availability status"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {orbitalStates.map((state) => (
                <button
                  key={state.value}
                  onClick={() => {
                    setOrbitalState(state.value as UserProfile["orbitalState"]);
                    saveProfile({ orbitalState: state.value });
                  }}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    orbitalState === state.value
                      ? "border-accent-primary bg-accent-primary/10"
                      : "border-void-atmosphere hover:border-void-atmosphere/80"
                  }`}
                >
                  <div className="text-xl mb-1">{state.icon}</div>
                  <div className="text-sm font-medium text-text-bright">{state.label}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* Resonance Preferences */}
          {preferences && (
            <Section 
              title="Resonance Preferences" 
              description="How you receive pings from teammates"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">Gentle Pings</label>
                  <select
                    value={preferences.pingDelivery.gentle}
                    onChange={(e) => updatePreferences("pingDelivery", {
                      ...preferences.pingDelivery,
                      gentle: e.target.value,
                    })}
                    className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright focus:outline-none focus:border-accent-primary"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="batch_hourly">Batch hourly</option>
                    <option value="batch_daily">Batch daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Warm Pings</label>
                  <select
                    value={preferences.pingDelivery.warm}
                    onChange={(e) => updatePreferences("pingDelivery", {
                      ...preferences.pingDelivery,
                      warm: e.target.value,
                    })}
                    className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright focus:outline-none focus:border-accent-primary"
                  >
                    <option value="when_open">When open/focused</option>
                    <option value="always">Always</option>
                  </select>
                </div>
                <p className="text-xs text-text-dim">
                  Direct pings always come through immediately.
                </p>
              </div>
            </Section>
          )}

          {/* Visual Settings */}
          {preferences && (
            <Section 
              title="Visual Powers" 
              description="Customize your viewing experience"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">
                    Particle Density: {Math.round(preferences.visualPowers.particleDensity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={preferences.visualPowers.particleDensity}
                    onChange={(e) => updatePreferences("visualPowers", {
                      ...preferences.visualPowers,
                      particleDensity: parseFloat(e.target.value),
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">
                    Glow Intensity: {Math.round(preferences.visualPowers.glowIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={preferences.visualPowers.glowIntensity}
                    onChange={(e) => updatePreferences("visualPowers", {
                      ...preferences.visualPowers,
                      glowIntensity: parseFloat(e.target.value),
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Animation Speed</label>
                  <div className="flex gap-2">
                    {["slow", "normal", "fast"].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => updatePreferences("visualPowers", {
                          ...preferences.visualPowers,
                          animationSpeed: speed,
                        })}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors capitalize ${
                          preferences.visualPowers.animationSpeed === speed
                            ? "border-accent-primary bg-accent-primary/10 text-text-bright"
                            : "border-void-atmosphere text-text-muted hover:text-text-bright"
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Team Pulse Settings */}
          {preferences && (
            <Section 
              title="Team Pulse" 
              description="Customize the central team heartbeat display"
            >
              <div className="space-y-4">
                <Toggle
                  enabled={preferences.teamPulse?.visible ?? true}
                  onChange={(value) => {
                    updatePreferences("teamPulse", {
                      ...getDefaultTeamPulseSettings(),
                      ...preferences.teamPulse,
                      visible: value,
                    });
                  }}
                  label="Show Team Pulse"
                  description="Display the central team energy orb"
                />
                
                {(preferences.teamPulse?.visible ?? true) && (
                  <>
                    <div>
                      <label className="block text-sm text-text-muted mb-2">
                        Size: {Math.round((preferences.teamPulse?.scale ?? 1) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={preferences.teamPulse?.scale ?? 1}
                        onChange={(e) => updatePreferences("teamPulse", {
                          ...getDefaultTeamPulseSettings(),
                          ...preferences.teamPulse,
                          scale: parseFloat(e.target.value),
                        })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-text-dim mt-1">
                        <span>Small</span>
                        <span>Normal</span>
                        <span>Large</span>
                      </div>
                    </div>

                    <Toggle
                      enabled={preferences.teamPulse?.showLabel ?? true}
                      onChange={(value) => {
                        updatePreferences("teamPulse", {
                          ...getDefaultTeamPulseSettings(),
                          ...preferences.teamPulse,
                          showLabel: value,
                        });
                      }}
                      label="Show Label"
                      description="Display 'Team Pulse' text label"
                    />

                    <Toggle
                      enabled={preferences.teamPulse?.showRings ?? true}
                      onChange={(value) => {
                        updatePreferences("teamPulse", {
                          ...getDefaultTeamPulseSettings(),
                          ...preferences.teamPulse,
                          showRings: value,
                        });
                      }}
                      label="Show Orbital Rings"
                      description="Display the rotating rings around the core"
                    />

                    <Toggle
                      enabled={preferences.teamPulse?.showParticles ?? true}
                      onChange={(value) => {
                        updatePreferences("teamPulse", {
                          ...getDefaultTeamPulseSettings(),
                          ...preferences.teamPulse,
                          showParticles: value,
                        });
                      }}
                      label="Show Particles"
                      description="Display floating energy particles"
                    />
                  </>
                )}
              </div>
            </Section>
          )}

          {/* Accessibility */}
          {preferences && (
            <Section 
              title="Accessibility" 
              description="Make FlowState work better for you"
            >
              <div className="space-y-4">
                <Toggle
                  enabled={preferences.accessibility.highContrast}
                  onChange={(value) => {
                    updatePreferences("accessibility", {
                      ...preferences.accessibility,
                      highContrast: value,
                    });
                    // Sync with global accessibility provider
                    updateSetting("highContrast", value);
                  }}
                  label="High Contrast Mode"
                  description="Increase contrast for better visibility"
                />
                <Toggle
                  enabled={preferences.accessibility.reducedMotion}
                  onChange={(value) => {
                    updatePreferences("accessibility", {
                      ...preferences.accessibility,
                      reducedMotion: value,
                    });
                    // Sync with global accessibility provider
                    updateSetting("reducedMotion", value);
                  }}
                  label="Reduced Motion"
                  description="Minimize animations and transitions"
                />
                <Toggle
                  enabled={preferences.accessibility.classicView}
                  onChange={(value) => {
                    updatePreferences("accessibility", {
                      ...preferences.accessibility,
                      classicView: value,
                    });
                    // Sync with global accessibility provider
                    updateSetting("classicView", value);
                  }}
                  label="Classic 2D View"
                  description="Use a traditional flat interface"
                />
              </div>
            </Section>
          )}

          {/* Team Info */}
          {profile?.team && (
            <Section title="Team">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-text-bright font-medium">{profile.team.teamName}</div>
                  <div className="text-sm text-text-muted">Role: {profile.team.role}</div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultTeamPulseSettings() {
  return {
    visible: true,
    scale: 1,
    showLabel: true,
    showRings: true,
    showParticles: true,
  };
}

function getDefaultPreferences(): UserPreferences {
  return {
    dailyCheckInEnabled: true,
    weeklyReflectionEnabled: true,
    pingDelivery: {
      gentle: "batch_hourly",
      warm: "when_open",
      direct: "always",
    },
    visualPowers: {
      particleDensity: 1.0,
      glowIntensity: 1.0,
      animationSpeed: "normal",
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      classicView: false,
    },
    teamPulse: getDefaultTeamPulseSettings(),
  };
}
