/**
 * @module persistence/request-store
 * In-memory request store for Sprint 1.
 *
 * Design notes:
 * - Interface is stable for future DynamoDB / RDS replacement
 * - Store holds full entity — no partial updates to avoid inconsistency
 * - Concurrent access is not safe in this in-memory impl (single-process only)
 * - Production impl must use optimistic locking / conditional writes
 *
 * Security: No external input is written directly here.
 * All writes come through validated domain entities.
 */

import { TenantEnvironmentRequest, RequestId } from '@caf/domain';

export interface IRequestStore {
  save(request: TenantEnvironmentRequest): Promise<void>;
  findById(id: RequestId): Promise<TenantEnvironmentRequest | null>;
  findAll(): Promise<TenantEnvironmentRequest[]>;
}

export class InMemoryRequestStore implements IRequestStore {
  private readonly store = new Map<string, TenantEnvironmentRequest>();

  async save(request: TenantEnvironmentRequest): Promise<void> {
    // Deep-copy to prevent external mutation of stored state
    this.store.set(request.id, JSON.parse(JSON.stringify(request)));
  }

  async findById(id: RequestId): Promise<TenantEnvironmentRequest | null> {
    const record = this.store.get(id);
    return record ? JSON.parse(JSON.stringify(record)) : null;
  }

  async findAll(): Promise<TenantEnvironmentRequest[]> {
    return Array.from(this.store.values()).map(r => JSON.parse(JSON.stringify(r)));
  }
}
