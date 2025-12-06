# FlowState API Reference

## Overview

FlowState uses Next.js API Routes for RESTful endpoints and Server Actions for form mutations. All APIs require authentication via NextAuth.js session.

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
All endpoints require a valid session cookie. Unauthenticated requests return `401 Unauthorized`.

### Response Format
```typescript
// Success
{
  data: T,
  meta?: {
    page?: number,
    pageSize?: number,
    total?: number,
    totalPages?: number,
  }
}

// Error
{
  error: string | ZodError[],
  code?: string,
}
```

---

## Users API

### GET /api/users
List all users in the current team.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `teamId` | uuid | required | Team to list users from |
| `orbitalState` | string | - | Filter by orbital state |

**Response:** `200 OK`
```typescript
{
  data: UserEntity[]
}
```

---

### GET /api/users/[id]
Get a specific user by ID.

**Response:** `200 OK`
```typescript
{
  data: UserEntity
}
```

**Errors:**
- `404 Not Found` - User does not exist

---

### GET /api/users/me
Get the current authenticated user.

**Response:** `200 OK`
```typescript
{
  data: UserEntity
}
```

---

### PATCH /api/users/me
Update current user's profile.

**Request Body:**
```typescript
{
  name?: string,          // 1-255 chars
  avatarUrl?: string,     // Valid URL or null
  role?: string,          // Max 100 chars
  energySignatureColor?: string,  // Hex color #RRGGBB
  sanctumTheme?: string,  // Theme identifier
}
```

**Response:** `200 OK`
```typescript
{
  data: UserEntity
}
```

---

### PATCH /api/users/me/orbital-state
Update current user's orbital state.

**Request Body:**
```typescript
{
  state: 'open' | 'deep_work' | 'recovery' | 'supernova' | 'eclipse'
}
```

**Response:** `200 OK`
```typescript
{
  data: UserEntity
}
```

**Side Effects:**
- If changing FROM `deep_work`, queued pings are delivered
- Real-time update broadcast to team

---

### PATCH /api/users/me/position
Update current user's position in the void.

**Request Body:**
```typescript
{
  x: number,
  y: number,
  z: number,
}
```

**Response:** `200 OK`
```typescript
{
  data: UserEntity
}
```

---

### GET /api/users/me/resonance
Get current user's resonance connections.

**Response:** `200 OK`
```typescript
{
  data: {
    user: UserEntity,
    resonanceScore: number,  // 0-100
  }[]
}
```

---

## Streams API

### GET /api/streams
List streams for a team.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `teamId` | uuid | required | Team ID |
| `includeEvaporated` | boolean | false | Include archived streams |
| `state` | string | - | Filter by state |

**Response:** `200 OK`
```typescript
{
  data: StreamEntity[]
}
```

---

### POST /api/streams
Create a new stream.

**Request Body:**
```typescript
{
  teamId: string,       // UUID, required
  name: string,         // 1-255 chars, required
  description?: string, // Max 2000 chars
}
```

**Response:** `201 Created`
```typescript
{
  data: StreamEntity
}
```

---

### GET /api/streams/[id]
Get a stream with full details.

**Response:** `200 OK`
```typescript
{
  data: {
    stream: StreamEntity,
    items: WorkItemEntity[],
    divers: UserEntity[],
    stats: {
      dormantCount: number,
      activeCount: number,
      crystalCount: number,
    }
  }
}
```

---

### PATCH /api/streams/[id]
Update a stream.

**Request Body:**
```typescript
{
  name?: string,
  description?: string | null,
  priority?: number,
}
```

**Response:** `200 OK`
```typescript
{
  data: StreamEntity
}
```

---

### POST /api/streams/[id]/fork
Fork a stream into a new stream.

**Request Body:**
```typescript
{
  name: string,          // Required
  description?: string,
}
```

**Response:** `201 Created`
```typescript
{
  data: StreamEntity  // The new forked stream
}
```

---

### POST /api/streams/[id]/dive
Record the current user diving into a stream.

**Response:** `200 OK`
```typescript
{
  data: {
    streamId: string,
    divedAt: string,  // ISO date
  }
}
```

**Side Effects:**
- User added to stream's active divers
- Real-time broadcast to team

---

### POST /api/streams/[id]/surface
Record the current user surfacing from a stream.

**Response:** `200 OK`
```typescript
{
  data: {
    streamId: string,
    surfacedAt: string,
  }
}
```

---

### DELETE /api/streams/[id]
Evaporate (archive) a stream.

**Response:** `200 OK`
```typescript
{
  data: StreamEntity  // With state: 'evaporated'
}
```

**Errors:**
- `400 Bad Request` - Stream has active items (must crystallize or move first)

---

## Work Items API

### GET /api/work-items
List work items.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `streamId` | uuid | - | Filter by stream |
| `energyState` | string | - | Filter by energy state |
| `primaryDiverId` | uuid | - | Filter by assigned user |
| `page` | number | 1 | Page number |
| `pageSize` | number | 50 | Items per page |

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity[],
  meta: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number,
  }
}
```

---

### POST /api/work-items
Spark a new work item.

**Request Body:**
```typescript
{
  streamId: string,                              // UUID, required
  title: string,                                 // 1-500 chars, required
  description?: string,                          // Max 5000 chars
  depth?: 'shallow' | 'medium' | 'deep' | 'abyssal',  // Default: 'medium'
  tags?: string[],                               // Max 10 tags, each max 50 chars
}
```

**Response:** `201 Created`
```typescript
{
  data: WorkItemEntity  // With energyState: 'dormant'
}
```

---

### GET /api/work-items/[id]
Get a work item with details.

**Response:** `200 OK`
```typescript
{
  data: {
    item: WorkItemEntity,
    contributors: {
      user: UserEntity,
      energyContributed: number,
      isPrimary: boolean,
    }[],
    discoveries: DiscoveryEntity[],
  }
}
```

---

### PATCH /api/work-items/[id]
Update a work item.

**Request Body:**
```typescript
{
  title?: string,
  description?: string | null,
  tags?: string[],
  depth?: 'shallow' | 'medium' | 'deep' | 'abyssal',
}
```

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity
}
```

---

### POST /api/work-items/[id]/kindle
Kindle a dormant work item (start working on it).

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity  // With energyState: 'kindling'
}
```

**Errors:**
- `400 Bad Request` - Item is not dormant

**Side Effects:**
- Current user becomes primary diver
- User added as contributor

---

### POST /api/work-items/[id]/energy
Infuse energy into a work item.

**Request Body:**
```typescript
{
  amount: number,  // 1-100
}
```

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity
}
```

**Side Effects:**
- May auto-transition to 'blazing' if energy >= 70
- User recorded as contributor

---

### POST /api/work-items/[id]/cool
Start cooling a blazing work item (prepare for completion).

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity  // With energyState: 'cooling'
}
```

**Errors:**
- `400 Bad Request` - Item is not blazing

---

### POST /api/work-items/[id]/crystallize
Crystallize a cooling work item (complete it).

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity  // With energyState: 'crystallized'
}
```

**Side Effects:**
- Stream crystal count incremented
- Crystal facets = number of contributors
- Brilliance calculated from energy and depth
- Crystallization event recorded

**Errors:**
- `400 Bad Request` - Item is not cooling

---

### POST /api/work-items/[id]/handoff
Transfer ownership to another user.

**Request Body:**
```typescript
{
  toUserId: string,  // UUID of new owner
}
```

**Response:** `200 OK`
```typescript
{
  data: WorkItemEntity
}
```

**Errors:**
- `403 Forbidden` - Only primary diver can hand off

---

### POST /api/work-items/[id]/discoveries
Add a discovery (blocker, insight, or fork idea).

**Request Body:**
```typescript
{
  type: 'blocker' | 'insight' | 'fork_idea',
  content: string,  // Required, max 2000 chars
}
```

**Response:** `201 Created`
```typescript
{
  data: DiscoveryEntity
}
```

---

## Resonance Pings API

### GET /api/pings/inbox
Get received pings.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeRead` | boolean | false | Include read pings |
| `limit` | number | 50 | Max pings to return |

**Response:** `200 OK`
```typescript
{
  data: ResonancePingEntity[]
}
```

---

### GET /api/pings/unread-count
Get count of unread pings.

**Response:** `200 OK`
```typescript
{
  data: {
    count: number
  }
}
```

---

### POST /api/pings
Send a resonance ping.

**Request Body:**
```typescript
{
  toUserId: string,                    // UUID, required
  type: 'gentle' | 'warm' | 'direct',  // Required
  message?: string,                    // Max 500 chars
  relatedWorkItemId?: string,          // UUID
  relatedStreamId?: string,            // UUID
}
```

**Response:** `201 Created`
```typescript
{
  data: ResonancePingEntity
}
```

**Behavior by type:**
- `gentle`: Async, expires in 72h, respects all orbital states
- `warm`: Delivered when recipient is 'open', expires in 24h
- `direct`: Always delivered immediately, expires in 4h

---

### PATCH /api/pings/[id]/read
Mark a ping as read.

**Response:** `200 OK`
```typescript
{
  data: ResonancePingEntity
}
```

**Errors:**
- `403 Forbidden` - Can only mark own pings as read

---

## Observatory API

### GET /api/observatory/metrics
Get aggregated team metrics.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `teamId` | uuid | required | Team ID |

**Response:** `200 OK`
```typescript
{
  data: {
    // Team pulse
    pulseRate: number,           // BPM metaphor (0-120)
    energyLevel: number,         // 0-100
    
    // Stream stats
    activeStreams: number,
    totalWorkItems: number,
    activeWorkItems: number,
    
    // Crystal garden
    crystalsToday: number,
    crystalsThisWeek: number,
    crystalsTotal: number,
    
    // Team state
    membersOnline: number,
    membersInDeepWork: number,
    membersAway: number,
    
    // Activity
    recentCrystallizations: {
      item: WorkItemEntity,
      crystallizedAt: string,
    }[],
  }
}
```

---

### GET /api/observatory/pulse
Get real-time pulse data (for live visualization).

**Response:** `200 OK` (SSE stream recommended)
```typescript
{
  data: {
    timestamp: string,
    pulseRate: number,
    activeUsers: string[],
    recentEvents: EnergyEvent[],
  }
}
```

---

### GET /api/crystals
Get crystal garden data.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `teamId` | uuid | required | Team ID |
| `userId` | uuid | - | Filter by contributor |
| `since` | date | - | Crystals since date |
| `limit` | number | 100 | Max crystals |

**Response:** `200 OK`
```typescript
{
  data: {
    id: string,
    title: string,
    crystallizedAt: string,
    facets: number,
    brilliance: number,
    streamName: string,
    contributors: {
      id: string,
      name: string,
      avatarUrl: string | null,
    }[],
  }[]
}
```

---

## Teams API

### GET /api/teams
List teams the current user belongs to.

**Response:** `200 OK`
```typescript
{
  data: {
    id: string,
    name: string,
    role: 'owner' | 'admin' | 'member',
    memberCount: number,
  }[]
}
```

---

### POST /api/teams
Create a new team.

**Request Body:**
```typescript
{
  name: string,         // 1-255 chars, required
  description?: string, // Max 1000 chars
}
```

**Response:** `201 Created`
```typescript
{
  data: TeamEntity
}
```

---

### POST /api/teams/[id]/invite
Invite a user to the team.

**Request Body:**
```typescript
{
  email: string,
  role?: 'admin' | 'member',  // Default: 'member'
}
```

**Response:** `200 OK`
```typescript
{
  data: {
    inviteId: string,
    email: string,
    expiresAt: string,
  }
}
```

---

## Portals (Integrations) API

### GET /api/portals
List connected integrations.

**Response:** `200 OK`
```typescript
{
  data: {
    provider: string,
    connectedAt: string,
    externalUsername: string | null,
    status: 'active' | 'expired' | 'error',
  }[]
}
```

---

### POST /api/portals/[provider]/connect
Initiate OAuth connection to a provider.

**Response:** `302 Redirect`
Redirects to provider's OAuth page.

---

### DELETE /api/portals/[provider]
Disconnect an integration.

**Response:** `200 OK`
```typescript
{
  data: {
    provider: string,
    disconnectedAt: string,
  }
}
```

---

## Webhooks

### POST /api/webhooks/github
Receive GitHub webhook events.

**Headers:**
- `X-Hub-Signature-256`: HMAC signature

**Supported Events:**
- `push` → Creates energy event, may advance work items
- `pull_request.merged` → Triggers crystallization if linked
- `pull_request.opened` → Creates kindling state

---

### POST /api/webhooks/slack
Receive Slack events.

**Supported Events:**
- Status changes sync with orbital state
- `/flowstate` slash command for quick actions

---

## Server Actions

For form-based mutations, use Next.js Server Actions:

```typescript
// Usage in React component
import { sparkWorkItem, kindleWorkItem, crystallizeWorkItem } from '@/app/actions/energy';

// Spark
const item = await sparkWorkItem({
  streamId: 'uuid',
  title: 'New feature',
  depth: 'medium',
});

// Kindle
const kindled = await kindleWorkItem(itemId);

// Crystallize
const crystal = await crystallizeWorkItem(itemId);
```

### Available Actions

| Action | File | Description |
|--------|------|-------------|
| `sparkWorkItem` | `energy.actions.ts` | Create dormant work item |
| `kindleWorkItem` | `energy.actions.ts` | Start working on item |
| `infuseEnergy` | `energy.actions.ts` | Add energy to item |
| `crystallizeWorkItem` | `energy.actions.ts` | Complete item |
| `sendPing` | `resonance.actions.ts` | Send resonance ping |
| `updateOrbitalState` | `user.actions.ts` | Change availability |
| `updateProfile` | `user.actions.ts` | Update user profile |
| `createStream` | `stream.actions.ts` | Create new stream |
| `diveIntoStream` | `stream.actions.ts` | Enter stream focus |

---

## Rate Limiting

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `POST /api/pings` | 30 | 1 minute |
| `POST /api/work-items` | 60 | 1 minute |
| `POST /api/streams` | 10 | 1 minute |
| `PATCH /api/*` | 120 | 1 minute |
| `GET /api/*` | 300 | 1 minute |

Exceeded limits return `429 Too Many Requests`.

---

## WebSocket Events

Real-time updates via Pusher/Socket.io:

### Channels

| Channel | Description |
|---------|-------------|
| `team-{teamId}` | Team-wide events |
| `user-{userId}` | Personal notifications |
| `stream-{streamId}` | Stream activity |

### Events

```typescript
// Team channel
'user-state-changed': { userId: string, orbitalState: string }
'stream-activity': { streamId: string, type: 'dive' | 'surface', userId: string }
'crystallization': { workItemId: string, streamId: string, title: string }

// User channel
'ping-received': ResonancePingEntity
'ping-delivered': { pingId: string }

// Stream channel
'item-energy-changed': { itemId: string, energyState: string, energyLevel: number }
'diver-joined': { userId: string, userName: string }
'diver-left': { userId: string }
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `CONFLICT` | 409 | Resource state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
