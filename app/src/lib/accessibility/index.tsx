"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  classicView: boolean;
  keyboardNav: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  classicView: false,
  keyboardNav: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const prefersHighContrast = window.matchMedia(
      "(prefers-contrast: more)"
    ).matches;

    // Load saved settings or use system preferences
    const saved = localStorage.getItem("flowstate-accessibility");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch {
        // Invalid JSON, use defaults with system preferences
        setSettings({
          ...defaultSettings,
          reducedMotion: prefersReducedMotion,
          highContrast: prefersHighContrast,
        });
      }
    } else {
      // No saved settings, use system preferences
      setSettings({
        ...defaultSettings,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      });
    }

    // Listen for keyboard navigation (Tab key pressed)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setSettings((prev) => ({ ...prev, keyboardNav: true }));
      }
    };

    const handleMouseDown = () => {
      setSettings((prev) => ({ ...prev, keyboardNav: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Apply settings to document
  useEffect(() => {
    if (!mounted) return;

    const classList = document.documentElement.classList;

    // High contrast
    if (settings.highContrast) {
      classList.add("high-contrast");
    } else {
      classList.remove("high-contrast");
    }

    // Reduced motion
    if (settings.reducedMotion) {
      classList.add("reduced-motion");
    } else {
      classList.remove("reduced-motion");
    }

    // Classic view
    if (settings.classicView) {
      classList.add("classic-view");
    } else {
      classList.remove("classic-view");
    }

    // Keyboard navigation
    if (settings.keyboardNav) {
      classList.add("keyboard-nav");
    } else {
      classList.remove("keyboard-nav");
    }

    // Save to localStorage
    localStorage.setItem("flowstate-accessibility", JSON.stringify(settings));
  }, [settings, mounted]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K]
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleSetting = useCallback((key: keyof AccessibilitySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSetting, toggleSetting }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
}

/**
 * Hook to check if reduced motion is preferred
 */
export function useReducedMotion() {
  const { settings } = useAccessibility();
  return settings.reducedMotion;
}

/**
 * Hook to check if classic view is enabled
 */
export function useClassicView() {
  const { settings } = useAccessibility();
  return settings.classicView;
}

/**
 * Screen reader only text
 */
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: "rect(0, 0, 0, 0)" }}
    >
      {children}
    </span>
  );
}

/**
 * Skip link for keyboard navigation
 */
export function SkipLink({ href = "#main", children = "Skip to main content" }: { 
  href?: string; 
  children?: ReactNode;
}) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}

/**
 * Announce text to screen readers
 */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", priority);
    el.setAttribute("aria-atomic", "true");
    el.className = "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0";
    el.style.clip = "rect(0, 0, 0, 0)";
    el.textContent = message;
    
    document.body.appendChild(el);
    
    setTimeout(() => {
      document.body.removeChild(el);
    }, 1000);
  }, []);

  return announce;
}
