# FlowState 3D Canvas Implementation

## Overview

The Void Canvas is the central 3D visualization layer built with React Three Fiber. It renders team activity as an interactive cosmic environment.

---

## Component Architecture

```
VoidCanvas (Root)
├── VoidEnvironment       # Background, lighting, fog
├── CameraController      # Navigation, zoom, pan
├── ConstellationView     # Team members as stars
│   └── CelestialBody[]   # Individual user nodes
├── StreamsView           # Work streams as flowing rivers
│   └── Stream[]          # Particle-based stream visualization
├── WorkItemsView         # Work items as energy orbs
│   └── EnergyOrb[]       # Individual work items
├── ParticleField         # Ambient background particles
├── ResonancePingTrails   # Ping travel animations
└── PostProcessing        # Bloom, glow effects
```

---

## Visual Elements

### CelestialBody (Team Members)

Each user is rendered as a glowing star with properties based on their role and state.

| Star Type | Size | Visual | Use Case |
|-----------|------|--------|----------|
| Sun | Large | Golden, bright corona | Team leads |
| Giant | Medium-large | Orange glow | Senior members |
| Main Sequence | Medium | Cyan core | Standard members |
| Dwarf | Small | Soft pink | Junior members |
| Neutron | Tiny, intense | Purple pulse | Specialists |

**Orbital States** affect availability indicator:
- **Open**: Bright ring, fast pulse
- **Focused**: Medium ring, moderate pulse  
- **Deep Work**: Dim protective shell, slow pulse
- **Away**: Faded, minimal glow

### Stream (Work Flows)

Streams are rendered as flowing particle rivers along curved paths.

| Stream State | Visual | Behavior |
|--------------|--------|----------|
| Nascent | Dim, slow | Few particles, thin width |
| Flowing | Cyan, steady | Normal particle density |
| Rushing | Golden, fast | Dense particles, wider |
| Flooding | Red, chaotic | Very dense, warning visual |
| Stagnant | Gray, static | Minimal movement |

### EnergyOrb (Work Items)

Work items appear as orbs that transform based on energy state.

| Energy State | Shape | Color | Effects |
|--------------|-------|-------|---------|
| Dormant | Sphere | Gray-teal | Slow pulse |
| Kindling | Sphere | Orange | Flickering particles |
| Blazing | Sphere | Golden | Intense particle burst |
| Cooling | Sphere | Lavender | Fading particles |
| Crystallized | Faceted gem | Cyan | Reflective, rotating |

**Depth** (shallow/medium/deep/abyssal) affects orb size.

---

## Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Focus entity | Click | Camera moves to entity, shows details |
| Hover info | Mouse over | Tooltip with name/status |
| Navigate | Drag/pan | Move camera through void |
| Zoom | Scroll/pinch | Adjust view distance |
| Intention wheel | Long press | Radial menu for quick actions |

---

## Animation Principles

1. **Organic Easing**: Spring physics, never linear
2. **Breathing**: Idle elements scale 0.98-1.02 continuously
3. **Particle Flow**: Constant ambient motion
4. **Gravitational Pull**: Subtle attraction toward cursor

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Frame Rate | 60 FPS |
| Initial Load | < 3 seconds |
| Memory | < 200MB |
| Draw Calls | < 100 |

### Optimization Strategies

- **LOD (Level of Detail)**: Reduce geometry at distance
- **Instanced Rendering**: Batch similar particles
- **Frustum Culling**: Skip off-screen objects
- **Dynamic Quality**: Reduce effects on low-end devices

---

## Accessibility

- **Classic Mode**: 2D fallback toggle
- **Keyboard Navigation**: Arrow keys + Enter
- **Reduced Motion**: Respect system preference
- **Screen Reader**: Aria-live announcements for state changes
