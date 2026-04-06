import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: RegisterAccount
 * Marks the account as active in the registry.
 * This is the terminal success phase.
 *
 * In production: would write to a DynamoDB account registry or SSM Parameter Store.
 * Sprint 1: Sets provisionedAccountId on the request entity.
 */
export async function runRegisterAccount(ctx: PhaseContext): Promise<PhaseResult> {
  if (!ctx.vendingResult) {
    return {
      success: false,
      detail: 'Registration failed: no account ID available',
      updatedContext: ctx,
    };
  }

  // Update the request entity with the provisioned account ID
  ctx.request.provisionedAccountId = ctx.vendingResult.accountId;

  return {
    success: true,
    detail: `Account ${ctx.vendingResult.accountId} registered successfully`,
    updatedContext: ctx,
  };
}
