# ADR-003: TypeScript for Sprint 1 API (Not Go)

**Status:** Accepted — revisit at Sprint 2 planning  
**Date:** Sprint 1  
**Deciders:** Platform Engineering  

---

## Context

The target architecture for the Custom Account Factory specifies a **Go** control-plane API.
Sprint 1 was implemented in **TypeScript/Node.js**.

This ADR documents why that decision was made, what risks it creates, and the plan to resolve it.

---

## The Architectural Intent

The platform roadmap specifies Go for the control plane because:
- Go's static binary and low memory footprint align well with Fargate/CodeBuild runners
- Go has a strong AWS SDK (aws-sdk-go-v2) with full Organizations and STS support
- Go is idiomatically used for control-plane tooling in the AWS ecosystem
- Go enforces explicit error handling, which matters for a platform that must not silently fail

---

## Why Sprint 1 Used TypeScript Instead

Sprint 1 is a **mocked, local-only vertical slice** with no real AWS calls and no Fargate runners.
The decision to use TypeScript for Sprint 1 was made on these grounds:

1. **Speed of iteration on domain contracts**: TypeScript's structural typing and monorepo tooling
   (pnpm workspaces) allowed the domain model, adapter interfaces, workflow engine, and API
   to be stood up in one sprint with shared types and a working test harness.

2. **React portal shares types**: The portal (React + TypeScript) benefits from shared type contracts
   with the backend. In Go, these would need to be regenerated from OpenAPI or kept in sync manually.

3. **Sprint 1 scope is contract definition, not runtime optimization**: The sprint goal is to
   define stable interfaces (IOrganizationsAdapter, IBootstrapAdapter, IRequestStore, IAuditLogger)
   and validate the workflow logic — not to deliver a production control plane.

4. **No Fargate/CodeBuild work in Sprint 1**: Go's binary deployment advantage is irrelevant
   when Sprint 1 has no runner infrastructure.

---

## Risks Introduced

| Risk | Severity | Mitigation |
|------|----------|------------|
| Domain contracts written in TypeScript may not map cleanly to Go structs | MEDIUM | Define OpenAPI contract in Sprint 2 before Go migration |
| Engineers build TypeScript muscle memory, resist Go migration | LOW | Flag explicitly in Sprint 2 planning |
| TypeScript runtime (Node.js) has different error semantics than Go | LOW | Acceptable for mocked Sprint 1 |
| Test suite written for ts-jest will not transfer to Go | LOW | Tests define the contract; Go tests will re-implement against same spec |

---

## Decision

**Accept TypeScript for Sprint 1 only.**

The following constraints apply:
- TypeScript Sprint 1 code must **not** be extended to Sprint 3+ without explicit Go migration decision
- An OpenAPI spec must be defined before Sprint 2 begins, to decouple portal from backend language
- The Go migration decision must appear as a Sprint 2 story: `S2-00: Evaluate Go migration path for control-plane API`
- All adapter interfaces (`IOrganizationsAdapter`, `IBootstrapAdapter`) and domain models must be treated as the canonical contract — they define what the Go implementation must produce

---

## Migration Path

To migrate the control-plane API to Go in Sprint 2:

1. Define OpenAPI 3.0 spec from the Express routes in `packages/api`
2. Generate Go server stubs from the OpenAPI spec
3. Reimplement `WorkflowEngine`, phase handlers, and adapters in Go
4. Replace `IRequestStore` with a DynamoDB store using `aws-sdk-go-v2`
5. Replace `InMemoryAuditLogger` with CloudTrail / structured logger
6. The React portal communicates via the OpenAPI contract — no portal changes required

The domain model types, audit event shapes, and adapter interfaces committed in Sprint 1
are the **migration contract** and must be preserved in the Go implementation.

---

## Consequences

**Positive:**
- Sprint 1 delivered a working vertical slice quickly
- Adapter interfaces and domain contracts are stable and language-agnostic in their semantics
- TypeScript test suite documents exact behavior the Go implementation must match

**Negative:**
- Sprint 1 codebase will be partially thrown away or maintained in parallel during Go migration
- This must be called out explicitly in Sprint 2 planning — it is not a surprise
- Engineers must not gold-plate the TypeScript API in Sprint 2 if Go migration is the direction

---

## Open Question for Sprint 2 Planning

Should Sprint 2 immediately migrate to Go, or build the OpenAPI contract first (in TypeScript)
and migrate to Go in Sprint 3? This decision depends on team Go expertise and infrastructure readiness.

**Recommendation:** Define the OpenAPI spec in Sprint 2 using the TypeScript codebase as the source.
Begin Go implementation in Sprint 2 for the core control-plane API endpoints only.
Keep TypeScript for the portal indefinitely.
