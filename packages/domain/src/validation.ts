/**
 * @module domain/validation
 * Pure validation functions — no side effects, no I/O.
 * Security note: All user inputs must pass through these validators before
 * entering the workflow. This is the first trust boundary.
 */

import { CreateRequestInput, EnvironmentClass, ValidationError } from './types';

const SAFE_STRING_PATTERN = /^[a-zA-Z0-9_\-\.]{1,64}$/;
// Dots and hyphens are intentionally allowed: they are common in tenant IDs (e.g. "acme-corp",
// "tenant.1") and safe here because values are only used in AWS account names and mock IDs,
// never in file paths or shell commands. Full allow-list prevents injection.

// ReDoS-safe email pattern: avoids nested quantifiers by using explicit character classes
// and anchoring each segment length. Not RFC 5321 complete — intentionally simplified for security.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}$/;

/**
 * Validates a CreateRequestInput.
 * Returns an array of ValidationErrors (empty = valid).
 * Never throws — callers must handle the error list.
 *
 * Security: Rejects any input that does not match strict allow-lists
 * to prevent injection into downstream AWS API calls.
 */
export function validateCreateRequestInput(
  input: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== 'object') {
    return [{ field: 'body', message: 'Request body must be a JSON object' }];
  }

  const req = input as Record<string, unknown>;

  if (!req.tenantId || typeof req.tenantId !== 'string') {
    errors.push({ field: 'tenantId', message: 'tenantId is required and must be a string' });
  } else if (!SAFE_STRING_PATTERN.test(req.tenantId)) {
    errors.push({ field: 'tenantId', message: 'tenantId must match pattern [a-zA-Z0-9_\\-.]{1,64}' });
  }

  if (!req.tenantName || typeof req.tenantName !== 'string') {
    errors.push({ field: 'tenantName', message: 'tenantName is required and must be a string' });
  } else if (req.tenantName.length > 128) {
    errors.push({ field: 'tenantName', message: 'tenantName must not exceed 128 characters' });
  }

  if (!req.environmentName || typeof req.environmentName !== 'string') {
    errors.push({ field: 'environmentName', message: 'environmentName is required and must be a string' });
  } else if (!SAFE_STRING_PATTERN.test(req.environmentName)) {
    errors.push({ field: 'environmentName', message: 'environmentName must match pattern [a-zA-Z0-9_\\-.]{1,64}' });
  }

  if (!req.environmentClass) {
    errors.push({ field: 'environmentClass', message: 'environmentClass is required' });
  } else if (!Object.values(EnvironmentClass).includes(req.environmentClass as EnvironmentClass)) {
    errors.push({
      field: 'environmentClass',
      message: `environmentClass must be one of: ${Object.values(EnvironmentClass).join(', ')}`,
    });
  }

  if (!req.requestedBy || typeof req.requestedBy !== 'string') {
    errors.push({ field: 'requestedBy', message: 'requestedBy is required and must be a string' });
  } else if (!EMAIL_PATTERN.test(req.requestedBy)) {
    errors.push({ field: 'requestedBy', message: 'requestedBy must be a valid email address' });
  }

  return errors;
}

/**
 * Returns a typed CreateRequestInput or throws if invalid.
 * Use validateCreateRequestInput if you want non-throwing validation.
 */
export function parseCreateRequestInput(input: unknown): CreateRequestInput {
  const errors = validateCreateRequestInput(input);
  if (errors.length > 0) {
    throw new Error(`Invalid input: ${errors.map(e => `${e.field}: ${e.message}`).join('; ')}`);
  }
  const req = input as Record<string, unknown>;
  return {
    tenantId: req.tenantId as string,
    tenantName: req.tenantName as string,
    environmentName: req.environmentName as string,
    environmentClass: req.environmentClass as EnvironmentClass,
    requestedBy: req.requestedBy as string,
  };
}
