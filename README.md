# FlowState

> Work is not a checklist. It's a living system of energy, momentum, and human connection.

**FlowState** is a revolutionary team tracking application that abandons traditional task management paradigms (Kanban, lists, sprints) in favor of an organic, living workspace where work flows like energy through streams and teams exist as celestial constellations.

## The Concept

Instead of tracking tasks, we track **energy**. Instead of moving cards between columns, we watch work **flow through streams**. Instead of a team directory, we navigate a **living constellation** of connected people.

### Core Metaphors

| Traditional | FlowState |
|-------------|-----------|
| Tasks | Energy entities |
| Kanban columns | Stream flows |
| Team directory | Celestial constellation |
| Assignments | Energy infusion |
| Completion | Crystallization |
| Notifications | Resonance pings |

### Energy States

Work progresses through natural energy states:

```
○ Dormant → ◐ Kindling → ● Blazing → ◐ Cooling → ◇ Crystallized
  (seed)     (warming)    (peak)     (winding)    (complete)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL 16 |
| **ORM** | Drizzle ORM |
| **3D Canvas** | React Three Fiber / Three.js |
| **Animation** | GSAP + Framer Motion |
| **Auth** | NextAuth.js (Auth.js) |
| **Real-time** | Pusher / WebSockets |
| **State** | Zustand |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Push database schema
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes
│   ├── (dashboard)/        # Protected routes
│   │   ├── observatory/    # Main dashboard
│   │   ├── streams/        # Work streams
│   │   ├── constellation/  # Team view
│   │   └── sanctum/        # Settings
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Base UI components
│   └── canvas/             # 3D void components
├── entities/               # Strongly-typed entity classes
├── repositories/           # Data access layer
├── services/               # Business logic layer
├── lib/
│   ├── db/                 # Drizzle schema & connection
│   └── auth/               # NextAuth config
└── types/                  # TypeScript types
```

## Documentation

Full documentation available in [docs/README.md](docs/README.md)

| Category | Documents |
|----------|-----------|
| **Overview** | [Implementation Plan](docs/01-overview/implementation_plan.md), [Tech Stack](docs/01-overview/technology_stack.md), [Glossary](docs/01-overview/glossary.md) |
| **Design** | [Design Spec](docs/02-design/design_spec.md), [Design Tokens](docs/02-design/design_consistency.md), [Pages](docs/02-design/) |
| **Architecture** | [Layers](docs/03-architecture/architecture_layers.md), [Database](docs/03-architecture/database_schema.md), [API](docs/03-architecture/api_reference.md) |
| **Features** | [3D Canvas](docs/04-features/canvas_implementation.md), [Auth](docs/04-features/authentication.md), [Real-time](docs/04-features/realtime.md) |
| **Operations** | [Deployment](docs/05-operations/deployment.md), [Testing](docs/05-operations/testing.md), [Monitoring](docs/05-operations/monitoring.md) |

## Key Features

### The Observatory
A cosmic viewport showing team activity, energy flows, and collective rhythm at a glance.

### Energy Streams
Work flows through streams like rivers. Dive in for immersive focus, surface to see the big picture.

### Resonance Network
Team members as celestial bodies with orbital states, connection lines, and collaborative energy.

### Crystallization
Completed work transforms into permanent crystals, building a garden of achievement over time.

### Deep Work Protection
Orbital states (Open, Deep Work, Recovery) control availability and queue interruptions respectfully.

## Architecture Highlights

### Strongly-Typed Entities
```typescript
class WorkItemEntity {
  kindle(diverId: string): WorkItemEntity;
  blaze(): WorkItemEntity;
  crystallize(facets: number, brilliance: number): WorkItemEntity;
}
```

### Repository Pattern
```typescript
const item = await workItemRepository.findById(id);
const items = await workItemRepository.findByStreamId(streamId);
```

### Service Layer
```typescript
const sparked = await energyService.spark(input, userId);
const kindled = await energyService.kindle(itemId, diverId);
const crystal = await energyService.crystallize(itemId);
```

### Type-Safe Database
```typescript
// Drizzle ORM with PostgreSQL
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.orbitalState, 'open'));
```

## Why FlowState?

### Psychology
- Intrinsic motivation through energy metaphors
- Reduced anxiety — no "overdue" shame
- Connection focus over task completion

### Productivity
- Flow state optimization in the interface itself
- Natural prioritization through visual energy
- Async-first with resonance pings

### Team Health
- Burnout visibility through energy states
- Collaboration celebration via resonance
- Lasting satisfaction from crystal gardens

## Accessibility

FlowState includes multiple accessibility modes:
- **High Contrast Mode**: Solid colors, no gradients
- **Reduced Motion**: Minimal animations
- **Classic View**: 2D fallback for those who prefer traditional layouts
- **Screen Reader Support**: Full announcements and keyboard navigation

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checker

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev)
npm run db:studio    # Open Drizzle Studio
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Real-time (optional)
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."

# Integrations (optional)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

## Contributing

1. Read the [Implementation Plan](docs/01-overview/implementation_plan.md)
2. Check the [Glossary](docs/01-overview/glossary.md) for terminology
3. Follow patterns in [Architecture Layers](docs/03-architecture/architecture_layers.md)
4. Ensure types are strict (no `any`)
5. Write tests for services

## License

MIT

---

*The void awaits your energy.*
