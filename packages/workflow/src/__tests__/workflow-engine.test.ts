/**
 * S1-11: Workflow engine tests — happy path and failure path
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
  return {
    engine: new WorkflowEngine({
      orgsAdapter: new MockOrganizationsAdapter({ latencyMs: 0, ...orgsConfig }),
      bootstrapAdapter: new MockBootstrapAdapter({ latencyMs: 0, ...bootstrapConfig }),
      requestStore: new InMemoryRequestStore(),
      auditLogger: new InMemoryAuditLogger(),
    }),
    auditLogger: new InMemoryAuditLogger(),
    requestStore: new InMemoryRequestStore(),
  };
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
