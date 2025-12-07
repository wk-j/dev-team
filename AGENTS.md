# FlowState Agent Guidelines

## Build & Development Commands
All commands run from `app/` directory:
- **Dev**: `npm run dev` (Next.js with Turbopack)
- **Build**: `npm run build` (typecheck + production build)
- **Lint**: `npm run lint` (ESLint with Next.js config)
- **Typecheck**: `npm run typecheck` (TypeScript only)
- **DB**: `npm run db:push` (sync schema), `npm run db:seed` (seed data)

## Code Style
- **Framework**: Next.js 16 App Router, React 19, TypeScript strict
- **Styling**: Tailwind CSS v4, use existing color tokens (void-*, text-*, accent-*, energy-*)
- **3D**: Three.js via @react-three/fiber and @react-three/drei
- **Database**: Drizzle ORM with PostgreSQL, schema in `src/lib/db/schema.ts`
- **Auth**: NextAuth v5 beta, auth helper in `src/lib/auth/index.ts`

## Conventions
- Use `"use client"` directive for client components
- API routes in `src/app/api/`, use NextResponse for responses
- Hooks in `src/lib/api/hooks.ts`, API client in `src/lib/api/client.ts`
- Prefer editing existing files over creating new ones
- Energy states: dormant → kindling → blazing → cooling → crystallized
- Use cosmic/space metaphors: streams (projects), crystals (completed), divers (active users)
