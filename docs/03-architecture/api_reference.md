# FlowState API Reference

## Overview

FlowState uses Next.js API Routes for RESTful endpoints and Server Actions for form mutations. All APIs require authentication.

---

## Authentication

All endpoints require a valid session cookie via NextAuth.js. Unauthenticated requests return `401 Unauthorized`.

---

## Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List team members |
| GET | `/api/users/[id]` | Get user by ID |
| GET | `/api/users/me` | Get current user |
| PATCH | `/api/users/me` | Update profile |
| PATCH | `/api/users/me/orbital-state` | Change availability |
| PATCH | `/api/users/me/position` | Update void position |
| GET | `/api/users/me/resonance` | Get connections |

### Orbital State Change
When changing FROM `deep_work`, queued pings are delivered. Real-time update broadcast to team.

---

## Streams API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams` | List team streams |
| POST | `/api/streams` | Create stream |
| GET | `/api/streams/[id]` | Get stream with items & divers |
| PATCH | `/api/streams/[id]` | Update stream |
| POST | `/api/streams/[id]/fork` | Fork into new stream |
| POST | `/api/streams/[id]/dive` | Enter stream focus |
| POST | `/api/streams/[id]/surface` | Exit stream focus |
| DELETE | `/api/streams/[id]` | Evaporate (archive) |

### Dive/Surface
- Adds/removes user from stream's active divers
- Broadcasts real-time update to team

---

## Work Items API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/work-items` | List items (filter by stream, state, user) |
| POST | `/api/work-items` | Spark new item (dormant) |
| GET | `/api/work-items/[id]` | Get item with contributors |
| PATCH | `/api/work-items/[id]` | Update item |
| POST | `/api/work-items/[id]/kindle` | Start working (dormant → kindling) |
| POST | `/api/work-items/[id]/energy` | Add energy |
| POST | `/api/work-items/[id]/cool` | Prepare completion (blazing → cooling) |
| POST | `/api/work-items/[id]/crystallize` | Complete (cooling → crystallized) |
| POST | `/api/work-items/[id]/handoff` | Transfer ownership |

### Energy State Transitions

```
dormant → kindling → blazing → cooling → crystallized
           (kindle)   (auto@70%)  (cool)   (crystallize)
```

### Crystallization Side Effects
- Stream crystal count incremented
- Crystal facets = number of contributors
- Brilliance calculated from energy × depth
- Event recorded for analytics

---

## Resonance Pings API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pings/inbox` | Get received pings |
| GET | `/api/pings/unread-count` | Get unread count |
| POST | `/api/pings` | Send ping |
| PATCH | `/api/pings/[id]/read` | Mark as read |

### Ping Behavior by Type

| Type | Delivery | Expiry |
|------|----------|--------|
| `gentle` | Respects all orbital states | 72 hours |
| `warm` | When recipient is open | 24 hours |
| `direct` | Always immediate | 4 hours |

---

## Observatory API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/observatory/metrics` | Team dashboard data |
| GET | `/api/observatory/pulse` | Real-time activity |
| GET | `/api/crystals` | Crystal garden data |

### Metrics Include
- Team pulse rate and energy level
- Active streams and work items
- Crystals (today, week, total)
- Members online, in deep work, away
- Recent crystallizations

---

## Teams API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List user's teams |
| POST | `/api/teams` | Create team |
| POST | `/api/teams/[id]/invite` | Invite member |

---

## Portals API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portals` | List integrations |
| POST | `/api/portals/[provider]/connect` | OAuth connect |
| DELETE | `/api/portals/[provider]` | Disconnect |

---

## Webhooks

| Endpoint | Provider | Events |
|----------|----------|--------|
| `/api/webhooks/github` | GitHub | push, pull_request |
| `/api/webhooks/slack` | Slack | Status sync, slash commands |

---

## Server Actions

Form-based mutations for React Server Components.

| Action | Description |
|--------|-------------|
| `sparkWorkItem` | Create dormant work item |
| `kindleWorkItem` | Start working on item |
| `infuseEnergy` | Add energy to item |
| `crystallizeWorkItem` | Complete item |
| `sendPing` | Send resonance ping |
| `updateOrbitalState` | Change availability |
| `createStream` | Create new stream |
| `diveIntoStream` | Enter stream focus |

---

## Rate Limiting

| Pattern | Limit | Window |
|---------|-------|--------|
| POST /api/pings | 30 | 1 minute |
| POST /api/work-items | 60 | 1 minute |
| POST /api/streams | 10 | 1 minute |
| PATCH /api/* | 120 | 1 minute |
| GET /api/* | 300 | 1 minute |

---

## Real-Time Events

### Channels

| Channel | Purpose |
|---------|---------|
| `team-{teamId}` | Team-wide broadcasts |
| `user-{userId}` | Personal notifications |
| `stream-{streamId}` | Stream activity |

### Events

| Event | Channel | Description |
|-------|---------|-------------|
| `user-state-changed` | team | Orbital state update |
| `stream-activity` | team | Dive/surface |
| `crystallization` | team | Work completed |
| `ping-received` | user | New ping |
| `item-energy-changed` | stream | Energy update |
| `diver-joined/left` | stream | Focus changes |

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request |
| `CONFLICT` | 409 | State conflict |
| `RATE_LIMITED` | 429 | Too many requests |
