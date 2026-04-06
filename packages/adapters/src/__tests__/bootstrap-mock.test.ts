import { MockBootstrapAdapter } from '../bootstrap/mock';
import { MockOrganizationsAdapter } from '../organizations/mock';
import { createTenantEnvironmentRequest, EnvironmentClass } from '@caf/domain';

const baseRequest = createTenantEnvironmentRequest({
  tenantId: 'test-tenant',
  tenantName: 'Test Tenant',
  environmentName: 'dev',
  environmentClass: EnvironmentClass.DEV,
  requestedBy: 'test@example.com',
});

describe('MockBootstrapAdapter', () => {
  it('runs bootstrap and returns result', async () => {
    const orgsAdapter = new MockOrganizationsAdapter({ latencyMs: 0 });
    const bootstrapAdapter = new MockBootstrapAdapter({ latencyMs: 0 });

    const vendingResult = await orgsAdapter.vendAccount(baseRequest);
    const bootstrapResult = await bootstrapAdapter.runBootstrap(baseRequest, vendingResult);

    expect(bootstrapResult.baselineRoleArn).toContain('mock::iam');
    expect(bootstrapResult.baselineBucketArn).toContain('mock::s3');
    expect(bootstrapResult.bootstrappedAt).toBeTruthy();
  });

  it('verifyBootstrap returns true on success', async () => {
    const orgsAdapter = new MockOrganizationsAdapter({ latencyMs: 0 });
    const bootstrapAdapter = new MockBootstrapAdapter({ latencyMs: 0 });

    const vendingResult = await orgsAdapter.vendAccount(baseRequest);
    const bootstrapResult = await bootstrapAdapter.runBootstrap(baseRequest, vendingResult);
    const verified = await bootstrapAdapter.verifyBootstrap(vendingResult.accountId, bootstrapResult);
    expect(verified).toBe(true);
  });

  it('verifyBootstrap returns false when configured to fail', async () => {
    const orgsAdapter = new MockOrganizationsAdapter({ latencyMs: 0 });
    const bootstrapAdapter = new MockBootstrapAdapter({ latencyMs: 0, verifyFails: true });

    const vendingResult = await orgsAdapter.vendAccount(baseRequest);
    const bootstrapResult = await bootstrapAdapter.runBootstrap(baseRequest, vendingResult);
    const verified = await bootstrapAdapter.verifyBootstrap(vendingResult.accountId, bootstrapResult);
    expect(verified).toBe(false);
  });

  it('throws AdapterError when failWith is set', async () => {
    const orgsAdapter = new MockOrganizationsAdapter({ latencyMs: 0 });
    const bootstrapAdapter = new MockBootstrapAdapter({ latencyMs: 0, failWith: 'IAM policy denied' });

    const vendingResult = await orgsAdapter.vendAccount(baseRequest);
    await expect(bootstrapAdapter.runBootstrap(baseRequest, vendingResult)).rejects.toThrow('BootstrapAdapter');
  });
});
