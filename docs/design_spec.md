# Design Specification: FlowState — Team Energy Tracker

## Revolutionary Concept: "Living Workspace"

**FlowState** abandons traditional task management paradigms (Kanban boards, lists, sprints) in favor of a **biological, energy-based system** that treats work as a living organism rather than static cards on a board.

### Core Philosophy
> "Work is not a checklist. It's a living system of energy, momentum, and human connection."

Instead of tracking *tasks*, we track **energy states**, **momentum flows**, and **team resonance**. The interface responds and evolves based on the collective state of the team.

---

## The Three Pillars

### 1. Energy States (Replaces Task Status)
Work exists in **energy states**, not columns:

| State | Metaphor | Visual | Behavior |
|-------|----------|--------|----------|
| **Dormant** | Seed underground | Dim, pulsing slowly | Ideas waiting to germinate |
| **Kindling** | Spark catching | Flickering warm glow | Active energy building |
| **Blazing** | Full flame | Bright, radiating heat | Peak momentum/focus |
| **Cooling** | Ember settling | Soft fade, warm afterglow | Wrapping up, handoff |
| **Crystallized** | Solidified gem | Solid, reflective | Complete, value captured |

### 2. Momentum Streams (Replaces Projects/Boards)
Work flows through **streams** — continuous rivers of effort that team members contribute to:
- Streams have **current speed** (team velocity)
- Members can **dive in** or **surface** from streams
- Streams can **merge**, **fork**, or **evaporate**
- Visual: Flowing particle systems that respond to activity

### 3. Resonance Network (Replaces Team Page)
Team members exist as **nodes in a constellation**:
- Connections form based on collaboration intensity
- **Resonance score** shows alignment/sync between members
- Members can be in **deep work orbit** (unreachable) or **open orbit** (available)
- Visual: Living star map that breathes with team activity

---

## Visual Design Language

### Aesthetic: "Bioluminescent Deep Space"
Combines the organic warmth of bioluminescence with the infinite depth of space.

### Color System

#### Base Layer (The Void)
- **Deep Space**: `#05080f` — Near-black with blue undertone
- **Nebula Layer**: `#0a1628` — Dark blue mist
- **Atmosphere**: `#0f1f3d` — Lighter interactive areas

#### Energy Colors (Organic Glow)
- **Dormant**: `#3d5a5a` → `#1a2f2f` (Teal-gray, barely visible)
- **Kindling**: `#ff6b35` → `#c44d2a` (Warm orange, flickering)
- **Blazing**: `#ffd700` → `#ff8c00` (Golden fire, pulsing)
- **Cooling**: `#9370db` → `#6a4c93` (Lavender, fading)
- **Crystallized**: `#00ffc8` → `#00b894` (Cyan crystal, solid)

#### Accent & UI
- **Primary Interaction**: `#00d4ff` (Electric cyan)
- **Secondary**: `#b388ff` (Soft violet)
- **Warning Pulse**: `#ff5252` (Urgent red pulse)
- **Success Bloom**: `#69f0ae` (Growth green)

### Typography
- **Display/Titles**: "Space Grotesk" — Geometric, modern, distinctive
- **Body/UI**: "IBM Plex Sans" — Highly readable, technical feel
- **Data/Numbers**: "JetBrains Mono" — Monospace for metrics

### Motion Principles
- **Organic Easing**: All motion uses spring/elastic easing, never linear
- **Breathing**: Idle elements have subtle scale breathing (0.98-1.02)
- **Particle Systems**: Background uses flowing particles to show activity level
- **Gravitational Pull**: Elements near cursor subtly attract toward it

---

## Interface Structure

### The Void (Main Canvas)
The entire application is a **zoomable, pannable infinite canvas** called "The Void":
- Zoom out: See entire team constellation and all streams
- Zoom in: Focus on individual work items or team members
- No fixed "pages" — everything exists in spatial relationship

### Navigation: Thought-Based
Instead of clicking menu items:
- **Press & Hold** anywhere to open radial "Intention Wheel"
- Speak/type an intention: "Find Sarah's work" → camera flies to Sarah's node
- Gesture-based shortcuts for common actions

### The Pulse Bar (Replaces Sidebar)
A **minimal floating bar** that shows:
- Team heartbeat (aggregate activity rhythm)
- Your current energy state
- Unread resonance signals (notifications reimagined)
- Quick-dive access to active streams

---

## Unique Interactions

### 1. Energy Infusion (Replaces Task Assignment)
- You don't "assign" work — you **infuse energy** into dormant items
- Visual: Drag your avatar's energy trail into a dormant seed
- The seed begins to glow and pulse with your color signature

### 2. Stream Diving (Replaces Opening a Project)
- "Diving" into a stream puts you in immersive focus mode
- The interface shifts: stream fills the view, other elements fade
- Your status broadcasts: "Alex is deep in the API Redesign stream"

### 3. Resonance Pings (Replaces @Mentions)
- Send a "ping" to a teammate — a gentle ripple that travels through the void
- Recipient feels it as a subtle screen vibration/glow
- Non-intrusive; they respond when they surface

### 4. Crystallization Ceremony (Replaces Marking Complete)
- Completing work triggers a brief celebration animation
- The work item transforms into a permanent crystal in your achievement constellation
- These crystals emit light — high-value work shines brighter forever

---

## Dashboard: The Observatory

The main view is an **Observatory** — a cosmic viewport into team activity:

### Focal Points
1. **Energy Map**: Heat visualization of where team energy is flowing
2. **Stream Currents**: Animated rivers showing active work movement
3. **Constellation View**: Team members as stars with connection lines
4. **Rhythm Visualizer**: Audio-reactive visualization of team "heartbeat"

### Key Metrics (Reimagined)
- **Collective Energy Index**: Team's overall momentum (not just task count)
- **Flow Harmony**: How synchronized is the team's work rhythm?
- **Resonance Strength**: Quality of collaboration connections
- **Crystal Garden**: Cumulative value delivered (visual growth)

---

## Why This Works

### Psychology
- **Intrinsic Motivation**: Energy metaphors tap into natural human drive
- **Reduced Anxiety**: No "overdue" shame — work is organic, not mechanical
- **Connection Focus**: Emphasizes human relationships over task completion

### Productivity
- **Flow State Optimization**: Interface designed to induce/protect focus
- **Natural Prioritization**: High-energy items visually demand attention
- **Async-First**: Pings and streams respect deep work

### Team Health
- **Burnout Visibility**: Low energy states are visible to leads (optional)
- **Collaboration Celebration**: Resonance rewards working together
- **Achievement Permanence**: Crystal garden provides lasting satisfaction

---

## Technical Considerations

### Rendering
- WebGL/Three.js for 3D void canvas
- GSAP for complex animation choreography
- Framer Motion for UI component transitions

### Performance
- LOD (Level of Detail) system for zoomed views
- Particle budget management
- Offscreen element virtualization

### Accessibility
- "Classic Mode" toggle: Converts to high-contrast flat view
- Keyboard navigation layer over spatial interface
- Screen reader announcements for all state changes
