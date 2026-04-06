/**
 * @module domain/factory
 * Factory functions for creating domain entities.
 * Centralizes ID generation and initialization logic.
 */

import { randomUUID } from 'crypto';
import {
  CreateRequestInput,
  TenantEnvironmentRequest,
  RequestStatus,
  makeRequestId,
  makeTenantId,
} from './types';

export function createTenantEnvironmentRequest(
  input: CreateRequestInput,
): TenantEnvironmentRequest {
  return {
    id: makeRequestId(randomUUID()),
    tenantId: makeTenantId(input.tenantId),
    tenantName: input.tenantName,
    environmentName: input.environmentName,
    environmentClass: input.environmentClass,
    requestedBy: input.requestedBy,
    createdAt: new Date().toISOString(),
    status: RequestStatus.PENDING,
    currentPhase: null,
    provisionedAccountId: null,
    failureReason: null,
    completedAt: null,
    phaseHistory: [],
  };
}
