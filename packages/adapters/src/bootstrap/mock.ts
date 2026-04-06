/**
 * @module adapters/bootstrap/mock
 * Sprint 1 mock implementation of the bootstrap adapter.
 *
 * Returns synthetic ARNs that are clearly mock (mock:: prefix).
 * Real implementation will replace these with actual ARNs from provisioned resources.
 *
 * Security note: ARNs logged here contain account IDs in a real system.
 * In production, log redaction must be applied before shipping to aggregators.
 */

import { BootstrapResult, AccountVendingResult, TenantEnvironmentRequest } from '@caf/domain';
import { IBootstrapAdapter } from './interface';
import { AdapterError } from '../organizations/mock';

export interface MockBootstrapAdapterConfig {
  latencyMs?: number;
  failWith?: string;
  verifyFails?: boolean;
}

export class MockBootstrapAdapter implements IBootstrapAdapter {
  private readonly config: Required<MockBootstrapAdapterConfig>;

  constructor(config: MockBootstrapAdapterConfig = {}) {
    this.config = {
      latencyMs: config.latencyMs ?? 150,
      failWith: config.failWith ?? '',
      verifyFails: config.verifyFails ?? false,
    };
  }

  async runBootstrap(
    request: TenantEnvironmentRequest,
    vendingResult: AccountVendingResult,
  ): Promise<BootstrapResult> {
    await this.simulateLatency();

    if (this.config.failWith) {
      throw new AdapterError('BootstrapAdapter', this.config.failWith);
    }

    const accountId = vendingResult.accountId;

    return {
      accountId,
      // MOCK: clearly synthetic ARN format
      baselineRoleArn: `mock::iam::${accountId}:role/caf-baseline-role`,
      baselineBucketArn: `mock::s3:::caf-baseline-${accountId.toLowerCase()}`,
      bootstrappedAt: new Date().toISOString(),
    };
  }

  async verifyBootstrap(_accountId: string, _bootstrapResult: BootstrapResult): Promise<boolean> {
    await this.simulateLatency();

    if (this.config.verifyFails) {
      return false;
    }

    return true;
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.config.latencyMs));
  }
}
