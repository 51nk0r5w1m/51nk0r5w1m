/**
 * S1-07, S1-08, S1-11: API request endpoint tests
 */

import request from 'supertest';
import { buildApp } from '../app';
import { buildContainer } from '../container';
import { EnvironmentClass, RequestStatus } from '@caf/domain';

function buildTestContainer() {
  // Use zero-latency adapters for testing
  const {
    InMemoryAuditLogger,
  } = require('@caf/audit');
  const {
    MockOrganizationsAdapter,
    MockBootstrapAdapter,
  } = require('@caf/adapters');
  const { InMemoryRequestStore } = require('@caf/persistence');
  const { WorkflowEngine } = require('@caf/workflow');

  const requestStore = new InMemoryRequestStore();
  const auditLogger = new InMemoryAuditLogger();
  const workflowEngine = new WorkflowEngine({
    orgsAdapter: new MockOrganizationsAdapter({ latencyMs: 0 }),
    bootstrapAdapter: new MockBootstrapAdapter({ latencyMs: 0 }),
    requestStore,
    auditLogger,
  });

  return { requestStore, auditLogger, workflowEngine };
}

const validBody = {
  tenantId: 'test-tenant',
  tenantName: 'Test Tenant Co',
  environmentName: 'dev',
  environmentClass: EnvironmentClass.DEV,
  requestedBy: 'admin@test.com',
};

describe('POST /api/requests', () => {
  it('returns 202 with requestId for valid input', async () => {
    const app = buildApp(buildTestContainer() as any);
    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(202);
    expect(res.body.requestId).toBeDefined();
    expect(res.body.status).toBe(RequestStatus.PENDING);
  });

  it('returns 400 for missing tenantId', async () => {
    const app = buildApp(buildTestContainer() as any);
    const { tenantId: _, ...noTenant } = validBody;
    const res = await request(app).post('/api/requests').send(noTenant);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
  });

  it('returns 400 for invalid environmentClass', async () => {
    const app = buildApp(buildTestContainer() as any);
    const res = await request(app).post('/api/requests').send({
      ...validBody,
      environmentClass: 'INVALID',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for injection in tenantId', async () => {
    const app = buildApp(buildTestContainer() as any);
    const res = await request(app).post('/api/requests').send({
      ...validBody,
      tenantId: 'evil; DROP TABLE requests;',
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/requests/:id', () => {
  it('returns 404 for unknown request ID', async () => {
    const app = buildApp(buildTestContainer() as any);
    const res = await request(app).get('/api/requests/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it('returns request data for known ID', async () => {
    const app = buildApp(buildTestContainer() as any);
    const postRes = await request(app).post('/api/requests').send(validBody);
    const { requestId } = postRes.body;

    const getRes = await request(app).get(`/api/requests/${requestId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(requestId);
    expect(getRes.body.tenantId).toBe(validBody.tenantId);
  });
});

describe('GET /api/requests', () => {
  it('returns empty list initially', async () => {
    const app = buildApp(buildTestContainer() as any);
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(200);
    expect(res.body.requests).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns list after submission', async () => {
    const app = buildApp(buildTestContainer() as any);
    await request(app).post('/api/requests').send(validBody);
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const app = buildApp(buildTestContainer() as any);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
