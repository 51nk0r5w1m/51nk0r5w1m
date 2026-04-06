import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: CreateMockAccount
 * Calls the Organizations adapter to vend a new AWS account.
 *
 * This phase is isolated behind the IOrganizationsAdapter interface.
 * Replace MockOrganizationsAdapter with RealOrganizationsAdapter for production.
 *
 * Security: Account ID must not be logged in detail before VerifyBootstrap confirms it.
 */
export async function runCreateMockAccount(ctx: PhaseContext): Promise<PhaseResult> {
  try {
    const vendingResult = await ctx.orgsAdapter.vendAccount(ctx.request);

    return {
      success: true,
      detail: `Account vended successfully (mock)`,
      updatedContext: {
        ...ctx,
        vendingResult,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      detail: `Account vending failed: ${message}`,
      updatedContext: ctx,
    };
  }
}
