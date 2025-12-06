# FlowState Deployment Guide

## Overview

FlowState is designed for deployment on Vercel with PostgreSQL (Neon/Supabase) and optional Redis caching.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Next.js    │  │   Edge      │  │   Serverless│      │
│  │  Frontend   │  │  Functions  │  │   Functions │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │   Redis     │    │   Pusher    │
│ (Neon)      │    │ (Upstash)   │    │ (Real-time) │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## Environments

| Environment | Purpose | Branch |
|-------------|---------|--------|
| Development | Local testing | - |
| Preview | PR review | feature/* |
| Staging | Pre-production | develop |
| Production | Live users | main |

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth encryption key (32+ chars) |
| `NEXTAUTH_URL` | App URL (https://flowstate.app) |

### Optional

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `PUSHER_*` | Real-time functionality |
| `REDIS_URL` | Caching layer |

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] OAuth redirect URIs updated

### Deployment
- [ ] Push to main branch (auto-deploys)
- [ ] Run database migrations
- [ ] Verify health check endpoint

### Post-deployment
- [ ] Smoke test critical paths
- [ ] Monitor error rates
- [ ] Check performance metrics

---

## Database Migrations

### Strategy
- Migrations run via CI/CD before deployment
- Backward-compatible changes only
- Feature flags for breaking changes

### Commands
```bash
npm run db:generate   # Generate migration
npm run db:migrate    # Apply migrations
npm run db:push       # Direct push (dev only)
```

---

## CI/CD Pipeline

```
Push to GitHub
     │
     ▼
┌─────────────┐
│  Lint &     │
│  Typecheck  │
└─────────────┘
     │
     ▼
┌─────────────┐
│  Run Tests  │
└─────────────┘
     │
     ▼
┌─────────────┐
│  Build      │
└─────────────┘
     │
     ▼
┌─────────────┐
│  Deploy     │
│  (Vercel)   │
└─────────────┘
     │
     ▼
┌─────────────┐
│  DB Migrate │
└─────────────┘
```

---

## Scaling Considerations

| Component | Scaling Strategy |
|-----------|------------------|
| API | Vercel auto-scales serverless functions |
| Database | Neon auto-scaling, read replicas |
| Real-time | Pusher handles scaling |
| Static | Vercel Edge CDN |

---

## Rollback Procedure

1. Identify issue in monitoring
2. Revert to previous deployment in Vercel dashboard
3. If database issue, restore from point-in-time backup
4. Post-mortem and fix forward

---

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Basic liveness |
| `/api/health/db` | Database connectivity |
| `/api/health/ready` | Full readiness |
