# Flow State

> Work is not a checklist. It's a living system of energy, momentum, and human connection.

**FlowState** is a team tracking application that abandons traditional task management paradigms (Kanban, lists, sprints) in favor of an organic, living workspace where work flows like energy through streams and teams exist as celestial constellations.

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
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **3D Canvas** | React Three Fiber / Three.js |
| **Auth** | NextAuth.js v5 (Auth.js) |

## Getting Started

```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Push database schema
npm run db:push

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, register)
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── observatory/    # Main dashboard
│   │   │   ├── streams/        # Work streams
│   │   │   ├── constellation/  # Team view
│   │   │   ├── inbox/          # Resonance pings
│   │   │   ├── team/           # Team management
│   │   │   └── sanctum/        # Settings
│   │   └── api/                # API routes
│   ├── components/
│   │   └── canvas/             # 3D void components
│   ├── lib/
│   │   ├── api/                # API client & hooks
│   │   ├── db/                 # Drizzle schema & connection
│   │   └── auth/               # NextAuth config
│   └── types/                  # TypeScript types
├── drizzle/                    # Database migrations
└── public/                     # Static assets
```

## Environment Variables

Create a `.env` file in the `app/` directory:

```bash
# Database (required)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Auth (required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers (optional)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Set **Root Directory** to `app`
5. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel URL)
6. Deploy

## Scripts

All scripts run from the `app/` directory:

```bash
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checker

# Database
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
```

## Key Features

### Observatory
A cosmic viewport showing team activity, energy flows, and collective rhythm at a glance.

### Energy Streams
Work flows through streams like rivers. Dive in for immersive focus, surface to see the big picture.

### Time Tracking
Track time spent on work items with start/stop timers and duration display.

### Constellation
Team members as celestial bodies with orbital states and connection lines.

### Crystallization
Completed work transforms into permanent crystals, building a garden of achievement.

### Deep Work Protection
Orbital states (Open, Deep Work, Recovery) control availability and queue interruptions.

## Documentation

Full documentation available in [docs/](docs/README.md)

## License

MIT
