/**
 * @module adapters/organizations/interface
 * Contract for the AWS Organizations account-vending adapter.
 *
 * Trust boundary: This adapter touches management-account level APIs.
 * In production, calls must use a cross-account role with scoped permissions.
 * The management account must NEVER be used for runtime application logic.
 *
 * Security considerations for real implementation:
 * - Use Organizations:CreateAccount — requires management account trust
 * - Account creation is async; poll via DescribeCreateAccountStatus
 * - Never log CreateAccountStatus.AccountId before verification
 * - OU placement must be policy-driven, not request-driven
 */

import { AccountVendingResult, TenantEnvironmentRequest } from '@caf/domain';

export interface IOrganizationsAdapter {
  /**
   * Vends a new AWS account for the given request.
   * In production: calls Organizations CreateAccount, waits for SUCCEEDED status.
   * Returns the account ID and placement details.
   *
   * @throws {AdapterError} if account creation fails or times out
   */
  vendAccount(request: TenantEnvironmentRequest): Promise<AccountVendingResult>;
}
