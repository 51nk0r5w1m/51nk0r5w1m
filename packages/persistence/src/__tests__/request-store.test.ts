/**
 * @caf/persistence — InMemoryRequestStore tests.
 *
 * Tests the contract that any production store (DynamoDB, RDS) must also satisfy.
 * Coverage: save, findById, findAll, deep-copy semantics, isolation between writes.
 */

import { InMemoryRequestStore } from '../request-store';
import { createTenantEnvironmentRequest, EnvironmentClass, RequestStatus, makeRequestId } from '@caf/domain';

const baseInput = {
  tenantId: 'store-test',
  tenantName: 'Store Test Corp',
  environmentName: 'dev',
  environmentClass: EnvironmentClass.DEV,
  requestedBy: 'ops@storetest.com',
};

describe('InMemoryRequestStore', () => {
  it('saves and retrieves a request by id', async () => {
    const store = new InMemoryRequestStore();
    const req = createTenantEnvironmentRequest(baseInput);
    await store.save(req);

    const found = await store.findById(req.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(req.id);
    expect(found!.tenantId).toBe(req.tenantId);
  });

  it('returns null for unknown id', async () => {
    const store = new InMemoryRequestStore();
    const result = await store.findById(makeRequestId('does-not-exist'));
    expect(result).toBeNull();
  });

  it('findAll returns empty array when store is empty', async () => {
    const store = new InMemoryRequestStore();
    const all = await store.findAll();
    expect(all).toEqual([]);
  });

  it('findAll returns all saved requests', async () => {
    const store = new InMemoryRequestStore();
    const req1 = createTenantEnvironmentRequest(baseInput);
    const req2 = createTenantEnvironmentRequest({ ...baseInput, environmentName: 'staging' });
    await store.save(req1);
    await store.save(req2);

    const all = await store.findAll();
    expect(all.length).toBe(2);
    const ids = all.map(r => r.id);
    expect(ids).toContain(req1.id);
    expect(ids).toContain(req2.id);
  });

  it('save overwrites existing record with same id', async () => {
    const store = new InMemoryRequestStore();
    const req = createTenantEnvironmentRequest(baseInput);
    await store.save(req);

    // Mutate and save again
    req.status = RequestStatus.COMPLETED;
    await store.save(req);

    const found = await store.findById(req.id);
    expect(found!.status).toBe(RequestStatus.COMPLETED);
  });

  it('deep-copy on write: mutating original does not affect stored record', async () => {
    const store = new InMemoryRequestStore();
    const req = createTenantEnvironmentRequest(baseInput);
    await store.save(req);

    // Mutate the original object after save
    req.status = RequestStatus.FAILED;

    // Store should still have the original PENDING status
    const found = await store.findById(req.id);
    expect(found!.status).toBe(RequestStatus.PENDING);
  });

  it('deep-copy on read: mutating returned object does not affect stored record', async () => {
    const store = new InMemoryRequestStore();
    const req = createTenantEnvironmentRequest(baseInput);
    await store.save(req);

    const found = await store.findById(req.id);
    // Mutate the returned object
    found!.status = RequestStatus.FAILED;

    // Stored record should be unchanged
    const foundAgain = await store.findById(req.id);
    expect(foundAgain!.status).toBe(RequestStatus.PENDING);
  });

  it('deep-copy on findAll: mutating returned object does not affect stored record', async () => {
    const store = new InMemoryRequestStore();
    const req = createTenantEnvironmentRequest(baseInput);
    await store.save(req);

    const all = await store.findAll();
    all[0].status = RequestStatus.FAILED;

    const foundAgain = await store.findById(req.id);
    expect(foundAgain!.status).toBe(RequestStatus.PENDING);
  });
});
