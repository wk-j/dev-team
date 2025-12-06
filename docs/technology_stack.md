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
│  │    Zod      │ │   tRPC or   │ │  NextAuth   │               │
│  │ Validation  │ │ Server Acts │ │    Auth     │               │
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

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | Full-stack React framework with App Router |
| **React** | 18.x | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **tailwind-merge** | latest | Merge Tailwind classes intelligently |
| **class-variance-authority** | latest | Component variant management |
| **clsx** | latest | Conditional class composition |

### 3D & Animation

| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | latest | 3D graphics library |
| **@react-three/fiber** | latest | React renderer for Three.js |
| **@react-three/drei** | latest | Useful helpers for R3F |
| **@react-three/postprocessing** | latest | Post-processing effects (bloom, glow) |
| **Framer Motion** | latest | React animation library |
| **GSAP** | latest | Advanced animation sequencing |

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16.x | Primary relational database |
| **Drizzle ORM** | latest | Type-safe SQL ORM |
| **drizzle-kit** | latest | Migration and schema tooling |
| **drizzle-zod** | latest | Zod schema generation from Drizzle |

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **NextAuth.js** | 5.x (Auth.js) | Authentication framework |
| **bcrypt** | latest | Password hashing |
| **jose** | latest | JWT handling |

### Validation & Type Safety

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | latest | Runtime type validation |
| **ts-pattern** | latest | Pattern matching for TypeScript |

### Real-time & State

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | latest | Lightweight state management |
| **Pusher** or **Socket.io** | latest | Real-time WebSocket connections |
| **@tanstack/react-query** | latest | Server state management |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Redis** | latest | Caching, session storage, real-time pub/sub |
| **Vercel** | - | Deployment platform (recommended) |
| **Docker** | latest | Local development & containerization |

---

## Project Structure

```
flowstate/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/          # Protected routes
│   │   │   ├── observatory/      # Main dashboard
│   │   │   ├── streams/          # Work streams
│   │   │   ├── constellation/    # Team view
│   │   │   └── sanctum/          # Settings
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── streams/
│   │   │   ├── work-items/
│   │   │   └── resonance/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── GlassPanel.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ...
│   │   ├── canvas/               # 3D void components
│   │   │   ├── VoidCanvas.tsx
│   │   │   ├── CelestialBody.tsx
│   │   │   ├── Stream.tsx
│   │   │   ├── Particles.tsx
│   │   │   └── ...
│   │   ├── observatory/          # Dashboard components
│   │   ├── streams/              # Stream components
│   │   ├── constellation/        # Team components
│   │   └── sanctum/              # Settings components
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts          # Database connection
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   └── migrations/       # SQL migrations
│   │   ├── auth/
│   │   │   └── config.ts         # NextAuth configuration
│   │   ├── validators/           # Zod schemas
│   │   └── utils/                # Utility functions
│   │
│   ├── entities/                 # Strongly-typed entity classes
│   │   ├── base.entity.ts
│   │   ├── user.entity.ts
│   │   ├── stream.entity.ts
│   │   ├── work-item.entity.ts
│   │   ├── resonance-ping.entity.ts
│   │   └── index.ts
│   │
│   ├── repositories/             # Data access layer
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── stream.repository.ts
│   │   └── work-item.repository.ts
│   │
│   ├── services/                 # Business logic layer
│   │   ├── user.service.ts
│   │   ├── stream.service.ts
│   │   ├── energy.service.ts
│   │   └── resonance.service.ts
│   │
│   ├── hooks/                    # React hooks
│   │   ├── useVoidNavigation.ts
│   │   ├── useEnergyState.ts
│   │   ├── useResonance.ts
│   │   └── ...
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── void.store.ts
│   │   ├── user.store.ts
│   │   └── stream.store.ts
│   │
│   └── types/                    # TypeScript types
│       ├── api.types.ts
│       ├── canvas.types.ts
│       └── index.ts
│
├── public/
│   ├── textures/                 # 3D textures
│   └── fonts/
│
├── drizzle/                      # Drizzle config & migrations
│   └── migrations/
│
├── tailwind.config.ts
├── drizzle.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Package.json Dependencies

```json
{
  "name": "flowstate",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    
    "three": "^0.162.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.100.0",
    "@react-three/postprocessing": "^2.16.0",
    
    "framer-motion": "^11.0.0",
    "gsap": "^3.12.0",
    
    "tailwindcss": "^3.4.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0",
    "@neondatabase/serverless": "^0.9.0",
    
    "next-auth": "^5.0.0-beta.15",
    "bcrypt": "^5.1.0",
    
    "zod": "^3.22.0",
    "drizzle-zod": "^0.5.0",
    "ts-pattern": "^5.1.0",
    
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.28.0",
    
    "pusher": "^5.2.0",
    "pusher-js": "^8.4.0",
    
    "lucide-react": "^0.358.0",
    "date-fns": "^3.6.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/three": "^0.162.0",
    "@types/bcrypt": "^5.0.0",
    
    "drizzle-kit": "^0.20.0",
    
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Environment Configuration

### .env.local

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/flowstate"

# For serverless (Neon/Vercel Postgres)
DATABASE_URL_UNPOOLED="postgresql://user:password@localhost:5432/flowstate"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# OAuth Providers (optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Real-time (Pusher)
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER=""

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/repositories/*": ["./src/repositories/*"],
      "@/services/*": ["./src/services/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Tailwind Configuration

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // The Void (Backgrounds)
        void: {
          deep: '#05080f',
          nebula: '#0a1628',
          atmosphere: '#0f1f3d',
          surface: '#1a2a4a',
        },
        // Energy States
        energy: {
          dormant: {
            DEFAULT: '#3d5a5a',
            glow: '#1a2f2f',
          },
          kindling: {
            DEFAULT: '#ff6b35',
            glow: '#ff8c5a',
          },
          blazing: {
            DEFAULT: '#ffd700',
            glow: '#ffed4a',
          },
          cooling: {
            DEFAULT: '#9370db',
            glow: '#b39ddb',
          },
          crystallized: {
            DEFAULT: '#00ffc8',
            glow: '#4dffd7',
          },
        },
        // Accents
        accent: {
          primary: '#00d4ff',
          secondary: '#b388ff',
          warning: '#ff5252',
          success: '#69f0ae',
        },
        // Text
        text: {
          stellar: '#ffffff',
          bright: '#e2e8f0',
          dim: '#94a3b8',
          muted: '#64748b',
          faded: '#475569',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        cosmic: ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        stellar: ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        nebula: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        planet: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        star: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        moon: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        dust: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 212, 255, 0.3)',
        'glow-md': '0 0 20px rgba(0, 212, 255, 0.4)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.5)',
        'glow-xl': '0 0 60px rgba(0, 212, 255, 0.6)',
        'glow-kindling': '0 0 20px rgba(255, 107, 53, 0.4)',
        'glow-blazing': '0 0 30px rgba(255, 215, 0, 0.5)',
        'glow-crystallized': '0 0 25px rgba(0, 255, 200, 0.4)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-3px) rotate(0.5deg)' },
          '75%': { transform: 'translateY(3px) rotate(-0.5deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' },
        },
      },
      transitionTimingFunction: {
        'cosmic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'drift': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'snap': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Drizzle Configuration

### drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

---

## Next.js Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Transpile Three.js packages
  transpilePackages: ['three'],
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    });
    return config;
  },
};

module.exports = nextConfig;
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
npm run db:generate    # Generate migrations from schema changes
npm run db:migrate     # Run pending migrations
npm run db:push        # Push schema directly (dev only)
npm run db:studio      # Open Drizzle Studio GUI

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

---

## Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "pmneo.tsimporter"
  ]
}
```

---

## Performance Optimizations

### 3D Canvas
- Use `React.memo` for all celestial body components
- Implement LOD (Level of Detail) for distant objects
- Use instanced meshes for particles
- Offscreen canvas rendering where possible

### Database
- Connection pooling via Drizzle
- Redis caching for frequently accessed data
- Prepared statements for common queries
- Proper indexing on foreign keys and search columns

### Next.js
- Server Components by default
- Streaming for large data sets
- Image optimization with next/image
- Route prefetching for navigation

### Bundle Size
- Dynamic imports for heavy 3D components
- Tree-shaking for Three.js
- Code splitting by route
