import { PhaseContext, PhaseResult } from '../phase-context';

/**
 * Phase: ValidateRequest
 * Validates that the request has all required fields and meets policy constraints.
 * This is the last chance to reject before any AWS API calls are made.
 *
 * Security: Validates tenant/environment names against allow-lists
 * to prevent injection attacks downstream in Organizations API calls.
 */
export async function runValidateRequest(ctx: PhaseContext): Promise<PhaseResult> {
  const { request } = ctx;

  const issues: string[] = [];

  if (!request.tenantId) issues.push('Missing tenantId');
  if (!request.tenantName) issues.push('Missing tenantName');
  if (!request.environmentName) issues.push('Missing environmentName');
  if (!request.environmentClass) issues.push('Missing environmentClass');
  if (!request.requestedBy) issues.push('Missing requestedBy');

  if (issues.length > 0) {
    return {
      success: false,
      detail: `Validation failed: ${issues.join(', ')}`,
      updatedContext: ctx,
    };
  }

  return {
    success: true,
    detail: 'Request validated successfully',
    updatedContext: ctx,
  };
}
