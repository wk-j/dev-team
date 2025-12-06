# FlowState Architecture Layers

## Overview

FlowState follows a clean layered architecture separating concerns across distinct layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  React Components, 3D Canvas, UI Elements                       │
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                │
│  Next.js API Routes, Server Actions                             │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                              │
│  Business Logic, Validation, Orchestration                      │
├─────────────────────────────────────────────────────────────────┤
│                    REPOSITORY LAYER                             │
│  Data Access, Query Building, Entity Mapping                    │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                │
│  Drizzle ORM, PostgreSQL, Redis                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Presentation Layer
- React components for UI
- React Three Fiber for 3D canvas
- Zustand stores for client state
- No business logic - only display and user interaction

### API Layer
- Next.js API Routes for REST endpoints
- Server Actions for form mutations
- Authentication/authorization checks
- Request validation with Zod
- Response formatting

### Service Layer
- Core business logic
- Orchestrates multiple repositories
- Validates business rules
- Triggers side effects (real-time updates, notifications)

### Repository Layer
- Data access abstraction
- CRUD operations
- Query building with filters/pagination
- Maps database rows to Entity classes

### Data Layer
- Drizzle ORM for type-safe queries
- PostgreSQL for persistent storage
- Redis for caching (optional)

---

## Entity Design

Entities are immutable domain objects with rich behavior.

### Entity Principles

| Principle | Description |
|-----------|-------------|
| Immutability | All state changes return new instances |
| Factory Methods | `create()` and `fromDatabase()` constructors |
| Computed Properties | Derived values as getters |
| State Transitions | Methods enforce valid transitions |

### Core Entities

| Entity | Purpose | Key Behaviors |
|--------|---------|---------------|
| `UserEntity` | Team member | Orbital state changes, energy tracking |
| `StreamEntity` | Work flow | Velocity, state (flowing/stagnant), fork/merge |
| `WorkItemEntity` | Work unit | Energy state transitions, crystallization |
| `ResonancePingEntity` | Notification | Delivery rules, expiration |

---

## Service Design

Services contain business logic and orchestrate operations.

### Core Services

| Service | Responsibility |
|---------|----------------|
| `UserService` | Profile management, orbital state, energy |
| `StreamService` | Stream lifecycle, diving, velocity |
| `EnergyService` | Work item transitions, crystallization |
| `ResonanceService` | Ping delivery, connection scoring |

### Service Patterns

- **Validation**: Zod schemas for input validation
- **Authorization**: Check user permissions
- **Orchestration**: Coordinate multiple repositories
- **Side Effects**: Trigger real-time updates, record events

---

## Repository Design

Repositories abstract data access with a consistent interface.

### Base Repository Pattern

| Method | Description |
|--------|-------------|
| `findById(id)` | Get single entity |
| `findMany(options)` | Get filtered list |
| `findPaginated(page, options)` | Get with pagination |
| `create(data)` | Insert new record |
| `update(id, data)` | Update existing record |
| `delete(id)` | Remove record |

### Specialized Methods

Each repository adds domain-specific queries:

| Repository | Example Methods |
|------------|-----------------|
| `UserRepository` | `findByEmail()`, `findByTeamId()`, `findResonanceConnections()` |
| `StreamRepository` | `findActiveByTeamId()`, `getCurrentDivers()`, `getWithStats()` |
| `WorkItemRepository` | `findByStreamId()`, `findByEnergyState()`, `getContributors()` |

---

## Data Flow Example

**Crystallizing a Work Item:**

```
1. Client calls POST /api/work-items/{id}/crystallize
         │
         ▼
2. API Route validates session & permissions
         │
         ▼
3. EnergyService.crystallize(itemId)
   ├── Validates item is in 'cooling' state
   ├── Gets contributors from repository
   ├── Calculates facets and brilliance
   └── Calls repository methods
         │
         ▼
4. WorkItemRepository.crystallize()
   └── Updates database, returns entity
         │
         ▼
5. StreamRepository.recordCrystallization()
   └── Increments crystal count
         │
         ▼
6. Service triggers side effects
   ├── Real-time broadcast
   ├── Record energy event
   └── Update resonance scores
         │
         ▼
7. API returns crystallized WorkItemEntity
```

---

## Dependency Injection

Services and repositories use dependency injection for testability.

| Benefit | Description |
|---------|-------------|
| Testability | Mock dependencies in tests |
| Flexibility | Swap implementations |
| Decoupling | Layers don't know concrete implementations |

---

## Error Handling

| Layer | Error Strategy |
|-------|----------------|
| API | Catch exceptions, return appropriate HTTP status |
| Service | Throw domain-specific errors |
| Repository | Throw database errors |
| Entity | Throw on invalid state transitions |
