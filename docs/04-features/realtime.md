# FlowState Real-Time Implementation

## Overview

FlowState uses Pusher for real-time updates, enabling live synchronization of team activity, resonance pings, and canvas state changes.

---

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │ ◄─────► │   Pusher    │ ◄─────► │   Server    │
│  (Browser)  │   WS    │   Service   │   HTTP  │  (Next.js)  │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## Channel Structure

| Channel | Pattern | Purpose |
|---------|---------|---------|
| `team-{teamId}` | Public | Team-wide broadcasts |
| `private-user-{userId}` | Private | Personal notifications |
| `presence-stream-{streamId}` | Presence | Track stream divers |

---

## Event Types

### Team Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `user:state-changed` | userId, orbitalState | User changes availability |
| `stream:updated` | streamId, state, velocity | Stream metrics change |
| `work-item:energy-changed` | itemId, energyState, level | Item state transition |
| `crystallization` | itemId, userId, brilliance | Work item completed |

### Personal Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `ping:received` | pingId, fromUser, type | Resonance ping arrives |
| `ping:delivered` | pingId | Ping acknowledged |
| `mention` | workItemId, fromUser | Mentioned in discussion |

### Presence Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `member_added` | userId | User dives into stream |
| `member_removed` | userId | User surfaces from stream |

---

## Client Subscription Flow

```
1. User authenticates
     │
     ▼
2. Subscribe to team-{teamId}
     │
     ▼
3. Subscribe to private-user-{userId}
     │
     ▼
4. On stream dive → Subscribe to presence-stream-{streamId}
     │
     ▼
5. On stream surface → Unsubscribe from stream channel
```

---

## Event Handling

### Canvas Updates
- `user:state-changed` → Update CelestialBody glow/ring
- `work-item:energy-changed` → Animate EnergyOrb transition
- `crystallization` → Trigger celebration animation

### Ping Visualization
- `ping:received` → Animate ping traveling through void
- Show gentle ripple at recipient's location

---

## Optimizations

| Strategy | Description |
|----------|-------------|
| Event batching | Group rapid updates (50ms window) |
| Selective subscription | Only active stream presence |
| Reconnection | Exponential backoff with jitter |
| Offline queue | Store actions, sync on reconnect |

---

## Fallback Behavior

If WebSocket unavailable:
1. Poll `/api/updates` every 30 seconds
2. Show "limited connectivity" indicator
3. Queue outgoing actions locally
4. Sync when connection restored
