# FlowState Testing Strategy

## Overview

FlowState uses a multi-layer testing approach ensuring reliability across entities, services, API, and UI.

---

## Testing Pyramid

```
        ┌───────────┐
        │   E2E     │  Few, critical paths
        │  Tests    │
        ├───────────┤
        │Integration│  API routes, services
        │   Tests   │
        ├───────────┤
        │   Unit    │  Entities, utilities
        │   Tests   │  Many, fast
        └───────────┘
```

---

## Test Categories

### Unit Tests

| Target | Framework | Focus |
|--------|-----------|-------|
| Entities | Vitest | State transitions, computed properties |
| Utilities | Vitest | Pure functions, helpers |
| Validators | Vitest | Zod schema validation |

**Example coverage:**
- `WorkItemEntity.kindle()` transitions from dormant to kindling
- `UserEntity.canReceivePing()` respects orbital state
- Energy calculations and state thresholds

### Integration Tests

| Target | Framework | Focus |
|--------|-----------|-------|
| Repositories | Vitest + TestDB | Database operations |
| Services | Vitest + Mocks | Business logic |
| API Routes | Vitest | Request/response |

**Example coverage:**
- Create stream → adds to database correctly
- Crystallize work item → updates stream counts
- Auth middleware → blocks unauthorized requests

### E2E Tests

| Target | Framework | Focus |
|--------|-----------|-------|
| Critical flows | Playwright | User journeys |
| Canvas | Playwright | 3D interactions |

**Example coverage:**
- Sign up → join team → create stream → add item
- Kindle → blaze → crystallize flow
- Send ping → recipient receives notification

---

## Test Database Strategy

- Use PostgreSQL test container
- Fresh database per test suite
- Seed with minimal fixture data
- Cleanup after each test

---

## Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| Database | Test container or in-memory |
| Pusher | Mock client, verify calls |
| NextAuth | Mock session provider |
| External APIs | MSW (Mock Service Worker) |

---

## Coverage Targets

| Layer | Target |
|-------|--------|
| Entities | 90% |
| Services | 80% |
| API Routes | 80% |
| UI Components | 60% |
| E2E Critical Paths | 100% |

---

## CI Pipeline

```
1. Lint & Typecheck
     │
     ▼
2. Unit Tests
     │
     ▼
3. Integration Tests (with test DB)
     │
     ▼
4. E2E Tests (Playwright)
     │
     ▼
5. Coverage Report
```

---

## Key Test Scenarios

### Energy State Transitions
- Dormant → Kindling (on kindle)
- Kindling → Blazing (at 70% energy)
- Blazing → Cooling (manual trigger)
- Cooling → Crystallized (on complete)

### Resonance Pings
- Ping delivery respects orbital state
- Direct pings bypass deep work
- Pings queue during deep work, deliver on surface

### Stream Operations
- Dive/surface updates presence correctly
- Velocity recalculates on activity
- Evaporation archives properly

---

## Commands

```bash
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:int      # Integration tests
npm run test:e2e      # E2E tests
npm run test:coverage # With coverage report
```
