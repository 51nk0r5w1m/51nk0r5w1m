/**
 * @module adapters/organizations/mock
 * Sprint 1 mock implementation of the Organizations adapter.
 *
 * This mock is a contract boundary, not a throwaway stub.
 * It must:
 * - Return the same shape as the real implementation will
 * - Simulate realistic latency
 * - Support configurable failure injection for testing
 *
 * Security note: Mock account IDs use a clearly synthetic format (MOCK-*)
 * to prevent any confusion with real AWS account IDs in logs.
 */

import { AccountVendingResult, TenantEnvironmentRequest, makeAccountId } from '@caf/domain';
import { IOrganizationsAdapter } from './interface';

export interface MockOrganizationsAdapterConfig {
  /** Simulated delay in ms (default: 200) */
  latencyMs?: number;
  /** If set, vendAccount will throw this error */
  failWith?: string;
}

export class MockOrganizationsAdapter implements IOrganizationsAdapter {
  private readonly config: Required<MockOrganizationsAdapterConfig>;

  constructor(config: MockOrganizationsAdapterConfig = {}) {
    this.config = {
      latencyMs: config.latencyMs ?? 200,
      failWith: config.failWith ?? '',
    };
  }

  async vendAccount(request: TenantEnvironmentRequest): Promise<AccountVendingResult> {
    await this.simulateLatency();

    if (this.config.failWith) {
      throw new AdapterError('OrganizationsAdapter', this.config.failWith);
    }

    // MOCK: generates a deterministic-looking but clearly synthetic account ID
    const mockAccountId = `MOCK-${request.tenantId}-${request.environmentName}`.toUpperCase();

    return {
      accountId: makeAccountId(mockAccountId),
      accountEmail: `aws+${request.tenantId}-${request.environmentName}@example.com`,
      accountName: `${request.tenantName} — ${request.environmentName}`,
      ouPath: `/mock-root/mock-${request.environmentClass.toLowerCase()}-ou/`,
      vendedAt: new Date().toISOString(),
    };
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.config.latencyMs));
  }
}

export class AdapterError extends Error {
  constructor(
    public readonly adapter: string,
    message: string,
  ) {
    super(`[${adapter}] ${message}`);
    this.name = 'AdapterError';
  }
}
