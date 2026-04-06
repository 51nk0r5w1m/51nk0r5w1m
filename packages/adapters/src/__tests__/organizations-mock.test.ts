import { MockOrganizationsAdapter } from '../organizations/mock';
import { createTenantEnvironmentRequest } from '@caf/domain';
import { EnvironmentClass } from '@caf/domain';

const baseRequest = createTenantEnvironmentRequest({
  tenantId: 'test-tenant',
  tenantName: 'Test Tenant',
  environmentName: 'dev',
  environmentClass: EnvironmentClass.DEV,
  requestedBy: 'test@example.com',
});

describe('MockOrganizationsAdapter', () => {
  it('vends an account with zero latency in tests', async () => {
    const adapter = new MockOrganizationsAdapter({ latencyMs: 0 });
    const result = await adapter.vendAccount(baseRequest);
    expect(result.accountId).toContain('MOCK');
    expect(result.accountEmail).toContain('@');
    expect(result.ouPath).toContain('/');
    expect(result.vendedAt).toBeTruthy();
  });

  it('throws AdapterError when failWith is set', async () => {
    const adapter = new MockOrganizationsAdapter({ latencyMs: 0, failWith: 'Simulated OU failure' });
    await expect(adapter.vendAccount(baseRequest)).rejects.toThrow('OrganizationsAdapter');
  });

  it('account name contains tenant and environment', async () => {
    const adapter = new MockOrganizationsAdapter({ latencyMs: 0 });
    const result = await adapter.vendAccount(baseRequest);
    expect(result.accountName).toContain('Test Tenant');
    expect(result.accountName).toContain('dev');
  });
});
