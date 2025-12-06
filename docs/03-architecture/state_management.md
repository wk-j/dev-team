# FlowState Client State Management

## Overview

FlowState uses Zustand for client-side state and TanStack Query for server state synchronization.

---

## State Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client State                          │
├─────────────────────────────────────────────────────────┤
│  Zustand Stores (UI State)                              │
│  ├── voidStore      → Camera, focus, navigation        │
│  ├── userStore      → Current user, preferences        │
│  └── uiStore        → Modals, sidebars, toasts         │
├─────────────────────────────────────────────────────────┤
│  TanStack Query (Server State)                          │
│  ├── Team data      → Members, connections             │
│  ├── Streams        → Active streams, items            │
│  └── Pings          → Inbox, unread count              │
└─────────────────────────────────────────────────────────┘
```

---

## Zustand Stores

### voidStore
Controls 3D canvas state.

| State | Type | Purpose |
|-------|------|---------|
| `cameraPosition` | Position3D | Current camera location |
| `targetPosition` | Position3D | Where camera is moving to |
| `zoom` | number | Zoom level (0.5 - 3.0) |
| `focusedEntity` | Entity | Currently selected item |

| Action | Description |
|--------|-------------|
| `focusOn(entity)` | Fly camera to entity |
| `resetView()` | Return to default position |
| `setZoom(level)` | Adjust zoom |

### userStore
Current user state and preferences.

| State | Type | Purpose |
|-------|------|---------|
| `orbitalState` | OrbitalState | Current availability |
| `energyLevel` | number | Personal energy (0-100) |
| `preferences` | Preferences | Theme, notifications |

| Action | Description |
|--------|-------------|
| `setOrbitalState(state)` | Change availability |
| `updatePreferences(prefs)` | Save preferences |

### uiStore
UI component state.

| State | Type | Purpose |
|-------|------|---------|
| `activeModal` | string | Currently open modal |
| `sidebarOpen` | boolean | Sidebar visibility |
| `toasts` | Toast[] | Notification queue |

---

## Server State (TanStack Query)

### Query Keys

| Key | Data | Stale Time |
|-----|------|------------|
| `['team', teamId]` | Team details | 5 min |
| `['team', teamId, 'members']` | Team members | 1 min |
| `['streams', teamId]` | Active streams | 30 sec |
| `['stream', streamId]` | Stream details | 30 sec |
| `['pings', 'inbox']` | User's pings | 10 sec |

### Invalidation Triggers

| Event | Invalidate |
|-------|------------|
| Real-time update | Related query key |
| Mutation success | Affected resources |
| Window focus | Stale queries |

---

## State Flow

```
User Action
    │
    ▼
┌─────────────┐     ┌─────────────┐
│  Zustand    │     │  TanStack   │
│  (UI State) │     │   Query     │
└─────────────┘     └─────────────┘
    │                     │
    ▼                     ▼
┌─────────────┐     ┌─────────────┐
│   Canvas    │     │    API      │
│   Update    │     │   Request   │
└─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Real-time  │
                    │   Broadcast │
                    └─────────────┘
                          │
                          ▼
                    Other Clients
```

---

## Persistence

| Store | Strategy | Storage |
|-------|----------|---------|
| voidStore | None | Memory only |
| userStore | Partial | localStorage (preferences) |
| uiStore | None | Memory only |

---

## Optimistic Updates

1. User performs action (e.g., kindle work item)
2. Immediately update local state
3. Send API request
4. On success: Invalidate queries
5. On failure: Rollback local state, show error
