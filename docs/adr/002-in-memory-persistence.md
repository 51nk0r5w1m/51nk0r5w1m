# ADR-002: In-Memory Persistence for Sprint 1

**Status:** Accepted  
**Date:** 2024  
**Deciders:** Platform Engineering Team  

---

## Context

Sprint 1 needs a persistence layer for `TenantEnvironmentRequest` entities.
The team needs to:
1. Move fast without infrastructure setup
2. Maintain a stable interface for future database migration
3. Avoid introducing AWS SDK dependencies in Sprint 1

---

## Decision

Use an **in-memory `Map`-based store** (`InMemoryRequestStore`) that implements
the `IRequestStore` interface, with **deep-copy semantics** on all reads and writes.

```typescript
export interface IRequestStore {
  save(request: TenantEnvironmentRequest): Promise<void>;
  findById(id: RequestId): Promise<TenantEnvironmentRequest | null>;
  findAll(): Promise<TenantEnvironmentRequest[]>;
}
```

All methods are `async` even though the in-memory implementation is synchronous.

---

## Rationale

### Why async interface even for in-memory?
- DynamoDB, RDS, and any real database require `async`
- Using `async` now means zero code changes in callers when the real store is swapped in
- `await store.save(request)` works identically with both implementations

### Why deep-copy on read/write?
- The workflow engine mutates `request` objects as it transitions through phases
- Without deep-copy, a caller holding a reference to a "stored" object would see the store mutate under them
- Deep-copy ensures the store is the source of truth — not external references
- This mimics the semantics of a real database (you get a snapshot, not a live object)

### Why not use a real database in Sprint 1?
- Infrastructure setup (DynamoDB local, RDS, etc.) adds days of work not relevant to Sprint 1 goals
- Sprint 1 goal is to validate the workflow logic, not the persistence layer
- Interface stability is the key deliverable; the implementation is temporary

---

## Alternatives Considered

### SQLite (via `better-sqlite3`)
- **Rejected**: Requires native module compilation. Adds infrastructure. No benefit in Sprint 1.

### DynamoDB Local
- **Rejected**: Requires Docker or local install. Significant setup cost. Premature for Sprint 1.

### Redis
- **Rejected**: Same concern as DynamoDB Local. Also overkill for a workflow state store.

### JSON file persistence
- **Rejected**: Race conditions on concurrent writes. Adds file I/O complexity without durability guarantees. Not meaningfully better than in-memory for Sprint 1 purposes.

---

## Migration Path (Sprint 2+)

To replace `InMemoryRequestStore` with a DynamoDB implementation:

1. Create `DynamoRequestStore` that implements `IRequestStore`
2. Replace `new InMemoryRequestStore()` in `container.ts`
3. Zero changes to `WorkflowEngine`, `WorkflowPhase` handlers, or API routes

The `IRequestStore` interface is the migration contract.

---

## Consequences

**Positive:**
- Zero infrastructure dependencies in Sprint 1
- Fast test execution (no I/O)
- Stable interface for migration

**Negative:**
- Data is lost on process restart
- No concurrent access safety (single-process only)
- No query capabilities beyond findById and findAll
- Memory grows unbounded (acceptable for Sprint 1 demo scale)

**Mitigations for Production:**
- Optimistic locking / conditional writes must be added to the production impl
- TTL or archival strategy needed for completed requests
- Pagination must be added to `findAll` for production scale
