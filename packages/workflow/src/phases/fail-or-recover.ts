import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: FailOrRecover
 * Terminal failure handler. Sets failure reason on the request.
 *
 * Sprint 1: Marks as failed with the reason from the previous phase.
 * Future: Could implement retry logic, partial rollback, or alerting.
 *
 * Design: This phase always "succeeds" from the workflow engine perspective
 * (it is the terminal failure state, not another failure to handle).
 */
export async function runFailOrRecover(
  ctx: PhaseContext,
  failureReason: string,
): Promise<PhaseResult> {
  ctx.request.failureReason = failureReason;

  return {
    success: true,
    detail: `Failure handled: ${failureReason}`,
    updatedContext: ctx,
  };
}
