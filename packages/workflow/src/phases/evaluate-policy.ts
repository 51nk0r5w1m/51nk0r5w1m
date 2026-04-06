import { EnvironmentClass } from '@caf/domain';
import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: EvaluatePolicy
 * Evaluates whether the request meets policy requirements.
 *
 * Sprint 1: Policy is mocked — PROD requests are auto-approved.
 * Future: This will call a policy engine with approval gates for PROD.
 *
 * Design note: EnvironmentClass influences what policies apply.
 * PROD would normally require human approval (deferred to Sprint 2).
 */
export async function runEvaluatePolicy(ctx: PhaseContext): Promise<PhaseResult> {
  const { request } = ctx;

  // Sprint 1: Log that PROD would require approval but auto-approve for now
  if (request.environmentClass === EnvironmentClass.PROD) {
    // TODO Sprint 2: Implement approval gate for PROD environments
    console.log(`[EvaluatePolicy] MOCK: Auto-approving PROD request ${request.id} (Sprint 1 — no approval gate)`);
  }

  return {
    success: true,
    detail: `Policy evaluation passed for ${request.environmentClass} environment (mocked)`,
    updatedContext: ctx,
  };
}
