# Threat Model — Sprint 1: Custom Account Factory

**Version:** 1.0  
**Date:** 2024  
**Scope:** Sprint 1 in-process system (no real AWS calls)  
**Methodology:** STRIDE  

---

## System Overview

The Custom Account Factory (CAF) is a provisioning platform that automates
AWS account creation via Organizations. In Sprint 1, all AWS adapters are mocked.

**Components:**
- REST API (Express.js, port 3001)
- Workflow Engine (in-process state machine)
- Mock Adapters (Organizations, Bootstrap)
- In-Memory Persistence
- Audit Logger (stdout JSON)
- React Portal (Vite, port 5173)

**Trust Boundaries:**
1. External → API: HTTP POST/GET (public)
2. API → Workflow Engine: in-process function call
3. Workflow Engine → Adapters: in-process, mocked in Sprint 1
4. Workflow Engine → Persistence: in-process Map

---

## STRIDE Analysis

### S — Spoofing

| Threat | Component | Mitigation (Sprint 1) | Sprint 2+ |
|--------|-----------|----------------------|-----------|
| Unauthenticated API calls | POST /api/requests | **No auth in Sprint 1** | Add JWT/OIDC |
| requestedBy field spoofing | Input | Email format validated only | Require OIDC claim |
| Forged requestId in GET | GET /api/requests/:id | UUID is unguessable | Add resource-level auth |

**Sprint 1 Risk:** HIGH — No authentication. Acceptable for local-only Sprint 1 demo.  
**Mitigation Plan:** Auth deferred to Sprint 2.

---

### T — Tampering

| Threat | Component | Mitigation |
|--------|-----------|------------|
| Injection via tenantId | Validation | `SAFE_STRING_PATTERN` allow-list rejects special chars |
| Injection via environmentName | Validation | Same allow-list |
| Payload size attack | express.json | Limited to 1MB |
| tenantName XSS | API response | JSON-encoded; no HTML rendering in API |
| State mutation between phases | Persistence | Deep-copy on read/write |

**Key Control:** `validateCreateRequestInput` is the primary injection defense.
All input passes through this before entering the workflow.

---

### R — Repudiation

| Threat | Component | Mitigation |
|--------|-----------|------------|
| No record of who submitted request | Audit log | `REQUEST_SUBMITTED` emitted with `actor=requestedBy` |
| No record of phase transitions | Audit log | `PHASE_STARTED`/`PHASE_COMPLETED`/`PHASE_FAILED` events |
| Audit log tampering | In-memory log | **Sprint 1 limitation** — log is mutable in-process |

**Sprint 1 Risk:** MEDIUM — In-memory audit log can be lost on restart.  
**Sprint 2+ Mitigation:** CloudTrail / immutable log store.

---

### I — Information Disclosure

| Threat | Component | Mitigation |
|--------|-----------|------------|
| Stack traces in API errors | Error handlers | Errors return `{ error: string }`, no stacks |
| AWS account IDs in logs | Adapters | Mock IDs use MOCK-* prefix; real impl needs redaction |
| Credentials in audit events | AuditEvent | `detail` field must never contain credentials |
| X-Powered-By header | Express | `app.disable('x-powered-by')` applied |
| CORS wildcard | CORS config | Scoped to localhost:5173 and localhost:3000 |

**Key Control:** Security headers applied globally:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- No `X-Powered-By`

---

### D — Denial of Service

| Threat | Component | Mitigation |
|--------|-----------|------------|
| Large request payload | express.json | 1MB limit |
| Request flooding | API | **No rate limiting in Sprint 1** |
| Memory exhaustion | In-memory store | **Sprint 1 limitation** — unbounded Map |
| Workflow starvation | setImmediate | Fire-and-forget; no queue backpressure |

**Sprint 1 Risk:** MEDIUM — No rate limiting. Acceptable for local demo.  
**Sprint 2+ Mitigation:** Rate limiting middleware, durable queue.

---

### E — Elevation of Privilege

| Threat | Component | Mitigation |
|--------|-----------|------------|
| PROD auto-approval | EvaluatePolicy | Logged as TODO; Sprint 2 adds approval gate |
| Direct adapter access | Architecture | Adapters only accessible via WorkflowEngine |
| OU placement driven by request | MockOrgsAdapter | OU is policy-driven in real impl |

---

## Security Controls Summary

| Control | Status |
|---------|--------|
| Input validation (allow-list) | ✅ Implemented |
| JSON payload size limit | ✅ 1MB |
| Security headers | ✅ Applied |
| CORS scoping | ✅ localhost only |
| No X-Powered-By | ✅ Disabled |
| Audit logging | ✅ In-memory |
| No secrets in code | ✅ No real credentials |
| No AWS SDK calls | ✅ All mocked |
| Authentication | ❌ Deferred to Sprint 2 |
| Rate limiting | ❌ Deferred to Sprint 2 |
| PROD approval gate | ❌ Deferred to Sprint 2 |
| Persistent audit log | ❌ Deferred (CloudTrail) |

---

## Data Classification

| Field | Classification | Notes |
|-------|---------------|-------|
| tenantId | Internal | Used in account names |
| tenantName | Internal | Appears in account email |
| requestedBy | PII (email) | Retained for accountability |
| provisionedAccountId | Sensitive | AWS account ID — must not leak |
| phaseHistory | Internal | May contain error details |

---

## Sprint 1 Accepted Risks

1. **No authentication** — system is only for local/demo use
2. **In-memory only** — data lost on restart, no durability
3. **No rate limiting** — not exposed publicly
4. **PROD auto-approval** — mocked with TODO for Sprint 2
5. **Audit log is mutable** — replaced with immutable store in Sprint 2
