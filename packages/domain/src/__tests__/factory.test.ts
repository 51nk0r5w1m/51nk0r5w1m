import { createTenantEnvironmentRequest } from '../factory';
import { EnvironmentClass, RequestStatus } from '../types';

const input = {
  tenantId: 'acme',
  tenantName: 'ACME Corp',
  environmentName: 'dev',
  environmentClass: EnvironmentClass.DEV,
  requestedBy: 'bob@acme.com',
};

describe('createTenantEnvironmentRequest', () => {
  it('creates a request with PENDING status', () => {
    const req = createTenantEnvironmentRequest(input);
    expect(req.status).toBe(RequestStatus.PENDING);
  });

  it('assigns a UUID id', () => {
    const req = createTenantEnvironmentRequest(input);
    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('starts with empty phaseHistory', () => {
    const req = createTenantEnvironmentRequest(input);
    expect(req.phaseHistory).toEqual([]);
  });

  it('has null provisionedAccountId initially', () => {
    const req = createTenantEnvironmentRequest(input);
    expect(req.provisionedAccountId).toBeNull();
  });
});
