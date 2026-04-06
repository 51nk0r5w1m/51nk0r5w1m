/**
 * @module audit/audit-logger
 * In-memory audit logger for Sprint 1.
 *
 * Security note: In production this would write to CloudTrail / immutable log store.
 * The logger interface is stable — only the sink changes.
 */

import { randomUUID } from 'crypto';
import { RequestId, WorkflowPhase, RequestStatus } from '@caf/domain';
import { AuditEvent, AuditEventType } from './audit-event';

export interface IAuditLogger {
  emit(event: Omit<AuditEvent, 'eventId' | 'occurredAt'>): void;
  getEvents(requestId: RequestId): AuditEvent[];
  getAllEvents(): AuditEvent[];
}

export class InMemoryAuditLogger implements IAuditLogger {
  private readonly events: AuditEvent[] = [];

  emit(event: Omit<AuditEvent, 'eventId' | 'occurredAt'>): void {
    const fullEvent: AuditEvent = {
      ...event,
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
    };
    this.events.push(fullEvent);
    // Structured log — in production, ship to log aggregator
    console.log(JSON.stringify({ level: 'AUDIT', ...fullEvent }));
  }

  getEvents(requestId: RequestId): AuditEvent[] {
    return this.events.filter(e => e.requestId === requestId);
  }

  getAllEvents(): AuditEvent[] {
    return [...this.events];
  }
}
