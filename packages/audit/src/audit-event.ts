/**
 * @module audit/audit-event
 * Structured audit event types and the audit logger.
 *
 * Security notes:
 * - Audit events must never contain credentials, tokens, or secrets.
 * - In production, these would be shipped to CloudTrail or a SIEM.
 * - requestedBy is retained for accountability but must be redacted in logs exported externally.
 * - All events are immutable once emitted.
 */

import { RequestId, WorkflowPhase, RequestStatus } from '@caf/domain';

export type AuditEventType =
  | 'REQUEST_SUBMITTED'
  | 'PHASE_STARTED'
  | 'PHASE_COMPLETED'
  | 'PHASE_FAILED'
  | 'REQUEST_COMPLETED'
  | 'REQUEST_FAILED'
  | 'VALIDATION_FAILED'
  | 'POLICY_EVALUATED'
  | 'ACCOUNT_VENDED'
  | 'BOOTSTRAP_COMPLETED'
  | 'ACCOUNT_REGISTERED';

export interface AuditEvent {
  readonly eventId: string;
  readonly eventType: AuditEventType;
  readonly requestId: RequestId;
  readonly occurredAt: string; // ISO 8601
  readonly actor: string; // requestedBy or 'system'
  readonly phase: WorkflowPhase | null;
  readonly status: RequestStatus | null;
  readonly detail: Record<string, unknown>;
  // Security: no credentials, tokens, or ARNs with account IDs in detail
}
