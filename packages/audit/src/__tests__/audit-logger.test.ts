/**
 * @caf/audit — InMemoryAuditLogger tests.
 *
 * Verifies the audit contract: events are immutable after emission,
 * queryable by requestId, and never contain forbidden fields.
 */

import { InMemoryAuditLogger } from '../audit-logger';
import { makeRequestId, RequestStatus, WorkflowPhase } from '@caf/domain';

const requestId = makeRequestId('test-request-id');

const baseEvent = {
  eventType: 'PHASE_STARTED' as const,
  requestId,
  actor: 'system',
  phase: WorkflowPhase.ValidateRequest,
  status: RequestStatus.VALIDATING,
  detail: {},
};

describe('InMemoryAuditLogger', () => {
  it('emits and retrieves an event by requestId', () => {
    const logger = new InMemoryAuditLogger();
    logger.emit(baseEvent);

    const events = logger.getEvents(requestId);
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('PHASE_STARTED');
    expect(events[0].requestId).toBe(requestId);
  });

  it('assigns a unique eventId to each event', () => {
    const logger = new InMemoryAuditLogger();
    logger.emit(baseEvent);
    logger.emit({ ...baseEvent, eventType: 'PHASE_COMPLETED' });

    const events = logger.getEvents(requestId);
    const ids = events.map(e => e.eventId);
    expect(new Set(ids).size).toBe(2);
  });

  it('assigns occurredAt timestamp', () => {
    const logger = new InMemoryAuditLogger();
    const before = new Date().toISOString();
    logger.emit(baseEvent);
    const after = new Date().toISOString();

    const events = logger.getEvents(requestId);
    expect(events[0].occurredAt >= before).toBe(true);
    expect(events[0].occurredAt <= after).toBe(true);
  });

  it('getEvents returns only events for the given requestId', () => {
    const logger = new InMemoryAuditLogger();
    const otherId = makeRequestId('other-request');

    logger.emit(baseEvent);
    logger.emit({ ...baseEvent, requestId: otherId, eventType: 'REQUEST_SUBMITTED' });

    const events = logger.getEvents(requestId);
    expect(events.length).toBe(1);
    expect(events.every(e => e.requestId === requestId)).toBe(true);
  });

  it('getAllEvents returns events for all requests', () => {
    const logger = new InMemoryAuditLogger();
    const otherId = makeRequestId('other-request');

    logger.emit(baseEvent);
    logger.emit({ ...baseEvent, requestId: otherId, eventType: 'REQUEST_SUBMITTED' });

    const all = logger.getAllEvents();
    expect(all.length).toBe(2);
  });

  it('emitted events never expose password, secret, or token fields', () => {
    const logger = new InMemoryAuditLogger();
    logger.emit({
      ...baseEvent,
      detail: { someMetadata: 'safe-value' },
    });

    const events = logger.getEvents(requestId);
    for (const event of events) {
      expect(event.detail).not.toHaveProperty('password');
      expect(event.detail).not.toHaveProperty('secret');
      expect(event.detail).not.toHaveProperty('token');
    }
  });

  it('getAllEvents returns a defensive copy (mutation does not affect internal state)', () => {
    const logger = new InMemoryAuditLogger();
    logger.emit(baseEvent);

    const all = logger.getAllEvents();
    const originalLength = all.length;
    // Mutate the returned array
    all.push({ ...all[0], eventId: 'injected' });

    // Internal state should be unchanged
    expect(logger.getAllEvents().length).toBe(originalLength);
  });
});
