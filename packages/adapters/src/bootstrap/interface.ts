/**
 * @module adapters/bootstrap/interface
 * Contract for the custom account bootstrap adapter.
 *
 * Trust boundary: This adapter acts inside the provisioned target account.
 * In production it would assume a cross-account role into the new account.
 * It must NOT use management-account credentials.
 *
 * Security considerations for real implementation:
 * - Bootstrap role must be pre-created during account vending (by Organizations)
 * - Baseline IAM role must enforce least privilege
 * - S3 bucket must have: block public access, versioning, server-side encryption
 * - All bootstrap actions must be idempotent for safe retry
 * - Assume-role chain: management → shared-services → target
 */

import { BootstrapResult, AccountVendingResult, TenantEnvironmentRequest } from '@caf/domain';

export interface IBootstrapAdapter {
  /**
   * Runs custom bootstrap in the provisioned account.
   * In production: assumes cross-account role, creates baseline resources.
   *
   * @param request the original provisioning request
   * @param vendingResult output from the Organizations adapter
   * @throws {AdapterError} if bootstrap fails
   */
  runBootstrap(
    request: TenantEnvironmentRequest,
    vendingResult: AccountVendingResult,
  ): Promise<BootstrapResult>;

  /**
   * Verifies bootstrap succeeded by checking sentinel resources.
   * Must be idempotent and safe to call multiple times.
   */
  verifyBootstrap(
    accountId: string,
    bootstrapResult: BootstrapResult,
  ): Promise<boolean>;
}
