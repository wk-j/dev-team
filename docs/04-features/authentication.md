# FlowState Authentication

## Overview

FlowState uses NextAuth.js (Auth.js) v5 for authentication, supporting both OAuth providers and email/password credentials.

---

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │ ──► │   Sign In   │ ──► │  Observatory │
│    Page     │     │   Options   │     │  (Dashboard) │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │ GitHub │  │ Google │  │ Email  │
         │ OAuth  │  │ OAuth  │  │ + Pass │
         └────────┘  └────────┘  └────────┘
```

---

## Supported Providers

| Provider | Type | Use Case |
|----------|------|----------|
| GitHub | OAuth | Developer teams |
| Google | OAuth | General users |
| Credentials | Email/Password | Enterprise/offline |

---

## Session Strategy

- **Strategy**: JWT (stateless)
- **Session Duration**: 30 days
- **Refresh**: Automatic on activity

### Session Data

| Field | Description |
|-------|-------------|
| `user.id` | Database user ID |
| `user.email` | User email |
| `user.name` | Display name |
| `user.teamId` | Primary team ID |
| `user.orbitalState` | Current availability |

---

## Route Protection

### Protected Routes (require auth)
- `/observatory/*` - Dashboard
- `/streams/*` - Work streams
- `/constellation/*` - Team view
- `/sanctum/*` - Settings
- `/api/*` - All API endpoints (except auth)

### Public Routes
- `/` - Landing page
- `/login` - Sign in
- `/register` - Sign up
- `/api/auth/*` - Auth endpoints

---

## Authorization Levels

| Role | Permissions |
|------|-------------|
| Member | View team, manage own work items, send pings |
| Admin | + Manage streams, invite members |
| Owner | + Manage team settings, billing, delete team |

---

## Security Considerations

1. **Password Hashing**: bcrypt with cost factor 12
2. **CSRF Protection**: Built into NextAuth
3. **Rate Limiting**: Auth endpoints limited to 5 req/min
4. **Secure Cookies**: HttpOnly, Secure, SameSite=Lax

---

## Environment Variables

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<min-32-char-secret>

# OAuth Providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## User Onboarding

After first sign-in:
1. Create user record in database
2. Assign default star type (main_sequence)
3. Generate random void position
4. Set orbital state to "open"
5. Redirect to onboarding flow or team join
