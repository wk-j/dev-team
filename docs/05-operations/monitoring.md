# FlowState Monitoring & Observability

## Overview

FlowState uses a combination of Vercel Analytics, error tracking, and custom metrics to ensure reliability and performance.

---

## Observability Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend Performance | Vercel Analytics | Core Web Vitals |
| Error Tracking | Sentry | Exceptions, stack traces |
| API Monitoring | Vercel Logs | Request/response logging |
| Database | Neon Dashboard | Query performance |
| Real-time | Pusher Dashboard | Connection metrics |

---

## Key Metrics

### Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4s |
| FID (First Input Delay) | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| Canvas FPS | 60 FPS | < 30 FPS |
| API Response Time (p95) | < 500ms | > 2s |

### Reliability

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error Rate | < 0.1% | > 1% |
| Uptime | 99.9% | < 99% |
| Failed Logins | < 5/min | > 20/min |

### Business

| Metric | Description |
|--------|-------------|
| DAU | Daily active users |
| Crystallization Rate | Work items completed/day |
| Resonance Score Avg | Team collaboration health |
| Deep Work Hours | Time in focused state |

---

## Logging Strategy

### Log Levels

| Level | Use Case |
|-------|----------|
| `error` | Exceptions, failures |
| `warn` | Degraded performance, retries |
| `info` | Key events (login, crystallize) |
| `debug` | Development only |

### Structured Logging

All logs include:
- Timestamp
- Request ID
- User ID (if authenticated)
- Action/Event name
- Duration (for operations)

---

## Alerting

### Critical (PagerDuty)
- Error rate > 5%
- API p95 > 5s
- Database connection failures
- Auth service down

### Warning (Slack)
- Error rate > 1%
- API p95 > 2s
- High memory usage
- Unusual traffic patterns

---

## Dashboards

### Operations Dashboard
- Request rate over time
- Error rate by endpoint
- Response time percentiles
- Active WebSocket connections

### Product Dashboard
- Active users (real-time)
- Work items by energy state
- Streams by health status
- Ping delivery rate

---

## Health Endpoints

| Endpoint | Checks |
|----------|--------|
| `/api/health` | App is running |
| `/api/health/db` | Database connected |
| `/api/health/ready` | All dependencies ready |

---

## Incident Response

1. **Detect**: Alert fires or user report
2. **Assess**: Check dashboards, logs
3. **Mitigate**: Rollback, feature flag, or hotfix
4. **Communicate**: Status page update
5. **Resolve**: Deploy fix
6. **Review**: Post-mortem within 48h
