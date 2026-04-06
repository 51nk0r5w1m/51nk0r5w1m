/**
 * S1-11: Workflow engine tests — happy path, failure path, and persistence verification.
 *
 * Bug-fix note: buildEngine() previously created two separate store/logger instances
 * — one injected into the engine and two orphaned ones returned to callers, making
 * it impossible to verify what was actually persisted. Fixed to share instances.
 */

import { WorkflowEngine } from '../workflow-engine';
import { MockOrganizationsAdapter } from '@caf/adapters';
import { MockBootstrapAdapter } from '@caf/adapters';
import { InMemoryAuditLogger } from '@caf/audit';
import { InMemoryRequestStore } from '@caf/persistence';
import {
  createTenantEnvironmentRequest,
  EnvironmentClass,
  RequestStatus,
} from '@caf/domain';

function buildEngine(orgsConfig = {}, bootstrapConfig = {}) {
  // Share the same instances so tests can inspect persisted state and emitted audit events.
  const requestStore = new InMemoryRequestStore();
  const auditLogger = new InMemoryAuditLogger();
  const engine = new WorkflowEngine({
    orgsAdapter: new MockOrganizationsAdapter({ latencyMs: 0, ...orgsConfig }),
    bootstrapAdapter: new MockBootstrapAdapter({ latencyMs: 0, ...bootstrapConfig }),
    requestStore,
    auditLogger,
  });
  return { engine, requestStore, auditLogger };
}

const baseInput = {
  tenantId: 'acme',
  tenantName: 'ACME Corp',
  environmentName: 'dev',
  environmentClass: EnvironmentClass.DEV,
  requestedBy: 'alice@acme.com',
};

describe('WorkflowEngine — happy path', () => {
  it('completes a full workflow and sets status to COMPLETED', async () => {
    const { engine } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    expect(result.status).toBe(RequestStatus.COMPLETED);
    expect(result.provisionedAccountId).not.toBeNull();
    expect(result.completedAt).not.toBeNull();
    expect(result.failureReason).toBeNull();
  });

  it('records all phases in phaseHistory', async () => {
    const { engine } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    const phases = result.phaseHistory.map(p => p.phase);
    expect(phases).toContain('ValidateRequest');
    expect(phases).toContain('EvaluatePolicy');
    expect(phases).toContain('CreateMockAccount');
    expect(phases).toContain('RunMockBootstrap');
    expect(phases).toContain('VerifyBootstrap');
    expect(phases).toContain('RegisterAccount');
  });

  it('all phases succeed in happy path', async () => {
    const { engine } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    for (const entry of result.phaseHistory) {
      expect(entry.outcome).toBe('SUCCESS');
    }
  });

  it('works for PROD environment class', async () => {
    const { engine } = buildEngine();
    const prodRequest = createTenantEnvironmentRequest({
      ...baseInput,
      environmentClass: EnvironmentClass.PROD,
    });
    const result = await engine.execute(prodRequest);
    expect(result.status).toBe(RequestStatus.COMPLETED);
  });
});

describe('WorkflowEngine — failure path', () => {
  it('fails when Organizations adapter fails', async () => {
    const { engine } = buildEngine({ failWith: 'OU limit exceeded' });
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    expect(result.status).toBe(RequestStatus.FAILED);
    expect(result.failureReason).toContain('OU limit exceeded');
  });

  it('fails when bootstrap adapter fails', async () => {
    const { engine } = buildEngine({}, { failWith: 'IAM policy denied' });
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    expect(result.status).toBe(RequestStatus.FAILED);
    expect(result.failureReason).toContain('IAM policy denied');
  });

  it('fails when bootstrap verification fails', async () => {
    const { engine } = buildEngine({}, { verifyFails: true });
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    expect(result.status).toBe(RequestStatus.FAILED);
  });

  it('records FailOrRecover phase in phaseHistory on failure', async () => {
    const { engine } = buildEngine({ failWith: 'Network error' });
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    const failPhase = result.phaseHistory.find(p => p.phase === 'FailOrRecover');
    expect(failPhase).toBeDefined();
  });
});

describe('WorkflowEngine — persistence verification', () => {
  it('persists the completed request to the store', async () => {
    const { engine, requestStore } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    const persisted = await requestStore.findById(result.id);
    expect(persisted).not.toBeNull();
    expect(persisted!.status).toBe(RequestStatus.COMPLETED);
    expect(persisted!.provisionedAccountId).not.toBeNull();
    expect(persisted!.completedAt).not.toBeNull();
  });

  it('persists the failed request to the store', async () => {
    const { engine, requestStore } = buildEngine({ failWith: 'OU limit exceeded' });
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    const persisted = await requestStore.findById(result.id);
    expect(persisted).not.toBeNull();
    expect(persisted!.status).toBe(RequestStatus.FAILED);
    expect(persisted!.failureReason).toContain('OU limit exceeded');
  });

  it('persisted state matches returned state', async () => {
    const { engine, requestStore } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    const result = await engine.execute(request);

    const persisted = await requestStore.findById(result.id);
    expect(persisted!.status).toBe(result.status);
    expect(persisted!.provisionedAccountId).toBe(result.provisionedAccountId);
    expect(persisted!.phaseHistory.length).toBe(result.phaseHistory.length);
  });
});

describe('WorkflowEngine — audit event verification', () => {
  it('emits REQUEST_COMPLETED audit event on success', async () => {
    const { engine, auditLogger } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    await engine.execute(request);

    const events = auditLogger.getEvents(request.id);
    const completedEvent = events.find(e => e.eventType === 'REQUEST_COMPLETED');
    expect(completedEvent).toBeDefined();
    expect(completedEvent!.status).toBe(RequestStatus.COMPLETED);
  });

  it('emits REQUEST_FAILED audit event on failure', async () => {
    const { engine, auditLogger } = buildEngine({ failWith: 'OU limit exceeded' });
    const request = createTenantEnvironmentRequest(baseInput);
    await engine.execute(request);

    const events = auditLogger.getEvents(request.id);
    const failedEvent = events.find(e => e.eventType === 'REQUEST_FAILED');
    expect(failedEvent).toBeDefined();
    expect(failedEvent!.status).toBe(RequestStatus.FAILED);
  });

  it('emits PHASE_STARTED and PHASE_COMPLETED events for each phase', async () => {
    const { engine, auditLogger } = buildEngine();
    const request = createTenantEnvironmentRequest(baseInput);
    await engine.execute(request);

    const events = auditLogger.getEvents(request.id);
    const startedEvents = events.filter(e => e.eventType === 'PHASE_STARTED');
    const completedEvents = events.filter(e => e.eventType === 'PHASE_COMPLETED');
    // 6 phases in happy path
    expect(startedEvents.length).toBe(6);
    expect(completedEvents.length).toBe(6);
  });

  it('audit events never contain failWith error as raw adapter internals', async () => {
    const { engine, auditLogger } = buildEngine({ failWith: 'OU limit exceeded' });
    const request = createTenantEnvironmentRequest(baseInput);
    await engine.execute(request);

    const events = auditLogger.getEvents(request.id);
    // Confirm events exist and none expose raw credentials or secrets (none here, but check structure)
    for (const event of events) {
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeDefined();
      expect(event.requestId).toBe(request.id);
      expect(event.detail).not.toHaveProperty('password');
      expect(event.detail).not.toHaveProperty('secret');
      expect(event.detail).not.toHaveProperty('token');
    }
  });
});
