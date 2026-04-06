import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: VerifyBootstrap
 * Verifies that bootstrap resources were created successfully.
 * This is the safety check before registering the account as ready.
 */
export async function runVerifyBootstrap(ctx: PhaseContext): Promise<PhaseResult> {
  if (!ctx.vendingResult || !ctx.bootstrapResult) {
    return {
      success: false,
      detail: 'Verification failed: missing vending or bootstrap result',
      updatedContext: ctx,
    };
  }

  const verified = await ctx.bootstrapAdapter.verifyBootstrap(
    ctx.vendingResult.accountId,
    ctx.bootstrapResult,
  );

  if (!verified) {
    return {
      success: false,
      detail: 'Bootstrap verification failed — sentinel resources not found',
      updatedContext: ctx,
    };
  }

  return {
    success: true,
    detail: 'Bootstrap verified successfully',
    updatedContext: ctx,
  };
}
