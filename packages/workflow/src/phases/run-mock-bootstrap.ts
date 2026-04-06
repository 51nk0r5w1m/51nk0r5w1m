import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: RunMockBootstrap
 * Calls the bootstrap adapter to set up baseline resources in the new account.
 *
 * Requires vendingResult from CreateMockAccount phase.
 * If vendingResult is missing, this phase fails immediately.
 */
export async function runRunMockBootstrap(ctx: PhaseContext): Promise<PhaseResult> {
  if (!ctx.vendingResult) {
    return {
      success: false,
      detail: 'Bootstrap failed: no vending result available from previous phase',
      updatedContext: ctx,
    };
  }

  try {
    const bootstrapResult = await ctx.bootstrapAdapter.runBootstrap(ctx.request, ctx.vendingResult);

    return {
      success: true,
      detail: 'Bootstrap completed successfully (mock)',
      updatedContext: {
        ...ctx,
        bootstrapResult,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      detail: `Bootstrap failed: ${message}`,
      updatedContext: ctx,
    };
  }
}
