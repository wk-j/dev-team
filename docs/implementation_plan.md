# FlowState — Implementation Plan

## Vision Statement
Build a revolutionary team energy tracking application that abandons traditional task management paradigms in favor of an **organic, living workspace** where work flows like energy through streams and teams exist as celestial constellations.

> "We're not building a task manager. We're building a living universe where work breathes."

---

## Core Concept Pillars

| Traditional | FlowState |
|-------------|-----------|
| Tasks | Energy entities |
| Kanban columns | Stream flow positions |
| Team directory | Celestial constellation |
| Assignments | Energy infusion |
| Completion | Crystallization |
| Notifications | Resonance pings |
| Projects | Momentum streams |
| Dashboards | The Observatory |

---

## Tech Stack

> **Full details**: See [Technology Stack](./technology_stack.md) for complete configuration and setup.

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | Full-stack React framework (App Router) |
| **React** | 18.x | UI component library |
| **TypeScript** | 5.x | Strict type safety |
| **Tailwind CSS** | 3.x | Utility-first styling |

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16.x | Primary relational database |
| **Drizzle ORM** | latest | Type-safe SQL with migrations |
| **Redis** | latest | Caching & real-time pub/sub |

### 3D & Animation
| Technology | Purpose |
|------------|---------|
| **Three.js / React Three Fiber** | 3D void canvas rendering |
| **@react-three/postprocessing** | Bloom, glow, depth effects |
| **GSAP** | Complex animation choreography |
| **Framer Motion** | UI component transitions |

### Authentication & Real-time
| Technology | Purpose |
|------------|---------|
| **NextAuth.js (Auth.js)** | Authentication framework |
| **Pusher / Socket.io** | WebSocket real-time updates |
| **Zustand** | Client-side state management |

### Fonts
| Font | Usage |
|------|-------|
| **Space Grotesk** | Display, headings |
| **IBM Plex Sans** | Body, UI elements |
| **JetBrains Mono** | Data, metrics, code |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   3D Void   │  │    React    │  │   Zustand   │                 │
│  │   Canvas    │  │ Components  │  │   Stores    │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
├──────────────────────────┼──────────────────────────────────────────┤
│                     API LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Server    │  │    API      │  │  NextAuth   │                 │
│  │   Actions   │  │   Routes    │  │    Auth     │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
├──────────────────────────┼──────────────────────────────────────────┤
│                   SERVICE LAYER                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │    User     │  │   Stream    │  │  Resonance  │                 │
│  │   Service   │  │   Service   │  │   Service   │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
├──────────────────────────┼──────────────────────────────────────────┤
│                 REPOSITORY LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │    User     │  │   Stream    │  │  WorkItem   │                 │
│  │    Repo     │  │    Repo     │  │    Repo     │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
├──────────────────────────┼──────────────────────────────────────────┤
│                    DATA LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Drizzle   │  │ PostgreSQL  │  │    Redis    │                 │
│  │     ORM     │  │   Database  │  │    Cache    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Phases

### Phase 0: Project Foundation
**Goal**: Set up the complete development environment

**Deliverables:**
- [ ] Next.js 14 project with App Router
- [ ] TypeScript strict mode configuration
- [ ] Tailwind CSS with FlowState design tokens
- [ ] PostgreSQL database setup
- [ ] Drizzle ORM with schema & migrations
- [ ] NextAuth.js authentication
- [ ] Entity classes & repository pattern
- [ ] Basic API routes structure

**Technical Notes:**
- See [Technology Stack](./technology_stack.md) for configurations
- See [Database Schema](./database_schema.md) for entity definitions
- Use `npm run db:push` for rapid development

---

### Phase 1: The Void Foundation
**Goal**: Establish the infinite canvas and basic navigation

**Deliverables:**
- [ ] React Three Fiber canvas setup
- [ ] Basic void environment (stars, nebula background)
- [ ] Camera controls (pan, zoom, fly-to)
- [ ] Intention Wheel (radial menu) component
- [ ] Basic particle system for ambiance
- [ ] Performance monitoring setup

**Technical Notes:**
- Use `@react-three/drei` OrbitControls initially
- Implement LOD (Level of Detail) system early
- Performance budget: 60fps on mid-tier devices

---

### Phase 2: Celestial Bodies (Team)
**Goal**: Render team members as interactive celestial bodies

**Deliverables:**
- [ ] `CelestialBody` 3D component
- [ ] Energy state visualization (dormant→blazing colors)
- [ ] Pulse/breathing animation system
- [ ] Connection lines between bodies (resonance)
- [ ] Hover/click interactions with floating UI
- [ ] Member profile card component
- [ ] Orbital state indicators

**API Endpoints:**
- `GET /api/users` — List team members
- `GET /api/users/[id]` — Get user details
- `PATCH /api/users/[id]/orbital-state` — Update orbital state
- `GET /api/users/[id]/resonance` — Get resonance connections

---

### Phase 3: Energy Streams (Work)
**Goal**: Implement flowing work streams

**Deliverables:**
- [ ] `Stream` 3D component with particle flow
- [ ] `WorkItem` entities along streams
- [ ] Energy state transitions with animations
- [ ] Dive mode (immersive stream view)
- [ ] Stream health indicators
- [ ] "Spark" work item creation flow
- [ ] Crystallization ceremony animation

**API Endpoints:**
- `GET /api/streams` — List streams
- `POST /api/streams` — Create stream
- `GET /api/streams/[id]` — Get stream with items
- `POST /api/streams/[id]/dive` — Record dive
- `POST /api/streams/[id]/surface` — Record surface
- `GET /api/work-items` — List work items
- `POST /api/work-items` — Spark new item
- `PATCH /api/work-items/[id]/energy` — Update energy state
- `POST /api/work-items/[id]/crystallize` — Crystallize item

---

### Phase 4: The Observatory (Dashboard)
**Goal**: Build the main command center view

**Deliverables:**
- [ ] Default Observatory camera position
- [ ] Pulse Core visualization (team heartbeat)
- [ ] Crystal Garden display
- [ ] Stream overview layer
- [ ] Time-based ambient lighting
- [ ] Quick stats floating panels
- [ ] Weather system (team health metaphors)

**API Endpoints:**
- `GET /api/observatory/metrics` — Aggregate team metrics
- `GET /api/observatory/pulse` — Real-time pulse data
- `GET /api/crystals` — Crystal garden data

---

### Phase 5: Resonance System (Interaction)
**Goal**: Enable team communication

**Deliverables:**
- [ ] Ping types (gentle, warm, direct)
- [ ] Ping travel animation through void
- [ ] Notification queue system
- [ ] Resonance score calculation
- [ ] Collaboration event triggers
- [ ] Handoff/passing the torch flow

**API Endpoints:**
- `POST /api/pings` — Send ping
- `GET /api/pings/inbox` — Get received pings
- `PATCH /api/pings/[id]/read` — Mark as read
- `GET /api/resonance/[userId]` — Get resonance data

**Technical Notes:**
- WebSocket for real-time ping delivery
- Queue management for Deep Work mode
- Sound integration (optional, toggle-able)

---

### Phase 6: The Sanctum (Settings)
**Goal**: Personal customization space

**Deliverables:**
- [ ] Sanctum environment transition
- [ ] Profile/essence customization
- [ ] Orbit schedule configuration
- [ ] Resonance preferences
- [ ] Powers (interface settings)
- [ ] Portal integrations UI
- [ ] Accessibility modes

**API Endpoints:**
- `GET /api/me` — Current user profile
- `PATCH /api/me` — Update profile
- `GET /api/me/preferences` — Get preferences
- `PATCH /api/me/preferences` — Update preferences
- `GET /api/me/schedules` — Orbital schedules
- `POST /api/me/schedules` — Create schedule
- `GET /api/portals` — List integrations
- `POST /api/portals/[provider]/connect` — Connect portal

---

### Phase 7: Accessibility & Polish
**Goal**: Ensure inclusive experience

**Deliverables:**
- [ ] High Contrast mode (flat colors)
- [ ] Reduced Motion mode
- [ ] Screen reader announcements
- [ ] Keyboard-only navigation layer
- [ ] Classic 2D View fallback
- [ ] Performance optimization pass
- [ ] Mobile responsive considerations

---

## Data Model

> **Full details**: See [Database Schema](./database_schema.md) for complete Drizzle schema and entity classes.

### Core Entities

```typescript
// User (Celestial Body)
class UserEntity {
  id: string;
  email: string;
  name: string;
  starType: StarType;
  orbitalState: OrbitalState;
  energySignatureColor: string;
  position: Position3D;
  currentEnergyLevel: number;
  preferences: UserPreferences;
}

// Stream (Work Flow)
class StreamEntity {
  id: string;
  teamId: string;
  name: string;
  state: StreamState;
  velocity: number;
  path: StreamPath;
  itemCount: number;
  crystalCount: number;
}

// WorkItem (Energy Entity)
class WorkItemEntity {
  id: string;
  streamId: string;
  title: string;
  energyState: EnergyState;
  energyLevel: number;
  depth: WorkItemDepth;
  streamPosition: number;
  primaryDiverId: string;
}

// ResonancePing
class ResonancePingEntity {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: PingType;
  status: PingStatus;
  message: string;
}
```

### Enums

```typescript
enum StarType {
  SUN = 'sun',
  GIANT = 'giant',
  MAIN_SEQUENCE = 'main_sequence',
  DWARF = 'dwarf',
  NEUTRON = 'neutron',
}

enum OrbitalState {
  OPEN = 'open',
  DEEP_WORK = 'deep_work',
  RECOVERY = 'recovery',
  SUPERNOVA = 'supernova',
  ECLIPSE = 'eclipse',
}

enum EnergyState {
  DORMANT = 'dormant',
  KINDLING = 'kindling',
  BLAZING = 'blazing',
  COOLING = 'cooling',
  CRYSTALLIZED = 'crystallized',
}

enum StreamState {
  RUSHING = 'rushing',
  FLOWING = 'flowing',
  STAGNANT = 'stagnant',
  FROZEN = 'frozen',
  FLOODING = 'flooding',
  EVAPORATED = 'evaporated',
}
```

---

## API Design

### RESTful Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List team members |
| `GET` | `/api/users/[id]` | Get user details |
| `PATCH` | `/api/users/[id]` | Update user |
| `GET` | `/api/streams` | List streams |
| `POST` | `/api/streams` | Create stream |
| `GET` | `/api/streams/[id]` | Get stream with items |
| `PATCH` | `/api/streams/[id]` | Update stream |
| `DELETE` | `/api/streams/[id]` | Evaporate stream |
| `GET` | `/api/work-items` | List work items |
| `POST` | `/api/work-items` | Spark new item |
| `PATCH` | `/api/work-items/[id]` | Update item |
| `POST` | `/api/work-items/[id]/kindle` | Kindle dormant item |
| `POST` | `/api/work-items/[id]/crystallize` | Crystallize item |
| `POST` | `/api/pings` | Send resonance ping |
| `GET` | `/api/pings/inbox` | Get received pings |

### Server Actions

For mutations that benefit from optimistic updates:

```typescript
// src/app/actions/work-items.ts
'use server'

export async function sparkWorkItem(data: SparkWorkItemInput) { }
export async function kindleWorkItem(id: string, diverId: string) { }
export async function crystallizeWorkItem(id: string) { }
export async function updateEnergyLevel(id: string, level: number) { }
```

---

## Verification Plan

### Automated Testing

```bash
# Unit tests for entities & services
npm run test:unit

# Component tests
npm run test:components

# API integration tests
npm run test:api

# E2E tests
npm run test:e2e

# Performance benchmarks
npm run test:perf

# Type checking
npm run typecheck
```

### Manual Verification Checklist
- [ ] Void canvas loads and is navigable
- [ ] Team members render as celestial bodies
- [ ] Energy states transition smoothly
- [ ] Streams flow with visible particles
- [ ] Dive mode activates correctly
- [ ] Pings travel between users visually
- [ ] Crystallization animation plays
- [ ] Observatory shows aggregate data
- [ ] Sanctum settings persist
- [ ] Accessibility modes function

### Performance Targets

| Metric | Target |
|--------|--------|
| Initial Load (LCP) | < 2.5s |
| Time to Interactive | < 3s |
| Frame Rate | 60fps (30fps mobile) |
| API Response (p95) | < 200ms |
| Memory Usage | < 200MB |
| Particle Count | 10,000 max |
| Database Queries | < 50ms average |

---

## Risk Mitigation

### Performance Risks
- **Risk**: 3D rendering too heavy
- **Mitigation**: LOD system, particle budgets, progressive enhancement, 2D fallback

### Usability Risks
- **Risk**: Metaphor too abstract for users
- **Mitigation**: Onboarding tutorial, tooltips, Classic View fallback

### Accessibility Risks
- **Risk**: Visual-heavy interface excludes users
- **Mitigation**: Screen reader mode, high contrast, keyboard nav from day one

### Scope Risks
- **Risk**: Feature creep delays launch
- **Mitigation**: Phase-based delivery, MVP focus on Phase 0-4

### Database Risks
- **Risk**: Complex queries slow down
- **Mitigation**: Proper indexing, Redis caching, query optimization

---

## Definition of Done

A feature is complete when:
1. Functionality works as specified
2. TypeScript types are strict (no `any`)
3. Database migrations are created
4. API endpoints are documented
5. Unit tests pass (>80% coverage for services)
6. Animations run at 60fps
7. Accessibility mode equivalent exists
8. Mobile responsive (or gracefully degraded)
9. Code reviewed and merged

---

## Related Documentation

- [Technology Stack](./technology_stack.md) — Full tech stack details
- [Database Schema](./database_schema.md) — Entity classes & Drizzle schema
- [Design Specification](./design_spec.md) — Visual design language
- [Design Consistency](./design_consistency.md) — Tokens & components
- [Onboarding Flow](./onboarding_flow.md) — First Contact experience
- [Glossary](./glossary.md) — FlowState terminology
