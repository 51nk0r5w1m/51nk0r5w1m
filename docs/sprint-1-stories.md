# Sprint 1 Stories — Custom Account Factory

## Epic: Organizations-First Account Provisioning (Sprint 1)

Sprint 1 establishes the core provisioning workflow with mocked AWS adapters,
an in-memory persistence layer, structured audit logging, and a REST API.
No real AWS API calls are made in Sprint 1.

---

## S1-01: Define Core Domain Types

**As a** platform engineer,  
**I want** a well-typed domain model for provisioning requests,  
**so that** all layers share a single, unambiguous contract.

### Acceptance Criteria
- `TenantEnvironmentRequest` entity captures: id, tenantId, tenantName, environmentName, environmentClass, requestedBy, status, currentPhase, provisionedAccountId, failureReason, phaseHistory
- `EnvironmentClass` enum: DEV, STAGING, PROD
- `RequestStatus` enum covers all lifecycle states
- `WorkflowPhase` enum maps 1:1 to state machine steps
- Opaque branded types (`RequestId`, `TenantId`, `AccountId`) for type safety
- No circular imports between domain and other packages

---

## S1-02: Input Validation

**As a** security engineer,  
**I want** all provisioning inputs validated at the boundary,  
**so that** injection attacks cannot reach downstream AWS API calls.

### Acceptance Criteria
- `validateCreateRequestInput` validates tenantId, tenantName, environmentName, environmentClass, requestedBy
- tenantId and environmentName must match `[a-zA-Z0-9_\-.]{1,64}`
- requestedBy must be a valid email
- Returns a list of `ValidationError` (field + message); never throws
- Injection characters in tenantId are rejected
- All validation tests pass

---

## S1-03: Request Factory

**As a** developer,  
**I want** a factory function to create `TenantEnvironmentRequest` entities,  
**so that** ID generation and initialization are centralized.

### Acceptance Criteria
- `createTenantEnvironmentRequest(input)` produces a valid entity
- UUID assigned as `id`
- `status` starts as `PENDING`
- `phaseHistory` starts empty
- `provisionedAccountId` starts null

---

## S1-04: Structured Audit Logging

**As a** compliance engineer,  
**I want** every workflow transition emitted as a structured audit event,  
**so that** there is an immutable audit trail for every provisioning action.

### Acceptance Criteria
- `AuditEvent` has: eventId, eventType, requestId, occurredAt, actor, phase, status, detail
- `InMemoryAuditLogger` implements `IAuditLogger`
- Events are queryable by requestId
- Audit events never contain credentials, tokens, or secrets
- Logs are emitted as JSON to stdout

---

## S1-05: In-Memory Persistence

**As a** developer,  
**I want** an in-memory request store that matches the production interface,  
**so that** Sprint 1 can run without a database while maintaining interface stability.

### Acceptance Criteria
- `IRequestStore` interface: `save`, `findById`, `findAll`
- `InMemoryRequestStore` deep-copies on write and read to prevent external mutation
- Interface is designed for future DynamoDB replacement

---

## S1-06: Mock AWS Adapters

**As a** developer,  
**I want** mock implementations of the Organizations and Bootstrap adapters,  
**so that** Sprint 1 runs fully without AWS credentials.

### Acceptance Criteria
- `MockOrganizationsAdapter` returns deterministic synthetic account IDs (MOCK-* prefix)
- `MockBootstrapAdapter` returns synthetic ARNs (mock:: prefix)
- Both adapters support configurable latency and failure injection
- `AdapterError` is a named error class for adapter failures
- All adapter tests pass

---

## S1-07: POST /api/requests

**As a** tenant administrator,  
**I want** to submit a provisioning request via REST API,  
**so that** I can trigger account creation without direct AWS access.

### Acceptance Criteria
- `POST /api/requests` accepts JSON body with tenantId, tenantName, environmentName, environmentClass, requestedBy
- Returns HTTP 202 with `{ requestId, status, message }`
- Returns HTTP 400 with `{ error, details }` for invalid input
- Workflow is launched asynchronously
- Request is persisted immediately on acceptance
- Audit event `REQUEST_SUBMITTED` is emitted

---

## S1-08: GET /api/requests/:id and GET /api/requests

**As a** tenant administrator,  
**I want** to check the status of my provisioning request,  
**so that** I know when my account is ready.

### Acceptance Criteria
- `GET /api/requests/:id` returns request DTO with status, currentPhase, phaseHistory
- Returns HTTP 404 for unknown IDs
- `GET /api/requests` returns all requests with count
- Response does not include internal fields

---

## S1-09: State Machine Definition

**As a** platform engineer,  
**I want** a declarative state machine for workflow phases,  
**so that** adding new phases is a configuration change, not a code change.

### Acceptance Criteria
- `PHASE_TRANSITIONS` table defines: enterStatus, onSuccess, onFailure for each phase
- Terminal states (success and failure) are explicit null transitions
- State machine covers: ValidateRequest → EvaluatePolicy → CreateMockAccount → RunMockBootstrap → VerifyBootstrap → RegisterAccount → (COMPLETED)
- FailOrRecover is the shared failure handler

---

## S1-10: Workflow Phase Handlers

**As a** platform engineer,  
**I want** each workflow phase implemented as an isolated, testable function,  
**so that** phases can be developed, tested, and replaced independently.

### Acceptance Criteria
- Each phase is a pure async function: `(ctx: PhaseContext) => Promise<PhaseResult>`
- `PhaseContext` carries request, adapters, audit logger, and accumulated results
- `PhaseResult` carries success flag, detail string, and updated context
- Phases do not directly mutate global state
- FailOrRecover phase accepts a failureReason parameter

---

## S1-11: Workflow Engine

**As a** platform engineer,  
**I want** a workflow engine that drives the state machine end-to-end,  
**so that** provisioning requests are processed reliably with full auditability.

### Acceptance Criteria
- `WorkflowEngine.execute(request)` runs all phases sequentially
- State is persisted after every phase transition
- Audit events are emitted at PHASE_STARTED and PHASE_COMPLETED/PHASE_FAILED
- On phase failure, engine routes to FailOrRecover
- On FailOrRecover success, engine sets status to FAILED (terminal)
- On RegisterAccount success, engine sets status to COMPLETED (terminal)
- Happy path test: status=COMPLETED, provisionedAccountId set, all phases SUCCESS
- Failure path test: status=FAILED, failureReason populated, FailOrRecover in history
- Tests run with zero-latency mock adapters

---

## S1-12: React Portal (Minimal)

**As a** tenant administrator,  
**I want** a basic web UI to submit and monitor provisioning requests,  
**so that** I don't need to use curl to interact with the system.

### Acceptance Criteria
- Vite + React app with form to submit requests
- Form fields: tenantId, tenantName, environmentName, environmentClass (dropdown), requestedBy (email)
- Table shows all requests with status, color-coded (green=COMPLETED, red=FAILED, orange=in-progress)
- Proxies API calls to backend on localhost:3001
- No production auth in Sprint 1 (deferred)

---

## Definition of Done (Sprint 1)

- [ ] All TypeScript compiles with `strict: true`, zero errors
- [ ] All tests pass (`pnpm -r run test`)
- [ ] No real AWS SDK calls in codebase
- [ ] Audit events emitted for every phase transition
- [ ] Input validation rejects injection characters
- [ ] Security headers applied (X-Content-Type-Options, X-Frame-Options, no X-Powered-By)
- [ ] All packages buildable (`pnpm -r run build`)
- [ ] Docs: ADRs, threat model, sprint stories committed
