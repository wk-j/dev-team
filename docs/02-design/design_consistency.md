# FlowState Design Consistency Guide

This document defines the visual language, tokens, and implementation patterns for the FlowState universe.

---

## 1. Color System

### The Void (Backgrounds)

| Token | Hex | Usage |
|-------|-----|-------|
| `--void-deep` | `#05080f` | Deepest background, infinite space |
| `--void-nebula` | `#0a1628` | Secondary background, panels |
| `--void-atmosphere` | `#0f1f3d` | Interactive areas, hover states |
| `--void-surface` | `#1a2a4a` | Elevated surfaces, cards |

```css
/* Tailwind config extensions */
colors: {
  void: {
    deep: '#05080f',
    nebula: '#0a1628',
    atmosphere: '#0f1f3d',
    surface: '#1a2a4a',
  }
}
```

### Energy States (Dynamic Colors)

Each energy state has a primary, glow, and subtle variant:

| State | Primary | Glow | Subtle |
|-------|---------|------|--------|
| **Dormant** | `#3d5a5a` | `#1a2f2f` | `rgba(61,90,90,0.1)` |
| **Kindling** | `#ff6b35` | `#ff8c5a` | `rgba(255,107,53,0.15)` |
| **Blazing** | `#ffd700` | `#ffed4a` | `rgba(255,215,0,0.2)` |
| **Cooling** | `#9370db` | `#b39ddb` | `rgba(147,112,219,0.15)` |
| **Crystallized** | `#00ffc8` | `#4dffd7` | `rgba(0,255,200,0.15)` |

```css
colors: {
  energy: {
    dormant: { DEFAULT: '#3d5a5a', glow: '#1a2f2f', subtle: 'rgba(61,90,90,0.1)' },
    kindling: { DEFAULT: '#ff6b35', glow: '#ff8c5a', subtle: 'rgba(255,107,53,0.15)' },
    blazing: { DEFAULT: '#ffd700', glow: '#ffed4a', subtle: 'rgba(255,215,0,0.2)' },
    cooling: { DEFAULT: '#9370db', glow: '#b39ddb', subtle: 'rgba(147,112,219,0.15)' },
    crystallized: { DEFAULT: '#00ffc8', glow: '#4dffd7', subtle: 'rgba(0,255,200,0.15)' },
  }
}
```

### Accent Colors (UI Elements)

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#00d4ff` | Primary actions, links |
| `--accent-secondary` | `#b388ff` | Secondary actions, highlights |
| `--accent-warning` | `#ff5252` | Urgent, warnings, errors |
| `--accent-success` | `#69f0ae` | Success, growth, positive |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-stellar` | `#ffffff` | Maximum emphasis, titles |
| `--text-bright` | `#e2e8f0` | Primary text, headings |
| `--text-dim` | `#94a3b8` | Body text, descriptions |
| `--text-muted` | `#64748b` | Subtle, metadata |
| `--text-faded` | `#475569` | Disabled, inactive |

---

## 2. Typography

### Font Families

```css
fontFamily: {
  display: ['Space Grotesk', 'sans-serif'],
  body: ['IBM Plex Sans', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Type Scale

| Name | Class | Size | Weight | Line Height | Usage |
|------|-------|------|--------|-------------|-------|
| **Cosmic** | `text-cosmic` | 48px | 700 | 1.1 | Hero text, landing |
| **Stellar** | `text-stellar` | 36px | 700 | 1.2 | Page titles |
| **Nebula** | `text-nebula` | 24px | 600 | 1.3 | Section headers |
| **Planet** | `text-planet` | 18px | 500 | 1.4 | Card titles, emphasis |
| **Star** | `text-star` | 16px | 400 | 1.5 | Body text |
| **Moon** | `text-moon` | 14px | 400 | 1.5 | Secondary text |
| **Dust** | `text-dust` | 12px | 500 | 1.4 | Labels, metadata |

```css
fontSize: {
  cosmic: ['48px', { lineHeight: '1.1', fontWeight: '700' }],
  stellar: ['36px', { lineHeight: '1.2', fontWeight: '700' }],
  nebula: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
  planet: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
  star: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
  moon: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
  dust: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
}
```

---

## 3. Glow & Effects

### Glow Intensities

```css
boxShadow: {
  'glow-sm': '0 0 10px rgba(0, 212, 255, 0.3)',
  'glow-md': '0 0 20px rgba(0, 212, 255, 0.4)',
  'glow-lg': '0 0 40px rgba(0, 212, 255, 0.5)',
  'glow-xl': '0 0 60px rgba(0, 212, 255, 0.6)',
}
```

### Dynamic Glow (based on energy state)
```css
/* Kindling glow */
.glow-kindling {
  box-shadow: 
    0 0 10px rgba(255, 107, 53, 0.4),
    0 0 30px rgba(255, 107, 53, 0.2),
    0 0 50px rgba(255, 107, 53, 0.1);
}

/* Blazing glow */
.glow-blazing {
  box-shadow: 
    0 0 15px rgba(255, 215, 0, 0.5),
    0 0 40px rgba(255, 215, 0, 0.3),
    0 0 80px rgba(255, 215, 0, 0.15);
}

/* Crystallized glow */
.glow-crystallized {
  box-shadow: 
    0 0 10px rgba(0, 255, 200, 0.5),
    0 0 25px rgba(0, 255, 200, 0.3),
    inset 0 0 15px rgba(0, 255, 200, 0.1);
}
```

### Glass/Frost Effect (UI Panels)

```css
.glass-panel {
  background: rgba(10, 22, 40, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.glass-panel-bright {
  background: rgba(26, 42, 74, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
}
```

---

## 4. Motion & Animation

### Timing Functions

```css
transitionTimingFunction: {
  'cosmic': 'cubic-bezier(0.34, 1.56, 0.64, 1)', /* Overshoot spring */
  'drift': 'cubic-bezier(0.25, 0.1, 0.25, 1)',   /* Gentle float */
  'snap': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', /* Snappy bounce */
}
```

### Duration Tokens

| Token | Duration | Usage |
|-------|----------|-------|
| `--duration-instant` | 100ms | Micro-interactions |
| `--duration-fast` | 200ms | Hovers, toggles |
| `--duration-normal` | 300ms | State changes |
| `--duration-slow` | 500ms | Page transitions |
| `--duration-cosmic` | 1000ms | Major reveals |

### Breathing Animation
```css
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.02); opacity: 1; }
}

.breathing {
  animation: breathe 4s ease-in-out infinite;
}
```

### Pulse Animation (Energy States)
```css
@keyframes pulse-dormant {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

@keyframes pulse-kindling {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  25% { opacity: 0.8; transform: scale(1.02); }
  50% { opacity: 0.7; transform: scale(0.99); }
  75% { opacity: 0.9; transform: scale(1.01); }
}

@keyframes pulse-blazing {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.03); }
}
```

### Float Animation (Celestial Bodies)
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-3px) rotate(0.5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(3px) rotate(-0.5deg); }
}

.floating {
  animation: float 8s ease-in-out infinite;
}
```

### Particle Flow (Streams)
```css
@keyframes flow {
  0% { transform: translateX(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}
```

---

## 5. Spacing & Layout

### Spacing Scale

```css
spacing: {
  'void-xs': '4px',
  'void-sm': '8px',
  'void-md': '16px',
  'void-lg': '24px',
  'void-xl': '32px',
  'void-2xl': '48px',
  'void-3xl': '64px',
}
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Buttons, badges |
| `--radius-md` | 12px | Cards, inputs |
| `--radius-lg` | 16px | Panels, modals |
| `--radius-xl` | 24px | Large containers |
| `--radius-full` | 9999px | Circular elements |

### Z-Index Layers

| Layer | Value | Usage |
|-------|-------|-------|
| `z-void` | 0 | Background, canvas |
| `z-streams` | 10 | Stream particles |
| `z-bodies` | 20 | Celestial bodies |
| `z-connections` | 30 | Resonance lines |
| `z-ui` | 100 | Floating UI panels |
| `z-modal` | 200 | Modals, overlays |
| `z-tooltip` | 300 | Tooltips |
| `z-notification` | 400 | Notifications |

---

## 6. Component Patterns

### Celestial Body (3D)
```jsx
// Shader uniforms for body glow
const bodyMaterial = {
  color: energyStateColor,
  emissive: energyStateGlow,
  emissiveIntensity: pulseIntensity, // 0.3 - 0.8 based on state
}

// Post-processing bloom
const bloomParams = {
  luminanceThreshold: 0.6,
  luminanceSmoothing: 0.3,
  intensity: 1.5,
}
```

### Glass Panel (2D UI)
```jsx
<div className="
  bg-void-nebula/70 
  backdrop-blur-xl 
  border border-white/8 
  rounded-lg 
  shadow-glow-sm
  p-void-lg
">
  {children}
</div>
```

### Energy Badge
```jsx
<span className={`
  inline-flex items-center gap-1.5
  px-2.5 py-1 
  rounded-full 
  text-dust font-medium
  ${energyStateClass} // e.g., "bg-energy-blazing/20 text-energy-blazing"
  animate-pulse-${state}
`}>
  <EnergyIcon state={state} />
  {label}
</span>
```

### Resonance Line
```jsx
// SVG path between two points
<path
  d={curvePath}
  stroke={connectionStrength > 0.7 ? 'url(#strongResonance)' : 'rgba(148,163,184,0.3)'}
  strokeWidth={Math.max(1, connectionStrength * 3)}
  strokeDasharray={isHistorical ? '5,5' : 'none'}
  fill="none"
  className="animate-pulse-subtle"
/>
```

---

## 7. Accessibility Modes

### High Contrast Overrides
```css
.high-contrast {
  --void-deep: #000000;
  --void-nebula: #0a0a0a;
  --text-bright: #ffffff;
  --text-dim: #e0e0e0;
  
  /* Remove gradients */
  .glow-* { box-shadow: none; }
  
  /* Solid state colors */
  --energy-dormant: #808080;
  --energy-kindling: #ff9900;
  --energy-blazing: #ffff00;
  --energy-cooling: #cc99ff;
  --energy-crystallized: #00ff99;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .breathing, .floating, .pulse-* {
    animation: none;
  }
}
```

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout Adaptation |
|------------|-------|-------------------|
| `xs` | < 480px | Single column, minimal UI |
| `sm` | 480-768px | Stacked panels, collapsed nav |
| `md` | 768-1024px | Two-column where needed |
| `lg` | 1024-1280px | Full layout, all features |
| `xl` | 1280-1536px | Expanded canvas, larger panels |
| `2xl` | > 1536px | Maximum visual fidelity |

### Mobile Considerations
- Void canvas: Simplified particle count
- Navigation: Bottom sheet instead of side panel
- Gestures: Two-finger pan, pinch zoom
- Energy states: Larger touch targets

---

## 9. Asset Specifications

### Icon Style
- Style: Outlined, 1.5px stroke
- Size: 20x20 default, 24x24 for emphasis
- Color: Inherit from text color
- Source: Lucide React (consistent with cosmic theme)
