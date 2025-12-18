# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowState is a team tracking application that replaces traditional task management with an organic "Living Workspace" where work flows as energy through streams and teams exist as celestial constellations.

## Build & Development Commands

All commands run from the `app/` directory:

```bash
npm run dev          # Start dev server (Next.js with Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking

# Database (Drizzle ORM)
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Drizzle Studio GUI
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth v5 (Auth.js)
- **3D Visualization**: Three.js via @react-three/fiber and @react-three/drei

### Directory Structure (app/src/)
```
app/                    # Next.js App Router
├── (auth)/             # Auth routes (login, register)
├── (dashboard)/        # Protected routes
│   ├── observatory/    # Main dashboard (3D team constellation)
│   ├── streams/        # Work streams (projects)
│   ├── constellation/  # Team visualization
│   ├── inbox/          # Resonance pings (notifications)
│   ├── team/           # Team management
│   └── sanctum/        # User settings
└── api/                # REST API routes

components/
└── canvas/             # Three.js 3D components (VoidCanvas, ConstellationView, etc.)

lib/
├── api/client.ts       # API client singleton
├── api/hooks.ts        # React hooks for data fetching
├── auth/index.ts       # NextAuth configuration
└── db/
    ├── schema.ts       # Drizzle schema (all tables & types)
    ├── index.ts        # Database connection
    └── energy.ts       # Energy state utilities
```

### Domain Concepts

| Traditional | FlowState Term |
|-------------|----------------|
| Tasks | Work items (energy entities) |
| Projects | Streams |
| Task states | Energy states: dormant → kindling → blazing → cooling → crystallized |
| Team members | Celestial bodies with orbital states |
| Assignments | Energy infusion |
| Completion | Crystallization |
| Notifications | Resonance pings |

### Key Enums (from schema.ts)
- **Energy states**: dormant, kindling, blazing, cooling, crystallized
- **Stream states**: nascent, flowing, rushing, flooding, stagnant, evaporated
- **Orbital states**: open, focused, deep_work, away, supernova
- **Work item depth**: shallow, medium, deep, abyssal
- **Ping types**: gentle, warm, direct

## Code Conventions

- Use `"use client"` directive for client components
- API routes use NextResponse for responses
- Use existing Tailwind color tokens: `void-*`, `text-*`, `accent-*`, `energy-*`
- Prefer cosmic/space metaphors in naming (streams, crystals, divers, constellation)
- Database types are exported from `src/lib/db/schema.ts`
