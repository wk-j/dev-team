# FlowState Technology Stack

## Overview

FlowState is built on a modern, type-safe stack optimized for real-time collaboration, 3D visualization, and developer experience.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  Next.js 14 (App Router) + React 18 + TypeScript                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ React Three │ │  Tailwind   │ │   Framer    │               │
│  │   Fiber     │ │    CSS      │ │   Motion    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                │
│  Next.js API Routes + Server Actions                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │    Zod      │ │   Server    │ │  NextAuth   │               │
│  │ Validation  │ │   Actions   │ │    Auth     │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Drizzle   │ │ PostgreSQL  │ │   Redis     │               │
│  │     ORM     │ │  Database   │ │   Cache     │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | Full-stack React framework with App Router |
| **React 18** | UI component library |
| **TypeScript** | Type-safe JavaScript |

### Styling & UI

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first CSS |
| **tailwind-merge** | Merge classes intelligently |
| **class-variance-authority** | Component variants |

### 3D & Animation

| Technology | Purpose |
|------------|---------|
| **Three.js** | 3D graphics |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | R3F helpers |
| **@react-three/postprocessing** | Bloom, glow effects |
| **Framer Motion** | UI animations |
| **GSAP** | Complex animation sequences |

### Database

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **Drizzle ORM** | Type-safe SQL |
| **Redis** | Caching (optional) |

### Authentication

| Technology | Purpose |
|------------|---------|
| **NextAuth.js v5** | Auth framework |
| **bcrypt** | Password hashing |

### Real-time & State

| Technology | Purpose |
|------------|---------|
| **Zustand** | Client state |
| **Pusher** | WebSocket connections |
| **TanStack Query** | Server state |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Vercel** | Deployment |
| **Neon/Supabase** | Managed PostgreSQL |

---

## Project Structure

```
flowstate/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, register)
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── observatory/    # Main dashboard
│   │   │   ├── streams/        # Work streams
│   │   │   ├── constellation/  # Team view
│   │   │   └── sanctum/        # Settings
│   │   └── api/                # API routes
│   │
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── canvas/             # 3D void components
│   │   └── [feature]/          # Feature-specific
│   │
│   ├── lib/
│   │   ├── db/                 # Database connection & schema
│   │   ├── auth/               # NextAuth config
│   │   └── validators/         # Zod schemas
│   │
│   ├── entities/               # Domain entity classes
│   ├── repositories/           # Data access layer
│   ├── services/               # Business logic
│   ├── hooks/                  # React hooks
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
│
├── public/
│   ├── textures/               # 3D textures
│   └── fonts/
│
└── drizzle/                    # Migrations
```

---

## Key Design Decisions

### Why Next.js 14 App Router?
- Server Components reduce bundle size
- Streaming for better UX
- Server Actions simplify mutations
- Built-in image optimization

### Why Drizzle ORM?
- Type-safe queries
- Lightweight (no query builder overhead)
- SQL-first approach
- Great migration tooling

### Why Zustand over Redux?
- Minimal boilerplate
- No providers needed
- Simple API
- Works great with Server Components

### Why Pusher over Socket.io?
- Managed infrastructure
- Reliable at scale
- Simple API
- Presence channels built-in

### Why React Three Fiber?
- React paradigm for 3D
- Declarative scene graph
- Easy integration with React ecosystem
- Great performance with proper optimization

---

## Performance Considerations

### 3D Canvas
- Use `React.memo` for all celestial components
- Implement LOD (Level of Detail) for distant objects
- Use instanced meshes for particles
- Dynamic quality based on device capability

### Database
- Connection pooling via Drizzle
- Redis caching for frequent queries
- Proper indexing on foreign keys
- Pagination for large result sets

### Next.js
- Server Components by default
- Streaming for large data
- Image optimization
- Route prefetching

---

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run db:push    # Push schema (dev)
npm run db:migrate # Run migrations
npm run db:studio  # Drizzle Studio GUI
```
