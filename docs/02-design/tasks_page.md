# Energy Streams — Work View

## Concept
Work doesn't live in columns or lists. Work **flows through streams** — continuous rivers of effort that team members dive into. Each stream has its own current, depth, and ecosystem of work items moving through it.

---

## The Stream Metaphor

### Why Streams?
Traditional task management treats work as static objects to be moved between buckets. FlowState treats work as **living entities** swimming through currents:

- Work has **momentum** (how fast it's moving)
- Work can **merge** or **fork** naturally
- Work can get **stuck in eddies** (blockers)
- Work eventually reaches the **crystallization delta**

### Stream Anatomy
```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   SOURCE          RAPIDS           DEEP FLOW        DELTA          ║
║   (Dormant)       (Kindling)       (Blazing)        (Crystallizing)║
║                                                                    ║
║    ○ ○ ○    →    ◐ ◐    →→→    ● ● ●    →→→    ◇ ◇               ║
║    seeds         sparking        in flow          becoming gems    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Stream Structure

### Stream Header
Each stream has a living header:

```
┌─────────────────────────────────────────────────────────────────┐
│  ≋≋≋ API Redesign Stream ≋≋≋                                    │
│                                                                 │
│  Current: ████████░░ Strong          Divers: ◐ ◐ ●              │
│  Depth: 12 items                     Crystals: ◇◇◇◇◇ (5 done)   │
│                                                                 │
│  [Dive In]  [Surface]  [Fork Stream]  [⋮ More]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Stream Metrics:**
- **Current**: How fast work is moving (velocity)
- **Depth**: Total items in the stream
- **Divers**: Team members currently active
- **Crystals**: Completed work count

### Stream States

| State | Visual | Meaning |
|-------|--------|---------|
| **Rushing** | Fast animated particles | High velocity, lots of activity |
| **Flowing** | Steady gentle movement | Normal healthy pace |
| **Stagnant** | Slow, murky appearance | Blocked or abandoned |
| **Frozen** | Ice crystal overlay | Intentionally paused |
| **Flooding** | Overflowing banks | Too much work, needs attention |

---

## Work Items as Living Entities

### Energy States (Lifecycle)

Work items are **organisms**, not cards:

#### 1. Dormant Seed ○
```
    ○ "Add user authentication"
    │
    ├── Planted by: Alex
    ├── Age: 3 days dormant
    └── Waiting for: Energy infusion
```
- Exists in stream's source pool
- Dim, barely visible, slowly pulsing
- Waiting for someone to infuse energy

#### 2. Kindling Spark ◐
```
    ◐ "Add user authentication"
   ╱│╲
    │  ← Flickering warmth
    ├── Infused by: Sarah
    ├── Energy: 25% kindled
    └── Building momentum...
```
- Someone has started work
- Warming glow, flickering animation
- Beginning to move through stream

#### 3. Blazing Core ●
```
    ● "Add user authentication"
   ╱█╲
    █  ← Intense glow, rapid pulse
    ├── Divers: Sarah, Alex
    ├── Energy: 78% blazing
    └── In full flow state
```
- Active, focused work
- Bright, radiant, moving fast
- Highest visibility

#### 4. Cooling Ember ◐
```
    ◐ "Add user authentication"
    │  ← Warm fade, slower pulse
    ├── Primary: Sarah
    ├── Status: Wrapping up
    └── Approaching crystallization
```
- Work completing
- Soft warm glow, slowing down
- Preparing for handoff/review

#### 5. Crystallized Gem ◇
```
    ◇ "Add user authentication"
    │  ← Solid, reflective
    ├── Crystallized by: Sarah
    ├── Time in stream: 4 days
    └── Contribution: +127 value
```
- Complete, permanent
- Joins the crystal garden
- Forever commemorated

---

## Stream View Modes

### 1. Flow View (Default)
See work flowing naturally through the stream:

```
SOURCE ──────────────────────────────────────────────────────► DELTA

   ○ ○      ◐       ◐ ●        ●        ◐         ◇ ◇ ◇
   ○        ◐              ● ●             ◐
              ◐                   ●              ◇
```

- Items float and drift at their natural pace
- Clustering shows related work
- Can grab and move items manually

### 2. Depth View
Cross-section showing item depth/complexity:

```
Surface ═══════════════════════════════════════════
         ○ ○ ○ ○ (small tasks)
         ───────
         ◐ ◐ ◐ (medium work)
         ─────────────
         ● ● (deep focus items)
         ───────────────────
         ● (massive undertaking)
Deep ═══════════════════════════════════════════════
```

### 3. Timeline View
Horizontal time-based layout:

```
         Past                 Now                 Future
         │                     │                     │
    ◇◇◇◇◇│    ●●●◐◐◐○○○○○○    │     ○○○○           │
         │                     │                     │
         └─────────────────────┴─────────────────────┘
```

### 4. Energy Map View
Heat visualization of where energy concentrates:

```
┌─────────────────────────────────────────┐
│░░░░░░░░░▒▒▒▒▒▒▓▓▓▓████▓▓▓▒▒░░░░░░░░░░░│
│         ↑           ↑                   │
│      Low energy   High energy           │
└─────────────────────────────────────────┘
```

---

## Diving Into a Stream

When you "Dive In" to a stream, the interface transforms:

### Immersive Dive Mode
```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   You are diving in: API Redesign                                 ║
║   ─────────────────────────────────                               ║
║                                                                   ║
║   ┌─────────────────────────────────────────────────────────┐     ║
║   │                                                         │     ║
║   │     ● Your Focus: "Implement OAuth flow"                │     ║
║   │                                                         │     ║
║   │     ════════════════════════════════                    │     ║
║   │     Energy: ████████░░ 80% Blazing                      │     ║
║   │                                                         │     ║
║   │     Nearby Items:                                       │     ║
║   │       ◐ "Add refresh token logic" (related)             │     ║
║   │       ○ "Write auth tests" (dependent)                  │     ║
║   │                                                         │     ║
║   └─────────────────────────────────────────────────────────┘     ║
║                                                                   ║
║   Fellow Divers: ◐ Sarah (nearby)  ● Alex (deep)                  ║
║                                                                   ║
║   [Surface]  [Grab Nearby Item]  [Signal Diver]  [Log Discovery]  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Dive Features:
- **Focus Mode**: Other streams fade to background
- **Proximity Awareness**: See nearby related items
- **Diver Communication**: Quick signals to co-divers
- **Discovery Log**: Capture findings/blockers as you work

---

## Work Item Interactions

### Sparking New Work
Instead of "Create Task":

```
┌─────────────────────────────────────────┐
│  ✨ Spark New Work                      │
│                                         │
│  What are you planting?                 │
│  ┌─────────────────────────────────────┐│
│  │ Add rate limiting to API            ││
│  └─────────────────────────────────────┘│
│                                         │
│  Which stream?                          │
│  ◉ API Redesign                         │
│  ○ Infrastructure                       │
│  ○ + New Stream...                      │
│                                         │
│  Initial energy:                        │
│  ○ Dormant (seed for later)             │
│  ◉ Kindling (start warming up)          │
│  ○ Blazing (diving in now)              │
│                                         │
│  Estimated depth: ○ ○ ○ ◐ ○             │
│                   (Medium)              │
│                                         │
│         [Plant Seed ○]                  │
└─────────────────────────────────────────┘
```

### Infusing Energy
To start working on a dormant item:
1. Hover over seed: "Ready to kindle?"
2. Click and hold: Energy transfers from you to item
3. Visual: Your avatar's glow flows into the seed
4. Seed transforms to kindling state
5. You're now the primary diver

### Passing the Torch
To hand off work:
1. Drag your energy signature to another diver
2. Brief "flame handoff" animation
3. Their energy now powers the item
4. Your connection becomes secondary

### Surfacing Discoveries
While working, capture insights:

```
┌────────────────────────────────────────────┐
│ 📍 Discovery Point                         │
│                                            │
│ Found something?                           │
│ ┌────────────────────────────────────────┐ │
│ │ The old auth system is incompatible... │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Type:                                      │
│ ○ Blocker (creates eddy)                   │
│ ◉ Insight (valuable knowledge)             │
│ ○ Fork idea (spawn new seed)               │
│                                            │
│          [Log Discovery]                   │
└────────────────────────────────────────────┘
```

---

## Stream Operations

### Forking a Stream
When work needs to split:
```
        Original Stream
═══════════════════════════════
              ║
              ╠════════════════ Fork: Mobile Specific
              ║
═══════════════════════════════
        Continues...
```

### Merging Streams
When separate efforts combine:
```
Stream A ═══════════════╗
                        ╠═══════════ Merged Stream
Stream B ═══════════════╝
```

### Archiving (Stream Evaporation)
Completed or abandoned streams don't delete — they evaporate:
- Stream gradually fades over time
- Crystals remain in the garden
- Searchable in "Evaporated Streams" history
- Can be "reconstituted" if needed

---

## Stream Health Indicators

### Healthy Stream
- Steady particle flow
- Mix of energy states
- Regular crystallization
- Active divers

### Warning Signs

**Stagnation Warning:**
```
⚠ Stream "Old Feature" stagnant for 14 days
   │
   ├── 3 items haven't moved
   ├── No active divers
   └── Suggest: Archive or refresh
```

**Flooding Alert:**
```
🌊 Stream "Q4 Launch" flooding!
   │
   ├── 47 items (capacity: 20)
   ├── Divers overwhelmed
   └── Suggest: Fork or redistribute
```

**Energy Drain:**
```
🔋 Stream "Backend Refactor" losing energy
   │
   ├── Items cooling without crystallizing
   ├── Possible blockers detected
   └── Suggest: Surface for team discussion
```

---

## Crystallization Ceremony

When work completes, it's not just "Done" — it **crystallizes**:

### The Moment
1. Item reaches cooling state
2. Diver initiates crystallization
3. Brief celebration animation
4. Crystal forms with unique shape based on:
   - Time in stream
   - Contributors
   - Complexity
   - Impact

### Crystal Properties
```
◇ "Implement OAuth flow"
│
├── Facets: 7 (contributors)
├── Brilliance: ★★★★☆ (impact)
├── Formation: 4 days
├── Core energy: Sarah (primary)
└── Secondary: Alex, Jordan
```

### Permanent Record
Crystals never disappear. They:
- Live in the Crystal Garden
- Contribute to team constellation brightness
- Form patterns showing team's work history
- Can be revisited for context/learning
