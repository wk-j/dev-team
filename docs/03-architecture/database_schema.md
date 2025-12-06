# FlowState Database Schema

## Overview

FlowState uses PostgreSQL with Drizzle ORM. This document defines the conceptual data model and relationships.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │◄─────►│    Teams    │◄─────►│   Streams   │
└─────────────┘       └─────────────┘       └─────────────┘
      │                                           │
      │                                           │
      ▼                                           ▼
┌─────────────┐                           ┌─────────────┐
│  Resonance  │                           │ Work Items  │
│   Pings     │                           └─────────────┘
└─────────────┘                                 │
      │                                         │
      ▼                                         ▼
┌─────────────┐                           ┌─────────────┐
│  Resonance  │                           │Contributors │
│ Connections │                           └─────────────┘
└─────────────┘
```

---

## Enums

### Star Type
User's celestial representation based on role.

| Value | Description |
|-------|-------------|
| `sun` | Team leads |
| `giant` | Senior members |
| `main_sequence` | Standard members |
| `dwarf` | Junior members |
| `neutron` | Specialists |

### Orbital State
User's current availability status.

| Value | Description |
|-------|-------------|
| `open` | Available for collaboration |
| `deep_work` | Focused, limit interruptions |
| `recovery` | Low energy, recharging |
| `supernova` | Highly active, peak energy |
| `eclipse` | Away/offline |

### Energy State
Work item's progress state.

| Value | Description |
|-------|-------------|
| `dormant` | Not started, waiting to be kindled |
| `kindling` | Active, building energy |
| `blazing` | Peak momentum |
| `cooling` | Wrapping up, preparing to complete |
| `crystallized` | Completed |

### Stream State
Work stream's health status.

| Value | Description |
|-------|-------------|
| `rushing` | High velocity, lots of activity |
| `flowing` | Normal, healthy pace |
| `stagnant` | Low activity, needs attention |
| `frozen` | Blocked |
| `flooding` | Too many items, overwhelmed |
| `evaporated` | Archived |

### Work Item Depth
Complexity/effort level.

| Value | Multiplier | Description |
|-------|------------|-------------|
| `shallow` | 0.5x | Quick task |
| `medium` | 1.0x | Standard work |
| `deep` | 2.0x | Complex task |
| `abyssal` | 4.0x | Major effort |

### Ping Type
Urgency level of resonance ping.

| Value | Expiry | Behavior |
|-------|--------|----------|
| `gentle` | 72h | Respects all orbital states |
| `warm` | 24h | Delivered when open |
| `direct` | 4h | Always delivered immediately |

---

## Tables

### Users

Core user identity and celestial properties.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique, required |
| `name` | VARCHAR(255) | Display name |
| `avatar_url` | TEXT | Profile image |
| `role` | VARCHAR(100) | Job title |
| `star_type` | ENUM | Celestial representation |
| `orbital_state` | ENUM | Current availability |
| `energy_signature_color` | VARCHAR(7) | Hex color |
| `position_x/y/z` | REAL | 3D void position |
| `current_energy_level` | INTEGER | 0-100 |
| `preferences` | JSONB | User settings |

### Teams

Team/organization container.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Team name |
| `description` | TEXT | Team description |
| `constellation_layout` | JSONB | Saved member positions |
| `pulse_rate` | INTEGER | Aggregate activity metric |
| `total_crystals` | INTEGER | Completed work count |

### Team Memberships

Join table for users and teams.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK to users |
| `team_id` | UUID | FK to teams |
| `role` | VARCHAR(50) | owner/admin/member |

### Streams

Work streams (project containers).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK to teams |
| `name` | VARCHAR(255) | Stream name |
| `state` | ENUM | Health status |
| `velocity` | REAL | 0.0-2.0 speed multiplier |
| `path_points` | JSONB | 3D curve for visualization |
| `item_count` | INTEGER | Active items |
| `crystal_count` | INTEGER | Completed items |
| `parent_stream_id` | UUID | FK for forks |

### Stream Divers

Users currently focused on a stream.

| Column | Type | Description |
|--------|------|-------------|
| `stream_id` | UUID | FK to streams |
| `user_id` | UUID | FK to users |
| `dived_at` | TIMESTAMP | When started |
| `surfaced_at` | TIMESTAMP | When ended (null if active) |

### Work Items

Individual units of work.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `stream_id` | UUID | FK to streams |
| `title` | VARCHAR(500) | Work item title |
| `description` | TEXT | Details |
| `energy_state` | ENUM | Current state |
| `energy_level` | INTEGER | 0-100 progress |
| `depth` | ENUM | Complexity level |
| `stream_position` | REAL | 0.0-1.0 position in flow |
| `primary_diver_id` | UUID | FK to assigned user |
| `tags` | JSONB | Array of tags |
| `crystal_facets` | INTEGER | Contributor count (when crystallized) |
| `crystal_brilliance` | INTEGER | Impact score 1-5 |

### Work Item Contributors

Users who contributed energy to a work item.

| Column | Type | Description |
|--------|------|-------------|
| `work_item_id` | UUID | FK to work items |
| `user_id` | UUID | FK to users |
| `energy_contributed` | INTEGER | Total energy added |
| `is_primary` | BOOLEAN | Main owner flag |

### Resonance Pings

Notifications between users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `from_user_id` | UUID | Sender |
| `to_user_id` | UUID | Recipient |
| `type` | ENUM | gentle/warm/direct |
| `status` | ENUM | sent/delivered/read/expired |
| `message` | TEXT | Optional message |
| `related_work_item_id` | UUID | Context link |
| `expires_at` | TIMESTAMP | Auto-expiry time |

### Resonance Connections

Collaboration strength between users.

| Column | Type | Description |
|--------|------|-------------|
| `user_id_a` | UUID | First user (lower ID) |
| `user_id_b` | UUID | Second user |
| `resonance_score` | INTEGER | 0-100 connection strength |
| `shared_work_items` | INTEGER | Co-contributed items |
| `ping_count` | INTEGER | Pings exchanged |

### Energy Events

Activity log for analytics.

| Column | Type | Description |
|--------|------|-------------|
| `team_id` | UUID | FK to teams |
| `user_id` | UUID | Actor |
| `event_type` | VARCHAR | Event name |
| `work_item_id` | UUID | Related item |
| `data` | JSONB | Event payload |
| `occurred_at` | TIMESTAMP | When it happened |

### Portals

External integrations.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK to users |
| `provider` | VARCHAR(50) | github/slack/calendar |
| `access_token` | TEXT | OAuth token |
| `settings` | JSONB | Integration config |

---

## Key Indexes

| Table | Columns | Purpose |
|-------|---------|---------|
| users | email | Unique lookup |
| users | orbital_state | Filter by availability |
| streams | team_id, state | Active streams query |
| work_items | stream_id, energy_state | Stream items by state |
| work_items | primary_diver_id | User's assigned items |
| resonance_pings | to_user_id, status | Inbox query |
| energy_events | team_id, occurred_at | Activity timeline |

---

## JSONB Structures

### User Preferences
```
{
  dailyCheckInEnabled: boolean,
  pingDelivery: { gentle, warm, direct },
  visualPowers: { particleDensity, glowIntensity },
  accessibility: { highContrast, reducedMotion, classicView }
}
```

### Path Points (Stream)
```
[{ x, y, z, t }, ...]  // 3D curve points
```

### Work Item Metadata
```
{
  externalLinks: string[],
  estimatedEnergy: number,
  category: string
}
```
