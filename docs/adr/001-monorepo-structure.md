# ADR-001: Monorepo Structure with pnpm Workspaces

**Status:** Accepted  
**Date:** 2024  
**Deciders:** Platform Engineering Team  

---

## Context

The Custom Account Factory requires multiple distinct concerns:
- Domain types and validation (no dependencies)
- Audit logging (depends on domain)
- Persistence (depends on domain)
- AWS adapters (depends on domain)
- Workflow orchestration (depends on all above)
- REST API (depends on workflow)
- React UI (standalone)

These concerns must be independently testable, buildable, and replaceable.

---

## Decision

Use a **pnpm workspace monorepo** with one package per concern:

```
packages/
  domain/      — @caf/domain
  audit/       — @caf/audit
  persistence/ — @caf/persistence
  adapters/    — @caf/adapters
  workflow/    — @caf/workflow
  api/         — @caf/api
apps/
  portal/      — portal (React)
```

---

## Rationale

### Why monorepo?
- **Single source of truth**: All packages share one TypeScript base config, one lockfile
- **Atomic changes**: A breaking change in `@caf/domain` is visible immediately across all dependents
- **Easy cross-package refactoring**: IDE tools work across the entire codebase
- **Consistent tooling**: Same Jest, TypeScript, and lint configs everywhere

### Why pnpm?
- **Workspace protocol** (`workspace:*`) enables local package linking without publishing
- **Efficient node_modules**: pnpm uses symlinks and a content-addressable store — faster installs
- **Strict**: pnpm prevents phantom dependencies (packages you didn't declare)
- **Industry adoption**: Used by Vue, Nx, and many large TypeScript monorepos

### Why separate packages (not a single package)?
- **Enforces dependency direction**: `domain` cannot accidentally import from `api`
- **Independent testability**: Each package has its own Jest config and can be tested in isolation
- **Replaceability**: The `adapters` package can be replaced with real AWS SDK implementations without touching the domain or workflow layers
- **Clear trust boundaries**: The `domain` package is the most critical — it has zero external dependencies

---

## Alternatives Considered

### Single package
- **Rejected**: No enforcement of dependency direction. Circular imports become possible. Cannot release domain types independently.

### Nx with Lerna
- **Rejected**: Adds significant tooling complexity for Sprint 1. Can be added later if build performance requires it.

### npm workspaces
- **Rejected**: pnpm is strictly superior (phantom dependency prevention, performance).

---

## Consequences

**Positive:**
- Clear package boundaries enforce architectural constraints
- Each package is independently buildable and testable
- Dependency graph is explicit and acyclic

**Negative:**
- More `package.json` files to maintain
- Build order matters (`domain` must build before `audit`, etc.)
- TypeScript path resolution requires `dist/` outputs for cross-package imports (or `paths` aliases)

---

## Dependency Graph

```
domain
  ↑
  ├── audit
  ├── persistence
  └── adapters
        ↑
        └── workflow (also depends on audit, persistence, domain)
              ↑
              └── api (also depends on adapters, audit, persistence, domain)
```

`portal` (React) has no workspace dependencies — communicates via HTTP API only.
